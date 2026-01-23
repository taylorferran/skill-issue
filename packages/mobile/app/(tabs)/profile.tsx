import ProfileScreen from "@/app/(tabs)/(profile)/index";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Profile() {
  return (
    <SafeAreaProvider>
      <ProfileScreen />
    </SafeAreaProvider>
  );
}
