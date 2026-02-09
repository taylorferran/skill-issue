# Skill Issue

## Overview

Skill Issue is an autonomous learning system that tests real competence by periodically sending short challenges via push notifications. Instead of tracking study time or content consumption, it measures whether you can actually use a skill when tested.

The system continuously improves itself. Three autonomous agents handle scheduling, challenge generation, and skill progression. When users rate questions poorly, **Opik automatically optimizes the prompts** used to generate those questions—analyzing what went wrong and improving them through reasoning-based refinement, these prompts are then immediately used by the system. Every LLM call and agent decision is traced in Opik for full observability.

## Download

<p align="center">
  <img src="siqrcode.png" alt="Download QR Code" width="200" />
  <br />
  Scan to download the Android app
</p>

## Core Product Principles

- **Competence over content** - Measure what you can do, not what you've read
- **Measurement over teaching** - Test real ability in the moment
- **Short interruptions, not study sessions** - Quick challenges that fit into your day
- **Autonomous adaptation** - System learns from your performance automatically
- **Self-improving prompts** - Opik automatically optimizes question generation when quality drops
- **Strong observability and evaluation** - Every LLM call and agent decision is traced and scored via Opik

## Technology Stack

| Layer | Technology |
|---|---|
| **Monorepo** | PNPM workspaces |
| **Language** | TypeScript (backend & frontends), Python (prompt optimization) |
| **Backend** | Express, node-cron |
| **Mobile** | React Native (Expo 54), Zustand, React Query |
| **Web** | React 19, Vite 5, React Router |
| **Auth** | Clerk |
| **Database** | Supabase (PostgreSQL) |
| **AI - Challenge Generation** | Anthropic Claude SDK (Claude Haiku 4.5) |
| **AI - Dataset Generation** | OpenAI GPT-4o |
| **AI - Prompt Optimization** | Opik Optimizer (HRPO, EvolutionaryOptimizer, MetaPrompt) |
| **Observability** | Opik - tracing, feedback scores, prompt versioning, datasets, experiments |
| **Push Notifications** | Expo Server SDK |
| **Containerization** | Docker (multi-stage Node 18 Alpine) |

## Monorepo Structure

```
/
  /packages
    /backend       - Express API server with autonomous agents, LLM-as-Judge, Opik tracing
    /mobile        - React Native mobile app (Expo 54)
    /shared        - Common TypeScript types, schemas, API clients
  /optimization    - Python prompt optimization system (Opik Optimizer)
```

## System Architecture

The backend runs three autonomous agents orchestrated by a cron-based scheduler:

```
Scheduler Tick (cron: every 30 min)
  |
  v
Agent 1 - Scheduling Decision
  Evaluates all users/skills, decides who needs a challenge
  Factors: time since last challenge, quiet hours, accuracy threshold, max daily challenges
  |
  v
Agent 2 - Challenge Design
  Checks question pool for reusable high-quality questions
  If none found -> Generates MCQ via Claude -> Validates structure -> LLM-as-Judge quality gate
  If validation or judge fails -> regenerate (up to retry limit)
  |
  v
Agent 3 - Skill State Update
  Evaluates answer correctness, adjusts difficulty target (+-1), updates streaks
  |
  v
Push Notification -> User answers -> Agent 3 processes response
```

### Challenge Generation Flow

```
Check Question Pool
  -> Found high-quality match?
    -> Reuse existing question (saves API calls)
  -> Not found?
    -> Generate new challenge (Claude Haiku 4.5)
      -> Structural Validation (4 answer options, question length, JSON format)
        -> LLM-as-Judge Evaluation (5 quality dimensions, weighted composite score)
          -> Pass (>= 0.7 composite, no dimension below 0.4 veto threshold)
            -> Save to DB & question pool -> Send push notification
          -> Fail
            -> Regenerate (flow repeats, max retries configurable)
```

The question pool significantly reduces LLM API calls by reusing high-quality questions across users. Questions are eligible for reuse if they have an average rating of 2.0+ stars or haven't been rated yet.

### LLM-as-Judge

Every generated challenge passes through an LLM-as-Judge quality gate before being stored. The judge evaluates 5 weighted dimensions:

