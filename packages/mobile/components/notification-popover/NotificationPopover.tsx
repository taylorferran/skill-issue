import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Theme } from '@/theme/Theme';
import { styles } from './NotificationPopover.styles';
import type { Challenge } from '@/types/Quiz';
import { Ionicons } from '@expo/vector-icons';

interface NotificationPopoverProps {
  isVisible: boolean;
  challenges: Challenge[];
  onClose: () => void;
  onChallengePress: (challenge: Challenge) => void;
}

function truncateText(text: string, maxLength: number = 70): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function NotificationPopover({
  isVisible,
  challenges,
  onClose,
  onChallengePress,
}: NotificationPopoverProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.popoverContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pending Challenges</Text>
          <Text style={styles.headerCount}>
            {challenges.length} {challenges.length === 1 ? 'challenge' : 'challenges'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {challenges.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="checkmark-circle-outline"
                size={40}
                color={Theme.colors.success.main}
              />
              <Text style={styles.emptyStateText}>
                No pending challenges!
              </Text>
              <Text style={styles.emptyStateSubtext}>
                You&apos;re all caught up. Great job!
              </Text>
            </View>
          ) : (
            challenges.map((challenge) => (
              <TouchableOpacity
                key={challenge.challengeId}
                style={styles.challengeItem}
                onPress={() => onChallengePress(challenge)}
                activeOpacity={0.7}
              >
                <View style={styles.challengeContent}>
                  <View style={styles.skillRow}>
                    <View style={styles.skillBadge}>
                      <Text style={styles.skillName}>{challenge.skillName}</Text>
                    </View>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>
                        Lvl {challenge.difficulty}
                      </Text>
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
      </View>
    </View>
  );
}
