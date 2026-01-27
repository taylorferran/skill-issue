import { getSupabase } from '@/lib/supabase';
import { opikService } from '@/lib/opik';
import type { SchedulingDecision } from '@/types';
import type { Database } from '@/types/database';
import dotenv from 'dotenv';

dotenv.config();

type SchedulingLogInsert = Database['public']['Tables']['scheduling_log']['Insert'];

/**
 * Agent 1: Scheduling / Interruption
 *
 * Decides when to send a challenge and which skill to test.
 * Respects quiet hours, rate limits, and user tolerance.
 *
 * Decision factors:
 * - Time since last challenge
 * - User's quiet hours
 * - Max challenges per day
 * - Skill priority (needs practice)
 */

interface SchedulingConfig {
  minHoursBetweenChallenges: number;
  priorityThreshold: number; // 0-1, accuracy threshold for priority
  maxUsersPerTick: number; // How many users to challenge per tick
  minAttemptsForAccuracyCheck: number; // Minimum attempts before accuracy matters
}

const DEFAULT_CONFIG: SchedulingConfig = {
  minHoursBetweenChallenges: 4,
  priorityThreshold: 0.7, // Send challenges for skills where accuracy < 70%
  maxUsersPerTick: 1, // Default to 1 for conservative approach
  minAttemptsForAccuracyCheck: 5, // Need 5+ attempts before accuracy check applies
};

export class SchedulingAgent {
  private config: SchedulingConfig;

