/**
 * Prompt Optimization Scheduler
 *
 * Periodically checks question pool ratings and triggers prompt optimization
 * when quality drops below threshold.
 */

import cron from 'node-cron';
import { promptOptimizer } from '@/services/prompt-optimizer';
import { checkPythonEnvironment } from '@/lib/python-optimizer';

const CONFIG = {
  enabled: process.env.PROMPT_OPTIMIZATION_ENABLED === 'true',
  checkIntervalHours: parseInt(process.env.PROMPT_OPTIMIZATION_CHECK_INTERVAL_HOURS || '1'),
};

let schedulerStarted = false;

/**
 * Start the prompt optimization scheduler
 */
export async function startPromptOptimizationScheduler(): Promise<void> {
  if (!CONFIG.enabled) {
    console.log('[Optimizer Scheduler] Prompt optimization disabled in config');
    return;
  }

  if (schedulerStarted) {
    console.log('[Optimizer Scheduler] Already started');
    return;
  }

  // Check Python environment on startup
  console.log('[Optimizer Scheduler] Checking Python environment...');
  const envCheck = await checkPythonEnvironment();

  if (!envCheck.pythonAvailable) {
    console.error('[Optimizer Scheduler] Python 3 not available:', envCheck.error);
    console.error('[Optimizer Scheduler] Scheduler will not start');
    return;
  }

  if (!envCheck.scriptsAvailable) {
    console.warn('[Optimizer Scheduler] Optimization scripts not found:', envCheck.error);
    console.warn('[Optimizer Scheduler] Running in monitoring mode only (no optimization)');
  } else {
    console.log('[Optimizer Scheduler] Python environment OK');
  }

  // Build cron expression
  // Format: minute hour day-of-month month day-of-week
  // Every N hours: 0 */N * * *
  const cronExpression = `0 */${CONFIG.checkIntervalHours} * * *`;

  console.log('[Optimizer Scheduler] Starting scheduler');
  console.log(`[Optimizer Scheduler] Check interval: every ${CONFIG.checkIntervalHours} hour(s)`);
  console.log(`[Optimizer Scheduler] Cron expression: ${cronExpression}`);

  // Schedule the job
  cron.schedule(cronExpression, async () => {
    console.log('[Optimizer Scheduler] Running scheduled check...');
    try {
      // Check and queue optimizations
      await promptOptimizer.checkAndQueueOptimizations();

      // Process queued jobs (if Python is available)
      if (envCheck.scriptsAvailable) {
        await promptOptimizer.processOptimizationQueue();
      }
    } catch (error) {
      console.error('[Optimizer Scheduler] Error during scheduled run:', error);
    }
  });

  schedulerStarted = true;
  console.log('[Optimizer Scheduler] Scheduler started successfully');

  // Run initial check after a short delay (5 seconds)
  setTimeout(async () => {
    console.log('[Optimizer Scheduler] Running initial check...');
    try {
      await promptOptimizer.checkAndQueueOptimizations();

      if (envCheck.scriptsAvailable) {
        await promptOptimizer.processOptimizationQueue();
      }
    } catch (error) {
      console.error('[Optimizer Scheduler] Error during initial check:', error);
    }
  }, 5000);
}

/**
 * Stop the scheduler (for testing/cleanup)
 */
export function stopPromptOptimizationScheduler(): void {
  // node-cron doesn't expose a way to stop individual tasks
  // This is mainly for testing purposes
  schedulerStarted = false;
  console.log('[Optimizer Scheduler] Scheduler stopped');
}
