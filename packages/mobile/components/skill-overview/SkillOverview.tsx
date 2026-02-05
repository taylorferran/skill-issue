import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { styles } from "./SkillsOverview.styles";
import StatCard from "../stat-card/StatCard";
import CircularProgress from "../circular-progress/CircularProgress";
import { AnimatedNumber, AnimatedText } from "../animated";
import type { GetUserSkillsResponse } from "@learning-platform/shared";
import type { Challenge } from "@/types/Quiz";

interface SkillOverviewProps {
  // Backend data for this skill (null if not enrolled)
  skillData: GetUserSkillsResponse[number] | null;

  // Whether user needs to rate (determined by parent)
  needsRating: boolean;

  // Callback when user starts calibration
  onStartCalibration: () => void;

  // Pending challenges from backend
  pendingChallenges: Challenge[];

  // Callback when user selects a challenge
  onChallengeSelect: (challenge: Challenge) => void;

  // Skill name for display
  skillName: string;

  // Whether the animation has already played (prevents re-animation on tab switch)
  hasAnimated?: boolean;
}

const SkillOverviewScreen: React.FC<SkillOverviewProps> = ({
  skillData,
  needsRating,
  onStartCalibration,
  pendingChallenges,
  onChallengeSelect,
  skillName,
  hasAnimated = false,
}) => {
  // Extract data from backend response (with defaults to show immediately)
  const currentLevel = skillData?.difficultyTarget ?? 0;
  const maxLevel = 10;
  const hotStreak = skillData?.streakCorrect ?? 0;
  const questionsAnswered = skillData?.attemptsTotal ?? 0;
  const accuracy = skillData?.accuracy ?? 0;
  const correctTotal = skillData?.correctTotal ?? 0;
  const hasAnsweredQuestions = questionsAnswered > 0;
  const hasHotStreak = hotStreak > 0;
  
  // Styles for stat values (matching original statValue style)
  const statValueStyle = {
    fontSize: Theme.typography.fontSize["2xl"],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.normal,
  };

  // Styles for stat subtitles (matching original statSubtitle style)
  const statSubtitleStyle = {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    marginTop: Theme.spacing.xs / 2,
  };

  // Create animated value components with proper styling
  // These will animate from 0 to actual values on first load only
  const hotStreakValue = (
    <AnimatedNumber
      value={hotStreak}
      suffix=" Days"
      style={statValueStyle}
      skipAnimation={hasAnimated}
    />
  );

  const hotStreakSubtitle = hasHotStreak ? (
    <AnimatedText 
      value={`${hotStreak} correct in a row!`} 
      style={[statSubtitleStyle, { color: "#07880b" }]}
    />
  ) : (
    <AnimatedText value="Starting fresh" style={[statSubtitleStyle, { color: Theme.colors.text.secondary }]} />
  );

  const answeredValue = (
    <AnimatedNumber
      value={questionsAnswered}
      suffix=" Qs"
      style={statValueStyle}
      skipAnimation={hasAnimated}
    />
  );

  const answeredSubtitle = hasAnsweredQuestions ? (
    <AnimatedText 
      value={`${Math.round(accuracy * 100)}% accuracy`}
      style={[statSubtitleStyle, { color: Theme.colors.text.secondary }]}
    />
  ) : (
    <AnimatedText value="Starting fresh" style={[statSubtitleStyle, { color: Theme.colors.text.secondary }]} />
  );

  const accuracyValue = hasAnsweredQuestions ? (
    <AnimatedText 
      value={`${Math.round(accuracy * 100)}%`}
      style={styles.compactAccuracyValue}
    />
  ) : (
    <AnimatedText value="0%" style={[styles.compactAccuracyValue, { color: Theme.colors.text.secondary }]} />
  );

  const accuracySubtext = hasAnsweredQuestions ? (
    <AnimatedText 
      value={`${correctTotal} / ${questionsAnswered} correct`}
      style={styles.compactAccuracySubtext}
    />
  ) : (
    <AnimatedText value="Start answering!" style={styles.compactAccuracySubtext} />
  );
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Show calibration card if user needs to set level */}
        {needsRating && (
          <View style={styles.calibrationCard}>
            <View style={styles.calibrationHeader}>
              <MaterialIcons name="psychology" size={24} color={Theme.colors.primary.main} />
              <Text style={styles.calibrationTitle}>Skill Calibration</Text>
            </View>
            <Text style={styles.calibrationDescription}>
              Complete a 10-question assessment to determine your starting difficulty level for {skillName}.
            </Text>
            <TouchableOpacity 
              style={styles.startCalibrationButton}
              onPress={onStartCalibration}
              activeOpacity={0.8}
            >
              <Text style={styles.startCalibrationButtonText}>Start Calibration</Text>
              <MaterialIcons name="arrow-forward" size={20} color={Theme.colors.text.inverse} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Stats Grid - Row 1: Hot Streak + Answered */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <StatCard
              label="HOT STREAK"
              value={hotStreakValue}
              subtitle={hotStreakSubtitle}
              subtitleColor={(hotStreak ?? 0) > 0 ? "#07880b" : Theme.colors.text.secondary}
              iconName="local-fire-department"
              iconColor="#ff4d4d"
              iconFilled={true}
            />
          </View>

          <View style={styles.statCardWrapper}>
            <StatCard
              label="ANSWERED"
              value={answeredValue}
              subtitle={answeredSubtitle}
              iconName="task-alt"
              iconColor="#3B82F6"
            />
          </View>
        </View>

        {/* Stats Grid - Row 2: Difficulty Level + Accuracy */}
        <View style={styles.statsGrid}>
          {/* Difficulty Level Gauge (compact) */}
          <View style={styles.statCardWrapper}>
            <View style={styles.compactProgressCard}>
              <Text style={styles.compactProgressHeader}>YOUR DIFFICULTY LEVEL</Text>
              <CircularProgress
                current={currentLevel}
                total={maxLevel}
                compact={true}
                skipAnimation={hasAnimated}
              />
            </View>
          </View>

          {/* Accuracy Card (compact) */}
          <View style={styles.statCardWrapper}>
            <View style={styles.compactAccuracyCard}>
              <Text style={styles.compactAccuracyLabel}>ACCURACY</Text>
              <View style={styles.accuracyContent}>
                {accuracyValue}
                {accuracySubtext}
              </View>
            </View>
          </View>
        </View>

        {/* Pro Tip Card */}
        <View style={styles.proTipCard}>
          <View style={styles.proTipIcon}>
            <MaterialIcons
              name="lightbulb"
              size={20}
              color={Theme.colors.primary.main}
            />
          </View>

          <View style={styles.proTipContent}>
            <Text style={styles.proTipTitle}>Pro Tip</Text>
            <Text style={styles.proTipText}>
              Daily practice increases retention by 40%.
            </Text>
          </View>
        </View>

        {/* Pending Challenges Section */}
        {!needsRating && skillData && (
          <View style={styles.challengesSection}>
            <Text style={styles.challengesHeader}>PENDING CHALLENGES</Text>
            
            {pendingChallenges.length === 0 ? (
              <View style={styles.emptyChallengesCard}>
                <MaterialIcons
                  name="check-circle"
                  size={48}
                  color={Theme.colors.success.main}
                />
                <Text style={styles.emptyChallengesText}>
                  No pending challenges! You&apos;re all caught up.
                </Text>
              </View>
            ) : (
              <View style={styles.challengesList}>
                {pendingChallenges.map((challenge, index) => (
                  <TouchableOpacity
                    key={challenge.challengeId}
                    style={styles.challengeCard}
                    onPress={() => onChallengeSelect(challenge)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.challengeHeader}>
                      <View style={styles.challengeNumberBadge}>
                        <Text style={styles.challengeNumberText}>
                          Q{index + 1}
                        </Text>
                      </View>
                      <View style={styles.difficultyBadge}>
                        <MaterialIcons
                          name="signal-cellular-alt"
                          size={14}
                          color={Theme.colors.text.inverse}
                        />
                        <Text style={styles.difficultyText}>
                          L{challenge.difficulty}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.challengeQuestion} numberOfLines={2}>
                      {challenge.question}
                    </Text>
                    
                    <View style={styles.challengeFooter}>
                      <Text style={styles.challengeDate}>
                        {new Date(challenge.createdAt).toLocaleDateString()}
                      </Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={Theme.colors.text.secondary}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SkillOverviewScreen;