  constructor(config: Partial<SchedulingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main scheduling decision logic
   * Called on periodic ticks (e.g., every 30 minutes)
   * Returns multiple decisions based on maxUsersPerTick config
   */
  async makeSchedulingDecisions(traceId?: string): Promise<SchedulingDecision[]> {
    const startTime = Date.now();
    const supabase = getSupabase();

    try {
      // Get all user skill states
      const { data: userSkills, error } = await supabase
        .from('user_skill_state')
        .select(`
          *,
          users!inner(id, timezone, quiet_hours_start, quiet_hours_end, max_challenges_per_day),
          skills!inner(id, name, active)
        `)
        .order('last_challenged_at', { ascending: true, nullsFirst: true });

      if (error) {
        throw error;
      }

      if (!userSkills || userSkills.length === 0) {
        console.log('[Agent 1] No user skills found');
        return [];
      }

      // Collect multiple decisions (up to maxUsersPerTick)
      const decisions: SchedulingDecision[] = [];
      const selectedUserIds = new Set<string>();
      const decisionSummaryByUser = new Map<string, { chosen: boolean; reason: string }>();

      console.log(`[Agent 1] Evaluating candidates (max ${this.config.maxUsersPerTick} users per tick)`);

      for (const userSkill of userSkills) {
        // Skip if user already selected in this tick
        const userSkillAny = userSkill as any;
        if (selectedUserIds.has(userSkillAny.user_id)) {
          continue;
        }

        const decision = await this.evaluateUserSkill(userSkill);

        // Capture a per-user summary (chosen + reason). If a user has already been chosen,
        // don't overwrite their chosen=true summary with later non-chosen evaluations.
        const existingSummary = decisionSummaryByUser.get(decision.userId);
        if (!existingSummary || !existingSummary.chosen) {
          decisionSummaryByUser.set(decision.userId, {
            chosen: decision.shouldChallenge,
            reason: decision.reason,
          });
        }

        if (decision.shouldChallenge) {
          // Log decision
          await this.logSchedulingDecision(decision);

          // Track with Opik
          await opikService.trackSchedulingDecision({
            userId: decision.userId,
            skillId: decision.skillId,
            shouldChallenge: true,
            reason: decision.reason,
            difficultyTarget: decision.difficultyTarget,
            traceId,
          });

          decisions.push(decision);
          selectedUserIds.add(decision.userId);

          console.log(`[Agent 1] Selected user ${decision.userId} for ${decision.skillId} (${decisions.length}/${this.config.maxUsersPerTick})`);

          // Stop if we've reached the limit
          if (decisions.length >= this.config.maxUsersPerTick) {
            break;
          }
        }
      }

      // Print the summary of decisions:
      if (decisionSummaryByUser.size > 0) {
        console.log('[Agent 1] Decision summary:');
        for (const [userId, summary] of decisionSummaryByUser.entries()) {
          console.log(`  userId=${userId} chosen=${summary.chosen} reason=${summary.reason}`);
        }
      }

      if (decisions.length === 0) {
        console.log(`[Agent 1] No suitable candidates found this tick`);
      } else {
        console.log(`[Agent 1] Selected ${decisions.length} user(s) for challenges`);
      }

      // Track agent execution
      const duration = Date.now() - startTime;
      await opikService.trackAgentExecution({
        agentName: 'scheduling',
        input: {
          totalCandidates: userSkills.length,
          maxUsersPerTick: this.config.maxUsersPerTick,
        },
        output: {
          decisionsCount: decisions.length,
          selectedUsers: decisions.map(d => ({ userId: d.userId, skillId: d.skillId })),
        },
        durationMs: duration,
        success: true,
        traceId,
      });

      return decisions;
    } catch (error) {
      console.error('[Agent 1] Scheduling error:', error);

      const duration = Date.now() - startTime;
      await opikService.trackAgentExecution({
        agentName: 'scheduling',
        input: {},
        output: { error: String(error) },
        durationMs: duration,
        success: false,
        traceId,
      });

      return [];
    }
  }

  /**
   * Evaluate if a specific user-skill combination should be challenged
   */
  private async evaluateUserSkill(userSkill: any): Promise<SchedulingDecision> {
    const userId = userSkill.user_id;
    const skillId = userSkill.skill_id;
    const user = userSkill.users;
    const skill = userSkill.skills;

    // Check if skill is active
    if (!skill.active) {
      return {
        shouldChallenge: false,
        userId,
        skillId,
        difficultyTarget: userSkill.difficulty_target,
        reason: 'Skill not active',
      };
    }

    // Check quiet hours
    if (this.isInQuietHours(user.quiet_hours_start, user.quiet_hours_end, user.timezone)) {
      return {
        shouldChallenge: false,
        userId,
        skillId,
        difficultyTarget: userSkill.difficulty_target,
        reason: 'User in quiet hours',
      };
    }

    // Check rate limit (max challenges per day)
    const challengesToday = await this.getChallengesCountToday(userId);
    if (challengesToday >= (user.max_challenges_per_day || 5)) {
      return {
        shouldChallenge: false,
        userId,
        skillId,
        difficultyTarget: userSkill.difficulty_target,
        reason: 'Daily challenge limit reached',
      };
    }

    // Check minimum time between challenges
    if (userSkill.last_challenged_at) {
      const lastChallengeTime = new Date(userSkill.last_challenged_at).getTime();
      const hoursSince = (Date.now() - lastChallengeTime) / (1000 * 60 * 60);
      if (hoursSince < this.config.minHoursBetweenChallenges) {
        return {
          shouldChallenge: false,
          userId,
          skillId,
          difficultyTarget: userSkill.difficulty_target,
          reason: `Too soon (${hoursSince.toFixed(1)}h since last)`,
        };
      }
    }

    // Check for unanswered challenges for this skill
    // A challenge is unanswered if there's no corresponding record in the answers table
    const supabase = getSupabase();

    // Get all challenges for this user-skill combination
    const { data: challenges, error: challengeError } = await supabase
      .from('challenges')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false })
      .limit(10); // Check recent challenges only

