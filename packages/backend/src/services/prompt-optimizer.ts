/**
 * Prompt Optimizer Service
 *
 * Monitors question pool ratings and triggers automated prompt optimization
 * when quality drops below threshold.
 */

import { getSupabase } from '@/lib/supabase';
import { runOptimization, type OptimizationResult } from '@/lib/python-optimizer';
import type { Database } from '@/types/database';

type PromptTemplate = Database['public']['Tables']['prompt_templates']['Row'];
type PromptTemplateInsert = Database['public']['Tables']['prompt_templates']['Insert'];
type OptimizationQueue = Database['public']['Tables']['prompt_optimization_queue']['Row'];
type OptimizationQueueInsert = Database['public']['Tables']['prompt_optimization_queue']['Insert'];
type OptimizationMetricInsert = Database['public']['Tables']['prompt_optimization_metrics']['Insert'];

// Configuration from environment
const CONFIG = {
  enabled: process.env.PROMPT_OPTIMIZATION_ENABLED === 'true',
  ratingThreshold: parseFloat(process.env.PROMPT_OPTIMIZATION_RATING_THRESHOLD || '2.5'),
  minQuestions: parseInt(process.env.PROMPT_OPTIMIZATION_MIN_QUESTIONS || '10'),
  autoDeploy: process.env.PROMPT_OPTIMIZATION_AUTO_DEPLOY === 'true',
  maxConcurrentJobs: parseInt(process.env.PROMPT_OPTIMIZATION_MAX_CONCURRENT_JOBS || '2'),
  refinements: parseInt(process.env.PROMPT_OPTIMIZATION_REFINEMENTS || '5'),
};

interface SkillLevelBelowThreshold {
  skillId: string;
  skillName: string;
  level: number;
  avgRating: number;
  questionsCount: number;
}

export class PromptOptimizer {
  /**
   * Main entry point: Check ratings and queue optimizations as needed
   */
  async checkAndQueueOptimizations(): Promise<void> {
    if (!CONFIG.enabled) {
      console.log('[PromptOptimizer] Optimization disabled in config');
      return;
    }

    console.log('[PromptOptimizer] Starting rating check...');
    console.log(`[PromptOptimizer] Threshold: ${CONFIG.ratingThreshold}, Min questions: ${CONFIG.minQuestions}`);

    try {
      const belowThreshold = await this.findSkillLevelsBelowThreshold();

      console.log(`[PromptOptimizer] Found ${belowThreshold.length} skill+level combinations below threshold`);

      for (const item of belowThreshold) {
        console.log(`[PromptOptimizer] Queueing: ${item.skillName} level ${item.level} (avg: ${item.avgRating})`);
        await this.queueOptimization({
          skillId: item.skillId,
          level: item.level,
          triggerReason: 'avg_rating_below_threshold',
          avgRating: item.avgRating,
          questionsCount: item.questionsCount,
        });
      }
    } catch (error) {
      console.error('[PromptOptimizer] Error checking ratings:', error);
      throw error;
    }
  }

  /**
   * Find skill+level combinations with ratings below threshold
   */
  async findSkillLevelsBelowThreshold(): Promise<SkillLevelBelowThreshold[]> {
    const supabase = getSupabase();

    // Query to find low-rated skill+level combinations
    const { data, error } = await supabase.rpc('find_low_rated_skill_levels', {
      p_rating_threshold: CONFIG.ratingThreshold,
      p_min_questions: CONFIG.minQuestions,
    });

    if (error) {
      console.warn('[PromptOptimizer] RPC function error, using fallback:', error);
      // If RPC doesn't exist, fall back to manual query
      return this.findSkillLevelsBelowThresholdFallback();
    }

    // Transform snake_case SQL columns to camelCase TypeScript
    return (data || []).map((row: any) => ({
      skillId: row.skill_id,
      skillName: row.skill_name,
      level: row.level,
      avgRating: parseFloat(row.avg_rating),
      questionsCount: parseInt(row.questions_count),
    }));
  }

