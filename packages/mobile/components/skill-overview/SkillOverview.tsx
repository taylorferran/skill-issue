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
import { useSkillLevelStore } from "@/stores/skillLevelStore";

const SkillOverviewScreen = () => {
  const currentLevel = 0;
  const maxLevel = 10;
  const hotStreak = 0;
  const questionsAnswered = 0;

  const {skill, progress } = useRouteParams('assessment')
  
  // Zustand store for skill level ratings
  const skillLevels = useSkillLevelStore((state) => state.skillLevels);
  const setSkillLevel = useSkillLevelStore((state) => state.setSkillLevel);

  // Check if user has rated this skill (derived from state to trigger re-render)
  const hasRated = skill in skillLevels;
  
  // Handler for when user submits their rating
  const handleRatingSubmit = (rating: number) => {
    setSkillLevel(skill, rating);
  };
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Skill Level Rating - Only show if not rated yet */}
        {!hasRated && (
          <SkillLevelRating 
            skillName={skill}
            onRatingSubmit={handleRatingSubmit}
          />
        )}
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <StatCard
              label="HOT STREAK"
              value={`${hotStreak} Days`}
              subtitle="+0% vs. last week"
              subtitleColor="#07880b"
              iconName="local-fire-department"
              iconColor="#ff4d4d"
              iconFilled={true}
            />
          </View>

          <View style={styles.statCardWrapper}>
            <StatCard
              label="ANSWERED"
              value={`${questionsAnswered} Qs`}
              subtitle="Starting fresh"
              iconName="task-alt"
              iconColor="#3B82F6"
            />
          </View>
        </View>

        {/* Skill Progress Gauge */}
        <View style={styles.progressCard}>
          <Text style={styles.progressHeader}>OVERALL SKILL PROGRESS</Text>

          <CircularProgress current={progress} total={100} />
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
      </ScrollView>

      {/* Fixed Bottom CTA Button with Gradient - Only show if rated */}
      {hasRated && (
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
          <TouchableOpacity onPress={() => navigateTo('quiz', {skill: skill, data: SINGLE_QUESTION_TEST})} style={styles.ctaButton} activeOpacity={0.95}>
            <Text style={styles.ctaButtonText}>NEXT QUESTION</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
    </View>
  );
};


export default SkillOverviewScreen;
