# Skill Issue

## Overview

Skill Issue is an autonomous, agent-based learning system that builds and maintains real competence by periodically sending short challenges to users via push notifications. Instead of tracking content consumption or study time, the system measures whether a skill is actually usable at the moment it is tested.

The system adapts automatically: challenge difficulty, timing, and frequency change based on real user outcomes. LLMs are used as tools inside a broader autonomous system, not as a monolithic brain. Every LLM call, agent decision, and quality evaluation is traced and scored in [Opik](https://www.comet.com/opik) for full observability, prompt optimization, and continuous improvement.

## Core Product Principles

- **Competence over content** - Measure what you can do, not what you've read
- **Measurement over teaching** - Test real ability in the moment
- **Short interruptions, not study sessions** - Quick challenges that fit into your day
- **Autonomous adaptation** - System learns from your performance automatically
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
| **AI - Prompt Optimization** | Opik Optimizer (EvolutionaryOptimizer, HRPO, MetaPrompt) |
| **Observability** | Opik - tracing, feedback scores, prompt versioning, datasets, experiments |
| **Push Notifications** | Expo Server SDK |
| **Containerization** | Docker (multi-stage Node 18 Alpine) |

## Monorepo Structure

```
/
  /packages
    /backend       - Express API server with autonomous agents, LLM-as-Judge, Opik tracing
    /mobile        - React Native mobile app (Expo 54)
    /web           - React web dashboard (Vite)
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
  Generates MCQ challenge via Claude -> Validates structure -> LLM-as-Judge quality gate
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
Challenge Generation (Claude Haiku 4.5)
  -> Structural Validation (4 answer options, question length, JSON format)
    -> LLM-as-Judge Evaluation (5 quality dimensions, weighted composite score)
      -> Pass (>= 0.7 composite, no dimension below 0.4 veto threshold)
        -> Save to DB & send push notification
      -> Fail
        -> Regenerate (flow repeats, max retries configurable)
```

The structural validation step prevents unnecessary LLM-as-Judge calls. If validation fails or the judge score is too low, generation restarts automatically.

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

Opik is deeply integrated throughout the system for observability, evaluation, prompt versioning, and optimization. Here's everything we use it for:

### Tracing & Spans

Every operation is traced with hierarchical spans:

- **`challenge_generation`** - The most important trace. Contains all challenge generation LLM calls and LLM-as-Judge evaluation calls as nested spans. When a challenge fails the judge and gets regenerated, you can see each attempt as a separate span within the trace. Each `llm_judge_evaluation` span has a feedback tab showing per-dimension scores, and the parent `challenge_generation` trace shows the scores of the winning challenge.
  - [Example: Challenge succeeding on 3rd attempt after failing judge twice](https://www.comet.com/opik/omorris95/projects/019bec3e-4610-7572-8d58-3793d75a4068/traces?traces_filters=%5B%5D&time_range=alltime&size=100&height=small&trace=019c3c7a-f68a-7906-9a62-2828144222bb&span=&trace_panel_filters=%5B%5D&traceTab=details&thread=)
  - [Example: Challenge passing on first attempt](https://www.comet.com/opik/omorris95/projects/019bec3e-4610-7572-8d58-3793d75a4068/traces?traces_filters=%5B%5D&time_range=alltime&size=100&height=small&trace=019c3931-d423-7d70-9385-3be121db31f6&span=&trace_panel_filters=%5B%5D&traceTab=feedback_scores&thread=)
- **`scheduling_tick`** - Root trace for each scheduler run, linking to individual challenge traces
- **`scheduling_decision`** - Agent 1's decision about which users to challenge
- **`skill_state_update`** - Agent 3's difficulty adjustments after a user answers
- **`answer_submission`** - User answer processing

### Feedback Scores

Feedback scores are attached at both the span and trace level:
- **Span-level**: Each `llm_judge_evaluation` span shows per-dimension scores (clarity, difficulty alignment, distractor quality, educational value, skill relevance)
- **Trace-level**: The parent `challenge_generation` trace shows the final winning challenge's scores
- **Answer feedback**: Correct/incorrect outcomes are scored on answer submission traces

### Prompt Versioning

Prompts are saved to Opik with full version history, so you can track how prompts evolve over time as optimization runs improve them:
- [Example: Challenge generation prompt with version history](https://www.comet.com/opik/omorris95/prompts/019c390b-409d-75b9-a5d3-9a487f4882d2?tab=prompt&activeVersionId=019c390b-40a8-77e0-861b-7805f926296a)

### Datasets & Experiments

- **Test datasets** are generated per skill per difficulty level (e.g., `skill_{id}_level_{3}_examples`), initially populated with GPT-4o-generated example challenges
- These datasets will later be populated with real user data: questions with good user feedback, high skill accuracy, etc.
- **Experiments** run the baseline prompt against these datasets and measure quality via our LLM-as-Judge metric
- After prompt optimization, experiments can be re-run to compare metrics between the optimized and previous prompt

### Prompt Optimization

When a new skill is created, the system:
1. Generates test datasets for each difficulty level (1-10)
2. Runs the baseline prompt through the optimizer against these datasets
3. If improved prompts are found, they get promoted as the prompt for that skill and difficulty level
4. Optimized prompts are saved to Opik with a commit history showing each version

The optimizer can also be triggered automatically:
- When test data has been populated with real user data
- When metrics for a certain skill/difficulty level drop below a threshold

We support three optimizer types via Opik's optimizer library:
- **EvolutionaryOptimizer** (default) - Mutates prompts across generations
- **HierarchicalReflectiveOptimizer (HRPO)** - Reflective analysis with hierarchical refinement
- **MetaPromptOptimizer** - Uses meta-prompting to generate candidate prompts

[Example optimization run with before/after comparison](https://www.comet.com/opik/omorris95/optimizations/019c3d2d-59fc-78e5-9b52-9ccfb5f39f2d/compare?optimizations=%5B%22019c3d38-603c-78f3-a33c-c56afccb6058%22%5D)

### A/B Testing

Prompt variants can be registered in Opik and selected via weighted random assignment. Each variant is tagged on the trace so you can compare performance between prompt versions directly in the Opik dashboard.

## Package Details

### `@skill-issue/backend`

Express-based API server that orchestrates the core system:
- Three autonomous agents (scheduling, challenge design, skill state)
- Challenge generation via Anthropic Claude SDK (Haiku 4.5)
- LLM-as-Judge quality gate with 5-dimension evaluation
- Full Opik tracing with hierarchical spans, feedback scores, and prompt versioning
- Question pool for reusing high-quality challenges across users
- A/B testing support for prompt variants
- Push notification delivery via Expo Server SDK
- Cron-based scheduling with configurable intervals

**Key Dependencies**: Express, @anthropic-ai/sdk, @supabase/supabase-js, node-cron, expo-server-sdk, openai, zod

### `@learning-platform/mobile`

React Native mobile app built with Expo 54:
- Cross-platform iOS/Android
- User authentication via Clerk
- Challenge quiz interface with answer submission
- Feedback collection (confidence, difficulty ratings)
- Push notification handling for challenge delivery
- Skill browsing and selection
- Calibration assessments

**Key Dependencies**: Expo 54, React Native 0.81, @clerk/clerk-expo, expo-notifications, @tanstack/react-query, zustand, expo-router

### `@learning-platform/web`

React web dashboard:
- User dashboard and skill management
- Alternative interface to the mobile app
- Built with Vite 5 for fast development

**Key Dependencies**: React 19, Vite 5, @clerk/clerk-react, react-router-dom

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
- Supports EvolutionaryOptimizer, HRPO, and MetaPromptOptimizer
- Exports optimized prompts with baseline vs. improved scores

**Key Dependencies**: opik, opik-optimizer, anthropic, openai (via litellm), supabase, python-dotenv

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

# Run web app
cd packages/web
pnpm dev

# Run prompt optimization (Python)
cd optimization
pip install -r requirements.txt
python optimize_challenge_prompt.py --skill <skill_id> --level 3
```

## Documentation

- `AGENTS.md` - Detailed system architecture and development principles
- `docs/API_REFERENCE.md` - API endpoints and usage
- `optimization/README.md` - Prompt optimization usage and configuration
