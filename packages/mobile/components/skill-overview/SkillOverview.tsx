import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import SkillLevelRating from "../skill-level-rating/SkillLevelRating";
import { styles } from "./SkillsOverview.styles";
import StatCard from "../stat-card/StatCard";
import CircularProgress from "../circular-progress/CircularProgress";
import type { GetUserSkillsResponse } from "@learning-platform/shared";
import type { Challenge } from "@/types/Quiz";

interface SkillOverviewProps {
  // Backend data for this skill (null if not enrolled)
  skillData: GetUserSkillsResponse[number] | null;

  // Whether user needs to rate (determined by parent)
  needsRating: boolean;

  // Callback when user submits rating
  onRatingSubmit: (rating: number) => void;

  // Loading state for enrollment
  isEnrolling?: boolean;

  // Pending challenges from backend
  pendingChallenges: Challenge[];

  // Callback when user selects a challenge
  onChallengeSelect: (challenge: Challenge) => void;

  // Skill name for display
  skillName: string;
}

const SkillOverviewScreen: React.FC<SkillOverviewProps> = ({ 
  skillData,
  needsRating,
  onRatingSubmit,
  isEnrolling = false,
  pendingChallenges,
  onChallengeSelect,
  skillName,
}) => {
  // Extract data from backend response (with defaults for new skills)
  const currentLevel = skillData?.difficultyTarget ?? 0;
  const maxLevel = 10;
  const hotStreak = skillData?.streakCorrect ?? 0;
  const questionsAnswered = skillData?.attemptsTotal ?? 0;
  const accuracy = skillData?.accuracy ?? 0;
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Show rating component if user needs to set level */}
        {needsRating && (
          <SkillLevelRating 
            skillName={skillName}
            onRatingSubmit={onRatingSubmit}
            isSubmitting={isEnrolling}
          />
        )}
        
        {/* Stats Grid - Row 1: Hot Streak + Answered */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <StatCard
              label="HOT STREAK"
              value={`${hotStreak} Days`}
              subtitle={
                hotStreak > 0 
                  ? `${hotStreak} correct in a row!` 
                  : "Starting fresh"
              }
              subtitleColor={
                hotStreak > 0 
                  ? "#07880b" 
                  : Theme.colors.text.secondary
              }
              iconName="local-fire-department"
              iconColor="#ff4d4d"
              iconFilled={true}
            />
          </View>

          <View style={styles.statCardWrapper}>
            <StatCard
              label="ANSWERED"
              value={`${questionsAnswered} Qs`}
              subtitle={
                questionsAnswered > 0
                  ? `${Math.round(accuracy * 100)}% accuracy`
                  : "Starting fresh"
              }
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
              {!skillData ? (
                <View style={styles.emptyProgressContainer}>
                  <Text style={styles.emptyProgressText}>
                    Set skill level
                  </Text>
                </View>
              ) : (
                <CircularProgress 
                  current={currentLevel} 
                  total={maxLevel} 
                  compact={true}
                />
              )}
            </View>
          </View>

          {/* Accuracy Card (compact) */}
          <View style={styles.statCardWrapper}>
            <View style={styles.compactAccuracyCard}>
              <Text style={styles.compactAccuracyLabel}>ACCURACY</Text>
              <Text style={styles.compactAccuracyValue}>
                {skillData && questionsAnswered > 0 
                  ? `${Math.round(accuracy * 100)}%` 
                  : "--"}
              </Text>
              <Text style={styles.compactAccuracySubtext}>
                {skillData && questionsAnswered > 0 
                  ? `${skillData.correctTotal} / ${questionsAnswered} correct`
                  : "Start answering!"}
              </Text>
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
