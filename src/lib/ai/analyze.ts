import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { getAIModel, validateProviderConfig, type AIProvider } from './providers';
import {
  getJournalAnalysisSystemPrompt,
  getJournalAnalysisUserPrompt,
  type ResolutionContext,
  type AIAnalysisResponse,
} from './prompts';
import type { ActivityLevel, MomentumSignal, ReframeType } from '@prisma/client';

/**
 * Zod schema for AI analysis response
 * Ensures type-safe parsing of AI output
 */
const AIAnalysisSchema = z.object({
  detectedActivity: z.record(
    z.string(),
    z.enum(['NONE', 'PARTIAL', 'FULL'])
  ),
  momentumSignal: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
  riskFlags: z.array(z.string()),
  suggestedAdjustments: z.string().nullable(),
  reframeType: z
    .enum(['MISALIGNMENT', 'STAGNATION', 'OVER_OPTIMIZATION', 'PHASE_MISMATCH', 'EXIT_SIGNAL'])
    .nullable(),
  reframeReason: z.string().nullable(),
  reframeSuggestion: z.string().nullable(),
});

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
  provider?: AIProvider
): Promise<void> {
  try {
    // Use default provider if not specified
    const selectedProvider = provider || (process.env.DEFAULT_AI_PROVIDER as AIProvider) || 'claude';

    // Validate provider configuration
    validateProviderConfig(selectedProvider);

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
    const resolutionContexts: ResolutionContext[] = resolutions.map((resolution: any) => ({
      resolution,
      currentPhase: resolution.currentPhase,
    }));

    // Get AI model
    const model = getAIModel(selectedProvider);

    // Generate analysis with retry logic
    let analysisResult: AIAnalysisResponse | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const { object } = await generateObject({
          model,
          schema: AIAnalysisSchema,
          system: getJournalAnalysisSystemPrompt(),
          prompt: getJournalAnalysisUserPrompt(journalEntry.rawText, resolutionContexts),
          temperature: 0.3, // Lower temperature for more consistent structured output
        });

        analysisResult = object as AIAnalysisResponse;
        break;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(
            `AI analysis failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }

    // If analysis failed after all retries
    if (!analysisResult) {
      throw new Error('AI analysis failed to produce results');
    }

    // Store AI interpretation in database
    const interpretation = await prisma.aIInterpretation.create({
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
    // Don't throw - we don't want to break the system if AI analysis fails
    // The journal entry is already saved, analysis can be retried later
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

  // Update or create daily activity records for each resolution
  for (const [resolutionId, activityLevel] of Object.entries(detectedActivity)) {
    if (activityLevel === 'NONE') {
      // Skip creating records for no activity
      continue;
    }

    try {
      await prisma.dailyActivity.upsert({
        where: {
          date_resolutionId: {
            date: normalizedDate,
            resolutionId,
          },
        },
        update: {
          activityLevel: activityLevel as ActivityLevel,
        },
        create: {
          date: normalizedDate,
          resolutionId,
          activityLevel: activityLevel as ActivityLevel,
        },
      });
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
  await analyzeJournalEntry(journalEntryId, provider);
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

  // Process in batches to avoid overwhelming the AI API
  for (let i = 0; i < journalEntryIds.length; i += concurrency) {
    const batch = journalEntryIds.slice(i, i + concurrency);
    await Promise.allSettled(
      batch.map((entryId) => analyzeJournalEntry(entryId, provider))
    );
  }

  console.log(`✅ Batch analysis complete`);
}
