// app/(tabs)/(skills)/_layout.tsx
import { Stack } from "expo-router";

export default function SkillsStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Tab header handles it
      }}
    >
    </Stack>
  );
}
