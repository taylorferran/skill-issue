# Learning Platform - Mobile App (React Native/Expo)

## Technology Stack
- **Framework**: Expo ~54.0.31 with React Native 0.81.5
- **React**: 19.1.0 (New Architecture enabled)
- **Routing**: Expo Router ~6.0.21 (file-based, typed routes enabled)
- **Authentication**: Clerk (@clerk/clerk-expo 1.2.9)
- **Language**: TypeScript (strict mode)
- **Package Manager**: PNPM (monorepo with workspaces)
- **Navigation**: Type-safe with Zod schemas (@react-navigation/native)
- **Validation**: Zod ^3.25.76

## Commands

### Development
```bash
# Start Expo dev server
pnpm start

# Run on specific platforms
pnpm android
pnpm ios
pnpm web

# Lint code
pnpm lint

# From monorepo root
pnpm --filter mobile start
pnpm -r lint                  # Lint all packages
pnpm -r type-check            # Type check all packages
```

### Testing
⚠️ **No testing framework configured yet** - Jest/Vitest setup needed

## Project Structure

```
packages/mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── index.tsx             # Dashboard tab (default export)
│   │   ├── profile.tsx           # Profile tab (default export)
│   │   ├── skills/               # Nested skill routes
│   │   │   ├── [skill]/          # Dynamic routes
│   │   │   └── _layout.tsx       # Stack layout
│   │   └── _layout.tsx           # Tab layout with CustomTabBar
│   ├── _layout.tsx               # Root layout (ClerkProvider)
│   └── sign-in.tsx               # Auth screen
├── components/                   # Reusable UI components
│   └── component-name/
│       ├── ComponentName.tsx     # Component (named export)
│       └── ComponentName.styles.tsx  # Styles
├── screens/                      # Legacy pattern (migrating to app/)
├── theme/                        # Centralized design system
│   ├── Theme.ts                  # Design tokens
│   └── ThemeUtils.ts             # Utilities (createTextStyle, flex, etc.)
├── types/                        # TypeScript definitions
│   ├── Language.ts
│   └── Module.ts
├── navigation/                   # Type-safe navigation
│   └── navigation.ts             # navigateTo(), useRouteParams()
├── contexts/                     # React contexts
│   └── AuthContext.tsx
└── assets/                       # Static assets
```

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Components** | PascalCase | `LanguageCard.tsx` |
| **Styles** | PascalCase + `.styles.tsx` | `LanguageCard.styles.tsx` |
| **Screens** | PascalCase | `Dashboard.tsx`, `SkillSelect.tsx` |
| **Types** | PascalCase | `Language.ts`, `Module.ts` |
| **Utilities** | lowercase | `navigation.ts` |
| **Routes** | kebab-case or `[param]` | `app/(tabs)/skills/[skill].tsx` |

## Code Style Guidelines

### Import Order
```typescript
// 1. React/React Native core
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

// 2. Third-party libraries
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 3. Shared package imports
import type { User } from '@learning-platform/shared/types';

// 4. Local imports (@ alias)
import { Theme } from '@/theme/Theme';
import { flex, createTextStyle } from '@/theme/ThemeUtils';
import { navigateTo } from '@/navigation/navigation';
import { LanguageCard } from '@/components/language-card/LanguageCard';
import { styles } from './Component.styles';
```

### Component Structure
```typescript
// 1. Imports (ordered as above)

// 2. Types/Interfaces
interface ComponentProps {
  language: Language;
  onSelect: (language: Language) => void;
}

// 3. Component Definition
export function ComponentName({ language, onSelect }: ComponentProps) {
  // 3a. Hooks (useState, useContext, useLocalSearchParams)
  const [state, setState] = React.useState(false);
  
  // 3b. Functions/handlers
  const handlePress = () => {
    // logic
  };
  
  // 3c. Render
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{language.name}</Text>
    </View>
  );
}
```

### Exports
- **Screens** (app/ directory): Default exports (`export default function DashboardScreen()`)
- **Components** (components/ directory): Named exports (`export function LanguageCard()`)
- **Types**: Named exports (`export type Language = { ... }`)
- **Utilities**: Named exports (`export const navigateTo = ...`)

### TypeScript Guidelines
- **Strict mode**: ALWAYS enabled (configured in tsconfig.json)
- **Avoid `any`**: Use proper types or `unknown` with type guards
- **Type imports**: Use `import type` for type-only imports
- **Props interfaces**: Define interfaces for all component props
- **Union types**: Use for status/state (`type Status = 'active' | 'locked' | 'completed'`)
- **Icon types**: Use `keyof typeof Ionicons.glyphMap` for icon name safety
- **Zod schemas**: Use for route params validation

```typescript
// ✅ GOOD
interface CardProps {
  title: string;
  onPress: () => void;
}

export function Card({ title, onPress }: CardProps) { ... }

// ❌ BAD
export function Card({ title, onPress }: any) { ... }
```

## Styling Guidelines

### Theme System Usage
**ALWAYS use Theme tokens** - never hardcode colors, spacing, or typography:

