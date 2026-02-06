import { Theme } from "@/theme/Theme";
import { spacing } from "@/theme/ThemeUtils";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { styles } from "./_index.styles";
import SkillOverviewScreen from "@/components/skill-overview/SkillOverview";
import { challengeToMCQQuestion, type Challenge } from "@/types/Quiz";
import { useRouteParams, navigateTo } from "@/navigation/navigation";
import { fetchUserSkills, fetchChallengeHistory, fetchChallenge, skillsKeys, challengeKeys } from "@/api/routes";
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
  const queryClient = useQueryClient();

  // Set header title to skill name (truncated to prevent overflow)
  useEffect(() => {
    setTitle(truncateTitle(skill));
    return () => setTitle(null);
  }, [skill, setTitle]);

  // Context
  const { userId } = useUser();

  // TanStack Query - User Skills
  // Shows initialData immediately (no loading state), fetches in background
  const {
    data: allUserSkills,
    isFetching: isFetchingSkills,
  } = useQuery({
    queryKey: skillsKeys.user(userId || ''),
    queryFn: () => fetchUserSkills(userId || ''),
    initialData: initialData?.userSkills,  // ← Instant display from navigation
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // TanStack Query - Challenge History
  const {
    data: challengeHistory,
    isFetching: isFetchingHistory,
  } = useQuery({
    queryKey: skillsKeys.history(userId || '', skillId || ''),
    queryFn: () => fetchChallengeHistory(userId || '', { limit: CHALLENGES_PER_PAGE, offset: 0 }),
    initialData: initialData?.history,  // ← Instant display from navigation
    enabled: !!userId && !!skillId,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Subscribe to notification store for pending challenges
  const allPendingChallenges = useNotificationStore((state) => state.pendingChallenges);
  
  const pendingChallenges = useMemo(
    () => allPendingChallenges.filter((c) => c.skillId === skillId),
    [allPendingChallenges, skillId]
  );

  // UI state
  const [hasLocalAssessment, setHasLocalAssessment] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(CHALLENGES_PER_PAGE);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [recentlyAnswered, setRecentlyAnswered] = useState<GetChallengeHistoryResponse>([]);
  const [hasOverviewAnimated, setHasOverviewAnimated] = useState(false);

  // Skill data is filtered from user skills
  const skillData = allUserSkills?.find((s: any) => s.skillName === skill) || null;

  // needsRating determines if calibration button should show
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

  // Check local storage for assessment status on mount
  useEffect(() => {
    if (!skillId) return;
    
    const checkAssessment = async () => {
      const localAssessment = await hasAssessedSkill(skillId);
      setHasLocalAssessment(localAssessment);
      
      // Sync with server data if available
      if (skillData?.difficultyTarget && !localAssessment) {
        await markSkillAssessed(skillId, skillData.difficultyTarget);
        setHasLocalAssessment(true);
      }
    };
    
    checkAssessment();
  }, [skillId, skillData?.difficultyTarget]);

  // Check for recently answered challenge from navigation params (optimistic update)
  useEffect(() => {
    if (params.answeredChallenge && skillId) {
      try {
        const answeredChallenge = JSON.parse(params.answeredChallenge as string);
        if (answeredChallenge.skillId === skillId) {
          // Add to recently answered for optimistic UI update
          setRecentlyAnswered(prev => [answeredChallenge, ...prev]);
          // Also update TanStack Query cache for persistence
          queryClient.setQueryData(
            skillsKeys.history(userId || '', skillId),
            (old: GetChallengeHistoryResponse | undefined) => [
              answeredChallenge,
              ...(old || [])
            ]
          );
          // Emit notification event
          notificationEventEmitter.emit();
          console.log('[Assessment] 🔔 Added optimistic update for answered challenge');
        }
      } catch (e) {
        console.error('[Assessment] Failed to parse answered challenge:', e);
      }
    }
  }, [params.answeredChallenge, skillId, userId, queryClient]);

  // Track when overview animation has played
  useEffect(() => {
    if (selectedSegment === "overview" && !hasOverviewAnimated) {
      const timer = setTimeout(() => {
        setHasOverviewAnimated(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedSegment, hasOverviewAnimated]);

  // Refresh when screen comes into focus (TanStack Query handles this automatically)
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      console.log('[Assessment] 🔄 Focus refresh - invalidating queries...');
      
      // Invalidate queries to trigger background refetch
      queryClient.invalidateQueries({ queryKey: skillsKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: skillsKeys.history(userId, skillId || '') });
    }, [userId, skillId, queryClient])
  );

  // Listen for notification events to sync pending challenges
  useEffect(() => {
    const unsubscribe = notificationEventEmitter.subscribe(() => {
      console.log('[Assessment] 📨 Notification event received - pending challenges already synced');
    });

    return unsubscribe;
  }, []);

  const loadMoreHistory = async () => {
    if (!userId || !skillId || isFetchingHistory) return;

    try {
      const history = await fetchChallengeHistory(userId, {
        limit: CHALLENGES_PER_PAGE,
        offset: historyOffset
      });

      // Append new history to existing cache
      queryClient.setQueryData(
        skillsKeys.history(userId, skillId),
        (old: GetChallengeHistoryResponse | undefined) => [
          ...(old || []),
          ...history
        ]
      );
      
      setHistoryOffset((prev: number) => prev + CHALLENGES_PER_PAGE);
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
      // Fetch full challenge details
      const fullChallenge = await fetchChallenge(challenge.challengeId);
      
      console.log('[Assessment] ✅ Full challenge loaded:', {
        challengeId: fullChallenge.id,
        hasCorrectOption: true,
        hasExplanation: !!fullChallenge.explanation,
      });

      // Convert to MCQ format
      const mcqQuestion = challengeToMCQQuestion(fullChallenge);
      
      // Prefetch challenge for faster navigation
      queryClient.setQueryData(challengeKeys.detail(challenge.challengeId), fullChallenge);
      
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

  // Combined loading state (only show loading if no cached data available)
  const isLoadingHistory = isFetchingHistory;

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
