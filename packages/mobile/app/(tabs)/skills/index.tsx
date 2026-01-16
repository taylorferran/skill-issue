import SkillSelectScreen from "@/screens/skill-select/SkillSelect";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Profile() {
  return (
    <SafeAreaProvider>
      <SkillSelectScreen/>
    </SafeAreaProvider>
  );
}
