import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Skill } from '@/types/Skill';
import { Theme } from '@/theme/Theme';
import { ProgressBar } from '@/components/progress-bar/ProgressBar';
import { NeedsCalibrationBadge } from '@/components/needs-calibration-badge/NeedsCalibrationBadge';
import { styles } from './SkillCard.styles';

const DELETE_THRESHOLD = -60; // Swipe left threshold to show delete mode
const SWIPE_RESET_THRESHOLD = 30; // Swipe right to reset

interface SkillCardProps {
  skill: Skill;
  onSelect: (skill: Skill) => void;
  onDelete?: () => void; // Optional delete handler
}

export function SkillCard({ skill, onSelect, onDelete }: SkillCardProps) {
  const swipeProgress = useRef(new Animated.Value(0)).current;
  const isDeleteMode = useRef(false);

  const resetCard = useCallback(() => {
    Animated.spring(swipeProgress, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
    isDeleteMode.current = false;
  }, [swipeProgress]);

  const showDeleteMode = useCallback(() => {
    Animated.spring(swipeProgress, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
    isDeleteMode.current = true;
  }, [swipeProgress]);

  const handleDelete = useCallback(() => {
    resetCard();
    onDelete?.();
  }, [onDelete, resetCard]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!onDelete) return;

        // Calculate progress based on swipe distance
        // Negative dx means swiping left
        const progress = Math.max(0, Math.min(1, -gestureState.dx / 100));
        swipeProgress.setValue(progress);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!onDelete) return;

        const position = gestureState.dx;

        if (position < DELETE_THRESHOLD) {
          // Swiped left enough - enter delete mode
          showDeleteMode();
        } else if (position > SWIPE_RESET_THRESHOLD && isDeleteMode.current) {
          // Swiped right while in delete mode - reset
          resetCard();
        } else if (!isDeleteMode.current) {
          // Didn't swipe far enough - reset
          resetCard();
        }
      },
    })
  ).current;

  const handleCardPress = () => {
    if (isDeleteMode.current) {
      resetCard();
    } else {
      onSelect(skill);
    }
  };

  const handleIconPress = () => {
    if (isDeleteMode.current && onDelete) {
      handleDelete();
    }
  };

  // Interpolate icon styles based on swipe progress
  const iconScale = swipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const iconBackgroundColor = swipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [Theme.colors.primary.main, Theme.colors.error.main],
    extrapolate: 'clamp',
  });

  const skillIconOpacity = swipeProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  const deleteIconOpacity = swipeProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardContainer}>
        <View {...(onDelete ? panResponder.panHandlers : {})}>
          <TouchableOpacity
            style={styles.contentTouchable}
            onPress={handleCardPress}
            activeOpacity={0.95}
          >
            {/* Main Content */}
            <View style={styles.header}>
              <View style={styles.info}>
                <Text style={styles.name}>{skill.name}</Text>
                <Text style={styles.category}>{skill.category}</Text>
                {skill.needsCalibration && (
                  <View style={styles.badgeContainer}>
                    <NeedsCalibrationBadge />
                  </View>
                )}
              </View>

              {/* Skill/Delete Icon Container */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: iconScale }],
                    backgroundColor: iconBackgroundColor,
                  }
                ]}
              >
                <TouchableOpacity
                  onPress={handleIconPress}
                  activeOpacity={0.7}
                  style={styles.iconTouchable}
                >
                  {/* Skill Icon - fades out when swiping */}
                  <Animated.View style={{ opacity: skillIconOpacity }}>
                    <Ionicons
                      name={skill.icon}
                      size={28}
                      color={Theme.colors.text.inverse}
                    />
                  </Animated.View>

                  {/* Delete Icon - fades in when swiping */}
                  <Animated.View
                    style={[
                      styles.deleteIconOverlay,
                      { opacity: deleteIconOpacity }
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={28}
                      color={Theme.colors.text.inverse}
                    />
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Progress Bar */}
            <ProgressBar
              progress={skill.progress}
              color={Theme.colors.primary.main}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
