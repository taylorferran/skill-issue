import { Theme } from "@/theme/Theme";
import { spacing } from "@/theme/ThemeUtils";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { styles } from "./_index.styles";
import SkillOverviewScreen from "@/components/skill-overview/SkillOverview";
import { challengeToMCQQuestion, type Challenge } from "@/types/Quiz";
import { useRouteParams, navigateTo } from "@/navigation/navigation";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { useGetPendingChallenges } from "@/api-routes/getPendingChallenges";
import { useGetChallengeHistory } from "@/api-routes/getChallengeHistory";
import { useGetChallenge } from "@/api-routes/getChallenge";
import { useUser } from "@/contexts/UserContext";
import { useNavigationTitle } from "@/contexts/NavigationTitleContext";
import { useSkillsStore } from "@/stores/skillsStore";
import type { GetChallengeHistoryResponse } from "@learning-platform/shared";
import { hasAssessedSkill } from "@/utils/assessmentStorage";
import { ChallengeHistoryCard } from "@/components/challenge-history-card/ChallengeHistoryCard";
import { notificationEventEmitter } from "@/utils/notificationEvents";
import { MaterialIcons } from "@expo/vector-icons";

const CHALLENGES_PER_PAGE = 10;

// Helper to truncate title text to max characters with ellipsis
const truncateTitle = (text: string, maxLength: number = 20): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Helper to check if two arrays are deeply equal (for preventing unnecessary updates)
function isArrayEqual<T>(a: T[] | null | undefined, b: T[] | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

const ReviewHistoryScreen = () => {
  const [selectedSegment, setSelectedSegment] = useState<"overview" | "review">(
    "overview",
  );

  // Get route params
  const { skill, skillId } = useRouteParams('assessment');
  const params = useLocalSearchParams();
  const { setTitle } = useNavigationTitle();

  // Track if this is the first mount (for animation control)
  const isFirstMount = useRef(true);

  // Set header title to skill name (truncated to prevent overflow)
  useEffect(() => {
    setTitle(truncateTitle(skill));
    return () => setTitle(null);
  }, [skill, setTitle]);

  // Context & store
  const { userId } = useUser();
  const { 
    setUserSkills,
    getCachedPendingChallenges,
    getCachedChallengeHistory,
    shouldRefetchPendingChallenges,
    shouldRefetchChallengeHistory,
    setSkillPendingChallenges,
    setSkillChallengeHistory,
  } = useSkillsStore();

  // API hooks - clearDataOnCall: false ensures cache-first behavior
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
  const { execute: fetchChallenge } = useGetChallenge();

  // UI state
  const [hasLocalAssessment, setHasLocalAssessment] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [recentlyAnswered, setRecentlyAnswered] = useState<GetChallengeHistoryResponse>([]);
  const [hasOverviewAnimated, setHasOverviewAnimated] = useState(false);

  // Local state for cached data - initialized synchronously with cached values
  const [localPendingChallenges, setLocalPendingChallenges] = useState<Challenge[]>(() => {
    // Initialize with cached data immediately (synchronous)
    return skillId ? getCachedPendingChallenges(skillId) ?? [] : [];
  });
  const [localChallengeHistory, setLocalChallengeHistory] = useState<GetChallengeHistoryResponse>(() => {
    // Initialize with cached data immediately (synchronous)
    return skillId ? getCachedChallengeHistory(skillId) ?? [] : [];
  });

  // Derived data - use local cached state if available, otherwise use API data
  const skillData = userSkillsData?.find(s => s.skillName === skill) || null;
  
  // Use local state if available, otherwise fall back to API data
  const pendingChallenges = localPendingChallenges.length > 0 
    ? localPendingChallenges 
    : (pendingChallengesData || []).filter(c => c.skillId === skillId);
    
  const challengeHistory = localChallengeHistory.length > 0
    ? localChallengeHistory
    : (challengeHistoryData || [])
        .filter(h => h.skillId === skillId)
        .sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime());
        
  const needsRating = !hasLocalAssessment && (!skillData || !skillData.difficultyTarget);

  // Combined display history with optimistic updates
  const displayHistory = [
    ...recentlyAnswered,
    ...challengeHistory.filter(h => !recentlyAnswered.some(r => r.answerId === h.answerId))
  ];

  // Sync API data with local state when API returns data
  // This ensures background API calls update our cached state
  useEffect(() => {
    if (!skillId) return;

    // Sync pending challenges
    if (pendingChallengesData) {
      const freshPending = pendingChallengesData.filter(c => c.skillId === skillId);
      const pendingChanged = !isArrayEqual(localPendingChallenges, freshPending);
      
      if (pendingChanged && !isFirstMount.current) {
        console.log('[Assessment] 🔄 Syncing API pending challenges to local state');
        setLocalPendingChallenges(freshPending);
        setSkillPendingChallenges(skillId, freshPending);
      }
    }

    // Sync challenge history
    if (challengeHistoryData) {
      const freshHistory = challengeHistoryData
        .filter(h => h.skillId === skillId)
        .sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime());
      const historyChanged = !isArrayEqual(localChallengeHistory, freshHistory);
      
      if (historyChanged && !isFirstMount.current) {
        console.log('[Assessment] 🔄 Syncing API challenge history to local state');
        setLocalChallengeHistory(freshHistory);
        setSkillChallengeHistory(skillId, freshHistory);
      }
    }
  }, [pendingChallengesData, challengeHistoryData, skillId]);

  // Check for recently answered challenge from navigation params
  useEffect(() => {
    if (params.answeredChallenge) {
      try {
        const answeredChallenge = JSON.parse(params.answeredChallenge as string);
        if (answeredChallenge.skillId === skillId) {
          // Add to recently answered for optimistic UI update
          setRecentlyAnswered(prev => [answeredChallenge, ...prev]);
          // CRITICAL: Remove the answered challenge from pending list to trigger re-render
          setLocalPendingChallenges(prev => {
            const filtered = prev.filter(c => c.challengeId !== answeredChallenge.challengeId);
            console.log('[Assessment] 🗑️ Removed answered challenge from pending:', answeredChallenge.challengeId, '- Pending count:', filtered.length);
            // Also update the skillsStore cache to ensure consistency
            setSkillPendingChallenges(skillId, filtered);
            return filtered;
          });
          // Emit notification event to refresh pending challenges list and notification badge
          notificationEventEmitter.emit();
          console.log('[Assessment] 🔔 Emitted notification event after answering challenge');
        }
      } catch (e) {
        console.error('[Assessment] Failed to parse answered challenge:', e);
      }
    }
  }, [params.answeredChallenge, skillId, setSkillPendingChallenges]);

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

  // Initial load - cached data is already in state from synchronous initialization
  // This effect only fetches fresh data in background and handles assessment check
  useEffect(() => {
    if (!userId || !skillId) return;

    const loadInitialData = async () => {
      console.log('[Assessment] 🔄 Initial load - checking local storage...');

      // Check local storage for assessment status (fast)
      const localAssessment = await hasAssessedSkill(skillId);
      setHasLocalAssessment(localAssessment);

      // Check if we need to refresh cached data
      const needsRefetchPending = shouldRefetchPendingChallenges(skillId);
      const needsRefetchHistory = shouldRefetchChallengeHistory(skillId);
      const needsFetch = needsRefetchPending || needsRefetchHistory;

      if (!needsFetch) {
        console.log('[Assessment] ✅ All cached data fresh - no fetch needed');
        isFirstMount.current = false;
        
        // Still fetch user skills in background (no cache for this)
        fetchUserSkills({ userId }).catch(console.error);
        return;
      }

      console.log('[Assessment] 🔄 Fetching fresh data in background...');

      try {
        // Fetch all data in parallel
        await Promise.all([
          fetchUserSkills({ userId }),
          fetchPendingChallenges({ userId }),
          fetchChallengeHistory({ userId, limit: CHALLENGES_PER_PAGE, offset: 0 })
        ]);

        // Update local state with fresh data
        const freshPending = (pendingChallengesData || []).filter(c => c.skillId === skillId);
        const freshHistory = (challengeHistoryData || [])
          .filter(h => h.skillId === skillId)
          .sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime());
        
        setLocalPendingChallenges(freshPending);
        setLocalChallengeHistory(freshHistory);
        
        // Cache the data
        setSkillPendingChallenges(skillId, freshPending);
        setSkillChallengeHistory(skillId, freshHistory);

        setHistoryOffset(CHALLENGES_PER_PAGE);
        setHasMoreHistory((challengeHistoryData?.length || 0) === CHALLENGES_PER_PAGE);

        // Sync local assessment if needed
        const currentSkill = userSkillsData?.find(s => s.skillName === skill);
        if (currentSkill?.difficultyTarget && !localAssessment) {
          await markSkillAssessed(skillId, currentSkill.difficultyTarget);
          setHasLocalAssessment(true);
        }

        isFirstMount.current = false;
      } catch (error) {
        console.error('[Assessment] ❌ Initial load failed:', error);
        // Data is already showing from cache, no need to show error
      }
    };

    loadInitialData();
  }, [userId, skill, skillId]);

  // Background refresh when screen comes into focus (silent - no loading UI)
  useFocusEffect(
    useCallback(() => {
      if (!userId || !skillId) return;
      
      // Skip background refresh on first mount (initial load handles it)
      if (isFirstMount.current) return;

      console.log('[Assessment] 🔄 Background refresh...');

      // Refresh all data silently (no loading indicators)
      Promise.all([
        fetchUserSkills({ userId }),
        fetchPendingChallenges({ userId }),
        fetchChallengeHistory({ userId, limit: CHALLENGES_PER_PAGE, offset: 0 })
      ]).then(() => {
        // Get fresh data
        const freshPending = (pendingChallengesData || []).filter(c => c.skillId === skillId);
        const freshHistory = (challengeHistoryData || [])
          .filter(h => h.skillId === skillId)
          .sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime());

        // Only update state if data actually changed
        const pendingChanged = !isArrayEqual(localPendingChallenges, freshPending);
        const historyChanged = !isArrayEqual(localChallengeHistory, freshHistory);

        if (pendingChanged) {
          console.log('[Assessment] ✅ Pending challenges updated');
          setLocalPendingChallenges(freshPending);
          setSkillPendingChallenges(skillId, freshPending);
        }

        if (historyChanged) {
          console.log('[Assessment] ✅ Challenge history updated');
          setLocalChallengeHistory(freshHistory);
          setSkillChallengeHistory(skillId, freshHistory);
          setRecentlyAnswered([]); // Clear optimistic updates on actual refresh
        }

        if (!pendingChanged && !historyChanged) {
          console.log('[Assessment] ✅ No data changes detected');
        }

        setHistoryOffset(CHALLENGES_PER_PAGE);
        setHasMoreHistory((challengeHistoryData?.length || 0) === CHALLENGES_PER_PAGE);
      }).catch(error => {
        console.error('[Assessment] ❌ Background refresh failed:', error);
        // Don't show error on background refresh - keep showing cached data
      });
    }, [userId, skill, skillId])
  );

  // Listen for notification events to refresh pending challenges
  useEffect(() => {
    const unsubscribe = notificationEventEmitter.subscribe(() => {
      if (userId && skillId) {
        console.log('[Assessment] 📨 Notification event received, refreshing pending challenges...');
        fetchPendingChallenges({ userId }).then((data) => {
          // Update cache with fresh pending challenges
          const freshPending = (data || []).filter(c => c.skillId === skillId);
          setLocalPendingChallenges(freshPending);
          setSkillPendingChallenges(skillId, freshPending);
        }).catch(console.error);
      }
    });

    return unsubscribe;
  }, [userId, skillId, fetchPendingChallenges]);

  const loadMoreHistory = async () => {
    if (!userId || !skillId || isFetchingHistory) return;

    try {
      const history = await fetchChallengeHistory({ 
        userId,
        limit: CHALLENGES_PER_PAGE,
        offset: historyOffset 
      });

      // Append to existing local history and cache
      const combinedHistory = [...localChallengeHistory, ...history];
      setLocalChallengeHistory(combinedHistory);
      setSkillChallengeHistory(skillId, combinedHistory);

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
          {/* Start Calibration - Only show if needs rating */}
          {needsRating && (
            <View style={styles.calibrationCard}>
              <View style={styles.calibrationHeader}>
                <MaterialIcons name="psychology" size={24} color={Theme.colors.primary.main} />
                <Text style={styles.calibrationTitle}>Skill Calibration</Text>
              </View>
              <Text style={styles.calibrationDescription}>
                Complete a 10-question assessment to determine your starting difficulty level for {skill}.
              </Text>
              <TouchableOpacity 
                style={styles.startCalibrationButton}
                onPress={handleStartCalibration}
                activeOpacity={0.8}
              >
                <Text style={styles.startCalibrationButtonText}>Start Calibration</Text>
                <MaterialIcons name="arrow-forward" size={20} color={Theme.colors.text.inverse} />
              </TouchableOpacity>
            </View>
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
              {hasMoreHistory && displayHistory.length >= 10 && (
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
