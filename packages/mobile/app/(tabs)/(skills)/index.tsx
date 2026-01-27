import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Skill, skillsMock, availableSkillsMock } from "@/types/Skill";
import { SkillCard } from "@/components/skill-card/SkillCard";
import { StatsCard } from "@/components/stats-card/StatsCard";
import { navigateTo } from "@/navigation/navigation";
import { styles } from "./_index.styles";
import { spacing } from "@/theme/ThemeUtils";
import { Theme } from "@/theme/Theme";
import { isNotificationsEnabled } from "@/utils/getPushToken";

export default function SkillSelectScreen() {
  const [selectedSegment, setSelectedSegment] = useState<
    "Current Skills" | "New Skills"
  >("Current Skills");

  // Current skills that user is learning
  const [currentSkills, setCurrentSkills] = useState<Skill[]>(skillsMock);

  console.log(isNotificationsEnabled());
  // Available skills to add
  const [availableSkills, setAvailableSkills] =
    useState<Skill[]>(availableSkillsMock);

  const handleSkillSelect = (skill: Skill) => {
    navigateTo("assessment", {
      skill: skill.name,
      progress: skill.progress,
    });
  };

  const handleAddSkill = (skill: Skill) => {
    // Add skill to current skills
    setCurrentSkills((prev) => [...prev, skill]);

    // Remove from available skills
    setAvailableSkills((prev) => prev.filter((s) => s.id !== skill.id));

    // Switch back to Current Skills tab
    setSelectedSegment("Current Skills");
  };

  // Render grid item for new skills
  const renderNewSkillCard = (skill: Skill) => (
    <View key={skill.id} style={styles.newSkillCard}>
      <View>
        <View style={[styles.newSkillIconContainer]}>
          <Ionicons name={skill.icon} size={28} color="#ffffff" />
        </View>
        <Text style={styles.newSkillName}>{skill.name}</Text>
        <Text style={styles.newSkillDescription} numberOfLines={3}>
          {skill.category}
        </Text>
      </View>

      {/* Add Skill Button */}
      <TouchableOpacity
        style={styles.addSkillButton}
        onPress={() => handleAddSkill(skill)}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={14} color={Theme.colors.text.inverse} />
        <Text style={styles.addSkillButtonText}>Add Skill</Text>
      </TouchableOpacity>
    </View>
  );

  const calculateTotalSkills = () => currentSkills.length;

  const getActivePath = () => {
    const primarySkill = currentSkills.find((skill) => skill.isPrimary);
    return primarySkill ? primarySkill.name.split(" ")[0] : "None";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
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
                  selectedSegment === "Current Skills" &&
                  styles.segmentButtonActive,
                ]}
                onPress={() => setSelectedSegment("Current Skills")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    selectedSegment === "Current Skills" &&
                    styles.segmentButtonTextActive,
                  ]}
                >
                  Current Skills
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  selectedSegment === "New Skills" &&
                  styles.segmentButtonActive,
                ]}
                onPress={() => setSelectedSegment("New Skills")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    selectedSegment === "New Skills" &&
                    styles.segmentButtonTextActive,
                  ]}
                >
                  New Skills
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Skills View */}
          {selectedSegment === "Current Skills" && (
            <>
              {/* Stats Cards Section */}
              <View style={styles.statsSection}>
                <View style={styles.statsContainer}>
                  <StatsCard
                    label="TOTAL SKILLS"
                    value={calculateTotalSkills()}
                  />
                  <StatsCard label="ACTIVE PATH" value={getActivePath()} />
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Professional Mastery</Text>
                <View style={styles.sortBadge}>
                  <Text style={styles.sortBadgeText}>SORT BY LEVEL</Text>
                </View>
              </View>

              {/* Skills Cards */}
              <View style={styles.cardsContainer}>
                {currentSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onSelect={handleSkillSelect}
                  />
                ))}
              </View>
            </>
          )}

          {/* New Skills View */}
          {selectedSegment === "New Skills" && (
            <>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Discover Skills</Text>
                <View style={styles.sortBadge}>
                  <Text style={styles.sortBadgeText}>RECOMMENDED</Text>
                </View>
              </View>

              {/* Skills Grid */}
              <View style={styles.newSkillsGrid}>
                {availableSkills.length > 0 ? (
                  availableSkills.map(renderNewSkillCard)
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      All skills have been added!
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
