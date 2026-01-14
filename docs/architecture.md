# System Architecture

## High-Level Overview
```
┌─────────────────────────────────────────────┐
│           React Web App (packages/web)      │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │ Auth Module  │  │  Learning Module   │  │
│  │ (OAuth/Email)│  │  (Topics/Courses)  │  │
│  └──────────────┘  └────────────────────┘  │
│         │                    │              │
│         └────────────────────┘              │
│                  │                          │
└──────────────────┼──────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │  Shared Package   │
         │  - Types          │
         │  - API Clients    │
         │  - Utilities      │
         └─────────┬─────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐  ┌──────▼──────┐  ┌───▼─────┐
│ Claude │  │ Auth Service│  │  Opik   │
│  SDK   │  │ (OAuth/JWT) │  │(Monitor)│
└────────┘  └─────────────┘  └─────────┘
```

## Application Flow

### 1. Authentication Flow
```typescript
User visits → Check auth state → 
  If unauthenticated → Show login options (OAuth/Email) →
  After auth → Store tokens → Redirect to dashboard

OAuth providers:
- GitHub
- Google
- Microsoft (optional)
- Email/Password fallback
```

### 2. Learning Flow
```typescript
Dashboard → Select Topic (Python, Data Analytics, etc.) →
  Load course structure →
  AI-powered content generation (Claude SDK) →
  Track interactions (Opik) →
  Progress saved
```

## Data Models (Preliminary)

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  authProvider: 'github' | 'google' | 'email';
  createdAt: Date;
  lastLoginAt: Date;
}
```

### Topic
```typescript
interface Topic {
  id: string;
  title: string;          // e.g., "Python"
  description: string;
  subtopics: Subtopic[];  // e.g., "Data Analytics"
  iconUrl?: string;
}

interface Subtopic {
  id: string;
  title: string;
  parentTopicId: string;
  order: number;
}
```

### Learning Session
```typescript
interface LearningSession {
  id: string;
  userId: string;
  topicId: string;
  subtopicId?: string;
  startedAt: Date;
  completedAt?: Date;
  aiInteractions: AIInteraction[];
}

interface AIInteraction {
  id: string;
  sessionId: string;
  prompt: string;
  response: string;
  timestamp: Date;
  opikTraceId?: string;  // Link to Opik trace
}
```

## State Management
**Decision**: Start with React Context + hooks, migrate to Zustand if complexity grows

**Rationale**: 
- React Context is sufficient for auth state and user preferences
- Zustand provides better performance if we need global state for learning progress
- Avoid Redux - too much boilerplate for this project

## Backend Strategy (Future)
- Next.js API routes for authentication callbacks
- Database: PostgreSQL or Supabase (TBD based on hosting choice)
- File structure: `/packages/web/src/app/api` (Next.js App Router)

## Security Considerations
- Never store tokens in localStorage (use httpOnly cookies)
- Validate all user inputs
- Rate limit AI requests
- Implement CORS properly for API routes
- Use environment variables for all secrets
