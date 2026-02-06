import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import SkillMetricsGrid from "../skill-metrics-grid/SkillMetricsGrid";
import type { GetUserSkillsResponse } from "@learning-platform/shared";
import { styles } from "./SkillsMetricsCard.styles";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SkillsMetricsCardProps {
  userSkills: GetUserSkillsResponse;
  defaultExpanded?: boolean;
}

const SkillsMetricsCard: React.FC<SkillsMetricsCardProps> = ({
  userSkills,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Calculate aggregated metrics
  const totalSkills = userSkills.length;
  const totalAttempts = userSkills.reduce(
    (sum, skill) => sum + (skill.attemptsTotal || 0),
    0
  );
  const totalCorrect = userSkills.reduce(
    (sum, skill) => sum + (skill.correctTotal || 0),
    0
  );
  const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  // Best streak is the highest single skill streak
  const bestStreak = Math.max(
    0,
    ...userSkills.map((skill) => skill.streakCorrect || 0)
  );

  // Average difficulty level across all skills
  const avgDifficulty =
    totalSkills > 0
      ? userSkills.reduce((sum, skill) => sum + (skill.difficultyTarget || 0), 0) /
        totalSkills
      : 0;

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
    if (!hasAnimated && !isExpanded) {
      setHasAnimated(true);
    }
  }, [hasAnimated, isExpanded]);

  return (
    <View style={styles.container}>
      {/* Header - Always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <MaterialIcons
            name="insights"
            size={24}
            color={Theme.colors.primary.main}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Your Progress</Text>
            <Text style={styles.headerSubtitle}>
              {totalSkills > 0
                ? `${totalSkills} skills • ${totalAttempts} questions answered`
                : "0 skills enrolled"}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <MaterialIcons
            name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={24}
            color={Theme.colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      {/* Expandable Content - Always show metrics grid */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          <SkillMetricsGrid
            hotStreak={bestStreak}
            questionsAnswered={totalAttempts}
            currentLevel={Math.round(avgDifficulty)}
            accuracy={overallAccuracy}
            correctTotal={totalCorrect}
            maxLevel={10}
            hasAnimated={hasAnimated}
            hotStreakLabel="BEST STREAK"
            answeredLabel="TOTAL ANSWERED"
            levelLabel="AVG DIFFICULTY"
            accuracyLabel="OVERALL ACCURACY"
            compact={true}
          />
        </View>
      )}
    </View>
  );
};

export default SkillsMetricsCard;
