import { randomBytes as cryptoRandomBytes } from 'crypto';
import type { OpikTrace, OpikSpan, OpikPrompt, SpanType } from '@/types';

/**
 * Opik integration for observability, tracing, and prompt optimization
 *
 * Features:
 * - Hierarchical tracing (traces contain spans)
 * - LLM call tracking with token usage and cost estimation
 * - Prompt versioning for A/B testing
 * - Feedback scores for evaluation
 */

const OPIK_BASE_URL = 'https://www.comet.com/opik/api';
const API_VERSION = 'v1/private';

/**
 * Generate a UUIDv7 (time-based UUID required by Opik)
 */
function generateUUIDv7(): string {
  const timestamp = Date.now();

  // UUIDv7 format: tttttttt-tttt-7xxx-yxxx-xxxxxxxxxxxx
  // t = timestamp, 7 = version, y = variant (8, 9, a, or b), x = random
  const timestampHex = timestamp.toString(16).padStart(12, '0');

  const randomBytes = cryptoRandomBytes(10);

  // Convert to hex
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Construct UUIDv7
  const uuid = [
    timestampHex.slice(0, 8),                          // First 8 chars of timestamp
    timestampHex.slice(8, 12),                         // Next 4 chars of timestamp
    '7' + randomHex.slice(0, 3),                       // Version 7 + 3 random chars
    ((parseInt(randomHex.slice(3, 5), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + randomHex.slice(5, 7), // Variant + random
    randomHex.slice(7, 19),                            // Remaining random
  ].join('-');

  return uuid;
}

// Anthropic pricing (per 1M tokens) - Claude Haiku
const ANTHROPIC_PRICING = {
  'claude-haiku-4-5-20251001': {
    input: 1.00,   // $1.00 per 1M input tokens
    output: 5.00,  // $5.00 per 1M output tokens
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-opus-20240229': {
    input: 15.00,
    output: 75.00,
  },
  // Default fallback
  default: {
    input: 1.00,
    output: 5.00,
  },
};

interface TraceContext {
  traceId: string;
  projectName: string;
  startTime: Date;
  input?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  creationPromise?: Promise<void>;  // Wait for trace to be created before updating
}

// Active trace contexts (for nested span support)
const activeTraces = new Map<string, TraceContext>();

class OpikService {
  private apiKey: string | null = null;
  private workspace: string | null = null;
  private projectName: string = 'skill-issue';
  private isEnabled: boolean = false;
  private pendingRequests: Promise<void>[] = [];

  initialize(apiKey?: string, workspaceName?: string): void {
    this.apiKey = apiKey || process.env.OPIK_API_KEY || null;
    this.workspace = workspaceName || process.env.OPIK_WORKSPACE || null;
    this.isEnabled = !!this.apiKey;

    if (!this.isEnabled) {
      console.log('[Opik] Not configured - using console logging for metrics');
      console.log('[Opik] Set OPIK_API_KEY to enable tracing');
      return;
    }

    console.log(`[Opik] Initialized for project: ${this.projectName}`);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: this.apiKey!,
      'Content-Type': 'application/json',
    };
    if (this.workspace) {
      headers['Comet-Workspace'] = this.workspace;
    }
    return headers;
  }

  private async request(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<globalThis.Response | null> {
    if (!this.isEnabled) {
      return null;
    }

    const url = `${OPIK_BASE_URL}/${API_VERSION}${endpoint}`;

    try {
      const response: globalThis.Response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Opik] API error ${response.status}: ${errorText}`);
      }

      return response;
    } catch (error) {
      console.error('[Opik] Request failed:', error);
      return null;
    }
  }

  /**
   * Calculate estimated cost for LLM usage
   */
  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing =
      ANTHROPIC_PRICING[model as keyof typeof ANTHROPIC_PRICING] ||
      ANTHROPIC_PRICING.default;

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  // ============= Trace Management =============

  /**
   * Start a new trace for an operation (e.g., agent execution)
   * Returns a trace ID that can be used to create child spans
   */
  async startTrace(params: {
    name: string;
    input?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    tags?: string[];
  }): Promise<string> {
    const traceId = generateUUIDv7();
    const startTime = new Date();

    const initialMetadata = {
      ...params.metadata,
      environment: process.env.NODE_ENV || 'development',
    };

    const context: TraceContext = {
      traceId,
      projectName: this.projectName,
      startTime,
      input: params.input,
      metadata: initialMetadata,
    };
    activeTraces.set(traceId, context);

    const traceData: Partial<OpikTrace> = {
      id: traceId,
      project_name: this.projectName,
      name: params.name,
      start_time: startTime.toISOString(),
      input: params.input,
      metadata: initialMetadata,
      tags: params.tags,
    };

    if (!this.isEnabled) {
      console.log(`[Opik] Trace started: ${params.name} (${traceId})`);
      return traceId;
    }

    // Use batch endpoint as required by Opik API
    // Store the promise so endTrace can wait for creation to complete
    const creationPromise = this.request('POST', '/traces/batch', { traces: [traceData] }).then(() => {});
    context.creationPromise = creationPromise;
    this.pendingRequests.push(creationPromise);

    return traceId;
  }

  /**
   * End a trace and record final output
   */
  async endTrace(params: {
    traceId: string;
    output?: Record<string, unknown>;
    error?: Error;
  }): Promise<void> {
    const context = activeTraces.get(params.traceId);
    if (!context) {
      console.warn(`[Opik] No active trace found: ${params.traceId}`);
      return;
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - context.startTime.getTime();

    const updateData: Partial<OpikTrace> = {
      project_name: context.projectName,  // Required to match the trace
      end_time: endTime.toISOString(),
      output: params.output,
      metadata: {
        ...context.metadata,  // Preserve original metadata
        duration_ms: durationMs,
        success: !params.error,
      },
    };

    if (params.error) {
      updateData.error_info = {
        exception_type: params.error.name,
        message: params.error.message,
        traceback: params.error.stack || '',
      };
    }

    // Store creation promise before deleting context
    const creationPromise = context.creationPromise;
    activeTraces.delete(params.traceId);

    if (!this.isEnabled) {
      console.log(`[Opik] Trace ended: ${params.traceId} (${durationMs}ms)`);
      return;
    }

    // Wait for trace creation to complete before updating
    // This prevents 404 errors from race conditions
    const promise = (async () => {
      if (creationPromise) {
        await creationPromise;
      }
      await this.request('PATCH', `/traces/${params.traceId}`, updateData);
    })();
    this.pendingRequests.push(promise);
  }

  // ============= Span Management =============

  /**
   * Create a span within a trace (e.g., LLM call, DB query)
   */
  async createSpan(params: {
    traceId: string;
    name: string;
    type: SpanType;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    model?: string;
    provider?: string;
    promptTokens?: number;
    completionTokens?: number;
    durationMs?: number;
    error?: Error;
    parentSpanId?: string;
  }): Promise<string> {
    const spanId = generateUUIDv7();
    const startTime = new Date();
    const endTime = params.durationMs
      ? new Date(startTime.getTime() + params.durationMs)
      : startTime;

    // Calculate cost if we have token data
    let estimatedCost: number | undefined;
    if (params.model && params.promptTokens && params.completionTokens) {
      estimatedCost = this.calculateCost(
        params.model,
        params.promptTokens,
        params.completionTokens
      );
    }

    const spanData: Partial<OpikSpan> = {
      id: spanId,
      trace_id: params.traceId,
      parent_span_id: params.parentSpanId,
      project_name: this.projectName,  // Required - spans don't inherit from trace
      name: params.name,
      type: params.type,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      input: params.input,
      output: params.output,
      metadata: {
        ...params.metadata,
        estimated_cost_usd: estimatedCost,
      },
      model: params.model,
      provider: params.provider,
      usage:
        params.promptTokens || params.completionTokens
          ? {
              prompt_tokens: params.promptTokens,
              completion_tokens: params.completionTokens,
              total_tokens:
                (params.promptTokens || 0) + (params.completionTokens || 0),
            }
          : undefined,
      total_estimated_cost: estimatedCost,
    };

    if (params.error) {
      spanData.error_info = {
        exception_type: params.error.name,
        message: params.error.message,
        traceback: params.error.stack || '',
      };
    }

    if (!this.isEnabled) {
      const costStr = estimatedCost ? ` ($${estimatedCost.toFixed(6)})` : '';
      console.log(
        `[Opik] Span: ${params.name} (${params.type}) - ${params.durationMs}ms${costStr}`
      );
      return spanId;
    }

    // Get the trace context to wait for trace creation
    const traceContext = activeTraces.get(params.traceId);
    const creationPromise = traceContext?.creationPromise;

    // Wait for trace creation before creating span
    const promise = (async () => {
      if (creationPromise) {
        await creationPromise;
      }
      await this.request('POST', '/spans/batch', { spans: [spanData] });
    })();
    this.pendingRequests.push(promise);

    return spanId;
  }

  // ============= High-Level Tracking Methods =============

  /**
   * Track a complete agent execution with optional nested LLM spans.
   * If traceId is provided, creates spans under the existing trace.
   * If not, creates a new standalone trace.
   */
  async trackAgentExecution(params: {
    agentName: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    durationMs: number;
    success: boolean;
    traceId?: string;
    llmCalls?: Array<{
      model: string;
      prompt: string;
      response: string;
      promptTokens?: number;
      completionTokens?: number;
      durationMs: number;
    }>;
  }): Promise<void> {
    if (params.traceId) {
      // Create a general span under the existing trace
      const agentSpanId = await this.createSpan({
        traceId: params.traceId,
        name: `agent_${params.agentName}`,
        type: 'general',
        input: params.input,
        output: params.output,
        metadata: { ...params.metadata, agent: params.agentName, success: params.success },
        durationMs: params.durationMs,
        error: params.success ? undefined : new Error('Agent execution failed'),
      });

      // Nest LLM spans under the agent span
      if (params.llmCalls) {
        for (const llmCall of params.llmCalls) {
          await this.createSpan({
            traceId: params.traceId,
            parentSpanId: agentSpanId,
            name: `llm_${llmCall.model}`,
            type: 'llm',
            model: llmCall.model,
            provider: this.getProviderFromModel(llmCall.model),
            input: { prompt: llmCall.prompt },
            output: { response: llmCall.response },
            promptTokens: llmCall.promptTokens,
            completionTokens: llmCall.completionTokens,
            durationMs: llmCall.durationMs,
          });
        }
      }
      return;
    }

    // No parent trace — create a standalone trace
    const traceId = await this.startTrace({
      name: `agent_${params.agentName}`,
      input: params.input,
      metadata: {
        ...params.metadata,
        agent: params.agentName,
      },
      tags: ['agent', params.agentName, params.success ? 'success' : 'failure'],
    });

    // Create spans for each LLM call
    if (params.llmCalls) {
      for (const llmCall of params.llmCalls) {
        await this.createSpan({
          traceId,
          name: `llm_${llmCall.model}`,
          type: 'llm',
          model: llmCall.model,
          provider: this.getProviderFromModel(llmCall.model),
          input: { prompt: llmCall.prompt },
          output: { response: llmCall.response },
          promptTokens: llmCall.promptTokens,
          completionTokens: llmCall.completionTokens,
          durationMs: llmCall.durationMs,
        });
      }
    }

    // End the trace
    await this.endTrace({
      traceId,
      output: params.output,
      error: params.success ? undefined : new Error('Agent execution failed'),
    });
  }

  /**
   * Track a standalone LLM call (when not part of an agent trace)
   */
  async trackLLMCall(params: {
    model: string;
    prompt: string;
    response: string;
    promptTokens?: number;
    completionTokens?: number;
    durationMs: number;
    success: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const traceId = await this.startTrace({
      name: 'llm_call',
      input: { prompt: params.prompt },
      metadata: params.metadata,
      tags: ['llm', params.model],
    });

    await this.createSpan({
      traceId,
      name: params.model,
      type: 'llm',
      model: params.model,
      provider: this.getProviderFromModel(params.model),
      input: { prompt: params.prompt },
      output: { response: params.response },
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      durationMs: params.durationMs,
      error: params.success ? undefined : new Error('LLM call failed'),
    });

    await this.endTrace({
      traceId,
      output: { response: params.response },
      error: params.success ? undefined : new Error('LLM call failed'),
    });
  }

  /**
   * Track challenge outcome metrics.
   * If traceId is provided, creates a span under the existing trace.
   * If not, creates a new standalone trace.
   */
  async trackChallengeMetrics(params: {
    challengeId: string;
    userId: string;
    skillId: string;
    difficulty: number;
    isCorrect: boolean;
    responseTimeMs: number;
    userConfidence?: number;
    traceId?: string;
  }): Promise<void> {
    const metricsInput = {
      challengeId: params.challengeId,
      userId: params.userId,
      skillId: params.skillId,
      difficulty: params.difficulty,
    };
    const metricsOutput = {
      isCorrect: params.isCorrect,
      responseTimeMs: params.responseTimeMs,
    };

    // Determine the traceId to use for feedback scores
    let feedbackTraceId: string;

    if (params.traceId) {
      // Create a span under the existing trace
      await this.createSpan({
        traceId: params.traceId,
        name: 'challenge_metrics',
        type: 'general',
        input: metricsInput,
        output: metricsOutput,
        metadata: { userConfidence: params.userConfidence },
      });
      feedbackTraceId = params.traceId;
    } else {
      // Standalone trace
      feedbackTraceId = await this.startTrace({
        name: 'challenge_outcome',
        input: metricsInput,
        metadata: { userConfidence: params.userConfidence },
        tags: ['challenge', params.isCorrect ? 'correct' : 'incorrect'],
      });

      await this.endTrace({
        traceId: feedbackTraceId,
        output: metricsOutput,
      });
    }

    // Add feedback score for the outcome
    await this.addFeedbackScore({
      traceId: feedbackTraceId,
      name: 'correctness',
      value: params.isCorrect ? 1 : 0,
      source: 'sdk',
      reason: params.isCorrect
        ? 'User answered correctly'
        : 'User answered incorrectly',
    });
  }

  /**
   * Track scheduling decision.
   * If traceId is provided, creates a span under the existing trace.
   * If not, creates a new standalone trace.
   */
  async trackSchedulingDecision(params: {
    userId: string;
    skillId: string;
    shouldChallenge: boolean;
    reason: string;
    difficultyTarget: number;
    traceId?: string;
  }): Promise<void> {
    const decisionInput = {
      userId: params.userId,
      skillId: params.skillId,
    };
    const decisionOutput = {
      decision: params.shouldChallenge,
      reason: params.reason,
      difficultyTarget: params.difficultyTarget,
    };

    if (params.traceId) {
      // Create a span under the existing trace
      await this.createSpan({
        traceId: params.traceId,
        name: 'scheduling_decision',
        type: 'general',
        input: decisionInput,
        output: decisionOutput,
      });
      return;
    }

    // Standalone trace
    const traceId = await this.startTrace({
      name: 'scheduling_decision',
      input: decisionInput,
      tags: ['scheduling', params.shouldChallenge ? 'challenged' : 'skipped'],
    });

    await this.endTrace({
      traceId,
      output: decisionOutput,
    });
  }

  // ============= Prompt Management =============

  /**
   * Register a prompt with Opik for versioning.
   * Opik auto-creates a new version if the template content changed.
   * If the same template is posted again, Opik returns the existing version.
   * Returns the prompt name and commit hash for linking to traces.
   */
  async createOrGetPrompt(params: {
    name: string;
    template: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ name: string; commit?: string }> {
    if (!this.isEnabled) {
      console.log(`[Opik] Prompt registered (local): ${params.name}`);
      return { name: params.name };
    }

    try {
      const response = await this.request('POST', '/prompts', {
        name: params.name,
        template: params.template,
        metadata: params.metadata,
        change_description: `Auto-registered at ${new Date().toISOString()}`,
      });

      if (response?.ok) {
        const data = await response.json() as Record<string, unknown>;
        const latestVersion = data?.latest_version as Record<string, unknown> | undefined;
        const commit = latestVersion?.commit as string | undefined;
        console.log(`[Opik] Prompt registered: ${params.name} (commit: ${commit || 'unknown'})`);
        return { name: params.name, commit };
      }
    } catch (error) {
      console.error('[Opik] Failed to register prompt:', error);
    }

    return { name: params.name };
  }

  /**
   * Get a prompt by name (for using versioned prompts)
   */
  async getPrompt(name: string): Promise<OpikPrompt | null> {
    if (!this.isEnabled) {
      return null;
    }

    const response = await this.request(
      'GET',
      `/prompts?name=${encodeURIComponent(name)}`
    );
    if (response?.ok) {
      const data = (await response.json()) as { content?: OpikPrompt[] };
      return data.content?.[0] || null;
    }
    return null;
  }

  // ============= Feedback & Evaluation =============

  /**
   * Add a feedback score to a trace
   */
  async addFeedbackScore(params: {
    traceId: string;
    name: string;
    value: number; // 0-1
    source: 'ui' | 'sdk' | 'online_scoring';
    reason?: string;
  }): Promise<void> {
    if (!this.isEnabled) {
      console.log(
        `[Opik] Feedback: ${params.name}=${params.value} for trace ${params.traceId}`
      );
      return;
    }

    const feedbackData = {
      name: params.name,
      value: params.value,
      source: params.source,
      reason: params.reason,
    };

    const promise = this.request(
      'PUT',
      `/traces/${params.traceId}/feedback-scores`,
      feedbackData
    ).then(() => {});
    this.pendingRequests.push(promise);
  }

  // ============= Utilities =============

  private getProviderFromModel(model: string): string {
    if (model.includes('claude') || model.includes('anthropic')) {
      return 'anthropic';
    }
    if (model.includes('gpt') || model.includes('openai')) {
      return 'openai';
    }
    if (model.includes('gemini') || model.includes('google')) {
      return 'google';
    }
    return 'unknown';
  }

  /**
   * Flush all pending requests (call before shutdown)
   */
  async flush(timeoutMs: number = 5000): Promise<void> {
    if (this.pendingRequests.length === 0) {
      return;
    }

    console.log(
      `[Opik] Flushing ${this.pendingRequests.length} pending requests...`
    );

    const timeout = new Promise<void>((resolve) =>
      setTimeout(resolve, timeoutMs)
    );

    await Promise.race([Promise.all(this.pendingRequests), timeout]);

    this.pendingRequests = [];
    console.log('[Opik] Flush complete');
  }

  /**
   * Check if Opik is enabled and configured
   */
  isConfigured(): boolean {
    return this.isEnabled;
  }
}

// Singleton instance
export const opikService = new OpikService();

export function initOpik(): void {
  const apiKey = process.env.OPIK_API_KEY;
  const workspace = process.env.OPIK_WORKSPACE;

  opikService.initialize(apiKey, workspace);
}

// Export for advanced usage
export { OpikService };
