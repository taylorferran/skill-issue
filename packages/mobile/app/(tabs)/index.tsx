
import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/theme/Theme";
import { Skill, skillsMock, calculateTotalSkills, getActivePath } from "@/types/Skill";
import { SkillCard } from "@/components/skill-card/SkillCard";
import { StatsCard } from "@/components/stats-card/StatsCard";
import { navigateTo } from "@/navigation/navigation";
import { styles } from "./_index.styles";


export default function SkillSelectScreen() {
  const handleSkillSelect = (skill: Skill) => {
    navigateTo('questions', {
        skill: skill.name,
    })
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Cards Section */}
          <View style={styles.statsSection}>
            <View style={styles.statsContainer}>
              <StatsCard 
                label="TOTAL SKILLS" 
                value={calculateTotalSkills()} 
              />
              <StatsCard 
                label="ACTIVE PATH" 
                value={getActivePath().split(' ')[0]} 
              />
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
            {skillsMock.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onSelect={handleSkillSelect}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}



