import React from "react";
import { useQuiz } from "@/contexts/QuizContext";
import { Theme } from "@/theme/Theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { useRouter, usePathname } from "expo-router";
import { View, Pressable, Text } from "react-native";
import { QuizTimer } from "../mcq-quiz/timer/QuizTimer";
import { styles } from "./Header.styles";

export function CustomHeader({
  navigation,
  route,
  options,
}: BottomTabHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { quizState } = useQuiz();
  const backgroundColor = "white";

  // Check if we're at a root tab route by pathname
  const isProfileRoute =
    pathname === "/profile" || pathname.startsWith("/profile/");
  const isSkillsRoute = pathname === "/";
  const isRootRoute = isSkillsRoute || isProfileRoute;

  // Show back button for any non-root route
  const canGoBack = !isRootRoute;

  const isQuizRoute = pathname?.includes("quiz");

  let displayTitle = "Skill Issue";
  if (quizState) {
    if (!quizState.isSingleQuestion && isQuizRoute) {
      displayTitle = `Question ${quizState.currentQuestion} of ${quizState.totalQuestions}`;
    } else {
      displayTitle = "";
    }
  } else if (isProfileRoute) {
    displayTitle = "Profile";
  } else if (isSkillsRoute) {
    displayTitle = "Skills";
  } else {
    displayTitle = options.title ?? "Skill Issue";
  }

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback: navigate to skills screen if can't go back (e.g., from notification)
      router.navigate('/(tabs)/(skills)');
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderBottomColor: "white" },
      ]}
    >
      <View style={styles.logoContainer}>
        {canGoBack && (
          <Pressable
            onPress={handleBackPress}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MaterialIcons
              name={isQuizRoute ? "close" : "arrow-back"}
              size={Theme.iconSize.md}
              color={Theme.colors.primary.main}
            />
          </Pressable>
        )}
        {!isQuizRoute && (
          <View style={styles.logoBox}>
            <Ionicons
              name="diamond"
              size={28}
              color={Theme.colors.primary.main}
            />
          </View>
        )}
        <Text
          style={[styles.title, { color: Theme.colors.text.primary }]}
          numberOfLines={1}
        >
          {displayTitle}
        </Text>
      </View>
      {/* Right Actions */}
      <View style={styles.actionsContainer}>
        {isQuizRoute && quizState ? (
          <QuizTimer elapsedTime={quizState.elapsedTime} />
        ) : null}
      </View>
    </View>
  );
}
