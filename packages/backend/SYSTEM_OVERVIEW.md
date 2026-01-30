# Skill Issue Backend - Complete System Overview

**Last Updated**: 2026-01-29
**Version**: 0.3.0

This document provides a comprehensive technical overview of the Skill Issue backend system. It's designed for AI models or developers who need to understand the entire system architecture, integrations, and design philosophy to make informed changes.

---

## Table of Contents

1. [Project Purpose & Goals](#project-purpose--goals)
2. [High-Level Architecture](#high-level-architecture)
3. [Core Concepts](#core-concepts)
4. [Three-Agent System](#three-agent-system)
5. [Database Schema](#database-schema)
6. [Integrations](#integrations)
7. [API Endpoints](#api-endpoints)
8. [Configuration](#configuration)
9. [Key Algorithms](#key-algorithms)
10. [A/B Testing System](#ab-testing-system)
11. [Error Handling & Resilience](#error-handling--resilience)
12. [Development Workflow](#development-workflow)
13. [Recent Changes & Evolution](#recent-changes--evolution)

---

## Project Purpose & Goals

### What is Skill Issue?

**Skill Issue** is an adaptive learning platform that uses AI to generate personalized multiple-choice challenges for users to practice and master various skills. It's designed to optimize learning through:

1. **Spaced Repetition**: Challenges are scheduled intelligently based on timing and user performance
2. **Adaptive Difficulty**: Challenge difficulty adjusts automatically based on user accuracy
3. **Data-Driven Optimization**: A/B testing and observability to continuously improve prompt quality
4. **Microlearning**: Short, focused challenges that can be completed in under 30 seconds

### Key Goals

- **Personalization**: Each user gets challenges tailored to their skill level and learning pace
- **Engagement**: Prevent challenge fatigue through quiet hours and smart scheduling
- **Quality**: Use LLMs to generate high-quality, pedagogically sound challenges
- **Measurability**: Track everything to understand what works and optimize continuously
- **Scalability**: Handle thousands of users with efficient scheduling and generation

### Target Use Case

Users enroll in skills (e.g., "Algebra I", "US Constitution", "Python Basics"). The system:
1. Generates challenges at appropriate difficulty levels
2. Sends push notifications (future feature)
3. Tracks user performance and adjusts difficulty
4. Ensures consistent practice through intelligent scheduling

---

## High-Level Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Future)                       │
│                    Mobile App / Web UI                       │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Backend                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            API Layer (routes.ts)                       │ │
│  │  - Authentication Middleware                            │ │
│  │  - Request Validation (Zod)                            │ │
│  │  - Route Handlers                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Three-Agent System                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Agent 1    │  │   Agent 2    │  │   Agent 3   │ │ │
│  │  │  Scheduling  │  │  Challenge   │  │  Skill      │ │ │
│  │  │              │  │   Design     │  │  State      │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                Service Layer                            │ │
│  │  - Scheduler Service (node-cron)                       │ │
│  │  - Push Notification Service (Expo)                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Integration Layer                          │ │
│  │  - Supabase Client                                     │ │
│  │  - Anthropic LLM Provider                              │ │
│  │  - Opik Observability                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌───────────────┐  ┌────────────┐  ┌─────────────┐
    │   Supabase    │  │ Anthropic  │  │    Opik     │
    │  PostgreSQL   │  │   Claude   │  │ Observabil. │
    │   Database    │  │    API     │  │  Platform   │
    └───────────────┘  └────────────┘  └─────────────┘
```

### Request Flow Examples

**User Answers a Challenge**:
```
User → POST /api/answer → Validate → Store Answer → Agent 3 (Update Skill State) → Opik (Track Metrics) → Response
```

**Scheduled Challenge Generation**:
```
Cron Trigger → Scheduler Service → Agent 1 (Select Users) → Agent 2 (Generate Challenge) → Store → Push Event → Opik (Track)
```

---

## Core Concepts

### Users

A user represents someone practicing skills on the platform.

**Properties**:
- `id`: UUID primary key
- `device_id`: For push notifications (optional)
- `timezone`: User's timezone for quiet hours
- `quiet_hours_start/end`: Hours when no challenges should be sent (0-23)
- `max_challenges_per_day`: Limit on daily challenges
- `created_at`: Registration timestamp

**Philosophy**: Users should receive challenges at optimal times, never feel spammed, and have control over their learning schedule.

### Skills

A skill is a topic/subject that users can practice (e.g., "Algebra I", "World Geography").

**Properties**:
- `id`: UUID primary key
- `name`: Human-readable name
- `description`: Detailed description for LLM context
- `difficulty_spec`: JSONB configuration for difficulty levels
- `active`: Whether this skill is available
- `created_at`: Creation timestamp

**Philosophy**: Skills should have clear, detailed descriptions that help the LLM generate relevant, high-quality challenges.

### User Skill State

Tracks a user's progress and performance in a specific skill.

**Properties**:
- `user_id` + `skill_id`: Composite key
- `difficulty_target`: Current difficulty level (1-10)
- `streak_correct`: Consecutive correct answers
- `streak_incorrect`: Consecutive incorrect answers
- `attempts_total`: Total challenges attempted
- `correct_total`: Total correct answers
- `last_challenged_at`: Last challenge timestamp
- `last_result`: Last answer outcome (correct/incorrect/ignored)
- `updated_at`: Last update timestamp

**Derived Metrics**:
- `accuracy`: `correct_total / attempts_total` (0-1)

**Philosophy**: The system adapts to user performance. Success leads to harder challenges, struggles lead to easier ones, creating a personalized learning curve.

### Challenges

A challenge is a multiple-choice question generated by an LLM.

**Properties**:
- `id`: UUID primary key
- `user_id`: Target user
- `skill_id`: Associated skill
- `difficulty`: Difficulty level when generated (1-10)
- `llm`: Model used (e.g., "claude-haiku-4-5-20251001")
- `prompt_version`: Version/commit of the prompt template
- `question`: The question text
- `options_json`: Array of 4 answer options
- `correct_option`: Index of correct answer (0-3)
- `explanation`: Why the correct answer is correct
- `created_at`: Generation timestamp

**Philosophy**: Challenges should be:
- Answerable in < 30 seconds
- Difficulty-appropriate
- Have plausible distractors
- Include educational explanations

### Answers

Records user responses to challenges.

**Properties**:
- `challenge_id`: Foreign key
- `user_id`: Respondent
- `selected_option`: User's choice (0-3)
- `is_correct`: Whether answer was correct
- `response_time`: Time to answer in milliseconds
- `confidence`: User confidence (1-5, optional)
- `user_feedback`: Free-form feedback (optional)
- `answered_at`: Response timestamp

**Philosophy**: Capture rich data to understand user behavior and improve the system.

---

## Three-Agent System

The backend uses a modular three-agent architecture where each agent has a specific responsibility.

### Agent 1: Scheduling Agent

**Location**: `src/agents/agent1-scheduling.ts`

**Purpose**: Decide which users should receive challenges and for which skills.

**Triggered By**: 
- Cron scheduler (every 30 minutes in production, configurable)
- Manual API call to `/api/scheduler/tick`

**Algorithm**:

1. **Load All Users**: Fetch all users from database
2. **Load User Skill States**: Get enrollment and performance data
3. **Evaluate Each User-Skill Pair**:
   - Check if user has unanswered challenges → Skip
   - Check quiet hours → Skip if in quiet hours
   - Check max challenges per day → Skip if limit reached
   - Check minimum time between challenges → Skip if too recent
   - Check accuracy threshold → Prioritize users below threshold (default: 70%)
   - Calculate priority score based on accuracy and time since last challenge
4. **Select Top N Users**: Choose up to `MAX_USERS_PER_TICK` users (default: 1)
5. **Log Decisions**: Write to `scheduling_log` table with reasoning

**Key Decision Factors**:
- **Accuracy**: Users struggling (< 70% correct) are prioritized
- **Recency**: Users who haven't been challenged recently get priority
- **Unanswered Challenges**: Never create a second challenge if one exists
- **User Preferences**: Respect quiet hours and daily limits

**Output**: Array of `SchedulingDecision` objects with `userId`, `skillId`, and `difficultyTarget`

**Observability**: Each decision is logged to Opik with:
- User/skill context
- Decision (selected or skipped)
- Reasoning
- Timestamp

**Philosophy**: Be respectful of user time and preferences. Quality over quantity. Don't spam users with challenges they haven't answered yet.

### Agent 2: Challenge Design Agent

**Location**: `src/agents/agent2-challenge-design.ts`

**Purpose**: Generate appropriate challenges using Claude LLM.

**Triggered By**: Agent 1's scheduling decisions

**Algorithm**:

1. **Load Skill Details**: Fetch skill name, description from database
2. **A/B Test Variant Selection** (if enabled):
   - Check `AB_TEST_CHALLENGE_PROMPT_ENABLED` environment variable
   - Select prompt variant based on configured weights
   - Log selected variant
3. **Generate Challenge via LLM**:
   - Build prompt with skill context and difficulty
   - Call Claude API (Haiku model by default)
   - Parse JSON response
   - Handle both `correctAnswerIndex` and `correctOption` field names
4. **Validate Challenge**:
   - Check for required fields: question, 4 options, correct index, explanation
   - Ensure correct index is 0-3
   - Log validation errors
5. **Register Prompt** (if Opik enabled):
   - Send prompt template to Opik
   - Tag with variant info if A/B testing
   - Store commit/version for tracking
6. **Store Challenge**:
   - Insert into `challenges` table
   - Create `push_events` record (status: 'sent')
   - Update `user_skill_state.last_challenged_at`
7. **Track Execution**:
   - Log to Opik with metrics (tokens, cost, duration)
   - Store A/B test variant metadata

**Fallback Behavior**: If LLM returns invalid JSON or validation fails, use a generic fallback challenge (indicates error needing investigation)

**LLM Prompt Structure**:
```
You are generating a multiple-choice challenge to test knowledge and competence.

SKILL: {skill_name}
DESCRIPTION: {skill_description}
DIFFICULTY LEVEL: {difficulty}/10

[Rules and requirements]

OUTPUT FORMAT (strict JSON):
{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctAnswerIndex": 0,
  "explanation": "...",
  "actualDifficulty": {difficulty}
}
```

**Difficulty Descriptions**: Agent 2 provides rich descriptions for each difficulty level (1-10) to guide the LLM. For example:
- **Level 1**: "Complete Beginner: Generate a question requiring no prior knowledge..."
- **Level 5**: "Intermediate: Generate a question that assumes solid foundational knowledge..."
- **Level 10**: "Subject Matter Expert: Generate a question at the frontier of the domain..."

**Philosophy**: Generate high-quality, pedagogically sound challenges. Quality is more important than speed. Validate everything. Track everything for continuous improvement.

### Agent 3: Skill State Agent

**Location**: `src/agents/agent3-skill-state.ts`

**Purpose**: Update user skill state based on challenge outcomes.

**Triggered By**: User submitting an answer via POST `/api/answer`

**Algorithm**:

1. **Load Current State**: Fetch `user_skill_state` for user-skill pair
2. **Update Metrics**:
   - Increment `attempts_total`
   - Increment `correct_total` if correct
   - Update streaks:
     - Correct answer: `streak_correct++`, reset `streak_incorrect`
     - Incorrect answer: `streak_incorrect++`, reset `streak_correct`
   - Set `last_result` (correct/incorrect/ignored)
   - Set `updated_at` timestamp
3. **Adjust Difficulty**:
   - **If correct**:
     - If `streak_correct >= 3`: Increase difficulty by 1 (max 10)
   - **If incorrect**:
     - If `streak_incorrect >= 2`: Decrease difficulty by 1 (min 1)
     - If accuracy < 40%: Decrease difficulty by 1 (min 1)
4. **Store Updated State**: Write to database
5. **Log Outcome**: Track in Opik with accuracy, new difficulty, streaks

**Difficulty Adjustment Philosophy**:
- **Conservative increases**: Only increase after 3 consecutive successes
- **Quicker decreases**: Decrease after 2 failures or low accuracy
- **Safety bounds**: Keep difficulty in [1, 10] range
- **Responsive**: React to struggles faster than successes

**Philosophy**: Help users stay in their "zone of proximal development" - challenges should be achievable but not trivial. Adapt quickly when users struggle, slowly when they succeed.

---

## Database Schema

### Database: Supabase PostgreSQL

**Connection**: Via `@supabase/supabase-js` client with service role key

### Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id VARCHAR,
  timezone VARCHAR NOT NULL DEFAULT 'UTC',
  quiet_hours_start INT CHECK (quiet_hours_start >= 0 AND quiet_hours_start <= 23),
  quiet_hours_end INT CHECK (quiet_hours_end >= 0 AND quiet_hours_end <= 23),
  max_challenges_per_day INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `skills`
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  difficulty_spec JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `user_skill_state`
```sql
CREATE TABLE user_skill_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  difficulty_target INT NOT NULL DEFAULT 2 CHECK (difficulty_target >= 1 AND difficulty_target <= 10),
  streak_correct INT NOT NULL DEFAULT 0,
  streak_incorrect INT NOT NULL DEFAULT 0,
  attempts_total INT NOT NULL DEFAULT 0,
  correct_total INT NOT NULL DEFAULT 0,
  last_challenged_at TIMESTAMPTZ,
  last_result VARCHAR CHECK (last_result IN ('correct', 'incorrect', 'ignored')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);
```

#### `challenges`
```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  difficulty INT NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  llm VARCHAR NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  prompt_version VARCHAR NOT NULL DEFAULT 'v1',
  question TEXT NOT NULL,
  options_json JSONB NOT NULL,
  correct_option INT NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `answers`
```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selected_option INT NOT NULL CHECK (selected_option >= 0 AND selected_option <= 3),
  is_correct BOOLEAN NOT NULL,
  response_time INT,
  confidence INT CHECK (confidence >= 1 AND confidence <= 5),
  user_feedback TEXT,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);
```

#### `push_events`
```sql
CREATE TABLE push_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  status VARCHAR NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'opened')),
  provider_message_id VARCHAR
);
```

#### `scheduling_log`
```sql
CREATE TABLE scheduling_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  decision BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  difficulty_target INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Database Indexes (Recommended)

```sql
-- Performance indexes for common queries
CREATE INDEX idx_user_skill_state_user ON user_skill_state(user_id);
CREATE INDEX idx_user_skill_state_skill ON user_skill_state(skill_id);
CREATE INDEX idx_challenges_user ON challenges(user_id);
CREATE INDEX idx_challenges_created ON challenges(created_at DESC);
CREATE INDEX idx_answers_challenge ON answers(challenge_id);
CREATE INDEX idx_answers_user ON answers(user_id);
```

---

## Integrations

### 1. Supabase (PostgreSQL Database)

**Location**: `src/lib/supabase.ts`

**Purpose**: Primary data store for all application data

**Configuration**:
- `SUPABASE_URL`: Project URL (e.g., https://xxx.supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key with full database access

**Client Initialization**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
```

**Usage Pattern**:
```typescript
// Insert
const { data, error } = await supabase
  .from('users')
  .insert({ timezone: 'UTC' })
  .select()
  .single();

// Query
const { data, error } = await supabase
  .from('users')
  .select('*, user_skill_state(*)')
  .eq('id', userId)
  .single();

// Update
const { error } = await supabase
  .from('user_skill_state')
  .update({ difficulty_target: 5 })
  .eq('user_id', userId)
  .eq('skill_id', skillId);
```

**Type Safety**: Database types defined in `src/types/database.ts` generated from Supabase schema

**Error Handling**: Always check `error` property. Errors include:
- `23505`: Unique constraint violation
- `23503`: Foreign key violation
- `42P01`: Table doesn't exist

### 2. Anthropic Claude API (LLM Provider)

**Location**: `src/lib/llm-provider.ts`

**Purpose**: Generate challenge questions using large language models

**Configuration**:
- `ANTHROPIC_API_KEY`: API key for Claude access

**Model Used**: `claude-haiku-4-5-20251001` (fast, cost-effective)

**Client Initialization**:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY 
});
```

**Generation Parameters**:
- `max_tokens`: 1500
- `temperature`: 0.7 (balanced creativity/consistency)
- `model`: claude-haiku-4-5-20251001

**Cost Tracking**:
- Input: $1.00 per 1M tokens
- Output: $5.00 per 1M tokens
- Average challenge: ~500 input + ~300 output tokens
- Estimated cost per challenge: ~$0.002

**Error Handling**:
- Rate limits: Retry with exponential backoff
- Invalid JSON: Use fallback challenge
- API errors: Log and skip user

**Prompt Template Management**:
- Template stored as static method: `AnthropicProvider.getChallengePromptTemplate()`
- Variables: `{{skill_name}}`, `{{skill_description}}`, `{{difficulty}}`, `{{difficulty_description}}`
- A/B testing: Custom templates can override default
- Version tracking: Templates registered with Opik for versioning

### 3. Opik (Observability & Tracing)

**Location**: `src/lib/opik.ts`

**Purpose**: Track LLM usage, costs, prompt versions, and A/B test performance

**Configuration**:
- `OPIK_API_KEY`: API key from https://www.comet.com/opik
- `OPIK_WORKSPACE`: Workspace/project name

**Features Used**:

**a. Hierarchical Tracing**:
```
Trace: answer_submission
├─ Span: load_challenge
├─ Span: store_answer
├─ Span: challenge_metrics
└─ Span: skill_state_update
```

**b. Prompt Versioning**:
- Register prompt templates with `createOrGetPrompt()`
- Opik creates versions automatically when template changes
- Returns commit hash for linking to specific version
- Tags for filtering (e.g., ['control', 'baseline'])

**c. LLM Call Tracking**:
- Model name
- Input/output tokens
- Estimated cost
- Duration
- Prompt used (actual interpolated version)
- Response received

**d. Feedback Scores**:
- Challenge correctness (0 or 1)
- User confidence (1-5)
- Custom metrics

**e. A/B Testing Support**:
- Tag traces with experiment name and variant
- Filter by tags in dashboard
- Compare metrics across variants

**API Endpoints Used**:
- `POST /v1/private/traces`: Create trace
- `POST /v1/private/spans`: Create span
- `POST /v1/private/prompts`: Register prompt
- `GET /v1/private/prompts`: List prompts
- `POST /v1/private/feedback-scores`: Add feedback

**Error Handling**:
- API key invalid (401): Log warning, continue without tracking
- Network errors: Log error, continue without tracking
- JSON parsing errors: Clone response before reading body
- System remains functional even if Opik is unavailable

**Philosophy**: Observability is important but should never break core functionality. Fail gracefully.

### 4. Expo Push Notifications (Future)

**Location**: `src/services/push-notification.service.ts`

**Purpose**: Send push notifications to mobile devices

**Configuration**:
- `EXPO_ACCESS_TOKEN`: Token for Expo push service

**Status**: Service defined but not yet implemented

**Planned Flow**:
1. User registers device with `device_id`
2. When challenge created, send push notification
3. Track delivery status in `push_events` table
4. Handle failed deliveries

---

## API Endpoints

### Base URL: `/api`

### Authentication

**Header**: `Authorization: Bearer <API_KEY>`

**Environment Variables**:
- `API_AUTH_ENABLED`: Set to "false" to disable auth (default: true)
- `API_KEY`: Secret key for authentication

**Middleware**: `src/middleware/auth.ts` - `apiKeyAuth()`

**Behavior**:
- If `API_AUTH_ENABLED=false`: All requests allowed
- If enabled: Check `Authorization: Bearer <key>` header
- Invalid/missing key: 401 Unauthorized

### Health Check

```http
GET /api/health
```

**No auth required**

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T10:00:00.000Z"
}
```

### User Management

#### Create User
```http
POST /api/users
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "id": "uuid" (optional, auto-generated if not provided),
  "deviceId": "string" (optional),
  "timezone": "America/New_York" (default: "UTC"),
  "quietHoursStart": 22 (optional, 0-23),
  "quietHoursEnd": 8 (optional, 0-23),
  "maxChallengesPerDay": 5 (default: 5, range: 1-100)
}
```

**Response**: User object with generated UUID

#### Get All Users
```http
GET /api/users
Authorization: Bearer <API_KEY>
```

**Response**: Array of all users (ordered by created_at DESC)

#### Get Single User
```http
GET /api/users/:userId
Authorization: Bearer <API_KEY>
```

**Response**: User object or 404

#### Update User
```http
PUT /api/users/:userId
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "deviceId": "string" (optional),
  "timezone": "string" (optional),
  "quietHoursStart": 0-23 (optional),
  "quietHoursEnd": 0-23 (optional),
  "maxChallengesPerDay": 1-100 (optional)
}
```

**Response**: Updated user object

### Skill Management

#### Get All Skills
```http
GET /api/skills
Authorization: Bearer <API_KEY>
```

**Response**: Array of active skills

#### Enroll User in Skill
```http
POST /api/users/:userId/skills
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "skillId": "uuid",
  "difficultyTarget": 2 (default: 2, range: 1-10)
}
```

**Response**: Created `user_skill_state` object

#### Get User's Skills
```http
GET /api/users/:userId/skills
Authorization: Bearer <API_KEY>
```

**Response**: Array of skills with user's state (difficulty, accuracy, streaks)

#### Update User Skill
```http
PUT /api/users/:userId/skills/:skillId
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "difficultyTarget": 1-10 (optional)
}
```

**Response**: Updated state object

#### Delete User Skill Enrollment
```http
DELETE /api/users/:userId/skills/:skillId
Authorization: Bearer <API_KEY>
```

**Response**: 204 No Content

### Challenge Management

#### Get Challenge
```http
GET /api/challenges/:challengeId
Authorization: Bearer <API_KEY>
```

**Response**: Challenge object (without correct answer)
```json
{
  "id": "uuid",
  "userId": "uuid",
  "skillId": "uuid",
  "skillName": "Algebra I",
  "difficulty": 3,
  "question": "Solve for x: 2x + 3 = 11",
  "options": ["x = 2", "x = 4", "x = 5", "x = 7"],
  "createdAt": "2026-01-28T10:00:00.000Z"
}
```

#### Get Pending Challenges
```http
GET /api/users/:userId/challenges/pending
Authorization: Bearer <API_KEY>
```

**Response**: Array of unanswered challenges for user

**Logic**: Challenges WITHOUT corresponding answer records

#### Get Challenge History
```http
GET /api/users/:userId/challenges/history?limit=20
Authorization: Bearer <API_KEY>
```

**Response**: Array of answered challenges with outcomes

**Query Params**:
- `limit`: Number of results (default: 20, max: 100)

#### Submit Answer
```http
POST /api/answer
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "challengeId": "uuid",
  "userId": "uuid",
  "selectedOption": 0-3,
  "responseTime": 5000 (milliseconds, optional),
  "confidence": 1-5 (optional),
  "userFeedback": "string" (optional)
}
```

**Flow**:
1. Validate request with Zod schema
2. Create root Opik trace
3. Load challenge from database
4. Check if already answered (prevent duplicates)
5. Determine correctness
6. Store answer in `answers` table
7. Track metrics in Opik
8. Update user skill state via Agent 3
9. End Opik trace

**Response**:
```json
{
  "isCorrect": true,
  "correctOption": 1,
  "explanation": "The correct answer is x = 4 because..."
}
```

### Scheduler Management

#### Trigger Scheduler Manually
```http
POST /api/scheduler/tick
Authorization: Bearer <API_KEY>
```

**Purpose**: Manually trigger a scheduling cycle (useful for testing)

**Flow**:
1. Run Agent 1 (select users)
2. For each selected user, run Agent 2 (generate challenge)
3. Log all decisions

**Response**:
```json
{
  "success": true,
  "message": "Scheduling tick completed",
  "timestamp": "2026-01-28T10:00:00.000Z"
}
```

### Admin Dashboard

```http
GET /admin
```

**No auth required** (served as static file)

**Purpose**: Web-based UI for testing and administration

**Features**:
- Create users
- Enroll users in skills
- View all users
- View pending challenges
- View challenge history
- Submit answers manually
- Trigger scheduler

**Implementation**: Single-page HTML app in `public/index.html`

---

## Configuration

### Environment Variables

Defined in `.env` file. See `.env.example` for template.

#### Required

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase admin key
- `ANTHROPIC_API_KEY`: Claude API key

#### Optional - Observability

- `OPIK_API_KEY`: Opik API key (system works without, but no tracking)
- `OPIK_WORKSPACE`: Opik workspace name

#### Optional - Features

- `EXPO_ACCESS_TOKEN`: Expo push notification token (not yet used)

#### Optional - Security

- `API_AUTH_ENABLED`: "true" or "false" (default: true)
- `API_KEY`: Secret key for API authentication

#### Optional - Scheduling

- `SCHEDULER_CRON`: Cron expression (default: "*/30 * * * *" = every 30 min)
- `MAX_USERS_PER_TICK`: Max users per scheduling cycle (default: 1)
- `MIN_HOURS_BETWEEN_CHALLENGES`: Min hours before re-challenging (default: 4)
- `PRIORITY_THRESHOLD`: Accuracy threshold for prioritization (default: 0.7)

#### Optional - A/B Testing

- `AB_TEST_CHALLENGE_PROMPT_ENABLED`: "true" or "false" (default: false)

#### Optional - Server

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: "development" or "production"

### A/B Test Configuration

**File**: `src/config/ab-tests.ts`

**Structure**:
```typescript
export const CHALLENGE_PROMPT_EXPERIMENT = {
  enabled: process.env.AB_TEST_CHALLENGE_PROMPT_ENABLED === 'true',
  experimentName: 'challenge_generation_v1',
  variants: [
    {
      name: 'control',
      weight: 50,
      tags: ['control', 'baseline'],
      metadata: { description: '...', version: '1.0' },
      template: undefined  // Uses default
    },
    {
      name: 'variant_a',
      weight: 50,
      tags: ['variant_a', 'test'],
      metadata: { description: '...', version: '1.1' },
      template: `Custom prompt template...`
    }
  ]
};
```

**Weight System**: Proportional, doesn't need to sum to 100
- 50/50 = equal split
- 80/20 = 80% control, 20% variant
- 33/33/34 = three-way split

---

## Key Algorithms

### Difficulty Adjustment (Agent 3)

**Input**: Answer result (correct/incorrect), current state

**Output**: New difficulty level (1-10)

**Algorithm**:
```
IF answer is CORRECT:
  streak_correct++
  streak_incorrect = 0
  IF streak_correct >= 3:
    difficulty = min(difficulty + 1, 10)
    
ELSE (answer is INCORRECT):
  streak_incorrect++
  streak_correct = 0
  IF streak_incorrect >= 2 OR accuracy < 0.4:
    difficulty = max(difficulty - 1, 1)
```

**Philosophy**:
- Conservative increases (need 3 successes)
- Quick decreases (2 failures or low accuracy)
- Keeps users challenged but not frustrated

### User Prioritization (Agent 1)

**Score Calculation**:
```typescript
const accuracy = correct_total / attempts_total;
const hoursSinceLastChallenge = (now - last_challenged_at) / 3600000;

// Users below threshold get priority
if (accuracy < PRIORITY_THRESHOLD) {
  priority = (PRIORITY_THRESHOLD - accuracy) * 100 + hoursSinceLastChallenge;
} else {
  priority = hoursSinceLastChallenge;
}
```

**Sort**: Descending by priority (higher = more urgent)

**Philosophy**: Help struggling users more frequently, but don't neglect successful users

### A/B Variant Selection (Agent 2)

**Algorithm**: Weighted random selection

```typescript
function selectVariant(variants) {
  const totalWeight = sum(variants.map(v => v.weight));
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return variant;
    }
  }
  return variants[0];  // Fallback
}
```

**Distribution**: Over many trials, each variant gets traffic proportional to its weight

---

## A/B Testing System

### Purpose

Test different prompt templates to find which generates higher quality challenges.

### Components

1. **Configuration** (`src/config/ab-tests.ts`)
   - Define experiments
   - Set variants and weights
   - Configure templates

2. **Variant Selection** (`src/lib/opik.ts` - `selectPromptVariant()`)
   - Weighted random selection
   - Returns template, tags, metadata

3. **Integration** (Agent 2)
   - Check if experiment enabled
   - Select variant
   - Use variant's template
   - Log variant used

4. **Tracking** (Opik)
   - Tag traces with experiment/variant
   - Store metadata
   - Enable filtering in dashboard

### Workflow

1. **Define Experiment**: Edit `src/config/ab-tests.ts`
2. **Enable**: Set `AB_TEST_CHALLENGE_PROMPT_ENABLED=true`
3. **Deploy**: Restart service
4. **Monitor**: Check Opik for variant selection logs
5. **Analyze**: Filter Opik by variant tags, compare metrics
6. **Decide**: Choose winner based on data
7. **Deploy Winner**: Update default template, disable A/B test

### Metrics to Compare

- **Correctness Rate**: What % of users answer correctly?
- **User Confidence**: Average confidence scores
- **Response Time**: How long to answer?
- **Feedback**: Qualitative user feedback
- **Token Usage**: Cost efficiency

### Example: Testing Explanation Length

```typescript
{
  experimentName: 'explanation_length',
  variants: [
    {
      name: 'brief',
      weight: 50,
      template: `... Include a 1-sentence explanation ...`
    },
    {
      name: 'detailed',
      weight: 50,
      template: `... Include a 2-3 sentence explanation ...`
    }
  ]
}
```

After collecting 500+ challenges per variant, analyze:
- Do detailed explanations improve learning (measured by next challenge correctness)?
- Do users prefer detailed explanations (measured by feedback)?
- Is the cost increase (more output tokens) justified?

---

## Error Handling & Resilience

### Philosophy

**Fail gracefully. Log everything. Never crash.**

The system handles errors at multiple levels:

### 1. Input Validation

**Tool**: Zod schemas (from `@learning-platform/shared`)

**Approach**: Validate all API inputs before processing

**Response**: Return 400 with detailed error messages

Example:
```typescript
const validation = CreateUserSchema.safeParse(req.body);
if (!validation.success) {
  return res.status(400).json({
    error: 'Invalid request',
    details: validation.error.errors
  });
}
```

### 2. Database Errors

**Approach**: Check `error` property on all Supabase operations

**Common Errors**:
- **23505** (Unique violation): Return 409 Conflict
- **23503** (Foreign key violation): Return 400 Bad Request
- **Not found**: Return 404

**Fallback**: If database unavailable, return 500 and log

### 3. LLM Errors

**Scenarios**:
- Rate limit exceeded
- Invalid API key
- Network timeout
- Invalid JSON response
- Validation failure

**Handling**:
- Parse errors: Use fallback challenge (indicates problem needing investigation)
- Network errors: Log and skip user
- Rate limits: Retry with exponential backoff (not yet implemented)

**Flexible Parsing**: Accept both `correctAnswerIndex` and `correctOption` field names (LLMs sometimes vary)

### 4. Opik Errors

**Scenarios**:
- Invalid API key (401)
- Network failure
- JSON parsing error

**Handling**:
- Log error
- Continue execution without tracking
- System remains fully functional

**Implementation**: 
- Clone responses before consuming body
- Wrap JSON parsing in try-catch
- Never let Opik errors propagate

### 5. Scheduler Errors

**Approach**: Wrap scheduling tick in try-catch

**On Error**:
- Log full error details
- Continue to next tick
- Alert if errors persist (not yet implemented)

**Result**: One failed tick doesn't stop future ticks

### 6. Graceful Shutdown

**Signals Handled**: SIGTERM, SIGINT

**Shutdown Process**:
1. Stop scheduler (no new ticks)
2. Flush Opik (send pending data)
3. Close connections
4. Exit process

```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  schedulerService.stop();
  await opikService.flush();
  process.exit(0);
});
```

---

## Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run development server (hot reload)
pnpm dev

# Type checking
pnpm type-check

# Build for production
pnpm build

# Run production build
pnpm start
```

### Testing Endpoints

Use the admin dashboard: `http://localhost:3000/admin`

Or use curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Create user (with auth)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"timezone":"UTC"}'

# Trigger scheduler
curl -X POST http://localhost:3000/api/scheduler/tick \
  -H "Authorization: Bearer your-api-key"
```

### Debugging

**Enable detailed logging**:
- All requests logged with headers
- All agent decisions logged
- All Opik operations logged (with [Opik] prefix)
- All errors logged with full details

**Common Issues**:

1. **401 Errors**: Check `API_KEY` in `.env` matches request header
2. **Opik 401**: Check `OPIK_API_KEY` is valid (or disable Opik)
3. **No challenges generated**: Check users have unanswered challenges or quiet hours
4. **Port in use**: `lsof -ti:3000 | xargs kill -9`

### Code Organization

```
src/
├── agents/                  # Three-agent system
│   ├── agent1-scheduling.ts
│   ├── agent2-challenge-design.ts
│   └── agent3-skill-state.ts
├── api/                     # Express routes
│   └── routes.ts
├── config/                  # Configuration files
│   └── ab-tests.ts
├── lib/                     # Core integrations
│   ├── supabase.ts
│   ├── llm-provider.ts
│   └── opik.ts
├── middleware/              # Express middleware
│   └── auth.ts
├── services/                # Business logic services
│   ├── scheduler.service.ts
│   └── push-notification.service.ts
├── types/                   # TypeScript types
│   ├── database.ts          # Supabase-generated types
│   └── index.ts             # Application types
└── index.ts                 # Entry point
```

### Making Changes

**Adding a new API endpoint**:
1. Define route in `src/api/routes.ts`
2. Add Zod validation schema if needed
3. Implement handler
4. Update admin UI if applicable
5. Update this document

**Modifying agent behavior**:
1. Edit agent file (`src/agents/agent*.ts`)
2. Update algorithm section in this document
3. Test with manual scheduler trigger
4. Monitor Opik for impact

**Adding A/B test variant**:
1. Edit `src/config/ab-tests.ts`
2. Add variant with template
3. Set `AB_TEST_CHALLENGE_PROMPT_ENABLED=true`
4. Deploy and monitor

**Changing difficulty algorithm**:
1. Edit `src/agents/agent3-skill-state.ts`
2. Update `updateSkillState()` method
3. Document new algorithm
4. Test with various accuracy scenarios

---

## Recent Changes & Evolution

### Version 0.2.0 (2026-01-28)

**Major Features**:
1. **A/B Testing System**
   - Environment variable control: `AB_TEST_CHALLENGE_PROMPT_ENABLED`
   - Configuration file: `src/config/ab-tests.ts`
   - Variant selection with weighted random distribution
   - Full Opik integration with tagging
   - Documentation: `docs/ab-testing.md`

2. **Get All Users Endpoint**
   - `GET /api/users` returns all users
   - Admin UI: "All Users" button

3. **Tags Support for Prompts**
   - `createOrGetPrompt()` accepts `tags` parameter
   - Tags sent to Opik for filtering
   - Used for A/B test tracking

4. **Comprehensive Documentation**
   - `README.md`: Quick start and API reference
   - `SYSTEM_OVERVIEW.md`: This document
   - `.env.example`: Environment variable template

**Bug Fixes**:
1. **Crypto Module Error**
   - Changed from browser `crypto.getRandomValues()` to Node.js `crypto.randomBytes()`
   - Fixed UUID generation for production environments

2. **LLM Response Parsing**
   - Now accepts both `correctAnswerIndex` and `correctOption` field names
   - Added detailed validation logging
   - Graceful fallback on parsing errors

3. **Opik JSON Parsing Error**
   - Clone response before reading body for error logging
   - Added try-catch around JSON parsing
   - Better error messages with status codes

4. **Agent 2 TypeScript Errors**
   - Added `customTemplate` to `ChallengeDesignRequest` interface
   - Fixed readonly type issues in A/B test config
   - Removed unnecessary `as const` assertions

### Version 0.3.0 (2026-01-29)

**Skill Calibration System**:
1. **Calibration Flow**
   - Users start with `difficulty_target = 0` (needs calibration)
   - System generates 10 calibration questions (difficulties 1-10) per skill
   - Shared calibration questions stored in `calibration_questions` table
   - Users answer all 10 questions to determine starting difficulty

2. **New Database Tables**
   - `calibration_questions`: Shared questions for each skill (difficulties 1-10)
   - `user_calibration_state`: Tracks calibration progress (pending/in_progress/completed)
   - `user_calibration_answers`: Stores user's calibration responses

3. **New API Endpoints**
   - `POST /api/skills/generate-description`: LLM generates skill description from name, assesses if name is too vague
   - `POST /api/skills`: Create new skill
   - `POST /api/skills/:skillId/calibration/generate`: Generate 10 calibration questions for a skill
   - `POST /api/users/:userId/skills/:skillId/calibration/start`: Start calibration, returns questions
   - `POST /api/users/:userId/skills/:skillId/calibration/answer`: Submit calibration answer
   - `POST /api/users/:userId/skills/:skillId/calibration/complete`: Complete calibration, calculates difficulty target
   - `GET /api/users/:userId/skills/:skillId/calibration/status`: Check calibration status

4. **Difficulty Calculation**
   - Formula: Average difficulty of correct answers, adjusted by accuracy
   - If accuracy >= 90%: difficulty + 1 (challenge them)
   - If accuracy < 50%: difficulty - 1 (make it easier)
   - Result: Starting difficulty between 1-10

5. **Agent 1 Scheduling Update**
   - Skips users with `difficulty_target = 0` (needs calibration)
   - Returns reason: "User needs to complete calibration first"

6. **User Skills Response Update**
   - Added `needsCalibration` boolean flag to indicate calibration status

7. **Code Cleanup**
   - Removed unused `userId` field from `ChallengeDesignRequest` interface

---

### Version 0.1.0 (2026-01-20)

**Initial Release**:
- Three-agent system architecture
- Supabase integration
- Anthropic Claude integration
- Opik observability
- Admin dashboard
- Scheduler service
- Basic API endpoints
- Authentication middleware

---

## Design Philosophy

### 1. **Fail Gracefully**

The system should never crash due to external failures. If Opik is down, challenges should still generate. If the LLM returns bad data, use a fallback. If the database is slow, log and retry.

### 2. **Track Everything**

Observability is key to improvement. Every decision, every LLM call, every user interaction should be tracked. This enables data-driven optimization.

### 3. **Respect the User**

Never spam users. Respect quiet hours. Respect daily limits. Don't create duplicate challenges. Provide quality over quantity.

### 4. **Adapt Intelligently**

The system should learn from user performance and adjust. Struggling users get easier challenges and more attention. Successful users get harder challenges at a sustainable pace.

### 5. **Be Explicit**

Code should be readable and obvious. Variable names should be descriptive. Algorithms should be documented. Magic numbers should be explained.

### 6. **Experiment Continuously**

A/B testing is built into the core. The system should make it easy to try new approaches and measure results. Never assume - always test.

### 7. **Type Safety**

Use TypeScript's type system fully. Define interfaces for everything. Use Zod for runtime validation. Catch errors at compile time when possible.

### 8. **Modularity**

Each component should have a single responsibility. Agents are independent. Services are swappable. Integrations are isolated. This makes the system easier to understand, test, and modify.

---

## Future Enhancements

### Short Term

1. **Push Notifications**
   - Implement Expo push service
   - Send notifications when challenges created
   - Track delivery and opens

2. **Retry Logic for LLM**
   - Exponential backoff on rate limits
   - Automatic retry on transient errors

3. **Analytics Dashboard**
   - Web UI for viewing system metrics
   - User engagement statistics
   - Challenge quality metrics

### Medium Term

1. **Multiple LLM Providers**
   - Support OpenAI, Cohere, etc.
   - A/B test different models
   - Cost optimization through model selection

2. **Advanced Scheduling**
   - Optimal time-of-day scheduling
   - Spaced repetition algorithms (SM-2, FSRS)
   - Multi-skill balancing

3. **Skill Dependencies**
   - Prerequisites (must complete Algebra I before Algebra II)
   - Skill trees and progression paths

### Long Term

1. **Personalized Learning Paths**
   - ML model to predict optimal difficulty curve
   - Personalized scheduling based on user patterns
   - Adaptive content selection

2. **Social Features**
   - Leaderboards
   - Challenges between users
   - Collaborative learning

3. **Rich Content**
   - Images in challenges
   - Code syntax highlighting
   - LaTeX for mathematics
   - Audio/video challenges

---

## Conclusion

This backend is designed to be a robust, observable, and continuously improving adaptive learning platform. It uses modern tools (Supabase, Claude, Opik) and clean architecture (three-agent system) to deliver personalized educational content at scale.

The system prioritizes:
- **Quality**: High-quality AI-generated challenges
- **Personalization**: Adaptive difficulty and timing
- **Observability**: Full tracking for optimization
- **Reliability**: Graceful error handling
- **Experimentation**: Built-in A/B testing

When making changes, consider:
- Will this improve learning outcomes?
- Will this respect user preferences?
- Can we measure the impact?
- Does it maintain or improve reliability?
- Is it documented for the next person?

Happy coding! 🚀
