import { Theme } from "@/theme/Theme";
import { spacing } from "@/theme/ThemeUtils";
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { styles } from "./_index.styles";
import SkillOverviewScreen from "@/components/skill-overview/SkillOverview";
import SkillLevelRating from "@/components/skill-level-rating/SkillLevelRating";
import { challengeToMCQQuestion, type Challenge } from "@/types/Quiz";
import { useRouteParams, navigateTo } from "@/navigation/navigation";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { useGetPendingChallenges } from "@/api-routes/getPendingChallenges";
import { useGetChallengeHistory } from "@/api-routes/getChallengeHistory";
import { useEnrollSkill } from "@/api-routes/enrollSkill";
import { useUser } from "@/contexts/UserContext";
import { useSkillsStore } from "@/stores/skillsStore";
import type { GetUserSkillsResponse, GetChallengeHistoryResponse } from "@learning-platform/shared";
import { hasAssessedSkill, markSkillAssessed } from "@/utils/assessmentStorage";
import { ChallengeHistoryCard } from "@/components/challenge-history-card/ChallengeHistoryCard";

const CHALLENGES_PER_PAGE = 10;

const ReviewHistoryScreen = () => {
  const [selectedSegment, setSelectedSegment] = useState<"overview" | "review">(
    "overview",
  );
  
  // Get route params
  const { skill, skillId } = useRouteParams('assessment');
  const params = useLocalSearchParams();
  
  // Context & API hooks
  const { userId } = useUser();
  const { execute: fetchUserSkills } = useGetUserSkills();
  const { execute: fetchPendingChallenges, isLoading: isFetchingChallenges } = useGetPendingChallenges();
  const { execute: fetchChallengeHistory, isLoading: isFetchingHistory } = useGetChallengeHistory();
  const { execute: enrollSkill, isLoading: isEnrolling } = useEnrollSkill();
  const { setUserSkills } = useSkillsStore();
  
  // Local state for this skill's data
  const [skillData, setSkillData] = useState<GetUserSkillsResponse[number] | null>(null);
  const [isLoadingSkill, setIsLoadingSkill] = useState(true);
  const [hasLocalAssessment, setHasLocalAssessment] = useState(false);
  
  // State for pending challenges
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
  
  // State for challenge history
  const [challengeHistory, setChallengeHistory] = useState<GetChallengeHistoryResponse>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [recentlyAnswered, setRecentlyAnswered] = useState<GetChallengeHistoryResponse>([]);
  
  // Determine if user needs to set difficulty level
  const needsRating = !hasLocalAssessment && (!skillData || !skillData.difficultyTarget);
  
  // Check for recently answered challenge from navigation params
  useEffect(() => {
    if (params.answeredChallenge) {
      try {
        const answeredChallenge = JSON.parse(params.answeredChallenge as string);
        if (answeredChallenge.skillId === skillId) {
          // Add to recently answered list (optimistic update)
          setRecentlyAnswered(prev => [answeredChallenge, ...prev]);
          // Clear the param to avoid re-adding on re-renders
          // Note: We can't actually clear router params, but the effect only runs once
        }
      } catch (e) {
        console.error('[Assessment] Failed to parse answered challenge:', e);
      }
    }
  }, [params.answeredChallenge, skillId]);
  
  // Fetch skill data and pending challenges from backend on mount
  useEffect(() => {
    loadSkillData();
  }, [userId, skill]);
  
  // Refetch when screen comes into focus (after navigation back)
  useFocusEffect(
    useCallback(() => {
      loadSkillData();
      // Also refresh challenge history when coming back from quiz
      if (selectedSegment === "review") {
        loadChallengeHistory(true);
      }
    }, [userId, skill, selectedSegment])
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
        
        // Fetch pending challenges for this skill
        console.log('[Assessment] 🔄 Loading pending challenges...');
        const challenges = await fetchPendingChallenges({ userId });
        // Filter challenges for this skill only
        const skillChallenges = challenges.filter(c => c.skillId === skillId);
        setPendingChallenges(skillChallenges);
        console.log('[Assessment] ✅ Pending challenges loaded:', skillChallenges.length);
        
        // Fetch challenge history for this skill
        await loadChallengeHistory(true);
      } else {
        console.log('[Assessment] ℹ️ No backend record for this skill (new enrollment)');
        setPendingChallenges([]);
        setChallengeHistory([]);
      }
      
    } catch (error) {
      console.error('[Assessment] ❌ Failed to load skill data:', error);
      Alert.alert('Error', 'Could not load skill data. Please try again.');
    } finally {
      setIsLoadingSkill(false);
    }
  };
  
  const loadChallengeHistory = async (reset = false) => {
    if (!userId || !skillId) return;
    
    try {
      const offset = reset ? 0 : historyOffset;
      console.log('[Assessment] 🔄 Loading challenge history...', { offset, limit: CHALLENGES_PER_PAGE });
      
      const history = await fetchChallengeHistory({ 
        userId,
        limit: CHALLENGES_PER_PAGE,
        offset 
      });
      
      // Filter by current skill and sort by answeredAt descending
      const skillHistory = history
        .filter(h => h.skillId === skillId)
        .sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime());
      
      if (reset) {
        setChallengeHistory(skillHistory);
        setHistoryOffset(CHALLENGES_PER_PAGE);
        // Clear recently answered when doing a fresh load
        setRecentlyAnswered([]);
      } else {
        // Merge and deduplicate
        const existingIds = new Set(challengeHistory.map(h => h.answerId));
        const newItems = skillHistory.filter(h => !existingIds.has(h.answerId));
        setChallengeHistory(prev => [...prev, ...newItems]);
        setHistoryOffset(prev => prev + CHALLENGES_PER_PAGE);
      }
      
      // Check if there might be more (if we got a full page)
      setHasMoreHistory(history.length === CHALLENGES_PER_PAGE);
      
      console.log('[Assessment] ✅ Challenge history loaded:', skillHistory.length);
    } catch (error) {
      console.error('[Assessment] ❌ Failed to load challenge history:', error);
    }
  };
  
  const handleLoadMore = () => {
    if (!isFetchingHistory && hasMoreHistory) {
      loadChallengeHistory(false);
    }
  };
  
  const handleToggleExpand = (answerId: string) => {
    setExpandedChallengeId(prev => prev === answerId ? null : answerId);
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
      
      // STEP 4: Fetch pending challenges for this skill
      console.log('[Assessment] 🔄 Loading pending challenges after enrollment...');
      const challenges = await fetchPendingChallenges({ userId });
      const skillChallenges = challenges.filter(c => c.skillId === skillId);
      setPendingChallenges(skillChallenges);
      
      // Show success message and switch to Overview tab
      Alert.alert(
        'Enrollment Complete!',
        `You're now learning ${skill} at level ${rating}. View your progress in the Overview tab.`,
        [
          { 
            text: 'View Overview',
            onPress: () => {
              setSelectedSegment('overview');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('[Assessment] ❌ Enrollment failed:', error);
      
      Alert.alert(
        'Enrollment Failed',
        'Your assessment was saved locally, but we could not sync with the server. Your progress will sync when connection is restored.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Handler when user selects a challenge
  const handleChallengeSelect = (challenge: Challenge) => {
    console.log('[Assessment] 📝 Challenge selected:', challenge.challengeId);
    
    // Convert challenge to MCQQuestion format
    const mcqQuestion = challengeToMCQQuestion(challenge);
    
    // Navigate to quiz with this challenge
    navigateTo('quiz', { 
      skill: skill,
      data: mcqQuestion,
      challengeId: challenge.challengeId
    });
  };

  // Combine recently answered with fetched history (for optimistic updates)
  const displayHistory = [
    ...recentlyAnswered,
    ...challengeHistory.filter(h => !recentlyAnswered.some(r => r.answerId === h.answerId))
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
      {isLoadingSkill || isFetchingChallenges ? (
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
              pendingChallenges={pendingChallenges}
              onChallengeSelect={handleChallengeSelect}
              skillName={skill}
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
              
              {/* Challenge History Cards */}
              {displayHistory.length === 0 && !isFetchingHistory ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No challenges answered yet. Start practicing to see your history here!
                  </Text>
                </View>
              ) : (
                <>
                  {displayHistory.map((challenge) => (
                    <ChallengeHistoryCard
                      key={challenge.answerId}
                      challenge={challenge}
                      isExpanded={expandedChallengeId === challenge.answerId}
                      onToggle={() => handleToggleExpand(challenge.answerId)}
                    />
                  ))}
                  
                  {/* Load More Button */}
                  {hasMoreHistory && (
                    <TouchableOpacity
                      style={styles.loadMoreButton}
                      onPress={handleLoadMore}
                      disabled={isFetchingHistory}
                      activeOpacity={0.7}
                    >
                      {isFetchingHistory ? (
                        <ActivityIndicator size="small" color={Theme.colors.primary.main} />
                      ) : (
                        <Text style={styles.loadMoreText}>Load More</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default ReviewHistoryScreen;
