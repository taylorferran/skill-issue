import { Theme } from "@/theme/Theme";
import {
  spacing,
  createButtonStyle,
  flex,
  createBadgeStyle,
  createTextStyle,
} from "@/theme/ThemeUtils";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { styles } from "./_index.styles";
import SkillOverviewScreen from "@/components/skill-overview/SkillOverview";
import AIAssessment from "@/components/ai-assessment/AIAssessment";

interface QuestionHistoryItem {
  id: string;
  question: string;
  isCorrect: boolean;
  timestamp: string;
}

const ReviewHistoryScreen = () => {
  const [selectedSegment, setSelectedSegment] = useState<"overview" | "review">(
    "overview",
  );

  const historyData: QuestionHistoryItem[] = [
    {
      id: "1",
      question: "How do you define a decorator?",
      isCorrect: true,
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      question: "Time complexity of Dict lookups?",
      isCorrect: false,
      timestamp: "Yesterday",
    },
    {
      id: "3",
      question: "Difference between __str__ & __repr__",
      isCorrect: true,
      timestamp: "Oct 20, 2023",
    },
    {
      id: "4",
      question: "List comprehensions vs Generators",
      isCorrect: true,
      timestamp: "Oct 18, 2023",
    },
  ];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
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
          <AIAssessment />
          {historyData.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.historyItem,
                index !== historyData.length - 1 && styles.historyItemBorder,
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