  /**
   * Fallback query if RPC function doesn't exist yet
   */
  private async findSkillLevelsBelowThresholdFallback(): Promise<SkillLevelBelowThreshold[]> {
    const supabase = getSupabase();

    // Get all question pool entries with ratings
    const { data: poolData, error: poolError } = await supabase
      .from('question_pool')
      .select('skill_id, difficulty, total_ratings, sum_ratings, active')
      .eq('active', true)
      .gt('total_ratings', 0);

    if (poolError) {
      console.error('[PromptOptimizer] Error fetching question pool:', poolError);
      return [];
    }

    if (!poolData || poolData.length === 0) {
      return [];
    }

    // Group by skill_id + difficulty and calculate averages
    const grouped = new Map<string, {
      skillId: string;
      level: number;
      totalRatings: number;
      sumRatings: number;
      count: number;
    }>();

    for (const row of poolData) {
      const key = `${row.skill_id}_${row.difficulty}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.totalRatings += row.total_ratings;
        existing.sumRatings += row.sum_ratings;
        existing.count += 1;
      } else {
        grouped.set(key, {
          skillId: row.skill_id,
          level: row.difficulty,
          totalRatings: row.total_ratings,
          sumRatings: row.sum_ratings,
          count: 1,
        });
      }
    }

    // Filter by threshold and min questions
    const results: SkillLevelBelowThreshold[] = [];

    for (const item of grouped.values()) {
      if (item.count < CONFIG.minQuestions) continue;

      const avgRating = item.sumRatings / item.totalRatings;
      if (avgRating >= CONFIG.ratingThreshold) continue;

      // Fetch skill name
      const { data: skill } = await supabase
        .from('skills')
        .select('name')
        .eq('id', item.skillId)
        .single();

      if (skill) {
        results.push({
          skillId: item.skillId,
          skillName: skill.name,
          level: item.level,
          avgRating: Number(avgRating.toFixed(2)),
          questionsCount: item.count,
        });
      }
    }

    return results;
  }

  /**
   * Queue an optimization job (if not already queued/running)
   */
  async queueOptimization(params: {
    skillId: string;
    level: number;
    triggerReason: string;
    avgRating?: number;
    questionsCount?: number;
  }): Promise<string | null> {
    const supabase = getSupabase();

    // Check if already queued or running
    const { data: existing } = await supabase
      .from('prompt_optimization_queue')
      .select('id, status')
      .eq('skill_id', params.skillId)
      .eq('difficulty_level', params.level)
      .in('status', ['pending', 'running'])
      .maybeSingle();

    if (existing) {
      console.log(`[PromptOptimizer] Already queued/running: ${params.skillId} level ${params.level}`);
      return null;
    }

    // Create queue entry
    const queueEntry: OptimizationQueueInsert = {
      skill_id: params.skillId,
      difficulty_level: params.level,
      status: 'pending',
      trigger_reason: params.triggerReason,
      avg_rating_at_trigger: params.avgRating || null,
      questions_count: params.questionsCount || null,
    };

    const { data, error } = await supabase
      .from('prompt_optimization_queue')
      .insert(queueEntry)
      .select()
      .single();

    if (error) {
      console.error('[PromptOptimizer] Error queueing optimization:', error);
      return null;
    }

    console.log(`[PromptOptimizer] Queued optimization job: ${data.id}`);
    return data.id;
  }

  /**
   * Process the optimization queue (process up to maxConcurrentJobs)
   */
  async processOptimizationQueue(): Promise<void> {
    if (!CONFIG.enabled) {
      return;
    }

    const supabase = getSupabase();

    // Count currently running jobs
    const { data: runningJobs, error: countError } = await supabase
      .from('prompt_optimization_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'running');

    if (countError) {
      console.error('[PromptOptimizer] Error counting running jobs:', countError);
      return;
    }

    const runningCount = runningJobs?.length || 0;
    const availableSlots = CONFIG.maxConcurrentJobs - runningCount;

    if (availableSlots <= 0) {
      console.log(`[PromptOptimizer] Max concurrent jobs (${CONFIG.maxConcurrentJobs}) reached`);
      return;
    }

    // Get pending jobs
    const { data: pendingJobs, error: fetchError } = await supabase
      .from('prompt_optimization_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(availableSlots);

    if (fetchError) {
      console.error('[PromptOptimizer] Error fetching pending jobs:', fetchError);
      return;
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('[PromptOptimizer] No pending jobs in queue');
      return;
    }

    console.log(`[PromptOptimizer] Processing ${pendingJobs.length} job(s)`);

    // Process jobs (can be done in parallel if needed)
    for (const job of pendingJobs) {
      await this.processJob(job);
    }
  }

  /**
   * Process a single optimization job
   */
  private async processJob(job: OptimizationQueue): Promise<void> {
    const supabase = getSupabase();

    console.log(`[PromptOptimizer] Starting job ${job.id}: skill ${job.skill_id} level ${job.difficulty_level}`);

    // Mark as running
    await supabase
      .from('prompt_optimization_queue')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    try {
      // Fetch skill metadata
      const { data: skill, error: skillError } = await supabase
        .from('skills')
        .select('name, description')
        .eq('id', job.skill_id)
        .single();

      if (skillError || !skill) {
        throw new Error(`Skill not found: ${job.skill_id}`);
      }

      console.log(`[PromptOptimizer] Running Python optimizer for ${skill.name} level ${job.difficulty_level}`);

      // Run Python optimization
      const result = await runOptimization({
        skillId: job.skill_id,
        level: job.difficulty_level,
        refinements: CONFIG.refinements,
      });

      console.log(`[PromptOptimizer] Optimization complete: ${result.baselineScore} → ${result.bestScore}`);

      // Store optimized prompt
      const promptTemplate = await this.storeOptimizedPrompt({
        skillId: job.skill_id,
        level: job.difficulty_level,
        promptContent: result.optimizedPrompt,
        baselineScore: result.baselineScore,
        bestScore: result.bestScore,
        improvementPercent: result.improvementPercent,
        refinementCount: result.refinements,
        optimizationMethod: result.method,
        opikPromptId: result.opikPromptId,
        opikCommitHash: result.opikCommitHash,
        autoDeploy: CONFIG.autoDeploy,
      });

      // Store metrics
      if (result.metrics) {
        await this.storeMetrics(promptTemplate.id, job.id, result.metrics);
      }

      // Mark job complete
      await supabase
        .from('prompt_optimization_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_prompt_id: promptTemplate.id,
        })
        .eq('id', job.id);

      console.log(`[PromptOptimizer] Job ${job.id} completed successfully`);

    } catch (error) {
      console.error(`[PromptOptimizer] Job ${job.id} failed:`, error);

      // Mark job failed
      await supabase
        .from('prompt_optimization_queue')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : String(error),
        })
        .eq('id', job.id);
    }
  }

  /**
   * Store optimized prompt in database
   */
  private async storeOptimizedPrompt(params: {
    skillId: string;
    level: number;
    promptContent: string;
    baselineScore: number;
    bestScore: number;
    improvementPercent: number;
    refinementCount: number;
    optimizationMethod?: string;
    opikPromptId?: string;
    opikCommitHash?: string;
    autoDeploy: boolean;
  }): Promise<PromptTemplate> {
    const supabase = getSupabase();

    // Get current version number
    const { data: existing } = await supabase
      .from('prompt_templates')
      .select('version')
      .eq('skill_id', params.skillId)
      .eq('difficulty_level', params.level)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = existing ? existing.version + 1 : 1;

    // Determine status and active state
    let status: 'pending' | 'deployed' = 'pending';
    let isActive = false;

    if (params.autoDeploy && params.bestScore > params.baselineScore) {
      status = 'deployed';
      isActive = true;

      // Deactivate previous active prompts
      await supabase
        .from('prompt_templates')
        .update({ is_active: false })
        .eq('skill_id', params.skillId)
        .eq('difficulty_level', params.level)
        .eq('is_active', true);
    }

    // Create new prompt template
    const promptTemplate: PromptTemplateInsert = {
      skill_id: params.skillId,
      difficulty_level: params.level,
      prompt_content: params.promptContent,
      prompt_type: 'challenge_generation',
      version: nextVersion,
      is_active: isActive,
      status,
      baseline_score: params.baselineScore,
      current_score: params.bestScore,
      improvement_percent: params.improvementPercent,
      optimization_method: params.optimizationMethod || 'evolutionary',
      refinement_count: params.refinementCount,
      opik_prompt_id: params.opikPromptId || null,
      opik_commit_hash: params.opikCommitHash || null,
      deployed_at: isActive ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('prompt_templates')
      .insert(promptTemplate)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store prompt template: ${error.message}`);
    }

