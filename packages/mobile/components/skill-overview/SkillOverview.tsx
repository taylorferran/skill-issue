import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { navigateTo, useRouteParams } from "@/navigation/navigation";
import { SINGLE_QUESTION_TEST } from "@/data/QuizData";
import type { GetUserSkillsResponse } from "@learning-platform/shared";

interface SkillOverviewProps {
  // Backend data for this skill (null if not enrolled)
  skillData: GetUserSkillsResponse[number] | null;
  
  // Whether user needs to rate (determined by parent)
  needsRating: boolean;
  
  // Callback when user submits rating
  onRatingSubmit: (rating: number) => void;
  
  // Loading state for enrollment
  isEnrolling?: boolean;
}

const SkillOverviewScreen: React.FC<SkillOverviewProps> = ({ 
  skillData,
  needsRating,
  onRatingSubmit,
  isEnrolling = false
}) => {
  const { skill } = useRouteParams('assessment');
  
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
            skillName={skill}
            onRatingSubmit={onRatingSubmit}
            isSubmitting={isEnrolling}
          />
        )}
        
        {/* Stats Grid */}
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

        {/* Difficulty Level Gauge (from backend) */}
        <View style={styles.progressCard}>
          <Text style={styles.progressHeader}>YOUR DIFFICULTY LEVEL</Text>

          {!skillData ? (
            <View style={styles.emptyProgressContainer}>
              <Text style={styles.emptyProgressText}>
                Set your skill level to get started
              </Text>
            </View>
          ) : (
            <CircularProgress 
              current={currentLevel} 
              total={maxLevel} 
            />
          )}
        </View>

        {/* Optional: Show accuracy separately if user has answered questions */}
        {skillData && questionsAnswered > 0 && (
          <View style={styles.accuracyCard}>
            <Text style={styles.accuracyLabel}>ACCURACY</Text>
            <Text style={styles.accuracyValue}>
              {Math.round(accuracy * 100)}%
            </Text>
            <Text style={styles.accuracySubtext}>
              {skillData.correctTotal} correct out of {questionsAnswered}
            </Text>
          </View>
        )}

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
      </ScrollView>

      {/* Show "Next Question" CTA only if enrolled (has difficulty level) */}
      {!needsRating && skillData && (
        <LinearGradient
          colors={[
            "rgba(252, 249, 243, 0)",
            "rgba(252, 249, 243, 1)",
            "rgba(252, 249, 243, 1)",
          ]}
          locations={[0, 0.3, 1]}
          style={styles.bottomCTA}
          pointerEvents="box-none"
        >
          <TouchableOpacity 
            onPress={() => navigateTo('quiz', { skill: skill, data: SINGLE_QUESTION_TEST })} 
            style={styles.ctaButton} 
            activeOpacity={0.95}
          >
            <Text style={styles.ctaButtonText}>NEXT QUESTION</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
    </View>
  );
};

export default SkillOverviewScreen;