```typescript
import { StyleSheet } from 'react-native';
import { Theme } from '@/theme/Theme';
import { flex, createTextStyle, createCardStyle } from '@/theme/ThemeUtils';

export const styles = StyleSheet.create({
  // Use Theme tokens
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
    padding: Theme.spacing['2xl'],  // 32px
  },
  
  // Use utility functions
  title: {
    ...createTextStyle('xl', 'bold', 'primary'),
    marginBottom: Theme.spacing.md,
  },
  
  // Use flex utilities
  header: {
    ...flex.rowBetween,
    alignItems: 'center',
  },
  
  // Use card utilities
  card: {
    ...createCardStyle('primary'),
    borderRadius: Theme.borderRadius.lg,
  },
});
```

### Style File Pattern
- **Components**: Separate `.styles.tsx` file co-located with component
- **Screens**: Inline `StyleSheet.create()` at bottom of file
- **Export pattern**: `export const styles = StyleSheet.create({ ... })`

## Navigation Patterns

### Type-Safe Navigation
```typescript
import { navigateTo, useRouteParams } from '@/navigation/navigation';

// Navigate with params (type-checked)
navigateTo('topicSelection', { skill: 'rust' });

// Get typed params in destination screen
const { skill } = useRouteParams('topicSelection'); // skill: string
```

### Expo Router Conventions
- **Tabs**: Use `(tabs)` group layout with `_layout.tsx`
- **Dynamic routes**: Use `[param]` syntax (e.g., `[skill].tsx`)
- **Default exports**: All route files must default export a component
- **Layouts**: `_layout.tsx` for nested navigation structures

## Authentication Patterns

```typescript
// Use AuthContext (wraps Clerk)
import { useAuth } from '@/contexts/AuthContext';

function Component() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  
  if (isLoading) return <LoadingView />;
  if (!isAuthenticated) return <SignInPrompt />;
  
  return <AuthenticatedContent user={user} />;
}

// Clerk OAuth flow
const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

const handleSignIn = async () => {
  try {
    const { createdSessionId } = await startOAuthFlow();
    // Success - Clerk handles redirect
  } catch (err: any) {
    console.error('OAuth error', err);
    Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in');
  }
};
```

## Error Handling

```typescript
// Use try-catch with proper error typing
try {
  await someAsyncOperation();
} catch (err: unknown) {
  // Type guard for error handling
  const message = err instanceof Error 
    ? err.message 
    : 'An unexpected error occurred';
  
  console.error('Operation failed', err);
  Alert.alert('Error', message);
}

// For Clerk errors
catch (err: any) {
  console.error('Auth error', err);
  Alert.alert('Error', err.errors?.[0]?.message || 'Authentication failed');
}
```

## VSCode Configuration

The project includes auto-formatting on save:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit",           // Auto-fix ESLint errors
    "source.organizeImports": "explicit",  // Auto-organize imports
    "source.sortMembers": "explicit"       // Auto-sort members
  }
}
```

Recommended extension: `expo.vscode-expo-tools`

## Development Principles

1. **Type Safety First**: Enable strict TypeScript, avoid `any`, use Zod for validation
2. **Component Reusability**: Extract reusable UI into `components/` with named exports
3. **Theme Consistency**: ALWAYS use Theme tokens and utilities - never hardcode values
4. **Co-locate Styles**: Keep styles in separate `.styles.tsx` files for components
5. **Type-Safe Navigation**: Use `navigateTo()` and Zod schemas for route params
6. **Shared Types**: Import from `@learning-platform/shared/types` for cross-platform types
7. **Migration Path**: New code goes in `app/` directory (Expo Router), not `screens/`
8. **Security**: Never commit secrets, use expo-secure-store for tokens
9. **Performance**: Use React.memo, useCallback for expensive operations
10. **Accessibility**: Include accessibilityLabel and accessibilityRole

## Common Patterns

### Safe Area Views
```typescript
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.container}>
  {/* content */}
</SafeAreaView>
```

### Touchable Components
```typescript
// Prefer TouchableOpacity for visual feedback
<TouchableOpacity 
  style={styles.button} 
  onPress={handlePress}
  activeOpacity={0.8}
>
  <Text>Press Me</Text>
</TouchableOpacity>

// Use Pressable for more control
<Pressable
  style={({ pressed }) => [
    styles.button,
    pressed && styles.buttonPressed
  ]}
  onPress={handlePress}
>
  {/* content */}
</Pressable>
```

### Scrollable Content
```typescript
<ScrollView 
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
>
  {/* content */}
</ScrollView>
```

## Linting & Quality

- **ESLint**: Uses `eslint-config-expo/flat` configuration
- **Run lint**: `pnpm lint` (uses `expo lint`)
- **Auto-fix**: VSCode will auto-fix on save (see VSCode config above)
- **Type check**: `pnpm -r type-check` from monorepo root

## Monorepo Integration

- **Shared package**: Import from `@learning-platform/shared`
- **Path alias**: Use `@/` for local imports (maps to package root)
- **Metro config**: Configured to watch entire monorepo workspace
- **Dependencies**: Install at package level, hoisted by PNPM

## Migration Notes

⚠️ **Active Migration**: Moving from `screens/` to `app/` directory
- New screens: Create in `app/` using Expo Router conventions
- Existing screens: Gradually migrate to `app/` structure
- Keep styles pattern consistent during migration
