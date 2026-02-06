import { Theme } from "@/theme/Theme";
import React from "react";
import { View, Text } from "react-native";
import { styles } from "./SkillMetricsGrid.styles";
import StatCard from "../stat-card/StatCard";
import CircularProgress from "../circular-progress/CircularProgress";
import { AnimatedNumber, AnimatedText } from "../animated";

export interface SkillMetricsGridProps {
  // Data inputs
  hotStreak: number;
  questionsAnswered: number;
  currentLevel: number;
  accuracy: number;
  correctTotal: number;
  maxLevel?: number;
  hasAnimated?: boolean;

  // Labels (customizable)
  hotStreakLabel?: string;
  answeredLabel?: string;
  levelLabel?: string;
  accuracyLabel?: string;

  // Display modes
  compact?: boolean;
}

const SkillMetricsGrid: React.FC<SkillMetricsGridProps> = ({
  hotStreak,
  questionsAnswered,
  currentLevel,
  accuracy,
  correctTotal,
  maxLevel = 10,
  hasAnimated = false,
  hotStreakLabel = "HOT STREAK",
  answeredLabel = "ANSWERED",
  levelLabel = "YOUR DIFFICULTY LEVEL",
  accuracyLabel = "ACCURACY",
  compact = true,
}) => {
  const hasAnsweredQuestions = questionsAnswered > 0;
  const hasHotStreak = hotStreak > 0;

  // Styles for stat values (matching original statValue style)
  const statValueStyle = {
    fontSize: Theme.typography.fontSize["2xl"],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.normal,
  };

  // Styles for stat subtitles
  const statSubtitleStyle = {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    marginTop: Theme.spacing.xs / 2,
  };

  // Create value components (animations disabled for instant display with cached data)
  const hotStreakValue = (
    <AnimatedNumber
      value={hotStreak}
      suffix=" Days"
      style={statValueStyle}
      skipAnimation={true}
    />
  );

  const hotStreakSubtitle = hasHotStreak ? (
    <AnimatedText
      value={`${hotStreak} correct in a row!`}
      style={[statSubtitleStyle, { color: "#07880b" }]}
    />
  ) : (
    <AnimatedText
      value="Starting fresh"
      style={[statSubtitleStyle, { color: Theme.colors.text.secondary }]}
    />
  );

  const answeredValue = (
    <AnimatedNumber
      value={questionsAnswered}
      suffix=" Qs"
      style={statValueStyle}
      skipAnimation={true}
    />
  );

  const answeredSubtitle = hasAnsweredQuestions ? (
    <AnimatedText
      value={`${Math.round(accuracy * 100)}% accuracy`}
      style={[statSubtitleStyle, { color: Theme.colors.text.secondary }]}
    />
  ) : (
    <AnimatedText
      value="Starting fresh"
      style={[statSubtitleStyle, { color: Theme.colors.text.secondary }]}
    />
  );

  const accuracyValue = hasAnsweredQuestions ? (
    <AnimatedText
      value={`${Math.round(accuracy * 100)}%`}
      style={styles.compactAccuracyValue}
    />
  ) : (
    <AnimatedText
      value="0%"
      style={[styles.compactAccuracyValue, { color: Theme.colors.text.secondary }]}
    />
  );

  const accuracySubtext = hasAnsweredQuestions ? (
    <AnimatedText
      value={`${correctTotal} / ${questionsAnswered} correct`}
      style={styles.compactAccuracySubtext}
    />
  ) : (
    <AnimatedText
      value="Start answering!"
      style={styles.compactAccuracySubtext}
    />
  );

  return (
    <View style={styles.container}>
      {/* Stats Grid - Row 1: Hot Streak + Answered */}
      <View style={styles.statsGrid}>
        <View style={styles.statCardWrapper}>
          <StatCard
            label={hotStreakLabel}
            value={hotStreakValue}
            subtitle={hotStreakSubtitle}
            subtitleColor={hotStreak > 0 ? "#07880b" : Theme.colors.text.secondary}
            iconName="local-fire-department"
            iconColor="#ff4d4d"
            iconFilled={true}
          />
        </View>

        <View style={styles.statCardWrapper}>
          <StatCard
            label={answeredLabel}
            value={answeredValue}
            subtitle={answeredSubtitle}
            iconName="task-alt"
            iconColor="#3B82F6"
          />
        </View>
      </View>

      {/* Stats Grid - Row 2: Difficulty Level + Accuracy */}
      <View style={styles.statsGrid}>
        {/* Difficulty Level Gauge */}
        <View style={styles.statCardWrapper}>
          <View style={styles.compactProgressCard}>
            <Text style={styles.compactProgressHeader}>{levelLabel}</Text>
            <CircularProgress
              current={currentLevel}
              total={maxLevel}
              compact={compact}
              skipAnimation={true}
            />
          </View>
        </View>

        {/* Accuracy Card */}
        <View style={styles.statCardWrapper}>
          <View style={styles.compactAccuracyCard}>
            <Text style={styles.compactAccuracyLabel}>{accuracyLabel}</Text>
            <View style={styles.accuracyContent}>
              {accuracyValue}
              {accuracySubtext}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SkillMetricsGrid;