    console.log(`[PromptOptimizer] Stored prompt template: ${data.id} (version ${nextVersion}, ${status})`);
    return data;
  }

  /**
   * Store optimization metrics
   */
  private async storeMetrics(
    promptTemplateId: string,
    queueId: string,
    metrics: Record<string, number>
  ): Promise<void> {
    const supabase = getSupabase();

    const metricsInserts: OptimizationMetricInsert[] = Object.entries(metrics).map(([name, value]) => ({
      prompt_template_id: promptTemplateId,
      optimization_queue_id: queueId,
      metric_name: name,
      metric_value: value,
    }));

    const { error } = await supabase
      .from('prompt_optimization_metrics')
      .insert(metricsInserts);

    if (error) {
      console.error('[PromptOptimizer] Error storing metrics:', error);
    }
  }

  /**
   * Get active optimized prompt for a skill+level
   */
  async getOptimizedPrompt(skillId: string, level: number): Promise<PromptTemplate | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('skill_id', skillId)
      .eq('difficulty_level', level)
      .eq('is_active', true)
      .eq('status', 'deployed')
      .maybeSingle();

    if (error) {
      console.error('[PromptOptimizer] Error fetching optimized prompt:', error);
      return null;
    }

    return data;
  }

  /**
   * Get optimization status for all skills
   */
  async getOptimizationStatus(): Promise<any[]> {
    const supabase = getSupabase();

    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name')
      .eq('active', true);

    if (skillsError || !skills) {
      return [];
    }

    const results = [];

    for (const skill of skills) {
      const levels = [];

      for (let level = 1; level <= 10; level++) {
        // Get active prompt
        const { data: prompt } = await supabase
          .from('prompt_templates')
          .select('*')
          .eq('skill_id', skill.id)
          .eq('difficulty_level', level)
          .eq('is_active', true)
          .maybeSingle();

        // Get question pool stats
        const { data: poolStats } = await supabase
          .from('question_pool')
          .select('total_ratings, sum_ratings')
          .eq('skill_id', skill.id)
          .eq('difficulty', level)
          .eq('active', true);

        let avgRating = null;
        if (poolStats && poolStats.length > 0) {
          const totalRatings = poolStats.reduce((sum, row) => sum + row.total_ratings, 0);
          const sumRatings = poolStats.reduce((sum, row) => sum + row.sum_ratings, 0);
          if (totalRatings > 0) {
            avgRating = Number((sumRatings / totalRatings).toFixed(2));
          }
        }

        levels.push({
          level,
          hasOptimizedPrompt: !!prompt,
          promptVersion: prompt?.version || null,
          avgRating,
          status: prompt?.status || null,
          lastOptimized: prompt?.updated_at || null,
        });
      }

      results.push({
        skillId: skill.id,
        skillName: skill.name,
        levels,
      });
    }

    return results;
  }
}

// Export singleton instance
export const promptOptimizer = new PromptOptimizer();
