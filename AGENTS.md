# Learning Platform - AI-Powered Educational Experience

## Project Overview
- **Type**: React web app (React Native mobile coming later)
- **Architecture**: PNPM monorepo with shared TypeScript code
- **Focus**: Learning platform with topic-based courses (e.g., Python → Data Analytics)
- **Stage**: Initial development - React web app only

## Technology Stack
- **Frontend**: React 18+ with TypeScript, React Router v6
- **Package Manager**: PNPM with workspaces
- **Backend**: Next.js (integration planned, not yet implemented)
- **Authentication**: Using Clerk for OAuth
- **AI Integration**: Anthropic Claude SDK for AI features
- **Monitoring**: Opik for LLM observability
- **Styling**: Css Modules
 
## Monorepo Structure
```
/packages
  /web           - React web application (PRIMARY FOCUS)
  /mobile        - React Native app (future)
  /shared        - Common TypeScript code (types, utils, API clients)
```

## Current Development Phase
**Phase 1: React Web App Foundation**
- ✅ Focus: `packages/web` only
- ✅ Setup: Authentication flow with OAuth providers
- ✅ Setup: Claude SDK integration for AI features
- ✅ Setup: Opik for monitoring AI interactions
- ⏸️ React Native app (packages/mobile) - not started
- ⏸️ Next.js backend - integration only, full implementation later

## Key Features
1. **Topic Selection**: Users choose learning paths (Python → Data Analytics, etc.)
2. **AI-Powered Learning**: Claude SDK integration for personalized content
3. **Multi-Auth Support**: OAuth (GitHub, Google) + traditional email/password
4. **Observability**: Track AI interactions with Opik

## External Context Files
For detailed guidelines, see:
- Architecture & data flow: @docs/architecture.md
- Monorepo organization: @docs/monorepo-structure.md
- Authentication patterns: @docs/authentication.md
- Claude SDK & Opik integration: @docs/integrations.md
- TypeScript & React standards: @docs/coding-standards.md

## Development Principles
- Start simple, iterate quickly
- Shared code must work for both web and mobile (prepare for mobile, but don't over-engineer)
- Type safety first - avoid `any`, use strict TypeScript
- Component-driven development with clear separation of concerns
- Service based file structure pathing for web / mobile. pages => top level page => sub pages => components
- For Css, where possible for styling ensure common properties get set as var(--) wherever possible
- For React, anything thats reused, should get set into its own component, any tsx files should stay within the web folder, ensure for common components the use of var(--) is used and where possible create ts union types to be able to select styles
- Authentication is critical - prioritize security patterns
