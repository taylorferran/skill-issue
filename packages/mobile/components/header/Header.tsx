import React, { useEffect, useState } from "react";
import { useNavigationTitle } from "@/contexts/NavigationTitleContext";
import { Theme } from "@/theme/Theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import { View, Pressable, Text } from "react-native";
import { QuizTimer } from "../mcq-quiz/timer/QuizTimer";
import { styles } from "./Header.styles";
import { navigateTo } from "@/navigation/navigation";
import { quizTimerEmitter } from "@/utils/quizTimerEmitter";

export function CustomHeader({
  navigation,
  route,
  options,
}: BottomTabHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useLocalSearchParams();
  const { title: navigationTitle } = useNavigationTitle();
  const [elapsedTime, setElapsedTime] = useState(0);
  const backgroundColor = "white";

  // Check if we're at a root tab route by pathname
  const isProfileRoute =
    pathname === "/profile" || pathname.startsWith("/profile/");
  const isSkillsRoute = pathname === "/";
  const isRootRoute = isSkillsRoute || isProfileRoute;

  // Show back button for any non-root route
  const canGoBack = !isRootRoute;

  const isQuizRoute = pathname?.includes("quiz");
  const isAssessmentRoute = pathname?.includes("assessment") && !isQuizRoute;

  // Subscribe to timer updates when on quiz route
  useEffect(() => {
    if (!isQuizRoute) {
      setElapsedTime(0);
      return;
    }

    console.log(`[Header] 🎯 Quiz route detected, subscribing to timer`);
    
    // Subscribe to timer events
    const unsubscribe = quizTimerEmitter.subscribe((time) => {
      console.log(`[Header] ⏱️ Timer update received: ${time}s`);
      setElapsedTime(time);
    });

    return () => {
      console.log(`[Header] 🧹 Quiz route leaving, unsubscribing`);
      unsubscribe();
      setElapsedTime(0);
    };
  }, [isQuizRoute]);

  let displayTitle = "Skill Issue";
  if (navigationTitle) {
    displayTitle = navigationTitle;
  } else if (isQuizRoute) {
    // For quiz route, show empty title or question counter
    // We could also emit question metadata through the emitter if needed
    displayTitle = "";
  } else if (isProfileRoute) {
    displayTitle = "Profile";
  } else if (isSkillsRoute) {
    displayTitle = "Skills";
  } else {
    displayTitle = options.title ?? "Skill Issue";
  }

  const handleBackPress = () => {
    if (isQuizRoute) {
      // When on quiz route, always navigate back to assessment with the skill params
      const skill = searchParams.skill as string;
      const skillId = searchParams.skillId as string | undefined;
      
      if (skill && skillId) {
        navigateTo('assessment', {
          skill,
          skillId,
          // Progress will be fetched on assessment screen from API
        });
      } else if (skill) {
        // Fallback: only skill available (shouldn't happen with proper routing)
        navigateTo('assessment', {
          skill,
          skillId: skill, // Use skill name as fallback ID
        });
      } else {
        // Fallback: navigate to skills screen if no skill param available
        router.navigate('/(tabs)/(skills)');
      }
    } else if (isAssessmentRoute) {
      // When on assessment route, always navigate to parent (skills)
      // This ensures proper parent-child navigation regardless of entry point
      navigateTo('skills');
    } else if (router.canGoBack()) {
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
        {isQuizRoute ? (
          <QuizTimer elapsedTime={elapsedTime} />
        ) : null}
      </View>
    </View>
  );
}
