import { LearnTopicScreen } from "@/screens/skill-select/topic-screen/learn-topic/LearnTopic";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Profile() {
  return (
    <SafeAreaProvider>
      <LearnTopicScreen/>
    </SafeAreaProvider>
  );
}
