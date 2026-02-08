// app/(tabs)/(skills)/_layout.tsx
import { Stack } from "expo-router";

export default function SkillsStack() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false, // Tab header handles it
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ headerBackVisible: false }}  // Root screen - no back button
      />
      <Stack.Screen name="[skill]/index" />
      <Stack.Screen name="create/index" />
      <Stack.Screen name="assessment/index" />
      <Stack.Screen name="assessment/calibration/index" />
      <Stack.Screen name="assessment/quiz/index" />
    </Stack>
  );
}
