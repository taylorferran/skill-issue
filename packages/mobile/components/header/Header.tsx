
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Theme } from "@/theme/Theme";
import { styles } from "./Header.styles";

export function CustomHeader() {
  const { user } = useUser();
  const router = useRouter();

  const backgroundColor = "rgba(252, 249, 243, 0.95)";
  const borderColor = "rgba(255, 139, 66, 0.1)";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderBottomColor: borderColor },
      ]}
    >
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <MaterialIcons
            name="bolt"
            color={"white"}
            size={Theme.iconSize.md}
          />
        </View>
        <Text style={[styles.title, { color: Theme.colors.text.primary }]}>
          Skill Issue
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


