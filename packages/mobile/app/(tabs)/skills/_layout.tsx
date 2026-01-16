// app/(tabs)/skills/_layout.tsx
import { Stack } from "expo-router";

export default function SkillsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide all Stack headers
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[skill]" />
    </Stack>
  );
}
