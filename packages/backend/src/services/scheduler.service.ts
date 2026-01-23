import cron from 'node-cron';
import { schedulingAgent } from '@/agents/agent1-scheduling';
import { challengeDesignAgent } from '@/agents/agent2-challenge-design';
import { getSupabase } from '@/lib/supabase';
import type { SchedulingDecision } from '@/types';

/**
 * Scheduler Service
 * Runs periodic ticks to trigger Agent 1 (scheduling)
 */

class SchedulerService {
  private scheduledTask: cron.ScheduledTask | null = null;

  /**
   * Start the scheduler
   * Runs every 30 minutes by default
   */
  start(cronExpression: string = '*/30 * * * *'): void {
    if (this.scheduledTask) {
      console.warn('[Scheduler] Already running');
      return;
    }

    console.log(`[Scheduler] Starting with cron: ${cronExpression}`);

    this.scheduledTask = cron.schedule(cronExpression, async () => {
      await this.runSchedulingTick();
    });

    console.log('[Scheduler] Started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
      console.log('[Scheduler] Stopped');
    }
  }

  /**
   * Run a single scheduling tick
   * Can be called manually for testing
   */
  async runSchedulingTick(): Promise<void> {
    console.log('[Scheduler] Tick started at', new Date().toISOString());

    try {
      // Agent 1: Make scheduling decisions (may return multiple)
      const decisions = await schedulingAgent.makeSchedulingDecisions();

      if (decisions.length === 0) {
        console.log('[Scheduler] No challenges scheduled this tick');
        return;
      }

      console.log(`[Scheduler] Processing ${decisions.length} challenge(s) this tick`);

      // Process each decision
      for (const decision of decisions) {
        await this.processChallenge(decision);
      }

      console.log('[Scheduler] Tick completed successfully');
    } catch (error) {
      console.error('[Scheduler] Tick error:', error);
    }
  }

  /**
   * Process a single challenge decision
   */
  private async processChallenge(decision: SchedulingDecision): Promise<void> {
    try {
      console.log(`[Scheduler] Processing challenge for user ${decision.userId}, skill ${decision.skillId}`);

      // Agent 2: Design challenge
      const challenge = await challengeDesignAgent.designChallenge(decision);

      if (!challenge) {
        console.error(`[Scheduler] Failed to design challenge for user ${decision.userId}`);
        return;
      }

      // Get skill info for logging
      const supabase = getSupabase();
      const { data: skill, error: skillError } = await supabase
        .from('skills')
        .select('name')
        .eq('id', decision.skillId)
        .single();

      if (skillError || !skill) {
        console.error('[Scheduler] Skill not found');
        return;
      }

      // For now, log that we would send a push notification
      // TODO: Implement actual push token retrieval and sending
      const skillData = skill as any;
      console.log(`[Scheduler] Challenge ${challenge.id} created`);
      console.log(`[Scheduler]   User: ${decision.userId}`);
      console.log(`[Scheduler]   Skill: ${skillData.name}`);
      console.log(`[Scheduler]   Difficulty: ${decision.difficultyTarget}`);
      console.log(`[Scheduler]   Would send push notification`);
    } catch (error) {
      console.error(`[Scheduler] Error processing challenge for user ${decision.userId}:`, error);
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
