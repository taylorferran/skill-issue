import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { use } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { SettingItem } from "./components/SettingItem";
import { AuthContext } from "@/contexts/AuthContext";
import { router } from "expo-router";

export default function ProfileScreen() {

  const { user: clerkUser} = useUser();
  const {signOut} = useAuth();
  // Navigation handlers - implement with your router
  const handleNotifications = () => {
    console.log("Navigate to notifications");
    // Example: router.push('/notifications');
  };

  const handleAccountDetails = () => {
    console.log("Navigate to account details");
    // Example: router.push('/account-details');
  };

  const handlePrivacy = () => {
    console.log("Navigate to privacy");
    // Example: router.push('/privacy');
  };

  const handleHelp = () => {
    console.log("Navigate to help");
    // Example: Linking.openURL('https://yourapp.com/help');
  };


  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: clerkUser?.imageUrl || "https://via.placeholder.com/128",
            }}
            style={styles.avatar}
          />
          <View style={styles.verifiedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Theme.colors.background.secondary}
            />
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {clerkUser?.fullName || "Undefined"}
          </Text>
          <View style={styles.badgesContainer}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO MEMBER</Text>
            </View>
            <Text style={styles.levelText}>Level 12 Developer</Text>
          </View>
        </View>
      </View>

      {/* AI Stats Widget */}
      <View style={styles.aiStatsCard}>
        <View style={styles.aiStatsLeft}>
          <View style={styles.aiIconContainer}>
            <Ionicons
              name="bulb"
              size={Theme.iconSize.md}
              color={Theme.colors.primary.main}
            />
          </View>
          <View>
            <Text style={styles.aiStatsLabel}>AI VERIFIED SKILL</Text>
            <Text style={styles.aiStatsTitle}>Python Architecture</Text>
          </View>
        </View>
        <View style={styles.aiStatsRight}>
          <Text style={styles.aiStatsPercentage}>Top 2%</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: "85%" }]} />
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="notifications-outline"
            title="Notification Settings"
            subtitle="Manage alerts and news"
            onPress={handleNotifications}
            testID="setting-notifications"
          />
          <SettingItem
            icon="person-outline"
            title="Account Details"
            subtitle="Personal info and password"
            onPress={handleAccountDetails}
            testID="setting-account"
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy & Visibility"
            subtitle="Control who sees your badges"
            onPress={handlePrivacy}
            testID="setting-privacy"
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="help-circle-outline"
            title="Help & Documentation"
            onPress={handleHelp}
            variant="support"
            isExternalLink
            testID="setting-help"
          />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButtonContainer}
        onPress={handleLogout}
        activeOpacity={0.9}
        testID="logout-button"
      >
        <LinearGradient
          colors={["#eb8b47", "#ffae70"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoutButton}
        >
          <Ionicons
            name="log-out-outline"
            size={Theme.iconSize.md}
            color={Theme.colors.text.inverse}
          />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>Skill Issue v2.4.0-stable</Text>
        <View style={styles.footerIcons}>
          <Ionicons
            name="language-outline"
            size={Theme.iconSize.sm}
            color={Theme.colors.text.secondary}
          />
          <Ionicons
            name="share-outline"
            size={Theme.iconSize.sm}
            color={Theme.colors.text.secondary}
          />
          <Ionicons
            name="terminal-outline"
            size={Theme.iconSize.sm}
            color={Theme.colors.text.secondary}
          />
        </View>
      </View>

      {/* Bottom padding for safe area */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  contentContainer: {
    paddingHorizontal: Theme.spacing["2xl"],
    paddingBottom: Theme.spacing["4xl"],
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingTop: Theme.spacing["2xl"],
    paddingBottom: Theme.spacing["3xl"],
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: Theme.colors.background.secondary,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Theme.colors.primary.main,
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: Theme.colors.background.primary,
  },
  profileInfo: {
    alignItems: "center",
    marginTop: Theme.spacing.lg,
  },
  profileName: {
    ...createTextStyle("2xl", "bold", "primary"),
    textAlign: "center",
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  proBadge: {
    backgroundColor: Theme.colors.primary.medium,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.xl,
  },
  proBadgeText: {
    ...createTextStyle("xs", "bold", "primary"),
    color: Theme.colors.primary.main,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },
  levelText: {
    ...createTextStyle("sm", "medium", "secondary"),
  },

  // AI Stats Card
  aiStatsCard: {
    backgroundColor: Theme.colors.background.tertiary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing["3xl"],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: Theme.borderWidth.thin,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  aiStatsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
    flex: 1,
  },
  aiIconContainer: {
    backgroundColor: Theme.colors.primary.border,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
  },
  aiStatsLabel: {
    ...createTextStyle("xs", "bold", "secondary"),
    letterSpacing: Theme.typography.letterSpacing.wide * 1.5,
  },
  aiStatsTitle: {
    ...createTextStyle("sm", "bold", "primary"),
    marginTop: Theme.spacing.xs / 2,
  },
  aiStatsRight: {
    alignItems: "flex-end",
  },
  aiStatsPercentage: {
    ...createTextStyle("xs", "bold", "primary"),
    color: Theme.colors.primary.main,
  },
  progressBarContainer: {
    width: 64,
    height: 6,
    backgroundColor: Theme.colors.settings.progressBarBg,
    borderRadius: Theme.borderRadius.xl,
    marginTop: Theme.spacing.xs,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.xl,
  },

  // Sections
  section: {
    marginBottom: Theme.spacing["4xl"],
  },
  sectionTitle: {
    ...createTextStyle("sm", "bold", "primary"),
    letterSpacing: Theme.typography.letterSpacing.wide * 1.5,
    paddingHorizontal: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  settingsGroup: {
    gap: Theme.spacing.md,
  },

  // Logout Button
  logoutButtonContainer: {
    marginTop: Theme.spacing["2xl"],
    marginBottom: Theme.spacing["4xl"],
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing["2xl"],
    borderRadius: Theme.borderRadius.xl,
    gap: Theme.spacing.sm,
    shadowColor: Theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  logoutButtonText: {
    ...createTextStyle("lg", "bold", "inverse"),
    fontSize: 18,
  },

  // Footer
  footer: {
    alignItems: "center",
    gap: Theme.spacing.lg,
  },
  versionText: {
    ...createTextStyle("xs", "medium", "secondary"),
    letterSpacing: Theme.typography.letterSpacing.wide * 1.5,
  },
  footerIcons: {
    flexDirection: "row",
    gap: Theme.spacing.lg,
  },
  bottomPadding: {
    height: Theme.spacing["4xl"],
  },
});
