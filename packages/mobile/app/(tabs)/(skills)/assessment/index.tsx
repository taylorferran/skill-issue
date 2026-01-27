import { Theme } from "@/theme/Theme";
import { spacing, flex, createBadgeStyle } from "@/theme/ThemeUtils";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { styles } from "./_index.styles";
import SkillOverviewScreen from "@/components/skill-overview/SkillOverview";
import SkillLevelRating from "@/components/skill-level-rating/SkillLevelRating";
import { MCQItem } from "@/types/Quiz";
import { useSkillLevelStore } from "@/stores/skillLevelStore";
import { useRouteParams } from "@/navigation/navigation";

const ReviewHistoryScreen = () => {
  const [selectedSegment, setSelectedSegment] = useState<"overview" | "review">(
    "overview",
  );
  
  // Get skill from route params
  const { skill } = useRouteParams('assessment');
  
  // Zustand store for skill level ratings
  const hasRatedSkill = useSkillLevelStore((state) => state.hasRatedSkill);
  const setSkillLevel = useSkillLevelStore((state) => state.setSkillLevel);
  
  // Check if user has rated this skill
  const hasRated = hasRatedSkill(skill);
  
  // Handler for when user submits their rating
  const handleRatingSubmit = (rating: number) => {
    setSkillLevel(skill, rating);
  };
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


  // Otherwise show the normal review history screen
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

      {selectedSegment === "overview" ? (
        <SkillOverviewScreen />
      ) : (
        <View style={styles.historyList}>
          {/* Skill Level Rating - Only show if not rated yet */}
          {!hasRated && (
            <SkillLevelRating 
              skillName={skill}
              onRatingSubmit={handleRatingSubmit}
            />
          )}
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
    </ScrollView>
  );
};

export default ReviewHistoryScreen;