    if (challengeError) {
      console.error('[Agent 1] Error checking challenges:', challengeError);
      // Continue anyway - don't block on this check
    } else if (challenges && challenges.length > 0) {
      // Check which challenges have been answered
      const challengeIds = challenges.map((c: any) => c.id);
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('challenge_id')
        .in('challenge_id', challengeIds);

      if (answersError) {
        console.error('[Agent 1] Error checking answers:', answersError);
        // Continue anyway
      } else {
        const answeredIds = new Set((answers as any[] || []).map((a: any) => a.challenge_id));
        const unansweredChallenges = challenges.filter((c: any) => !answeredIds.has(c.id));

        if (unansweredChallenges.length > 0) {
          const oldestUnanswered = unansweredChallenges[0] as any;
          const hoursSinceChallenge = (Date.now() - new Date(oldestUnanswered.created_at).getTime()) / (1000 * 60 * 60);
          return {
            shouldChallenge: false,
            userId,
            skillId,
            difficultyTarget: userSkill.difficulty_target,
            reason: `Unanswered challenge exists (${hoursSinceChallenge.toFixed(1)}h old)`,
          };
        }
      }
    }

    // Priority based on accuracy (lower accuracy = higher priority)
    // BUT only apply this threshold after sufficient attempts (minimum sample size)
    const accuracy = userSkill.attempts_total > 0
      ? userSkill.correct_total / userSkill.attempts_total
      : 0.5; // Assume 50% for new skills

    // Only skip challenging if BOTH conditions are met:
    // 1. User has enough attempts for statistical significance
    // 2. Their accuracy is above threshold (indicating mastery) - might remove this behaviour later, not sure if mastery is a good feature yet
    if (
      userSkill.attempts_total >= this.config.minAttemptsForAccuracyCheck &&
      accuracy > this.config.priorityThreshold
    ) {
      return {
        shouldChallenge: false,
        userId,
        skillId,
        difficultyTarget: userSkill.difficulty_target,
        reason: `Accuracy too high (${(accuracy * 100).toFixed(0)}% over ${userSkill.attempts_total} attempts)`,
      };
    }

    // All checks passed - schedule challenge
    return {
      shouldChallenge: true,
      userId,
      skillId,
      difficultyTarget: userSkill.difficulty_target,
      reason: `Needs practice (accuracy: ${(accuracy * 100).toFixed(0)}%)`,
      scheduledFor: new Date(),
    };
  }

  /**
   * Check if current time is in user's quiet hours
   */
  private isInQuietHours(
    quietStart: number | null,
    quietEnd: number | null,
    timezone: string = 'UTC'
  ): boolean {
    if (quietStart === null || quietEnd === null) {
      return false;
    }

    // Get current hour in user's timezone
    const now = new Date();
    const userHour = parseInt(
      now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: timezone })
    );

    // Handle wrap-around (e.g., 22-6 means 10pm to 6am)
    if (quietStart < quietEnd) {
      return userHour >= quietStart && userHour < quietEnd;
    } else {
      return userHour >= quietStart || userHour < quietEnd;
    }
  }

  /**
   * Count challenges sent to user today
   */
  private async getChallengesCountToday(userId: string): Promise<number> {
    const supabase = getSupabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    if (error) {
      console.error('Error counting challenges:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Log scheduling decision to database
   */
  private async logSchedulingDecision(decision: SchedulingDecision): Promise<void> {
    const supabase = getSupabase();

    const logData: SchedulingLogInsert = {
      user_id: decision.userId,
      skill_id: decision.skillId,
      decision: decision.shouldChallenge,
      reason: decision.reason,
      difficulty_target: decision.difficultyTarget,
    };

    // @ts-expect-error - Supabase type inference issue with Insert types
    await supabase.from('scheduling_log').insert(logData);
  }
}

// Export singleton instance with config from environment
export const schedulingAgent = new SchedulingAgent({
  maxUsersPerTick: parseInt(process.env.MAX_USERS_PER_TICK || '1'),
  minHoursBetweenChallenges: parseFloat(process.env.MIN_HOURS_BETWEEN_CHALLENGES || '4'),
  priorityThreshold: parseFloat(process.env.PRIORITY_THRESHOLD || '0.7'),
  minAttemptsForAccuracyCheck: parseInt(process.env.MIN_ATTEMPTS_FOR_ACCURACY_CHECK || '5'),
});
