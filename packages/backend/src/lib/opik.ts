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

interface SpanContext {
  spanId: string;
  creationPromise: Promise<void>;  // Wait for span to be created before adding feedback
}

// Active trace contexts (for nested span support)
const activeTraces = new Map<string, TraceContext>();

// Active span contexts (for feedback score support)
const activeSpans = new Map<string, SpanContext>();

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
        // Clone response before consuming body for error logging
        const errorResponse = response.clone();
        try {
          const errorText = await errorResponse.text();
          console.error(`[Opik] API error ${response.status}: ${errorText}`);
        } catch (readError) {
          console.error(`[Opik] API error ${response.status} (could not read body)`);
        }
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
    const traceCreationPromise = traceContext?.creationPromise;

    // Wait for trace creation before creating span
    const spanCreationPromise = (async () => {
      try {
        if (traceCreationPromise) {
          await traceCreationPromise;
        }
        await this.request('POST', '/spans/batch', { spans: [spanData] });
      } catch (error) {
        console.error(`[Opik] Span creation failed for ${spanId}:`, error);
      }
    })();
    this.pendingRequests.push(spanCreationPromise);

    // Track span creation promise so feedback can wait for it
    activeSpans.set(spanId, {
      spanId,
      creationPromise: spanCreationPromise,
    });

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
      // Create a tool span under the existing trace (agents perform DB operations)
      const agentSpanId = await this.createSpan({
        traceId: params.traceId,
        name: `agent_${params.agentName}`,
        type: 'tool',
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
   *
   * @param tags - Tags for organizing and filtering prompts, useful for A/B testing
   *               (e.g., ['variant_a', 'experiment_123', 'production'])
   */
  async createOrGetPrompt(params: {
    name: string;
    template: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
  }): Promise<{ name: string; commit?: string }> {
    if (!this.isEnabled) {
      const tagsStr = params.tags ? ` (tags: ${params.tags.join(', ')})` : '';
      console.log(`[Opik] Prompt registered (local): ${params.name}${tagsStr}`);
      return { name: params.name };
    }

    try {
      // First check if prompt already exists to avoid 409 errors
      const existingPrompt = await this.getPromptWithVersion(params.name);
      if (existingPrompt) {
        console.log(`[Opik] Using existing prompt: ${params.name} (commit: ${existingPrompt.commit || 'unknown'})`);
        return { name: params.name, commit: existingPrompt.commit };
      }

      // Prompt doesn't exist, create it
      const response = await this.request('POST', '/prompts', {
        name: params.name,
        template: params.template,
        metadata: params.metadata,
        tags: params.tags,
        change_description: `Auto-registered at ${new Date().toISOString()}`
      });

      if (response?.ok) {
        try {
          const data = await response.json() as Record<string, unknown>;
          const latestVersion = data?.latest_version as Record<string, unknown> | undefined;
          const commit = latestVersion?.commit as string | undefined;
          const tagsStr = params.tags ? `, tags: ${params.tags.join(', ')}` : '';
          console.log(`[Opik] Prompt registered: ${params.name} (commit: ${commit || 'unknown'}${tagsStr})`);
          return { name: params.name, commit };
        } catch (jsonError) {
          console.error('[Opik] Failed to parse prompt registration response:', jsonError);
          // Still return success with just the name if we got an OK status
          return { name: params.name };
        }
      } else {
        console.error(`[Opik] Prompt registration failed with status: ${response?.status}`);
      }
    } catch (error) {
      console.error('[Opik] Failed to register prompt:', error);
    }

    return { name: params.name };
  }

  /**
   * Get a prompt by name with version info (uses the detail endpoint)
   */
  private async getPromptWithVersion(name: string): Promise<{ name: string; commit?: string } | null> {
    if (!this.isEnabled) {
      return null;
    }

    // First get the prompt ID from the list
    const listResponse = await this.request(
      'GET',
      `/prompts?name=${encodeURIComponent(name)}`
    );
    if (!listResponse?.ok) {
      return null;
    }

    const listData = await listResponse.json() as { content?: Array<{ id?: string; name?: string }> };
    const promptInfo = listData.content?.find(p => p.name === name);
    if (!promptInfo?.id) {
      return null;
    }

    // Now get the full prompt details including latest_version
    const detailResponse = await this.request('GET', `/prompts/${promptInfo.id}`);
    if (!detailResponse?.ok) {
      return { name };
    }

    const detailData = await detailResponse.json() as Record<string, unknown>;
    const latestVersion = detailData?.latest_version as Record<string, unknown> | undefined;
    const commit = latestVersion?.commit as string | undefined;

    return { name, commit };
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

  // ============= A/B Testing =============

  /**
   * Select a prompt variant for A/B testing based on weights.
   * Uses weighted random selection to distribute traffic across variants.
   *
   * @param variants - Array of prompt variants with templates and traffic weights
   * @returns Selected variant with name, template, and metadata
   *
   * @example
   * ```typescript
   * const variant = opikService.selectPromptVariant({
   *   experimentName: 'challenge_prompt_experiment',
   *   variants: [
   *     {
   *       name: 'control',
   *       template: originalTemplate,
   *       weight: 50,  // 50% of traffic
   *       tags: ['control', 'experiment_1']
   *     },
   *     {
   *       name: 'variant_a',
   *       template: experimentalTemplate,
   *       weight: 50,  // 50% of traffic
   *       tags: ['variant_a', 'experiment_1', 'test']
   *     }
   *   ]
   * });
   * ```
   */
  selectPromptVariant(params: {
    experimentName: string;
    variants: Array<{
      name: string;
      template: string;
      weight: number;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }>;
  }): {
    variantName: string;
    template: string;
    tags: string[];
    metadata: Record<string, unknown>;
  } {
    const { experimentName, variants } = params;

    // Validate weights
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight === 0) {
      throw new Error(`[Opik] A/B Test '${experimentName}': Total weight cannot be 0`);
    }

    // Weighted random selection
    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;

    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        console.log(
          `[Opik] A/B Test '${experimentName}': Selected variant '${variant.name}' (weight: ${variant.weight}/${totalWeight})`
        );

        return {
          variantName: variant.name,
          template: variant.template,
          tags: [
            ...(variant.tags || []),
            `experiment:${experimentName}`,
            `variant:${variant.name}`,
          ],
          metadata: {
            ...(variant.metadata || {}),
            experiment: experimentName,
            variant: variant.name,
            variantWeight: variant.weight,
            totalWeight,
          },
        };
      }
    }

    // Fallback to first variant (should never reach here)
    const fallback = variants[0];
    console.warn(
      `[Opik] A/B Test '${experimentName}': Fallback to variant '${fallback.name}'`
    );
    return {
      variantName: fallback.name,
      template: fallback.template,
      tags: [
        ...(fallback.tags || []),
        `experiment:${experimentName}`,
        `variant:${fallback.name}`,
      ],
      metadata: {
        ...(fallback.metadata || {}),
        experiment: experimentName,
        variant: fallback.name,
        variantWeight: fallback.weight,
        totalWeight,
      },
    };
  }

  /**
   * Register all variants of an A/B test experiment with Opik.
   * Each variant will be registered as a separate prompt with appropriate tags.
   *
   * @returns Array of registered prompt information
   */
  async registerABTestVariants(params: {
    experimentName: string;
    variants: Array<{
      name: string;
      template: string;
      weight: number;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }>;
  }): Promise<Array<{ variantName: string; promptName: string; commit?: string }>> {
    const { experimentName, variants } = params;
    const results = [];

    console.log(
      `[Opik] Registering A/B test '${experimentName}' with ${variants.length} variants`
    );

    for (const variant of variants) {
      const promptName = `${experimentName}_${variant.name}`;
      const tags = [
        ...(variant.tags || []),
        `experiment:${experimentName}`,
        `variant:${variant.name}`,
      ];

      const result = await this.createOrGetPrompt({
        name: promptName,
        template: variant.template,
        tags,
        metadata: {
          ...(variant.metadata || {}),
          experiment: experimentName,
          variant: variant.name,
          weight: variant.weight,
        },
      });

      results.push({
        variantName: variant.name,
        promptName: result.name,
        commit: result.commit,
      });
    }

    console.log(`[Opik] A/B test '${experimentName}' registered successfully`);
    return results;
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

  /**
   * Add multiple feedback scores to a trace at once.
   * Convenience method for LLM-as-Judge evaluations that produce multiple metrics.
   */
  async addFeedbackScores(
    traceId: string,
    scores: Array<{
      name: string;
      value: number;
      reason?: string;
    }>,
    source: 'ui' | 'sdk' | 'online_scoring' = 'online_scoring'
  ): Promise<void> {
    if (!this.isEnabled) {
      console.log(
        `[Opik] Batch feedback: ${scores.length} scores for trace ${traceId}`
      );
      for (const score of scores) {
        console.log(`  - ${score.name}=${score.value.toFixed(2)}`);
      }
      return;
    }

    // Add all scores in parallel
    const promises = scores.map((score) =>
      this.addFeedbackScore({
        traceId,
        name: score.name,
        value: score.value,
        source,
        reason: score.reason,
      })
    );

    await Promise.all(promises);
  }

  /**
   * Add a feedback score to a span
   * Useful for attaching evaluation scores directly to LLM call spans
   */
  async addSpanFeedbackScore(params: {
    spanId: string;
    name: string;
    value: number; // 0-1
    source: 'ui' | 'sdk' | 'online_scoring';
    reason?: string;
  }): Promise<void> {
    if (!this.isEnabled) {
      console.log(
        `[Opik] Span Feedback: ${params.name}=${params.value} for span ${params.spanId}`
      );
      return;
    }

    const feedbackData = {
      name: params.name,
      value: params.value,
      source: params.source,
      reason: params.reason,
    };

    // Get span context to wait for span creation
    const spanContext = activeSpans.get(params.spanId);
    const spanCreationPromise = spanContext?.creationPromise;

    const promise = (async () => {
      try {
        // Wait for span to be created before adding feedback
        if (spanCreationPromise) {
          await spanCreationPromise;
        }
        await this.request(
          'PUT',
          `/spans/${params.spanId}/feedback-scores`,
          feedbackData
        );
      } catch (error) {
        console.error(`[Opik] Span feedback failed for ${params.spanId}:`, error);
      }
    })();
    this.pendingRequests.push(promise);
  }

  /**
   * Add multiple feedback scores to a span at once.
   * Convenience method for attaching LLM-as-Judge scores to evaluation spans.
   */
  async addSpanFeedbackScores(
    spanId: string,
    scores: Array<{
      name: string;
      value: number;
      reason?: string;
    }>,
    source: 'ui' | 'sdk' | 'online_scoring' = 'online_scoring'
  ): Promise<void> {
    if (!this.isEnabled) {
      console.log(
        `[Opik] Batch span feedback: ${scores.length} scores for span ${spanId}`
      );
      for (const score of scores) {
        console.log(`  - ${score.name}=${score.value.toFixed(2)}`);
      }
      return;
    }

    // Add all scores in parallel
    const promises = scores.map((score) =>
      this.addSpanFeedbackScore({
        spanId,
        name: score.name,
        value: score.value,
        source,
        reason: score.reason,
      })
    );

    await Promise.all(promises);
  }

  // ============= Dataset Management =============

  /**
   * Find a dataset by name
   */
  async findDataset(name: string): Promise<{ id: string; name: string } | null> {
    if (!this.isEnabled) {
      console.log(`[Opik] Dataset lookup (local): ${name}`);
      return null;
    }

    const response = await this.request('GET', `/datasets?name=${encodeURIComponent(name)}`);
    if (response?.ok) {
      const data = await response.json() as { content?: Array<{ id: string; name: string }> };
      const datasets = data?.content || [];
      return datasets.find((d) => d.name === name) || null;
    }
    return null;
  }

  /**
   * Create a new dataset
   */
  async createDataset(params: {
    name: string;
    description?: string;
  }): Promise<string | null> {
    if (!this.isEnabled) {
      console.log(`[Opik] Dataset created (local): ${params.name}`);
      return 'local-dataset-id';
    }

    const id = generateUUIDv7();
    const response = await this.request('POST', '/datasets', {
      id,
      name: params.name,
      description: params.description,
    });

    if (response?.ok) {
      console.log(`[Opik] Dataset created: ${params.name}`);
      return id;
    }

    // Handle 409 - dataset already exists
    if (response?.status === 409) {
      console.log(`[Opik] Dataset already exists: ${params.name}`);
      const existing = await this.findDataset(params.name);
      return existing?.id || null;
    }

    return null;
  }

  /**
   * Add items to a dataset
   *
   * For example-based datasets:
   * - input: {} (empty)
   * - expected_output: { question, options, correctAnswerIndex, explanation }
   *
   * Opik expects `input` and `expected_output` as top-level fields in `data`.
   * Do NOT flatten - the Python optimizer reads via dataset_item.get("expected_output", {})
   */
  async addDatasetItems(
    datasetName: string,
    items: Array<{
      input: Record<string, unknown>;
      expected_output: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[Opik] Added ${items.length} items to dataset (local): ${datasetName}`);
      return;
    }

    // Format items according to Opik API spec:
    // - Use PUT method (not POST)
    // - Preserve nested structure in 'data' object
    // - 'source' field is required
    const formattedItems = items.map(item => ({
      id: generateUUIDv7(),
      source: 'sdk',
      data: {
        input: item.input,                    // Preserve as nested object
        expected_output: item.expected_output, // Preserve as nested object
      },
    }));

    // Batch in groups of 50
    for (let i = 0; i < formattedItems.length; i += 50) {
      const batch = formattedItems.slice(i, i + 50);
      const response = await this.request('PUT', '/datasets/items', {
        dataset_name: datasetName,
        items: batch,
      });

      if (!response?.ok) {
        console.error(`[Opik] Failed to add batch ${i / 50 + 1} to dataset ${datasetName}`);
      }
    }

    console.log(`[Opik] Added ${formattedItems.length} items to dataset ${datasetName}`);
  }

  /**
   * Get items from a dataset
   */
  async getDatasetItems(datasetName: string): Promise<Array<Record<string, unknown>>> {
    if (!this.isEnabled) {
      console.log(`[Opik] Get dataset items (local): ${datasetName}`);
      return [];
    }

    // First get the dataset ID from the name
    const dataset = await this.findDataset(datasetName);
    if (!dataset) {
      console.warn(`[Opik] Dataset not found: ${datasetName}`);
      return [];
    }

    console.log(`[Opik] Fetching items for dataset: ${datasetName} (id: ${dataset.id})`);

    // Endpoint is GET /datasets/{id}/items with ID in path
    const response = await this.request('GET', `/datasets/${dataset.id}/items?size=100`);
    if (response?.ok) {
      const data = await response.json() as { content?: Array<Record<string, unknown>>; total?: number };
      console.log(`[Opik] Found ${data?.content?.length || 0} items (total: ${data?.total || 'unknown'})`);
      return data?.content || [];
    } else {
      console.error(`[Opik] Failed to fetch dataset items, status: ${response?.status}`);
    }
    return [];
  }

  // ============= Experiment Management =============

  /**
   * Log experiment items in bulk.
   * Creates the experiment automatically if it doesn't exist.
   * Uses trace/spans format to populate Opik's built-in usage columns.
   */
  async logExperimentItems(params: {
    experimentName: string;
    datasetName: string;
    items: Array<{
      datasetItemId: string;
      output: Record<string, unknown>;
      trace?: {
        name: string;
        input: Record<string, unknown>;
        output: Record<string, unknown>;
        startTime: string;
        endTime: string;
      };
      spans?: Array<{
        name: string;
        type: 'llm' | 'general';
        model?: string;
        provider?: string;
        startTime: string;
        endTime: string;
        input?: Record<string, unknown>;
        output?: Record<string, unknown>;
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
        totalEstimatedCost?: number;
      }>;
      feedbackScores?: Array<{
        name: string;
        value: number;
        reason?: string;
      }>;
    }>;
  }): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[Opik] Experiment logged (local): ${params.experimentName} with ${params.items.length} items`);
      return;
    }

    const formattedItems = params.items.map(item => {
      // If trace/spans provided, use that format for proper usage tracking
      if (item.trace && item.spans) {
        return {
          dataset_item_id: item.datasetItemId,
          trace: {
            name: item.trace.name,
            input: item.trace.input,
            output: item.trace.output,
            start_time: item.trace.startTime,
            end_time: item.trace.endTime,
          },
          spans: item.spans.map(span => ({
            name: span.name,
            type: span.type,
            model: span.model,
            provider: span.provider,
            start_time: span.startTime,
            end_time: span.endTime,
            input: span.input,
            output: span.output,
            usage: span.usage,
            total_estimated_cost: span.totalEstimatedCost,
          })),
          feedback_scores: item.feedbackScores?.map(score => ({
            name: score.name,
            value: score.value,
            source: 'sdk',
            reason: score.reason,
          })),
        };
      }

      // Fallback to simple evaluate_task_result format
      return {
        dataset_item_id: item.datasetItemId,
        evaluate_task_result: item.output,
        feedback_scores: item.feedbackScores?.map(score => ({
          name: score.name,
          value: score.value,
          source: 'sdk',
          reason: score.reason,
        })),
      };
    });

    // Batch in groups of 50 to avoid payload limits
    for (let i = 0; i < formattedItems.length; i += 50) {
      const batch = formattedItems.slice(i, i + 50);
      const response = await this.request('PUT', '/experiments/items/bulk', {
        experiment_name: params.experimentName,
        dataset_name: params.datasetName,
        items: batch,
      });

      if (!response?.ok) {
        console.error(`[Opik] Failed to log experiment batch ${i / 50 + 1}`);
      }
    }

    console.log(`[Opik] Experiment '${params.experimentName}' logged with ${params.items.length} items`);
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

// Export UUID generator for dataset operations
export { generateUUIDv7 };
