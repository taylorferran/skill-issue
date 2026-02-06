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
import SkillMetricsGrid from "../skill-metrics-grid/SkillMetricsGrid";
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
  const hotStreak = skillData?.streakCorrect ?? 0;
  const questionsAnswered = skillData?.attemptsTotal ?? 0;
  const accuracy = skillData?.accuracy ?? 0;
  const correctTotal = skillData?.correctTotal ?? 0;

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

        {/* Metrics Grid - Reusable component */}
        <SkillMetricsGrid
          hotStreak={hotStreak}
          questionsAnswered={questionsAnswered}
          currentLevel={currentLevel}
          accuracy={accuracy}
          correctTotal={correctTotal}
          maxLevel={10}
          hasAnimated={hasAnimated}
          compact={true}
        />

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
