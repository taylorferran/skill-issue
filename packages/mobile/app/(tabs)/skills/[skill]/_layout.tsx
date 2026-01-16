// app/(tabs)/skills/_layout.tsx
import { Stack } from "expo-router";

export default function TopicsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[topic]" />
    </Stack>
  );
}
