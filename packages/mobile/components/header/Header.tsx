import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { Theme } from "@/theme/Theme";
import { styles } from "./Header.styles";
import { QuizTimer } from "../mcq-quiz/timer/QuizTimer";
import { useQuiz } from "@/contexts/QuizContext";

export function CustomHeader({
  navigation,
  route,
  options,
}: BottomTabHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { quizState } = useQuiz(); // ✅ Use context instead of global variable
  const backgroundColor = "white";

  const rootRoutes = ["index", "profile"];
  const isRootRoute = rootRoutes.includes(route.name);
  const canGoBack = navigation.canGoBack() && !isRootRoute;

  const isQuizRoute =
    pathname?.includes("/quiz") || route.name?.includes("quiz");

  let displayTitle = "Skill Issue";

  if (isQuizRoute && quizState) {
    if (!quizState.isSingleQuestion) {
      displayTitle = `Question ${quizState.currentQuestion} of ${quizState.totalQuestions}`;
    } else {
      displayTitle = "Quiz";
    }
  } else if (route.name === "skills/index") {
    displayTitle = "Skills";
  } else if (!isRootRoute) {
    displayTitle = options.title ?? "Skill Issue";
  }

  const handleBackPress = () => {
    // Use relative navigation - "../" goes up one level
    router.navigate("../");
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
            <MaterialIcons
              name="bolt"
              color={"white"}
              size={Theme.iconSize.md}
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
          // ✅ Show timer on quiz routes
          <QuizTimer
            timeLeft={quizState.timeLeft}
            totalTime={quizState.totalTime}
            isTimeUp={quizState.isTimeUp}
          />
        ) : !isQuizRoute ? (
          // ✅ Show notification bell only on non-quiz routes
          <Pressable
            style={({ pressed }) => [
              styles.notificationButton,
              {
                backgroundColor: pressed
                  ? Theme.colors.background.primary
                  : "transparent",
              },
            ]}
            onPress={() => {
              console.log("Notifications pressed");
            }}
          >
            <MaterialIcons
              name="notifications"
              color={Theme.colors.primary.main}
              size={Theme.iconSize.lg}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
