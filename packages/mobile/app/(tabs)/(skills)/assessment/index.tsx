import { Theme } from "@/theme/Theme";
import { spacing, flex, createBadgeStyle } from "@/theme/ThemeUtils";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { styles } from "./_index.styles";
import SkillOverviewScreen from "@/components/skill-overview/SkillOverview";
import SkillLevelRating from "@/components/skill-level-rating/SkillLevelRating";
import { MCQItem } from "@/types/Quiz";
import { useRouteParams } from "@/navigation/navigation";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { useEnrollSkill } from "@/api-routes/enrollSkill";
import { useUser } from "@/contexts/UserContext";
import { useSkillsStore } from "@/stores/skillsStore";
import type { GetUserSkillsResponse } from "@learning-platform/shared";
import { hasAssessedSkill, markSkillAssessed } from "@/utils/assessmentStorage";

const ReviewHistoryScreen = () => {
  const [selectedSegment, setSelectedSegment] = useState<"overview" | "review">(
    "overview",
  );
  
  // Get route params
  const { skill, skillId, isNewSkill } = useRouteParams('assessment');
  
  // Context & API hooks
  const { userId } = useUser();
  const { execute: fetchUserSkills, isLoading: isFetchingSkills } = useGetUserSkills();
  const { execute: enrollSkill, isLoading: isEnrolling } = useEnrollSkill();
  const { setUserSkills } = useSkillsStore();
  
  // Local state for this skill's data
  const [skillData, setSkillData] = useState<GetUserSkillsResponse[number] | null>(null);
  const [isLoadingSkill, setIsLoadingSkill] = useState(true);
  const [hasLocalAssessment, setHasLocalAssessment] = useState(false);
  
  // Determine if user needs to set difficulty level
  // User needs to rate if ALL of the following are true:
  // 1. No local assessment record (hasLocalAssessment = false), AND
  // 2. No backend record OR backend record has no difficultyTarget
  const needsRating = !hasLocalAssessment && (!skillData || !skillData.difficultyTarget);
  
  // Fetch skill data from backend on mount
  useEffect(() => {
    loadSkillData();
  }, [userId, skill]);
  
  // Refetch when screen comes into focus (after navigation back)
  useFocusEffect(
    useCallback(() => {
      loadSkillData();
    }, [userId, skill])
  );
  
  const loadSkillData = async () => {
    if (!userId || !skillId) return;
    
    setIsLoadingSkill(true);
    try {
      console.log('[Assessment] 🔄 Loading skill data...');
      
      // Check local storage first (fast)
      const localAssessment = await hasAssessedSkill(skillId);
      setHasLocalAssessment(localAssessment);
      
      console.log('[Assessment] 💾 Local assessment status:', localAssessment);
      
      // Fetch from backend (source of truth)
      const userSkills = await fetchUserSkills({ userId });
      const currentSkill = userSkills.find(s => s.skillName === skill);
      
      setSkillData(currentSkill || null);
      
      if (currentSkill) {
        console.log('[Assessment] ✅ Skill data loaded:', {
          skillName: currentSkill.skillName,
          difficultyTarget: currentSkill.difficultyTarget,
          accuracy: currentSkill.accuracy,
          attempts: currentSkill.attemptsTotal
        });
        
        // If backend has data but local doesn't, sync local storage
        if (currentSkill.difficultyTarget && !localAssessment) {
          console.log('[Assessment] 🔄 Syncing local assessment from backend...');
          await markSkillAssessed(skillId, currentSkill.difficultyTarget);
          setHasLocalAssessment(true);
        }
      } else {
        console.log('[Assessment] ℹ️ No backend record for this skill (new enrollment)');
      }
      
    } catch (error) {
      console.error('[Assessment] ❌ Failed to load skill data:', error);
      Alert.alert('Error', 'Could not load skill data. Please try again.');
    } finally {
      setIsLoadingSkill(false);
    }
  };
  
  // Handler when user submits difficulty rating
  const handleRatingSubmit = async (rating: number) => {
    if (!userId || !skillId) {
      Alert.alert('Error', 'Missing user or skill information');
      return;
    }
    
    try {
      console.log('[Assessment] 📝 Enrolling in skill with difficulty:', rating);
      
      // STEP 1: Mark as assessed locally IMMEDIATELY (optimistic update)
      // This hides the slider right away, even if API call is slow/fails
      await markSkillAssessed(skillId, rating);
      setHasLocalAssessment(true);
      console.log('[Assessment] ✅ Local assessment saved');
      
      // STEP 2: Call backend API to enroll
      const enrollmentResult = await enrollSkill({
        userId,
        skillId,
        difficultyTarget: rating,
      });
      
      console.log('[Assessment] ✅ Enrollment successful:', enrollmentResult);
      
      // STEP 3: Refetch ALL user skills to update cache
      const updatedSkills = await fetchUserSkills({ userId });
      setUserSkills(updatedSkills);
      
      // Update local state with the newly enrolled skill
      const newSkillData = updatedSkills.find(s => s.skillId === skillId);
      setSkillData(newSkillData || null);
      
      // Show success message and switch to Overview tab
      Alert.alert(
        'Enrollment Complete!',
        `You're now learning ${skill} at level ${rating}. View your progress in the Overview tab.`,
        [
          { 
            text: 'View Overview',
            onPress: () => {
              // Switch to overview tab to show enrolled skill stats
              setSelectedSegment('overview');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('[Assessment] ❌ Enrollment failed:', error);
      
      // Note: We don't revert the local assessment flag here
      // This prevents the slider from reappearing immediately
      // User can retry from settings if needed
      
      Alert.alert(
        'Enrollment Failed',
        'Your assessment was saved locally, but we could not sync with the server. Your progress will sync when connection is restored.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Mock MCQ data (keep as-is)
  const mcqAnswers: MCQItem[] = [
    {
      question: "How do you define a decorator?",
      id: 1,
      isCorrect: true,
      timestamp: "2 days ago",
    },
    {
      question: "Time complexity of Dict lookups?",
      id: 2,
      isCorrect: false,
      timestamp: "3 days ago",
    },
    {
      question: "Difference between __str__ & __repr__",
      id: 3,
      isCorrect: true,
      timestamp: "5 days ago",
    },
    {
      question: "List comprehensions vs Generators",
      id: 4,
      isCorrect: false,
      timestamp: "1 week ago",
    },
  ];

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Segmented Control */}
      <View style={[spacing.containerPadding, styles.segmentedContainer]}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedSegment === "overview" && styles.segmentButtonActive,
            ]}
            onPress={() => setSelectedSegment("overview")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentButtonText,
                selectedSegment === "overview" &&
                  styles.segmentButtonTextActive,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedSegment === "review" && styles.segmentButtonActive,
            ]}
            onPress={() => setSelectedSegment("review")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentButtonText,
                selectedSegment === "review" && styles.segmentButtonTextActive,
              ]}
            >
              Review Previous
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Show loading state while fetching skill data */}
      {isLoadingSkill ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading skill data...</Text>
        </View>
      ) : (
        <>
          {selectedSegment === "overview" ? (
            <SkillOverviewScreen 
              skillData={skillData}
              needsRating={needsRating}
              onRatingSubmit={handleRatingSubmit}
              isEnrolling={isEnrolling}
            />
          ) : (
            <View style={styles.historyList}>
              {/* Skill Level Rating - Only show if needs rating */}
              {needsRating && (
                <SkillLevelRating 
                  skillName={skill}
                  onRatingSubmit={handleRatingSubmit}
                  isSubmitting={isEnrolling}
                />
              )}
              
              {/* MCQ History */}
              {mcqAnswers.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.historyItem,
                    index !== mcqAnswers.length - 1 && styles.historyItemBorder,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={flex.row}>
                    <View
                      style={[
                        styles.iconContainer,
                        item.isCorrect
                          ? styles.iconContainerSuccess
                          : styles.iconContainerError,
                      ]}
                    >
                      <MaterialIcons
                        name={item.isCorrect ? "check-circle" : "cancel"}
                        size={24}
                        color={
                          item.isCorrect
                            ? Theme.colors.success.main
                            : Theme.colors.primary.main
                        }
                      />
                    </View>

                    <View style={styles.historyContent}>
                      <Text style={styles.questionText} numberOfLines={1}>
                        {item.question}
                      </Text>

                      <View style={[flex.row, styles.historyMeta]}>
                        <View
                          style={[
                            createBadgeStyle(
                              item.isCorrect ? "success" : "primary",
                            ),
                            styles.statusBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              item.isCorrect
                                ? styles.statusBadgeTextSuccess
                                : styles.statusBadgeTextError,
                            ]}
                          >
                            {item.isCorrect ? "CORRECT" : "INCORRECT"}
                          </Text>
                        </View>

                        <Text style={styles.timestampText}>{item.timestamp}</Text>
                      </View>
                    </View>
                  </View>

                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color={Theme.colors.settings.chevron}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default ReviewHistoryScreen;
