# Monorepo Structure & Organization

## Workspace Configuration

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
```

### Project Structure
```
/learning-platform-root
├── pnpm-workspace.yaml
├── package.json              # Root package.json
├── tsconfig.json             # Root TypeScript config
├── .gitignore
├── AGENTS.md
├── opencode.json
├── docs/                     # Documentation
│
├── packages/
│   ├── shared/               # Shared TypeScript code
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── types/        # Shared TypeScript types
│   │   │   │   ├── user.ts
│   │   │   │   ├── topic.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/          # API client wrappers
│   │   │   │   ├── claude.ts
│   │   │   │   ├── opik.ts
│   │   │   │   └── auth.ts
│   │   │   ├── utils/        # Utility functions
│   │   │   │   ├── validation.ts
│   │   │   │   ├── formatting.ts
│   │   │   │   └── date.ts
│   │   │   └── index.ts
│   │   └── README.md
│   │
│   ├── web/                  # React web app (PRIMARY FOCUS)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts    # or next.config.js
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/   # React components
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginButton.tsx
│   │   │   │   │   ├── OAuthProviders.tsx
│   │   │   │   │   └── ProtectedRoute.tsx
│   │   │   │   ├── topics/
│   │   │   │   │   ├── TopicCard.tsx
│   │   │   │   │   ├── TopicSelector.tsx
│   │   │   │   │   └── SubtopicList.tsx
│   │   │   │   ├── learning/
│   │   │   │   │   ├── CourseView.tsx
│   │   │   │   │   ├── AIChat.tsx
│   │   │   │   │   └── ProgressTracker.tsx
│   │   │   │   └── layout/
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       └── Layout.tsx
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useClaude.ts
│   │   │   │   └── useOpik.ts
│   │   │   ├── context/      # React Context providers
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   └── LearningContext.tsx
│   │   │   ├── pages/        # Route components
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── TopicSelection.tsx
│   │   │   │   └── Learning.tsx
│   │   │   ├── services/     # Business logic
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── claude.service.ts
│   │   │   │   └── opik.service.ts
│   │   │   ├── lib/          # Configuration & setup
│   │   │   │   ├── claude.ts
│   │   │   │   ├── opik.ts
│   │   │   │   └── router.tsx
│   │   │   └── styles/       # Global styles
│   │   └── public/           # Static assets
│   │
│   └── mobile/               # React Native (FUTURE - NOT STARTED)
│       └── .gitkeep
```

## Package Dependencies

### Root package.json
```json
{
  "name": "learning-platform",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm -r build",
    "type-check": "pnpm -r type-check",
    "lint": "pnpm -r lint"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

### packages/shared/package.json
```json
{
  "name": "@learning-platform/shared",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./utils": "./src/utils/index.ts",
    "./api": "./src/api/index.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "zod": "^3.22.0"
  }
}
```

### packages/web/package.json
```json
{
  "name": "@learning-platform/web",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@learning-platform/shared": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@anthropic-ai/sdk": "^0.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

## TypeScript Configuration

### Root tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

### packages/web/tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/src/*"]
    }
  },
  "include": ["src"],
  "references": [
    { "path": "../shared" }
  ]
}
```

## Import Rules
- Use workspace protocol: `@learning-platform/shared`
- Shared code imports: `import { User } from '@learning-platform/shared/types'`
- Local imports: `import { Button } from '@/components'`
- Relative imports only for adjacent files: `import { helper } from './helper'`

## Development Workflow
1. **Install**: `pnpm install` (from root)
2. **Dev**: `pnpm dev` (starts web app)
3. **Add dependency to web**: `pnpm --filter web add package-name`
4. **Add dependency to shared**: `pnpm --filter @learning-platform/shared add package-name`
5. **Type check all**: `pnpm -r type-check`
