import { analyzeJournalEntry } from '@/lib/ai/analyze';
import type { AIProvider } from '@/lib/ai/providers';

/**
 * Simple async job queue for AI analysis
 *
 * ARCHITECTURE:
 * - Uses setImmediate() for immediate background processing
 * - Non-blocking: Returns immediately, processes in background
 * - Simple approach suitable for standalone deployment
 * - Can be upgraded to database-backed queue or BullMQ later
 *
 * FLOW:
 * 1. Journal POST → Save to DB (< 100ms)
 * 2. Enqueue analysis → Return success immediately
 * 3. Background worker picks up job
 * 4. AI analysis completes
 * 5. Dashboard updates on next refresh
 */

interface AnalysisJob {
  entryId: string;
  provider?: AIProvider;
  attempts: number;
  maxAttempts: number;
}

/**
 * In-memory queue for development/simple deployments
 * For production with multiple instances, use a database-backed queue or Redis
 */
const analysisQueue: AnalysisJob[] = [];
let isProcessing = false;

/**
 * Enqueue a journal entry for AI analysis
 *
 * This function returns immediately (non-blocking)
 * Analysis happens in the background
 *
 * @param entryId - Journal entry ID to analyze
 * @param provider - Optional AI provider
 */
export async function enqueueAnalysis(
  entryId: string,
  provider?: AIProvider
): Promise<void> {
  const job: AnalysisJob = {
    entryId,
    provider,
    attempts: 0,
    maxAttempts: 3,
  };

  analysisQueue.push(job);

  console.log(`📋 Enqueued analysis for entry ${entryId} (queue size: ${analysisQueue.length})`);

  // Start processing if not already running
  if (!isProcessing) {
    // Use setImmediate to process in next tick (non-blocking)
    setImmediate(() => processQueue());
  }
}

/**
 * Process the analysis queue
 *
 * Runs in background, processes jobs one at a time
 * Includes retry logic and error handling
 */
async function processQueue(): Promise<void> {
  if (isProcessing) {
    return; // Already processing
  }

  isProcessing = true;

  while (analysisQueue.length > 0) {
    const job = analysisQueue.shift();
    if (!job) continue;

    try {
      console.log(`🔄 Processing analysis for entry ${job.entryId} (attempt ${job.attempts + 1}/${job.maxAttempts})`);

      // Run AI analysis — throwOnError so the catch block can handle retries
      await analyzeJournalEntry(job.entryId, job.provider, { throwOnError: true });

      console.log(`✅ Analysis complete for entry ${job.entryId}`);
    } catch (error) {
      console.error(`❌ Analysis failed for entry ${job.entryId}:`, error);

      // Retry logic
      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        console.log(`🔁 Retrying entry ${job.entryId} (attempt ${job.attempts + 1}/${job.maxAttempts})`);

        // Re-queue with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000; // 2s, 4s, 8s, etc.
        setTimeout(() => {
          analysisQueue.push(job);
          if (!isProcessing) {
            setImmediate(() => processQueue());
          }
        }, delay);
      } else {
        console.error(`💀 Max retries exceeded for entry ${job.entryId}, giving up`);
        // Could store failed jobs in database for manual retry later
      }
    }

    // Small delay between jobs to avoid overwhelming the AI API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  isProcessing = false;
  console.log('📭 Queue empty, worker idle');
}

/**
 * Get current queue status (for debugging/monitoring)
 */
export function getQueueStatus() {
  return {
    queueSize: analysisQueue.length,
    isProcessing,
    pendingJobs: analysisQueue.map((job) => ({
      entryId: job.entryId,
      provider: job.provider || 'default',
      attempts: job.attempts,
    })),
  };
}

/**
 * Clear the queue (for testing/emergency use)
 */
export function clearQueue() {
  const clearedCount = analysisQueue.length;
  analysisQueue.length = 0;
  console.log(`🗑️ Cleared ${clearedCount} jobs from queue`);
  return clearedCount;
}
