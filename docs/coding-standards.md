# TypeScript & React Coding Standards

## TypeScript Configuration

### Strict Mode Always
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## Naming Conventions

### Files
- Components: PascalCase - `UserProfile.tsx`
- Hooks: camelCase with 'use' prefix - `useAuth.ts`
- Utils: camelCase - `validation.ts`
- Types: PascalCase - `User.ts` or within files
- Constants: SCREAMING_SNAKE_CASE - `API_ENDPOINTS.ts`

### Variables & Functions
```typescript
// ✅ Good
const userName = 'John';
const isAuthenticated = true;
const handleSubmit = () => {};

// ❌ Bad
const user_name = 'John';
const is_authenticated = true;
const HandleSubmit = () => {};
```

## TypeScript Patterns

### Type vs Interface
**Use `interface` for object shapes, `type` for unions/intersections**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

type UserWithStatus = User & { status: Status };

// ❌ Avoid
type User = {  // Use interface instead
  id: string;
};
```

### Avoid `any`
```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}

// ✅ Better - use generics
function processData<T extends { value: string }>(data: T) {
  return data.value;
}
```

### Explicit Return Types
```typescript
// ✅ Good
function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0);
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ❌ Bad - implicit return type
function calculateTotal(items: number[]) {
  return items.reduce((sum, item) => sum + item, 0);
}
```

## React Patterns

### Functional Components
```typescript
// ✅ Good - Named export with explicit props type
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}

// ❌ Bad - default export, no types
export default function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Hooks Rules
```typescript
// ✅ Good - hooks at top level
export function UserProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  return <div>{user.name}</div>;
}

// ❌ Bad - conditional hooks
export function UserProfile() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Loading...</div>;
  }

  const [isEditing, setIsEditing] = useState(false); // Hook after conditional return!
  
  return <div>{user.name}</div>;
}
```

### Custom Hooks Pattern
```typescript
// ✅ Good
export function useTopic(topicId: string) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTopic() {
      try {
        setIsLoading(true);
        const data = await fetchTopicById(topicId);
        if (!cancelled) {
          setTopic(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchTopic();

    return () => {
      cancelled = true;
    };
  }, [topicId]);

  return { topic, isLoading, error };
}
```

### Component Organization
```typescript
// File structure within a component file:
// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Helper functions (if small, otherwise extract)
// 5. Component
// 6. Export

// ✅ Good
import { useState } from 'react';
import { User } from '@learning-platform/shared/types';

interface UserCardProps {
  user: User;
  onEdit?: () => void;
}

const DEFAULT_AVATAR = '/default-avatar.png';

function formatUserName(user: User): string {
  return user.name || user.email;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="user-card">
      <img src={user.avatarUrl || DEFAULT_AVATAR} alt={user.name} />
      <h3>{formatUserName(user)}</h3>
      {onEdit && <button onClick={onEdit}>Edit</button>}
    </div>
  );
}
```

## Error Handling

### Try-Catch Blocks
```typescript
// ✅ Good
async function loadUserData(userId: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load user:', error);
    throw new Error('Failed to load user data');
  }
}

// ❌ Bad
async function loadUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json(); // No error handling!
}
```

### Custom Error Classes
```typescript
// packages/shared/src/utils/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Usage
throw new APIError('User not found', 404, 'USER_NOT_FOUND');
```

## Async/Await Best Practices
```typescript
// ✅ Good - proper error handling
async function processMultipleRequests() {
  try {
    const [users, topics] = await Promise.all([
      fetchUsers(),
      fetchTopics()
    ]);
    return { users, topics };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// ❌ Bad - sequential when could be parallel
async function processMultipleRequests() {
  const users = await fetchUsers();
  const topics = await fetchTopics(); // Waits for users unnecessarily
  return { users, topics };
}
```

## State Management

### When to Use useState vs useReducer
```typescript
// useState for simple state
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// useReducer for complex state with multiple related values
interface State {
  data: User[];
  isLoading: boolean;
  error: Error | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User[] }
  | { type: 'FETCH_ERROR'; payload: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, data: action.payload };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

function UserList() {
  const [state, dispatch] = useReducer(reducer, {
    data: [],
    isLoading: false,
    error: null
  });
  
  // ... use dispatch
}
```

## Import Organization
```typescript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal absolute imports (workspace packages)
import type { User, Topic } from '@learning-platform/shared/types';
import { validateEmail } from '@learning-platform/shared/utils';

// 3. Relative imports - components
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

// 4. Relative imports - hooks/services
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api.service';

// 5. Styles
import styles from './Component.module.css';
```

## Comments & Documentation
```typescript
// ✅ Good - JSDoc for public APIs
/**
 * Validates user input and creates a new learning session
 * @param userId - The ID of the user starting the session
 * @param topicId - The ID of the topic to learn
 * @returns A promise that resolves to the created session
 * @throws {ValidationError} If user or topic ID is invalid
 */
export async function createLearningSession(
  userId: string,
  topicId: string
): Promise<LearningSession> {
  // Implementation
}

// ✅ Good - explain WHY, not WHAT
// Using setTimeout instead of setInterval to prevent overlapping requests
// if the API is slow to respond
setTimeout(fetchData, 5000);

// ❌ Bad - obvious comments
// Increment counter by 1
setCount(count + 1);
```

## File Size Limits
- Components: Max 300 lines
- Hooks: Max 100 lines
- Utils: Max 200 lines per file

If exceeding these, split into multiple files.

## Performance Patterns

### Memoization
```typescript
import { useMemo, useCallback } from 'react';

function ExpensiveComponent({ items, filter }: Props) {
  // ✅ Good - memoize expensive computation
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  // ✅ Good - memoize callbacks passed to children
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return (
    <div>
      {filteredItems.map(item => (
        <Item key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
}
```

## Testing (Future)
When tests are added:
- Unit tests: `Component.test.tsx`
- Hook tests: `useHook.test.ts`
- Use React Testing Library
- Aim for >80% coverage on critical paths
