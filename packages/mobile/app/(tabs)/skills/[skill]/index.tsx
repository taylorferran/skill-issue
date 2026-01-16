
import { TopicSelectScreen } from "@/screens/skill-select/topic-screen/TopicSelect";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Profile() {
  return (
    <SafeAreaProvider>
      <TopicSelectScreen/>
    </SafeAreaProvider>
  );
}
