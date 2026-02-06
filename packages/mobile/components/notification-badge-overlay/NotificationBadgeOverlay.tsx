import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { Theme } from '@/theme/Theme';
import { useNotificationStore } from '@/stores/notificationStore';
import { useGetPendingChallenges } from '@/api-routes/getPendingChallenges';
import { useUser } from '@/contexts/UserContext';
import { useGetChallenge } from '@/api-routes/getChallenge';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { challengeToMCQQuestion, type Challenge } from '@/types/Quiz';
import { navigateTo } from '@/navigation/navigation';

function truncateText(text: string, maxLength: number = 70): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Persistent Notification Badge Overlay with Integrated Dropdown
 *
 * This component lives at the root level and persists across all screen transitions.
 * The challenges dropdown is integrated directly below the notification button.
 */
export const NotificationBadgeOverlay = React.memo(function NotificationBadgeOverlay() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { userId } = useUser();
  const { isSignedIn } = useClerkAuth();
  const { pendingChallenges, setPendingChallenges } = useNotificationStore();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [hasInitialFetchCompleted, setHasInitialFetchCompleted] = useState(false);
  const { execute: fetchPendingChallenges } = useGetPendingChallenges({ clearDataOnCall: false });
  const { execute: fetchChallenge } = useGetChallenge();

  // Hide notification bar on quiz and calibration pages
  const isQuizPage = pathname?.includes('/assessment/quiz');
  const isCalibrationPage = pathname?.includes('/assessment/calibration');

  // Calculate display values
  const count = pendingChallenges.length;
  const displayCount = count > 9 ? '9+' : String(count);
  const showBadge = count > 0;

  // Fetch challenges only on FIRST mount (not on subsequent userId changes or re-renders)
  // After initial fetch, the badge updates via local operations only:
  // - Push notifications add via addPendingChallenge() in notifications.ts
  // - Quiz completion removes via removePendingChallenge() in the quiz page
  useEffect(() => {
    if (!userId || hasInitialFetchCompleted) return;

    const loadChallenges = async () => {
      try {
        console.log('[NotificationBadgeOverlay] Loading initial challenges on first mount...');
        const challenges = await fetchPendingChallenges({ userId });
        if (challenges) {
          setPendingChallenges(challenges);
        }
        setHasInitialFetchCompleted(true);
      } catch (err) {
        console.error('[NotificationBadgeOverlay] Failed to load challenges:', err);
      }
    };

    loadChallenges();
  }, [userId, fetchPendingChallenges, setPendingChallenges, hasInitialFetchCompleted]);

  // Note: We intentionally do NOT listen for notification events to auto-refresh from server.
  // Push notifications add challenges directly via addPendingChallenge() in notifications.ts
  // Quiz completion removes challenges via removePendingChallenge() in the quiz page
  // Both operations update the local store immediately, so no server re-fetch is needed.
  // This prevents race conditions where server returns stale data.
  //
  // The component will automatically re-render with fresh data when it becomes visible again
  // (coming back from quiz pages) because useNotificationStore() subscribes to state changes.

  const handlePress = useCallback(() => {
    setIsDropdownVisible(prev => !prev);
  }, []);

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownVisible(false);
  }, []);

  const handleChallengePress = useCallback(async (challenge: Challenge) => {
    console.log('[NotificationBadgeOverlay] Challenge selected:', challenge.challengeId);

    try {
      // Fetch full challenge details
      const fullChallenge = await fetchChallenge({ challengeId: challenge.challengeId });

      console.log('[NotificationBadgeOverlay] Full challenge loaded:', {
        challengeId: fullChallenge.id,
        hasCorrectOption: true,
        hasExplanation: !!fullChallenge.explanation,
      });

      // Convert to MCQ format
      const mcqQuestion = challengeToMCQQuestion(fullChallenge);

      // Close dropdown before navigation
      setIsDropdownVisible(false);

      // Navigate to quiz
      // Note: Challenge will be removed from pending after successful completion (status 200)
      // in the quiz page's handleFinish function, not here optimistically
      navigateTo('quiz', {
        skill: challenge.skillName,
        skillId: challenge.skillId,
        data: mcqQuestion,
        challengeId: challenge.challengeId,
      });
    } catch (error) {
      console.error('[NotificationBadgeOverlay] Failed to load challenge:', error);
      Alert.alert('Error', 'Failed to load challenge. Please try again.');
    }
  }, [fetchChallenge]);

  // Don't show notification button if user is not signed in or on quiz/calibration pages
  if (!userId || !isSignedIn || isQuizPage || isCalibrationPage) {
    return null;
  }

  return (
    <View style={[styles.container, { top: insets.top + 10 }]}>
      {/* Backdrop for closing dropdown */}
      {isDropdownVisible && (
        <Pressable style={styles.backdrop} onPress={handleCloseDropdown} />
      )}

      {/* Notification Button */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={handlePress}
      >
        <MaterialIcons
          name="notifications"
          color={Theme.colors.primary.main}
          size={Theme.iconSize.lg}
        />
        <View style={[styles.badge, !showBadge && styles.badgeHidden]}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      </Pressable>

      {/* Dropdown Menu */}
      {isDropdownVisible && (
        <View style={styles.dropdown}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Pending Challenges</Text>
            <Text style={styles.headerCount}>
              {pendingChallenges.length} {pendingChallenges.length === 1 ? 'challenge' : 'challenges'}
            </Text>
          </View>

          {/* Challenges List */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
          >
            {pendingChallenges.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={32}
                  color={Theme.colors.success.main}
                />
                <Text style={styles.emptyStateText}>No pending challenges!</Text>
                <Text style={styles.emptyStateSubtext}>You&apos;re all caught up. Great job!</Text>
              </View>
            ) : (
              pendingChallenges.map((challenge: Challenge) => (
                <TouchableOpacity
                  key={challenge.challengeId}
                  style={styles.challengeItem}
                  onPress={() => handleChallengePress(challenge)}
                  activeOpacity={0.7}
                >
                  <View style={styles.challengeContent}>
                    <View style={styles.skillRow}>
                      <View style={styles.skillBadge}>
                        <Text style={styles.skillName}>{challenge.skillName}</Text>
                      </View>
                      <View style={styles.difficultyBadge}>
                        <Text style={styles.difficultyText}>Lvl {challenge.difficulty}</Text>
                      </View>
                    </View>
                    <Text style={styles.questionText}>
                      {truncateText(challenge.question)}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Theme.colors.text.quaternary}
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Arrow pointer */}
          <View style={styles.arrow} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: -500,
    left: -500,
    right: -500,
    bottom: -500,
    backgroundColor: 'transparent',
    zIndex: -1,
  },
  button: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Theme.colors.error.main,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeHidden: {
    opacity: 0,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Theme.typography.fontWeight.bold,
    color: 'white',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 300,
    maxHeight: 350,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.card,
    overflow: 'hidden',
    marginTop: 4,
  },
  arrow: {
    position: 'absolute',
    top: -6,
    right: 16,
    width: 12,
    height: 12,
    backgroundColor: Theme.colors.background.secondary,
    transform: [{ rotate: '45deg' }],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: Theme.colors.gray[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.gray[200],
    backgroundColor: Theme.colors.background.secondary,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  headerCount: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
  },
  scrollContainer: {
    maxHeight: 290,
  },
  scrollContent: {
    paddingVertical: Theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.gray[100],
    backgroundColor: Theme.colors.background.secondary,
  },
  challengeContent: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.xs,
  },
  skillBadge: {
    backgroundColor: Theme.colors.primary.light,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  skillName: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.primary.main,
  },
  difficultyBadge: {
    backgroundColor: Theme.colors.gray[100],
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  difficultyText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.gray[500],
  },
  questionText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.tight,
  },
  chevron: {
    marginLeft: Theme.spacing.xs,
  },
});
