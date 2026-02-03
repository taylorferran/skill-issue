import React from "react";
import { View, Text, TouchableOpacity, LayoutAnimation } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "./ChallengeHistoryCard.styles";
import { Theme } from "@/theme/Theme";
import type { GetChallengeHistoryResponse } from "@learning-platform/shared";

// Type for a single challenge history item
type ChallengeHistoryItem = GetChallengeHistoryResponse[number];

interface ChallengeHistoryCardProps {
  challenge: ChallengeHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
}

// Letter labels for options
const OPTION_LABELS = ["A", "B", "C", "D"];

export const ChallengeHistoryCard: React.FC<ChallengeHistoryCardProps> = ({
  challenge,
  isExpanded,
  onToggle,
}) => {
  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Format response time
  const formatResponseTime = (ms: number | null): string => {
    if (!ms) return "";
    const seconds = Math.round(ms / 1000);
    return `${seconds}s`;
  };

  // Handle toggle with animation
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  // Get option style based on its state
  const getOptionStyle = (index: number) => {
    const isSelected = index === challenge.selectedOption;
    const isCorrect = index === challenge.correctOption;

    if (isSelected && isCorrect) {
      return [styles.option, styles.optionCorrect];
    } else if (isSelected && !isCorrect) {
      return [styles.option, styles.optionIncorrect];
    } else if (isCorrect) {
      return [styles.option, styles.optionCorrect];
    }
    return styles.option;
  };

  // Get option text style
  const getOptionTextStyle = (index: number) => {
    const isSelected = index === challenge.selectedOption;
    const isCorrect = index === challenge.correctOption;

    if (isSelected && isCorrect) {
      return [styles.optionText, styles.optionTextCorrect];
    } else if (isSelected && !isCorrect) {
      return [styles.optionText, styles.optionTextIncorrect];
    } else if (isCorrect) {
      return [styles.optionText, styles.optionTextCorrect];
    }
    return styles.optionText;
  };

  // Get icon for option
  const getOptionIcon = (index: number): { name: keyof typeof MaterialIcons.glyphMap; color: string } | null => {
    const isSelected = index === challenge.selectedOption;
    const isCorrect = index === challenge.correctOption;

    if (isSelected && isCorrect) {
      return { name: "check-circle", color: Theme.colors.success.main };
    } else if (isSelected && !isCorrect) {
      return { name: "cancel", color: Theme.colors.primary.main };
    } else if (isCorrect) {
      return { name: "check-circle", color: Theme.colors.success.main };
    }
    return null;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleToggle}
      activeOpacity={0.9}
    >
      {/* Header - Always visible */}
      <View style={styles.header}>
        {/* Correct/Incorrect Icon */}
        <View
          style={[
            styles.iconContainer,
            challenge.isCorrect
              ? styles.iconContainerSuccess
              : styles.iconContainerError,
          ]}
        >
          <MaterialIcons
            name={challenge.isCorrect ? "check-circle" : "cancel"}
            size={24}
            color={
              challenge.isCorrect
                ? Theme.colors.success.main
                : Theme.colors.primary.main
            }
          />
        </View>

        {/* Question and Meta */}
        <View style={styles.headerContent}>
          <Text style={styles.questionTextCollapsed} numberOfLines={1}>
            {challenge.question}
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.statusBadge,
                challenge.isCorrect
                  ? styles.statusBadgeSuccess
                  : styles.statusBadgeError,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  challenge.isCorrect
                    ? styles.statusBadgeTextSuccess
                    : styles.statusBadgeTextError,
                ]}
              >
                {challenge.isCorrect ? "CORRECT" : "INCORRECT"}
              </Text>
            </View>
            <Text style={styles.timestampText}>
              {formatTimestamp(challenge.answeredAt)}
            </Text>
          </View>
        </View>

        {/* Expand/Collapse Icon */}
        <MaterialIcons
          name={isExpanded ? "expand-less" : "expand-more"}
          size={24}
          color={Theme.colors.gray[400]}
          style={styles.expandIcon}
        />
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {/* Full Question */}
          <Text style={styles.questionTextFull}>{challenge.question}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {challenge.options.map((option, index) => {
              const icon = getOptionIcon(index);
              return (
                <View key={index} style={getOptionStyle(index)}>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>
                      {OPTION_LABELS[index]}
                    </Text>
                    <Text style={getOptionTextStyle(index)}>{option}</Text>
                  </View>
                  {icon && (
                    <MaterialIcons
                      name={icon.name}
                      size={20}
                      color={icon.color}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Explanation */}
          {challenge.explanation && (
            <View style={styles.explanationSection}>
              <Text style={styles.explanationTitle}>Explanation</Text>
              <Text style={styles.explanationText}>
                {challenge.explanation}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            {challenge.responseTime && (
              <View style={styles.statItem}>
                <MaterialIcons
                  name="timer"
                  size={14}
                  color={Theme.colors.gray[400]}
                />
                <Text style={styles.statText}>
                  {formatResponseTime(challenge.responseTime)}
                </Text>
              </View>
            )}
            {challenge.confidence && (
              <View style={styles.statItem}>
                <MaterialIcons
                  name="star"
                  size={14}
                  color={Theme.colors.warning.main}
                />
                <Text style={styles.statText}>
                  Confidence: {challenge.confidence}/5
                </Text>
              </View>
            )}
            <View style={styles.statItem}>
              <MaterialIcons
                name="signal-cellular-alt"
                size={14}
                color={Theme.colors.gray[400]}
              />
              <Text style={styles.statText}>
                Difficulty: {challenge.difficulty}/10
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};
