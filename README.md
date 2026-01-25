# Skill Issue

**WORK IN PROGRESS** - This project is under active development and not yet ready for production use.

## Overview

Skill Issue is an agent-based system that builds and maintains real competence by periodically sending short challenges to users. Instead of tracking content consumption or study time, the system measures whether a skill is actually usable at the moment it is tested.

The system adapts automatically: challenge difficulty, timing, and frequency change based on real user outcomes. LLMs are used as tools inside a broader autonomous system, not as a monolithic brain.

## Core Product Principles

- **Competence over content** - Measure what you can do, not what you've read
- **Measurement over teaching** - Test real ability in the moment
- **Short interruptions, not study sessions** - Quick challenges that fit into your day
- **Autonomous adaptation** - System learns from your performance automatically
- **Strong observability and evaluation** - Every decision is logged and traceable

## High-Level System Flow

1. The system decides it is an appropriate moment to challenge a user
2. A challenge is designed at a target difficulty
3. The challenge is sent via push notification
4. The user answers the challenge and provides feedback
5. The system updates its belief about the user's skill
6. System behavior is evaluated and tuned automatically

## Technology Stack

- **Package Manager**: PNPM with workspaces
- **Language**: TypeScript
- **Authentication**: Clerk for user management
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude SDK for challenge generation
- **Observability**: Opik for LLM and agent monitoring

## Monorepo Structure

```
/packages
  /backend       - Express API server with scheduling and agent logic
  /discord       - Discord bot integration (in development)
  /mobile        - React Native mobile app (Expo)
  /web           - React web application
  /shared        - Common TypeScript code (types, schemas, API clients)
```

### Package Descriptions

#### `@skill-issue/backend`
Express-based API server that orchestrates the core system:
- Autonomous scheduling agents that decide when to send challenges
- Challenge generation using Claude SDK
- User skill tracking and difficulty adaptation
- Integration with Supabase for data persistence
- Push notification delivery via Expo
- Cron jobs for periodic challenge scheduling
- All agent decisions and LLM calls logged to Opik

**Key Dependencies**: Express, Anthropic SDK, Supabase, node-cron, expo-server-sdk

#### `@learning-platform/mobile`
React Native mobile app built with Expo:
- Cross-platform iOS/Android support
- User authentication via Clerk
- Challenge interface for answering questions
- Feedback collection (confidence, difficulty ratings)
- Push notification handling
- Skill selection and difficulty settings

**Key Dependencies**: Expo 54, React Native, Clerk, React Navigation

#### `@learning-platform/web`
React web application for desktop access:
- User dashboard and skill management
- Challenge history and performance analytics
- Alternative interface to the mobile app
- Built with Vite for fast development

**Key Dependencies**: React, Vite, Clerk, React Router

#### `@learning-platform/shared`
Shared TypeScript package used across all platforms:
- Common type definitions
- Zod schemas for validation
- API client utilities
- Shared business logic
- Ensures type safety across frontend and backend

**Key Dependencies**: Zod, TypeScript

#### `packages/discord` (In Development)
Discord bot for delivering challenges via Discord:
- Alternative delivery channel to mobile push notifications
- Discord slash commands for skill management
- Challenge delivery through Discord messages

## Version 1 Flow

1. **Authentication**: Login with Clerk → generate auth token → save to Supabase
2. **User Setup**: Create user profile → store details in Supabase
3. **Skill Selection**: Browse available skills → choose skill → set initial difficulty (1-10) → save to Supabase
4. **Challenge Loop**:
   - User waits for next challenge
   - Scheduler agent decides when to send challenge (decision logged to Opik)
   - Challenge agent generates MCQ based on skill/difficulty rubric (LLM call logged to Opik)
   - Challenge sent to user via push notification
   - User answers, records: answer, time taken, confidence (1-5), perceived difficulty (1-5)
   - Answer evaluation agent processes response → updates difficulty target (±1) → saves to Supabase
   - Challenge/answer pair logged to Opik for analysis
   - Difficulty rubrics manually tuned using Opik data

## Development

```bash
# Install dependencies
pnpm install

# Run backend
cd packages/backend
pnpm dev

# Run web app
cd packages/web
pnpm dev

# Run mobile app
cd packages/mobile
pnpm start
```

## Documentation

- `AGENTS.md` - Detailed system architecture and development principles
- `docs/API_REFERENCE.md` - API endpoints and usage
