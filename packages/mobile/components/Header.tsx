import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { IconSymbol } from "./ui/icon-symbol";

export function CustomHeader() {
  const { user } = useUser();
  const router = useRouter();

  const backgroundColor = "rgba(252, 249, 243, 0.95)";
  const textColor = "#181310";
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
          <IconSymbol name="bolt" color="#fff" size={20} />
        </View>
        <Text style={[styles.title, { color: textColor }]}>Skill Issue</Text>
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
          <IconSymbol name="bell.badge" color={"black"} size={26} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: "#ff8b42",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
  },
  profileContainer: {
    padding: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 139, 66, 0.2)",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 139, 66, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
