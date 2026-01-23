import type { OpikTraceParams } from '@/types';

/**
 * Opik integration for observability and metrics
 * Tracks all agent decisions and LLM calls
 *
 * Currently uses console logging as placeholder.
 * TODO: Integrate actual Opik SDK when needed and rework to ensure we're using Opik correctly.
 */

// Note: Opik SDK types may need adjustment based on actual SDK
interface OpikClient {
  trace(params: OpikTraceParams): Promise<void>;
  flush(): Promise<void>;
}

class OpikService {
  private client: OpikClient | null = null;
  private isEnabled: boolean = false;

  initialize(apiKey?: string, workspaceName?: string): void {
    this.isEnabled = !!apiKey && !!workspaceName;

    if (!this.isEnabled) {
      console.log('[Opik] Not configured - using console logging for metrics');
      return;
    }

    // TODO: Initialize actual Opik client when SDK is available
    console.log(`[Opik] Initialized for workspace: ${workspaceName}`);
  }

  async trackAgentExecution(params: {
    agentName: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    durationMs: number;
    success: boolean;
  }): Promise<void> {
    const traceParams: OpikTraceParams = {
      name: `agent_${params.agentName}`,
      input: params.input,
      output: params.output,
      metadata: {
        ...params.metadata,
        durationMs: params.durationMs,
        success: params.success,
        timestamp: new Date().toISOString(),
      },
      tags: ['agent', params.agentName],
    };

    await this.trace(traceParams);
  }

  async trackLLMCall(params: {
    model: string;
    prompt: string;
    response: string;
    tokenCount?: number;
    durationMs: number;
    success: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const traceParams: OpikTraceParams = {
      name: 'llm_call',
      input: {
        model: params.model,
        prompt: params.prompt,
      },
      output: {
        response: params.response,
      },
      metadata: {
        ...params.metadata,
        tokenCount: params.tokenCount,
        durationMs: params.durationMs,
        success: params.success,
        timestamp: new Date().toISOString(),
      },
      tags: ['llm', params.model],
    };

    await this.trace(traceParams);
  }

  async trackChallengeMetrics(params: {
    challengeId: string;
    userId: string;
    skillId: string;
    difficulty: number;
    isCorrect: boolean;
    responseTimeMs: number;
    userConfidence?: number;
  }): Promise<void> {
    const traceParams: OpikTraceParams = {
      name: 'challenge_outcome',
      input: {
        challengeId: params.challengeId,
        userId: params.userId,
        skillId: params.skillId,
        difficulty: params.difficulty,
      },
      output: {
        isCorrect: params.isCorrect,
        responseTimeMs: params.responseTimeMs,
      },
      metadata: {
        userConfidence: params.userConfidence,
        timestamp: new Date().toISOString(),
      },
      tags: ['challenge', params.isCorrect ? 'correct' : 'incorrect'],
    };

    await this.trace(traceParams);
  }

  async trackSchedulingDecision(params: {
    userId: string;
    skillId: string;
    shouldChallenge: boolean;
    reason: string;
    difficultyTarget: number;
  }): Promise<void> {
    const traceParams: OpikTraceParams = {
      name: 'scheduling_decision',
      input: {
        userId: params.userId,
        skillId: params.skillId,
      },
      output: {
        decision: params.shouldChallenge,
        reason: params.reason,
        difficultyTarget: params.difficultyTarget,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
      tags: ['scheduling', params.shouldChallenge ? 'challenged' : 'skipped'],
    };

    await this.trace(traceParams);
  }

  private async trace(params: OpikTraceParams): Promise<void> {
    try {
      if (!this.isEnabled) {
        // Log to console when Opik is not configured
        console.log(`[Opik] ${params.name}:`, {
          tags: params.tags,
          success: params.metadata?.success,
          duration: params.metadata?.durationMs,
        });
        return;
      }

      // TODO: Replace with actual Opik SDK call
      // if (this.client) {
      //   await this.client.trace(params);
      // }
      console.log(`[Opik] Trace sent: ${params.name}`);
    } catch (error) {
      console.error('[Opik] Failed to send trace:', error);
      // Don't throw - observability failures shouldn't break the app
    }
  }

  async flush(): Promise<void> {
    if (this.client) {
      await this.client.flush();
    }
  }
}

// Singleton instance
export const opikService = new OpikService();

export function initOpik(): void {
  const apiKey = process.env.OPIK_API_KEY;
  const workspace = process.env.OPIK_WORKSPACE;

  opikService.initialize(apiKey, workspace);
}