| Dimension | Weight | What it measures |
|---|---|---|
| Clarity | 20% | Is the question unambiguous? |
| Difficulty Alignment | 25% | Does complexity match the target difficulty (1-10)? |
| Distractor Quality | 20% | Are wrong options plausible but clearly incorrect? |
| Educational Value | 15% | Does the explanation effectively teach WHY? |
| Skill Relevance | 20% | Does the question genuinely test the stated skill? |

**Quality gate**: Composite score >= 0.7 to pass. Any single dimension below 0.4 triggers a veto regardless of composite score.

Each evaluation is recorded as feedback scores on the Opik trace, so you can see exactly how every challenge scored and why it passed or failed.

## Opik Integration

Opik is deeply integrated throughout the system for observability, evaluation, prompt versioning, and optimization.

### Tracing & Spans

Every operation is traced with hierarchical spans:

- **`challenge_generation`** - Contains all challenge generation LLM calls and LLM-as-Judge evaluation calls as nested spans. When a challenge fails the judge and gets regenerated, you can see each attempt as a separate span within the trace. Each `llm_judge_evaluation` span has a feedback tab showing per-dimension scores, and the parent `challenge_generation` trace shows the scores of the winning challenge.
  - [Example: Challenge succeeding on 3rd attempt after failing judge twice](https://www.comet.com/opik/omorris95/projects/019bec3e-4610-7572-8d58-3793d75a4068/traces?traces_filters=%5B%5D&time_range=alltime&size=100&height=small&trace=019c3c7a-f68a-7906-9a62-2828144222bb&span=&trace_panel_filters=%5B%5D&traceTab=details&thread=)
  - [Example: Challenge passing on first attempt](https://www.comet.com/opik/omorris95/projects/019bec3e-4610-7572-8d58-3793d75a4068/traces?traces_filters=%5B%5D&time_range=alltime&size=100&height=small&trace=019c3931-d423-7d70-9385-3be121db31f6&span=&trace_panel_filters=%5B%5D&traceTab=feedback_scores&thread=)
- **`scheduling_tick`** - Root trace for each scheduler run, linking to individual challenge traces
- **`scheduling_decision`** - Agent 1's decision about which users to challenge
- **`skill_state_update`** - Agent 3's difficulty adjustments after a user answers
- **`answer_submission`** - User answer processing
- **`dataset_generation_examples`** - Dataset creation for prompt optimization
- **`prompt_optimization`** - Full optimization run with refinement iterations

### Feedback Scores

Feedback scores are attached at both the span and trace level:
- **Span-level**: Each `llm_judge_evaluation` span shows per-dimension scores (clarity, difficulty alignment, distractor quality, educational value, skill relevance)
- **Trace-level**: The parent `challenge_generation` trace shows the final winning challenge's scores
- **Answer feedback**: Correct/incorrect outcomes are scored on answer submission traces
- **User ratings**: 1-5 star ratings from users feed back into question quality tracking

### Prompt Versioning

Prompts are saved to Opik with full version history. When optimization improves a prompt, the new version is stored with metrics showing baseline vs. improved scores. The admin dashboard shows all versions, their performance, and which is currently active.

### Datasets & Experiments

- **Test datasets** are generated per skill per difficulty level (e.g., `skill_{id}_level_{7}_examples`)
- Datasets contain 5 high-quality example challenges generated by GPT-4o
- These serve as benchmarks for measuring prompt quality during optimization
- **Experiments** run prompts against these datasets and measure quality via LLM-as-Judge
- After optimization, experiments compare metrics between baseline and optimized prompts

### Automated Prompt Optimization

The system monitors question quality continuously and optimizes prompts automatically:

**How it works:**
1. Every hour, checks average user ratings for each skill+level combination
2. When ratings drop below 2.5 stars (with 10+ rated questions), triggers optimization
3. Automatically generates benchmark dataset if it doesn't exist (5 examples via GPT-4o)
4. Runs Opik's **HRPO** (HierarchicalReflectiveOptimizer) with 5 refinement cycles
5. HRPO analyzes why prompts fail and hierarchically refines them through reasoning
6. Measures quality using the same LLM-as-Judge metric (5 dimensions, composite score)
7. If improved, automatically deploys the optimized prompt
8. Won't re-optimize unless rating changes by 0.1+ points (prevents wasteful reruns)

**Optimizer types supported:**
- **HierarchicalReflectiveOptimizer (HRPO)** - Default. Uses reflective analysis and structured reasoning
- **EvolutionaryOptimizer** - Mutates prompts across generations
- **MetaPromptOptimizer** - Uses meta-prompting to generate candidate prompts

The admin dashboard shows optimization status, pending jobs, low-rated skills, and full version history with scores.

### A/B Testing

Prompt variants can be registered in Opik and selected via weighted random assignment. Each variant is tagged on the trace so you can compare performance between prompt versions in the Opik dashboard. Currently disabled by default (`AB_TEST_CHALLENGE_PROMPT_ENABLED=false`).

## Package Details

### `@skill-issue/backend`

Express-based API server that orchestrates the core system:
- Three autonomous agents (scheduling, challenge design, skill state)
- Challenge generation via Anthropic Claude SDK (Haiku 4.5)
- LLM-as-Judge quality gate with 5-dimension evaluation
- Full Opik tracing with hierarchical spans, feedback scores, and prompt versioning
- Question pool for reusing high-quality challenges across users
- Automated prompt optimization scheduler (hourly checks)
- Admin dashboard for viewing prompts, optimization status, and triggering manual optimization
- A/B testing support for prompt variants
- Push notification delivery via Expo Server SDK
- Cron-based scheduling with configurable intervals

**Key Dependencies**: Express, @anthropic-ai/sdk, @supabase/supabase-js, node-cron, expo-server-sdk, openai, opik, zod

### `@learning-platform/mobile`

React Native mobile app built with Expo 54:
- Cross-platform iOS/Android
- User authentication via Clerk
- Challenge quiz interface with answer submission
- Feedback collection (confidence, difficulty ratings, 1-5 star quality ratings)
- Push notification handling for challenge delivery
- Skill browsing and selection
- Calibration assessments

**Key Dependencies**: Expo 54, React Native 0.81, @clerk/clerk-expo, expo-notifications, @tanstack/react-query, zustand, expo-router

### `@learning-platform/shared`

Shared TypeScript package:
- Common type definitions
- Zod schemas for validation
- API client utilities

**Key Dependencies**: @anthropic-ai/sdk, zod

### `/optimization` (Python)

Prompt optimization system using Opik's optimizer library:
- Per-skill, per-difficulty-level prompt optimization
- Prompts are "baked" with concrete values before optimization (no template variables)
- Uses LLM-as-Judge as the quality metric for the optimizer
- Supports HRPO (default), EvolutionaryOptimizer, and MetaPromptOptimizer
- Exports optimized prompts with baseline vs. improved scores to JSON and database
- Called by TypeScript backend via subprocess when optimization is triggered

**Key Dependencies**: opik, opik-optimizer, anthropic, openai, litellm, supabase, python-dotenv

## Development

```bash
# Install dependencies
pnpm install

# Run backend
cd packages/backend
pnpm dev

# Run mobile app
cd packages/mobile
pnpm start

# Run prompt optimization (Python) - normally called automatically by backend
cd optimization
pip install -r requirements.txt
python optimize_challenge_prompt.py --skill <skill_id> --level 3 --optimizer hrpo
```

## Environment Configuration

Key environment variables for the backend:

```bash
# Prompt Optimization (automated)
PROMPT_OPTIMIZATION_ENABLED=true
PROMPT_OPTIMIZATION_RATING_THRESHOLD=2.5
PROMPT_OPTIMIZATION_MIN_QUESTIONS=10
PROMPT_OPTIMIZATION_CHECK_INTERVAL_HOURS=1
PROMPT_OPTIMIZATION_AUTO_DEPLOY=true
PROMPT_OPTIMIZATION_MAX_CONCURRENT_JOBS=2
PROMPT_OPTIMIZATION_REFINEMENTS=5

# Question Pool (reduces API costs)
QUESTION_POOL_ENABLED=true
QUESTION_POOL_MIN_RATING=2.0
ADD_GENERATED_TO_POOL=true

# LLM Settings
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=400

# A/B Testing
AB_TEST_CHALLENGE_PROMPT_ENABLED=false
```