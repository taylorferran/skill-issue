import { Theme } from "@/theme/Theme";
import { spacing } from "@/theme/ThemeUtils";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { styles } from "./_index.styles";
import SkillOverviewScreen from "@/components/skill-overview/SkillOverview";
import { challengeToMCQQuestion, type Challenge } from "@/types/Quiz";
import { useRouteParams, navigateTo } from "@/navigation/navigation";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { useGetChallengeHistory } from "@/api-routes/getChallengeHistory";
import { useGetChallenge } from "@/api-routes/getChallenge";
import { useUser } from "@/contexts/UserContext";
import { useNavigationTitle } from "@/contexts/NavigationTitleContext";
import type { GetChallengeHistoryResponse } from "@learning-platform/shared";
import { hasAssessedSkill, markSkillAssessed } from "@/utils/assessmentStorage";
import { ChallengeHistoryCard } from "@/components/challenge-history-card/ChallengeHistoryCard";
import { notificationEventEmitter } from "@/utils/notificationEvents";
import { useNotificationStore } from "@/stores/notificationStore";

const CHALLENGES_PER_PAGE = 10;

// Helper to truncate title text to max characters with ellipsis
const truncateTitle = (text: string, maxLength: number = 20): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

const ReviewHistoryScreen = () => {
  const [selectedSegment, setSelectedSegment] = useState<"overview" | "review">(
    "overview",
  );

  // Get route params - initialData provides cached data to prevent flicker
  const { skill, skillId, initialData } = useRouteParams('assessment');
  const params = useLocalSearchParams();
  const { setTitle } = useNavigationTitle();

  // Set header title to skill name (truncated to prevent overflow)
  useEffect(() => {
    setTitle(truncateTitle(skill));
    return () => setTitle(null);
  }, [skill, setTitle]);

  // Context
  const { userId } = useUser();

  // API hooks - now only used for execute functions (cache updates happen in background)
  const { execute: fetchUserSkills } = useGetUserSkills();
  const { execute: fetchChallengeHistory } = useGetChallengeHistory({ storageProps: { skillId } });
  const { execute: fetchChallenge } = useGetChallenge();

  // Subscribe to notification store for pending challenges
  // First get all pending challenges (stable reference from store)
  const allPendingChallenges = useNotificationStore((state) => state.pendingChallenges);
  
  // Filter by skillId using useMemo to prevent re-renders from new array references
  const pendingChallenges = useMemo(
    () => allPendingChallenges.filter((c) => c.skillId === skillId),
    [allPendingChallenges, skillId]
  );

  // Data state - initialized from navigation params to prevent flicker
  // initialData comes from cache on the previous screen, available synchronously on mount
  const [allUserSkills, setAllUserSkills] = useState(initialData?.userSkills || null);
  const [challengeHistory, setChallengeHistory] = useState(initialData?.history || null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // UI state
  const [hasLocalAssessment, setHasLocalAssessment] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [recentlyAnswered, setRecentlyAnswered] = useState<GetChallengeHistoryResponse>([]);
  const [hasOverviewAnimated, setHasOverviewAnimated] = useState(false);

  // Skill data is filtered from user skills
  const skillData = allUserSkills?.find((s: any) => s.skillName === skill) || null;

  // pendingChallenges is already filtered by skillId from the store subscription

  // needsRating determines if calibration button should show
  // Check backend's needsCalibration flag OR if no difficulty target is set
  const needsRating = skillData?.needsCalibration || (!hasLocalAssessment && !skillData?.difficultyTarget);

  // Combined display history with optimistic updates - filtered by skillId
  const displayHistory = [
    ...recentlyAnswered.filter((r) => r.skillId === skillId),
    ...(challengeHistory || [])
      .filter((h: GetChallengeHistoryResponse[number]) => h.skillId === skillId)
      .filter((h: GetChallengeHistoryResponse[number]) => 
        !recentlyAnswered.some(r => r.answerId === h.answerId)
      )
  ];

  // Initial load - fetch all data in background
  useEffect(() => {
    if (!userId || !skillId) return;

    const loadInitialData = async () => {
      console.log('[Assessment] 🔄 Initial load - fetching fresh data...');

      // Check local storage for assessment status
      const localAssessment = await hasAssessedSkill(skillId);
      setHasLocalAssessment(localAssessment);

      try {
        // Fetch user skills and history in parallel
        // Pending challenges now come from notificationStore (no API call needed)
        const [userSkillsResult, historyResult] = await Promise.all([
          fetchUserSkills({ userId }),
          fetchChallengeHistory({ userId, limit: CHALLENGES_PER_PAGE, offset: 0 })
        ]);

        // Update local state with fresh data
        setAllUserSkills(userSkillsResult);
        setChallengeHistory(historyResult);

        // Sync local assessment if needed
        const currentSkill = userSkillsResult?.find((s: any) => s.skillName === skill);
        if (currentSkill?.difficultyTarget && !localAssessment) {
          await markSkillAssessed(skillId, currentSkill.difficultyTarget);
          setHasLocalAssessment(true);
        }

        setHistoryOffset(CHALLENGES_PER_PAGE);
        setHasMoreHistory((historyResult?.length || 0) >= CHALLENGES_PER_PAGE);
      } catch (error) {
        console.error('[Assessment] ❌ Initial load failed:', error);
        // Data is already showing from initialData, no need to show error
      }
    };

    loadInitialData();
  }, [userId, skill, skillId]);

  // Check for recently answered challenge from navigation params
  useEffect(() => {
    if (params.answeredChallenge && skillId) {
      try {
        const answeredChallenge = JSON.parse(params.answeredChallenge as string);
        if (answeredChallenge.skillId === skillId) {
          // Add to recently answered for optimistic UI update
          setRecentlyAnswered(prev => [answeredChallenge, ...prev]);
          // Emit notification event
          notificationEventEmitter.emit();
          console.log('[Assessment] 🔔 Added optimistic update for answered challenge');
        }
      } catch (e) {
        console.error('[Assessment] Failed to parse answered challenge:', e);
      }
    }
  }, [params.answeredChallenge, skillId]);

  // Track when overview animation has played
  useEffect(() => {
    if (selectedSegment === "overview" && !hasOverviewAnimated) {
      const timer = setTimeout(() => {
        setHasOverviewAnimated(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedSegment, hasOverviewAnimated]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      console.log('[Assessment] 🔄 Focus refresh - fetching fresh data...');

      // Fetch fresh data and update local state
      Promise.all([
        fetchUserSkills({ userId }),
        fetchChallengeHistory({ userId, limit: CHALLENGES_PER_PAGE, offset: 0 })
      ]).then(([userSkillsResult, historyResult]) => {
        console.log('[Assessment] ✅ Focus refresh complete');
        setAllUserSkills(userSkillsResult);
        setChallengeHistory(historyResult);
        // Note: pending challenges come from notificationStore (no fetch needed)
      }).catch(error => {
        console.error('[Assessment] ❌ Focus refresh failed:', error);
      });
    }, [userId])
  );

  // Listen for notification events to sync pending challenges from notificationStore
  // This ensures the badge count and pending list stay in sync
  useEffect(() => {
    const unsubscribe = notificationEventEmitter.subscribe(() => {
      // No action needed - pendingChallenges is already subscribed to notificationStore
      // The subscription automatically updates when the store changes
      console.log('[Assessment] 📨 Notification event received - pending challenges already synced');
    });

    return unsubscribe;
  }, []);

  const loadMoreHistory = async () => {
    if (!userId || !skillId || isLoadingHistory) return;

    setIsLoadingHistory(true);
    try {
      const history = await fetchChallengeHistory({
        userId,
        limit: CHALLENGES_PER_PAGE,
        offset: historyOffset
      });

      // Append new history to existing history
      setChallengeHistory((prev: GetChallengeHistoryResponse | null) => [...(prev || []), ...history]);
      setHistoryOffset((prev: number) => prev + CHALLENGES_PER_PAGE);
      setHasMoreHistory(history.length === CHALLENGES_PER_PAGE);
    } catch (error) {
      console.error('[Assessment] ❌ Failed to load more history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingHistory && hasMoreHistory) {
      loadMoreHistory();
    }
  };

  const handleToggleExpand = (answerId: string) => {
    setExpandedChallengeId(prev => prev === answerId ? null : answerId);
  };

  // Handler to start calibration quiz
  const handleStartCalibration = () => {
    if (!skill || !skillId) {
      Alert.alert('Error', 'Missing skill information');
      return;
    }

    navigateTo('calibration', { skill, skillId });
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
        skill,
        skillId,
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
          onStartCalibration={handleStartCalibration}
          pendingChallenges={pendingChallenges}
          onChallengeSelect={handleChallengeSelect}
          skillName={skill}
          hasAnimated={hasOverviewAnimated}
        />
      )}

      {/* Review Tab */}
      {selectedSegment === "review" && (
        <View style={styles.historyList}>
          {/* Challenge History Cards */}
          {displayHistory.length === 0 && !isLoadingHistory ? (
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
              {hasMoreHistory && displayHistory.length >= 10 && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={isLoadingHistory}
                  activeOpacity={0.7}
                >
                  {isLoadingHistory ? (
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
