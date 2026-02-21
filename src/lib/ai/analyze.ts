import { generateText, Output } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { getAIModel, validateProviderConfig, providerTypeToProvider, type AIProvider } from './providers';
import { getCurrentProvider, getProviderApiKey } from '@/actions/settings';
import {
  getJournalAnalysisSystemPrompt,
  getJournalAnalysisUserPrompt,
  type ResolutionContext,
  type AIAnalysisResponse,
} from './prompts';
import type { ActivityLevel, MomentumSignal, ReframeType } from '@prisma/client';

/**
 * Build a Zod schema for AI analysis response dynamically based on resolution IDs.
 *
 * OpenAI's structured output doesn't support z.record with propertyNames,
 * so we build the detectedActivity shape from known resolution IDs.
 */
function buildAnalysisSchema(resolutionIds: string[]) {
  const activityShape: Record<string, z.ZodType> = {};
  for (const id of resolutionIds) {
    activityShape[id] = z.enum(['NONE', 'PARTIAL', 'FULL']);
  }

  return z.object({
    detectedActivity: z.object(activityShape),
    momentumSignal: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
    riskFlags: z.array(z.string()),
    suggestedAdjustments: z.string().nullable(),
    reframeType: z
      .enum(['MISALIGNMENT', 'STAGNATION', 'OVER_OPTIMIZATION', 'PHASE_MISMATCH', 'EXIT_SIGNAL'])
      .nullable(),
    reframeReason: z.string().nullable(),
    reframeSuggestion: z.string().nullable(),
  });
}

/**
 * Analyze a journal entry using AI
 *
 * This function:
 * 1. Fetches active resolutions with their current phases
 * 2. Calls AI provider with structured prompts
 * 3. Parses and validates AI response
 * 4. Stores interpretation in database
 * 5. Updates daily activity records
 *
 * CRITICAL: This runs asynchronously and should never block journal submission
 *
 * @param journalEntryId - ID of the journal entry to analyze
 * @param provider - AI provider to use (defaults to env var)
 * @returns The created AIInterpretation record
 */
