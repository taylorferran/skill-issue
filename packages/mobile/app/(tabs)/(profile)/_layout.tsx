// app/(tabs)/(profile)/_layout.tsx
import { Stack } from "expo-router";

export default function ProfileStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />  {/* ← Add this */}
    </Stack>
  );
}
