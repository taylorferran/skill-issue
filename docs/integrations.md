# External Integrations

## 1. Claude SDK Integration

### Purpose
Power AI-driven learning experiences with Claude's conversational abilities.

### Installation
```bash
pnpm --filter @learning-platform/shared add @anthropic-ai/sdk
```

### Configuration

**packages/shared/src/api/claude.ts**
```typescript
import Anthropic from '@anthropic-ai/sdk';

export const createClaudeClient = (apiKey: string) => {
  return new Anthropic({
    apiKey,
    // Important: For browser apps, use a proxy or backend
    dangerouslyAllowBrowser: false // Set to true only for prototyping
  });
};

export type ClaudeClient = ReturnType<typeof createClaudeClient>;
```

**packages/web/src/services/claude.service.ts**
```typescript
import type { ClaudeClient } from '@learning-platform/shared/api';
import { createClaudeClient } from '@learning-platform/shared/api';

class ClaudeService {
  private client: ClaudeClient | null = null;

  initialize(apiKey: string) {
    this.client = createClaudeClient(apiKey);
  }

  async generateLearningContent(topic: string, userLevel: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude client not initialized');
    }

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Create a beginner-friendly introduction to ${topic} for someone at a ${userLevel} level. Include key concepts and a simple example.`
      }]
    });

    return message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
  }

  async answerQuestion(question: string, context: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude client not initialized');
    }

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Context: ${context}\n\nQuestion: ${question}\n\nProvide a clear, educational answer.`
      }]
    });

    return message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
  }
}

export const claudeService = new ClaudeService();
```

**packages/web/src/hooks/useClaude.ts**
```typescript
import { useState, useEffect } from 'react';
import { claudeService } from '@/services/claude.service';

export function useClaude() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (apiKey) {
      claudeService.initialize(apiKey);
      setIsInitialized(true);
    }
  }, []);

  const generateContent = async (topic: string, level: string) => {
    if (!isInitialized) {
      throw new Error('Claude not initialized');
    }
    return claudeService.generateLearningContent(topic, level);
  };

  const askQuestion = async (question: string, context: string) => {
    if (!isInitialized) {
      throw new Error('Claude not initialized');
    }
    return claudeService.answerQuestion(question, context);
  };

  return {
    isInitialized,
    generateContent,
    askQuestion
  };
}
```

### Security Note
**CRITICAL**: Never expose your Anthropic API key in the frontend!

**Proper Pattern**:
1. Store API key on backend (Next.js API route)
2. Frontend calls your backend
3. Backend calls Claude API

**packages/web/src/app/api/ai/chat/route.ts** (when Next.js is ready):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // Server-side only
});

export async function POST(request: NextRequest) {
  // Verify user is authenticated
  const token = request.headers.get('authorization');
  // ... validate token ...

  const { prompt, context } = await request.json();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  return NextResponse.json({
    response: message.content[0].type === 'text' ? message.content[0].text : ''
  });
}
```

## 2. Opik Integration

### Purpose
Monitor and trace LLM interactions for debugging, cost tracking, and performance optimization.

### Installation
```bash
pnpm --filter @learning-platform/shared add opik
```

### Configuration

**packages/shared/src/api/opik.ts**
```typescript
import { Opik } from 'opik';

export const createOpikClient = (apiKey: string, workspaceName: string) => {
  return new Opik({
    apiKey,
    workspaceName
  });
};

export type OpikClient = ReturnType<typeof createOpikClient>;
```

**packages/web/src/services/opik.service.ts**
```typescript
import type { OpikClient } from '@learning-platform/shared/api';
import { createOpikClient } from '@learning-platform/shared/api';

class OpikService {
  private client: OpikClient | null = null;

  initialize(apiKey: string, workspaceName: string) {
    this.client = createOpikClient(apiKey, workspaceName);
  }

  async trackClaudeInteraction(params: {
    userId: string;
    topic: string;
    prompt: string;
    response: string;
    modelName: string;
    duration: number;
    tokenCount?: number;
  }) {
    if (!this.client) {
      console.warn('Opik client not initialized');
      return null;
    }

    try {
      const trace = this.client.trace({
        name: 'learning_interaction',
        input: {
          topic: params.topic,
          prompt: params.prompt
        },
        output: {
          response: params.response
        },
        metadata: {
          userId: params.userId,
          modelName: params.modelName,
          duration: params.duration,
          tokenCount: params.tokenCount
        },
        tags: ['learning', params.topic]
      });

      return trace;
    } catch (error) {
      console.error('Failed to track interaction:', error);
      return null;
    }
  }

  async trackError(params: {
    userId: string;
    errorType: string;
    errorMessage: string;
    context?: Record<string, unknown>;
  }) {
    if (!this.client) return;

    try {
      this.client.trace({
        name: 'error',
        input: { errorType: params.errorType },
        output: { error: params.errorMessage },
        metadata: {
          userId: params.userId,
          ...params.context
        },
        tags: ['error']
      });
    } catch (error) {
      console.error('Failed to track error:', error);
    }
  }
}

export const opikService = new OpikService();
```

**packages/web/src/hooks/useOpik.ts**
```typescript
import { useEffect } from 'react';
import { opikService } from '@/services/opik.service';

export function useOpik() {
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPIK_API_KEY;
    const workspace = import.meta.env.VITE_OPIK_WORKSPACE;
    
    if (apiKey && workspace) {
      opikService.initialize(apiKey, workspace);
    }
  }, []);

  return {
    trackInteraction: opikService.trackClaudeInteraction.bind(opikService),
    trackError: opikService.trackError.bind(opikService)
  };
}
```

### Combined Usage Example

**packages/web/src/components/learning/AIChat.tsx**
```typescript
import { useState } from 'react';
import { useClaude } from '@/hooks/useClaude';
import { useOpik } from '@/hooks/useOpik';
import { useAuth } from '@/context/AuthContext';

export function AIChat({ topic }: { topic: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { askQuestion } = useClaude();
  const { trackInteraction } = useOpik();
  const { user } = useAuth();

  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await askQuestion(question, topic);
      const duration = Date.now() - startTime;

      setAnswer(response);

      // Track with Opik
      if (user) {
        await trackInteraction({
          userId: user.id,
          topic,
          prompt: question,
          response,
          modelName: 'claude-sonnet-4-20250514',
          duration
        });
      }
    } catch (error) {
      console.error('Failed to get answer:', error);
      setAnswer('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat">
      <h3>Ask a question about {topic}</h3>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What would you like to know?"
      />
      <button onClick={handleAsk} disabled={isLoading}>
        {isLoading ? 'Thinking...' : 'Ask'}
      </button>
      {answer && (
        <div className="answer">
          <h4>Answer:</h4>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
```

### Environment Variables

**packages/web/.env.local**
```env
# Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-...

# Opik
VITE_OPIK_API_KEY=your-opik-key
VITE_OPIK_WORKSPACE=your-workspace-name

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**IMPORTANT**: 
- Add `.env.local` to `.gitignore`
- Use backend proxy for production (move API keys server-side)
- Never commit real API keys
