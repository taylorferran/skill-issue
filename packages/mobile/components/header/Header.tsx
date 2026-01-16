
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { Theme } from "@/theme/Theme";
import { styles } from "./Header.styles";

export function CustomHeader({ navigation, route, options }: BottomTabHeaderProps) {
  const { user } = useUser();
  const router = useRouter();

  const backgroundColor = "rgba(252, 249, 243, 0.95)";
  const borderColor = "rgba(255, 139, 66, 0.1)";

  // Root routes that should not show a back button
  const rootRoutes = ["index", "skills/index", "profile"];
  const isRootRoute = rootRoutes.includes(route.name);
  const canGoBack = navigation.canGoBack() && !isRootRoute;

  // The user wants "Skills" for the skills root, but "Skill Issue" for others
  let displayTitle = "Skill Issue";
  if (route.name === "skills/index") {
    displayTitle = "Skills";
  } else if (!isRootRoute) {
    displayTitle = options.title ?? "Skill Issue";
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderBottomColor: borderColor },
      ]}
    >
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        {canGoBack && (
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <MaterialIcons
              name="arrow-back"
              size={Theme.iconSize.md}
              color={Theme.colors.primary.main}
            />
          </Pressable>
        )}
        <View style={styles.logoBox}>
          <MaterialIcons
            name="bolt"
            color={"white"}
            size={Theme.iconSize.md}
          />
        </View>
        <Text 
          style={[styles.title, { color: Theme.colors.text.primary }]}
          numberOfLines={1}
        >
          {displayTitle}
        </Text>
      </View>

      {/* Right Actions */}
      <View style={styles.actionsContainer}>
        {/* Notifications Button */}
        <Pressable
          style={({ pressed }) => [
            styles.notificationButton,
            {
              backgroundColor: pressed
                ? "rgba(255, 139, 66, 0.1)"
                : "transparent",
            },
          ]}
          onPress={() => {
            // Handle notifications
            console.log("Notifications pressed");
          }}
        >
          <MaterialIcons
            name="notifications"
            color={Theme.colors.primary.main}
            size={Theme.iconSize.lg}
          />
        </Pressable>
      </View>
    </View>
  );
}


