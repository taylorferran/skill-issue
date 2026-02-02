import cron from 'node-cron';
import { schedulingAgent } from '@/agents/agent1-scheduling';
import { challengeDesignAgent } from '@/agents/agent2-challenge-design';
import { getSupabase } from '@/lib/supabase';
import { opikService } from '@/lib/opik';
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

    // Create a lightweight trace for the scheduling tick (orchestration only)
    const tickTraceId = await opikService.startTrace({
      name: 'scheduling_tick',
      input: { timestamp: new Date().toISOString() },
      tags: ['scheduler', 'orchestration'],
    });

    const challengeTraceIds: string[] = [];

    try {
      // Agent 1: Make scheduling decisions (may return multiple)
      const decisions = await schedulingAgent.makeSchedulingDecisions(tickTraceId);

      if (decisions.length === 0) {
        console.log('[Scheduler] No challenges scheduled this tick');
        await opikService.endTrace({
          traceId: tickTraceId,
          output: { decisionsCount: 0, challengeTraceIds: [] },
        });
        return;
      }

      console.log(`[Scheduler] Processing ${decisions.length} challenge(s) this tick`);

      // Process each decision - each creates its own trace
      for (const decision of decisions) {
        const result = await this.processChallenge(decision, tickTraceId);
        if (result?.traceId) {
          challengeTraceIds.push(result.traceId);
        }
      }

      console.log('[Scheduler] Tick completed successfully');
      await opikService.endTrace({
        traceId: tickTraceId,
        output: {
          decisionsCount: decisions.length,
          challengesCreated: challengeTraceIds.length,
          challengeTraceIds, // Links to individual challenge traces
          users: decisions.map(d => d.userId),
        },
      });
    } catch (error) {
      console.error('[Scheduler] Tick error:', error);
      await opikService.endTrace({ traceId: tickTraceId, error: error as Error });
    }
  }

  /**
   * Process a single challenge decision.
   * Agent 2 creates its own trace for the challenge generation.
   *
   * @returns The challenge result with trace ID, or null if failed
   */
  private async processChallenge(
    decision: SchedulingDecision,
    tickTraceId: string
  ): Promise<{ challengeId: string; traceId: string } | null> {
    try {
      console.log(`[Scheduler] Processing challenge for user ${decision.userId}, skill ${decision.skillId}`);

      // Agent 2: Design challenge (creates its own trace, linked to tick)
      const result = await challengeDesignAgent.designChallenge(decision, tickTraceId);

      if (!result) {
        console.error(`[Scheduler] Failed to design challenge for user ${decision.userId}`);
        return null;
      }

      const { challenge, traceId } = result;

      // Get skill info for logging
      const supabase = getSupabase();
      const { data: skill, error: skillError } = await supabase
        .from('skills')
        .select('name')
        .eq('id', decision.skillId)
        .single();

      if (skillError || !skill) {
        console.error('[Scheduler] Skill not found');
        return { challengeId: challenge.id, traceId };
      }

      // For now, log that we would send a push notification
      // TODO: Implement actual push token retrieval and sending
      const skillData = skill as any;
      console.log(`[Scheduler] Challenge ${challenge.id} created (trace: ${traceId})`);
      console.log(`[Scheduler]   User: ${decision.userId}`);
      console.log(`[Scheduler]   Skill: ${skillData.name}`);
      console.log(`[Scheduler]   Difficulty: ${decision.difficultyTarget}`);
      console.log(`[Scheduler]   Would send push notification`);

      return { challengeId: challenge.id, traceId };
    } catch (error) {
      console.error(`[Scheduler] Error processing challenge for user ${decision.userId}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
