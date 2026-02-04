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
import { useGetChallenge } from "@/api-routes/getChallenge";
import { useEnrollSkill } from "@/api-routes/enrollSkill";
import { useUser } from "@/contexts/UserContext";
import { useSkillsStore } from "@/stores/skillsStore";
import type { GetChallengeHistoryResponse } from "@learning-platform/shared";
import { hasAssessedSkill, markSkillAssessed } from "@/utils/assessmentStorage";
import { ChallengeHistoryCard } from "@/components/challenge-history-card/ChallengeHistoryCard";
import { notificationEventEmitter } from "@/utils/notificationEvents";

const CHALLENGES_PER_PAGE = 10;

const ReviewHistoryScreen = () => {
  const [selectedSegment, setSelectedSegment] = useState<"overview" | "review">(
    "overview",
  );

  // Get route params
  const { skill, skillId } = useRouteParams('assessment');
  const params = useLocalSearchParams();

  // Context & store
  const { userId } = useUser();
  const { setUserSkills } = useSkillsStore();

  // API hooks with cache-first behavior - keeps data between calls, only shows loading on first call
  const { 
    execute: fetchUserSkills, 
    data: userSkillsData
  } = useGetUserSkills();
  const { 
    execute: fetchPendingChallenges, 
    data: pendingChallengesData
  } = useGetPendingChallenges();
  const { 
    execute: fetchChallengeHistory, 
    data: challengeHistoryData, 
    isFetching: isFetchingHistory 
  } = useGetChallengeHistory({ clearDataOnCall: false });
  const { execute: enrollSkill, isLoading: isEnrolling } = useEnrollSkill();
  const { execute: fetchChallenge } = useGetChallenge();

  // UI state
  const [hasLocalAssessment, setHasLocalAssessment] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [recentlyAnswered, setRecentlyAnswered] = useState<GetChallengeHistoryResponse>([]);
  const [hasOverviewAnimated, setHasOverviewAnimated] = useState(false);

  // Derived data
  const skillData = userSkillsData?.find(s => s.skillName === skill) || null;
  const pendingChallenges = (pendingChallengesData || []).filter(c => c.skillId === skillId);
  const challengeHistory = (challengeHistoryData || [])
    .filter(h => h.skillId === skillId)
    .sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime());
  const needsRating = !hasLocalAssessment && (!skillData || !skillData.difficultyTarget);

  // Combined display history with optimistic updates
  const displayHistory = [
    ...recentlyAnswered,
    ...challengeHistory.filter(h => !recentlyAnswered.some(r => r.answerId === h.answerId))
  ];

  // Check for recently answered challenge from navigation params
  useEffect(() => {
    if (params.answeredChallenge) {
      try {
        const answeredChallenge = JSON.parse(params.answeredChallenge as string);
        if (answeredChallenge.skillId === skillId) {
          setRecentlyAnswered(prev => [answeredChallenge, ...prev]);
        }
      } catch (e) {
        console.error('[Assessment] Failed to parse answered challenge:', e);
      }
    }
  }, [params.answeredChallenge, skillId]);

  // Track when overview animation has played
  useEffect(() => {
    if (selectedSegment === "overview" && !hasOverviewAnimated) {
      // Mark animation as played after a short delay to allow the initial animation to start
      const timer = setTimeout(() => {
        setHasOverviewAnimated(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedSegment, hasOverviewAnimated]);

  // Initial load - fetch all data in parallel
  useEffect(() => {
    if (!userId || !skillId) return;

    const loadInitialData = async () => {
      console.log('[Assessment] 🔄 Initial load - fetching all data...');

      // Check local storage first (fast)
      const localAssessment = await hasAssessedSkill(skillId);
      setHasLocalAssessment(localAssessment);

      // Fetch all data in parallel
      await Promise.all([
        fetchUserSkills({ userId }),
        fetchPendingChallenges({ userId }),
        fetchChallengeHistory({ userId, limit: CHALLENGES_PER_PAGE, offset: 0 })
      ]);

      setHistoryOffset(CHALLENGES_PER_PAGE);
      setHasMoreHistory((challengeHistoryData?.length || 0) === CHALLENGES_PER_PAGE);

      // Sync local assessment if needed
      const currentSkill = userSkillsData?.find(s => s.skillName === skill);
      if (currentSkill?.difficultyTarget && !localAssessment) {
        await markSkillAssessed(skillId, currentSkill.difficultyTarget);
        setHasLocalAssessment(true);
      }
    };

    loadInitialData();
  }, [userId, skill, skillId]);

  // Background refresh when screen comes into focus (silent - no loading UI)
  useFocusEffect(
    useCallback(() => {
      if (!userId || !skillId) return;

      console.log('[Assessment] 🔄 Background refresh...');

      // Refresh all data silently (hooks keep existing data visible)
      Promise.all([
        fetchUserSkills({ userId }),
        fetchPendingChallenges({ userId }),
        fetchChallengeHistory({ userId, limit: CHALLENGES_PER_PAGE, offset: 0 })
      ]).then(() => {
        setHistoryOffset(CHALLENGES_PER_PAGE);
        setHasMoreHistory((challengeHistoryData?.length || 0) === CHALLENGES_PER_PAGE);
        setRecentlyAnswered([]);
      }).catch(error => {
        console.error('[Assessment] ❌ Background refresh failed:', error);
      });
    }, [userId, skill, skillId])
  );

  // Listen for notification events to refresh pending challenges
  useEffect(() => {
    const unsubscribe = notificationEventEmitter.subscribe(() => {
      if (userId) {
        console.log('[Assessment] 📨 Notification event received, refreshing pending challenges...');
        fetchPendingChallenges({ userId });
      }
    });

    return unsubscribe;
  }, [userId, fetchPendingChallenges]);

  const loadMoreHistory = async () => {
    if (!userId || !skillId || isFetchingHistory) return;

    try {
      const history = await fetchChallengeHistory({ 
        userId,
        limit: CHALLENGES_PER_PAGE,
        offset: historyOffset 
      });

      setHistoryOffset(prev => prev + CHALLENGES_PER_PAGE);
      setHasMoreHistory(history.length === CHALLENGES_PER_PAGE);
    } catch (error) {
      console.error('[Assessment] ❌ Failed to load more history:', error);
    }
  };

  const handleLoadMore = () => {
    if (!isFetchingHistory && hasMoreHistory) {
      loadMoreHistory();
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

      // Mark as assessed locally (optimistic update)
      await markSkillAssessed(skillId, rating);
      setHasLocalAssessment(true);

      // Enroll in skill
      await enrollSkill({ userId, skillId, difficultyTarget: rating });

      // Refetch all data
      const [updatedSkills] = await Promise.all([
        fetchUserSkills({ userId }),
        fetchPendingChallenges({ userId })
      ]);

      setUserSkills(updatedSkills);

      Alert.alert(
        'Enrollment Complete!',
        `You're now learning ${skill} at level ${rating}. View your progress in the Overview tab.`,
        [
          { 
            text: 'View Overview',
            onPress: () => setSelectedSegment('overview')
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
  const handleChallengeSelect = async (challenge: Challenge) => {
    console.log('[Assessment] 📝 Challenge selected:', challenge.challengeId);

    try {
      // Fetch full challenge details including correctOption and explanation
      const fullChallenge = await fetchChallenge({ challengeId: challenge.challengeId });
      
      console.log('[Assessment] ✅ Full challenge loaded:', {
        challengeId: fullChallenge.id,
        hasCorrectOption: true,
        hasExplanation: !!fullChallenge.explanation,
      });

      // Convert to MCQ format with correct answer and explanation
      const mcqQuestion = challengeToMCQQuestion(fullChallenge);
      
      navigateTo('quiz', { 
        skill: skill,
        data: mcqQuestion,
        challengeId: challenge.challengeId
      });
    } catch (error) {
      console.error('[Assessment] ❌ Failed to load challenge details:', error);
      Alert.alert(
        'Error',
        'Failed to load challenge. Please try again.'
      );
    }
  };

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

      {/* Overview Tab */}
      {selectedSegment === "overview" && (
        <SkillOverviewScreen 
          skillData={skillData}
          needsRating={needsRating}
          onRatingSubmit={handleRatingSubmit}
          isEnrolling={isEnrolling}
          pendingChallenges={pendingChallenges}
          onChallengeSelect={handleChallengeSelect}
          skillName={skill}
          hasAnimated={hasOverviewAnimated}
        />
      )}

      {/* Review Tab */}
      {selectedSegment === "review" && (
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
    </ScrollView>
  );
};

export default ReviewHistoryScreen;
