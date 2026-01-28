import { Theme } from "@/theme/Theme";
import { createButtonStyle } from "@/theme/ThemeUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./AIAssessment.styles";
import { navigateTo, useRouteParams } from "@/navigation/navigation";
import { MULTIPLE_QUESTIONS_TEST } from "@/data/QuizData";

const AIAssessment = () => {
  const {skill} = useRouteParams('questions')
  return (
    <View style={styles.assessmentCardWrapper}>
      <View style={styles.assessmentCard}>
        {/* Decorative Background Element */}
        <View style={styles.decorativeBlob} />

        <View style={styles.assessmentContent}>
          <View style={styles.assessmentInfo}>
            <View style={styles.assessmentHeader}>
              <MaterialIcons
                name="auto-awesome"
                size={20}
                color={Theme.colors.primary.main}
              />
              <Text style={styles.assessmentTitle}>AI Skill Assessment</Text>
            </View>

            <Text style={styles.assessmentDescription}>
              Calibrate your level for a personalized path.
            </Text>
          </View>

          <TouchableOpacity
            style={[createButtonStyle("primary"), styles.assessmentButton]}
            onPress={() => navigateTo('quiz', {skill: skill, data: MULTIPLE_QUESTIONS_TEST})}
            activeOpacity={0.8}
          >
            <Text style={styles.assessmentButtonText}>Start Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AIAssessment;