export async function analyzeJournalEntry(
  journalEntryId: string,
  provider?: AIProvider,
  options?: { throwOnError?: boolean }
): Promise<void> {
  try {
    // Get provider from settings if not specified
    let selectedProvider: AIProvider;
    if (provider) {
      selectedProvider = provider;
    } else {
      // Get from user settings or fallback to env var
      const providerType = await getCurrentProvider();
      selectedProvider = providerTypeToProvider(providerType);
    }

    // Get API key from settings or env vars
    const providerType = selectedProvider.toUpperCase() as 'CLAUDE' | 'OPENAI' | 'GEMINI';
    const apiKey = await getProviderApiKey(providerType);

    // Validate provider configuration
    validateProviderConfig(selectedProvider, apiKey || undefined);

    // Fetch the journal entry
    const journalEntry = await prisma.journalEntry.findUnique({
      where: { id: journalEntryId },
    });

    if (!journalEntry) {
      throw new Error(`Journal entry not found: ${journalEntryId}`);
    }

    // Fetch active resolutions with their current phases
    const resolutions = await prisma.resolution.findMany({
      where: { status: 'ACTIVE' },
      include: {
        currentPhase: true,
      },
    });

    if (resolutions.length === 0) {
      console.warn(`No active resolutions found for journal entry ${journalEntryId}`);
      // Still create an interpretation record but with minimal data
      await prisma.aIInterpretation.create({
        data: {
          journalEntryId,
          provider: selectedProvider,
          detectedActivity: {},
          momentumSignal: 'NONE',
          riskFlags: [],
        },
      });
      return;
    }

    // Prepare resolution context
    const resolutionContexts: ResolutionContext[] = resolutions.map((resolution) => ({
      resolution,
      currentPhase: resolution.currentPhase,
    }));

    // Get AI model with custom API key if available
    const model = getAIModel(selectedProvider, apiKey || undefined);

    // Build schema dynamically from known resolution IDs
    const resolutionIds = resolutions.map((r) => r.id);
    const schema = buildAnalysisSchema(resolutionIds);

    // Generate analysis with retry logic
    let analysisResult: AIAnalysisResponse | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`🤖 Calling ${selectedProvider} API (attempt ${attempts}/${maxAttempts})...`);

        const generateOptions: Parameters<typeof generateText>[0] = {
          model,
          output: Output.object({ schema }),
          system: getJournalAnalysisSystemPrompt(),
          prompt: getJournalAnalysisUserPrompt(journalEntry.rawText, resolutionContexts),
        };

        // Only set temperature for non-reasoning models
        if (selectedProvider !== 'openai') {
          generateOptions.temperature = 0.3;
        }

        const { output } = await generateText(generateOptions);

        analysisResult = output as AIAnalysisResponse;
        console.log(`✓ AI analysis successful on attempt ${attempts}`);
        break;
      } catch (error) {
        console.error(`✗ Attempt ${attempts}/${maxAttempts} failed:`, error instanceof Error ? error.message : 'Unknown error');

        if (attempts >= maxAttempts) {
          throw new Error(
            `AI analysis failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        // Exponential backoff before next retry
        const backoffMs = Math.pow(2, attempts) * 1000;
        console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    // If analysis failed after all retries
    if (!analysisResult) {
      throw new Error('AI analysis failed to produce results');
    }

    // Store AI interpretation in database
    await prisma.aIInterpretation.create({
      data: {
        journalEntryId,
        provider: selectedProvider,
        detectedActivity: analysisResult.detectedActivity,
        momentumSignal: analysisResult.momentumSignal as MomentumSignal,
        riskFlags: analysisResult.riskFlags,
        suggestedAdjustments: analysisResult.suggestedAdjustments,
        reframeType: analysisResult.reframeType as ReframeType | null,
        reframeReason: analysisResult.reframeReason,
        reframeSuggestion: analysisResult.reframeSuggestion,
      },
    });

    // Update daily activity records based on detected engagement
    await updateDailyActivities(
      journalEntry.timestamp,
      analysisResult.detectedActivity
    );

    console.log(`✅ Successfully analyzed journal entry ${journalEntryId} with ${selectedProvider}`);
  } catch (error) {
    console.error(`❌ Error analyzing journal entry ${journalEntryId}:`, error);
    if (options?.throwOnError) {
      throw error;
    }
    // By default, don't throw - the journal entry is already saved and analysis can be retried
  }
}

/**
 * Update daily activity records based on AI-detected engagement
 *
 * @param entryDate - Date of the journal entry
 * @param detectedActivity - Map of resolution IDs to activity levels
 */
async function updateDailyActivities(
  entryDate: Date,
  detectedActivity: Record<string, 'NONE' | 'PARTIAL' | 'FULL'>
): Promise<void> {
  // Normalize date to start of day (midnight UTC)
  const normalizedDate = new Date(entryDate);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  const levelPriority: Record<string, number> = { NONE: 0, PARTIAL: 1, FULL: 2 };

  // Update or create daily activity records for each resolution
  for (const [resolutionId, activityLevel] of Object.entries(detectedActivity)) {
    if (activityLevel === 'NONE') {
      // Skip creating records for no activity
      continue;
    }

    try {
      const existing = await prisma.dailyActivity.findUnique({
        where: { date_resolutionId: { date: normalizedDate, resolutionId } },
        select: { activityLevel: true },
      });

      if (!existing) {
        await prisma.dailyActivity.create({
          data: { date: normalizedDate, resolutionId, activityLevel: activityLevel as ActivityLevel },
        });
      } else if (levelPriority[activityLevel] > levelPriority[existing.activityLevel]) {
        // Only upgrade — never let a later PARTIAL overwrite an earlier FULL
        await prisma.dailyActivity.update({
          where: { date_resolutionId: { date: normalizedDate, resolutionId } },
          data: { activityLevel: activityLevel as ActivityLevel },
        });
      }
    } catch (error) {
      console.error(
        `Error updating daily activity for resolution ${resolutionId}:`,
        error
      );
      // Continue with other resolutions even if one fails
    }
  }
}

/**
 * Re-analyze an existing journal entry with a different provider
 * Useful for comparing AI interpretations or when switching providers
 *
 * @param journalEntryId - ID of the journal entry to re-analyze
 * @param provider - AI provider to use for re-analysis
 */
export async function reanalyzeJournalEntry(
  journalEntryId: string,
  provider: AIProvider
): Promise<void> {
  console.log(`Re-analyzing journal entry ${journalEntryId} with ${provider}...`);
  await analyzeJournalEntry(journalEntryId, provider, { throwOnError: true });
}

/**
 * Batch analyze multiple journal entries
 * Useful for backfilling analysis or bulk re-analysis
 *
 * @param journalEntryIds - Array of journal entry IDs to analyze
 * @param provider - Optional AI provider (defaults to env var)
 * @param concurrency - Number of concurrent analyses (default: 3)
 */
export async function batchAnalyzeEntries(
  journalEntryIds: string[],
  provider?: AIProvider,
  concurrency = 3
): Promise<void> {
  console.log(`Batch analyzing ${journalEntryIds.length} entries with concurrency ${concurrency}...`);

  const failed: string[] = [];

  // Process in batches to avoid overwhelming the AI API
  for (let i = 0; i < journalEntryIds.length; i += concurrency) {
    const batch = journalEntryIds.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map((entryId) => analyzeJournalEntry(entryId, provider, { throwOnError: true }))
    );
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const entryId = batch[index];
        console.error(`❌ Failed to analyze entry ${entryId}:`, result.reason);
        failed.push(entryId);
      }
    });
  }

  if (failed.length > 0) {
    console.error(`⚠️ Batch analysis complete with ${failed.length} failure(s): ${failed.join(', ')}`);
  } else {
    console.log(`✅ Batch analysis complete`);
  }
}
