import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SkillCard } from "@/components/skill-card/SkillCard";
import { StatsCard } from "@/components/stats-card/StatsCard";
import { navigateTo } from "@/navigation/navigation";
import { styles } from "./_index.styles";
import { spacing } from "@/theme/ThemeUtils";
import { Theme } from "@/theme/Theme";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { useGetSkills } from "@/api-routes/getSkills";
import { useDeleteSkill } from "@/api-routes/deleteSkill";
import { useSkillsStore } from "@/stores/skillsStore";
import { useUser } from "@/contexts/UserContext";
import type { 
  GetUserSkillsResponse,
  GetSkillsResponse 
} from "@learning-platform/shared";

export default function SkillSelectScreen() {
  const [selectedSegment, setSelectedSegment] = useState<
    "Current Skills" | "New Skills"
  >("Current Skills");

  // Get userId from UserContext
  const { userId } = useUser();
  
  // Zustand store for cached data
  const {
    userSkills,
    availableSkills,
    setUserSkills,
    setAvailableSkills,
    shouldRefetchUserSkills,
    shouldRefetchAvailableSkills,
  } = useSkillsStore();
  
  // API hooks
  const { 
    execute: fetchUserSkills, 
    isLoading: isLoadingUserSkills,
    error: userSkillsError 
  } = useGetUserSkills();
  
  const { 
    execute: fetchAvailableSkills, 
    isLoading: isLoadingAvailableSkills,
    error: availableSkillsError 
  } = useGetSkills();
  
  const { 
    execute: deleteSkillApi,
    isLoading: isDeleting 
  } = useDeleteSkill();
  
  // Fetch data on mount - ALWAYS fetch fresh data (no cache)
  useEffect(() => {
    loadSkills();
  }, [userId]);
  
  // Refetch skills whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSkills();
    }, [userId])
  );
  
  const loadSkills = async () => {
    if (!userId) {
      console.warn('[Skills] No userId available, skipping fetch');
      return;
    }
    
    try {
      // ALWAYS fetch fresh data from backend
      console.log('[Skills] 🔄 Fetching user skills from backend...');
      const userSkillsData = await fetchUserSkills({ userId });
      setUserSkills(userSkillsData);
      console.log('[Skills] ✅ User skills loaded:', userSkillsData.length);
      
      console.log('[Skills] 🔄 Fetching available skills from backend...');
      const availableSkillsData = await fetchAvailableSkills();
      setAvailableSkills(availableSkillsData);
      console.log('[Skills] ✅ Available skills loaded:', availableSkillsData.length);
      
    } catch (error) {
      console.error('[Skills] ❌ Error loading skills:', error);
      Alert.alert(
        'Loading Failed',
        'Could not load skills. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Handle skill selection (navigate to assessment)
  const handleSkillSelect = (skill: GetUserSkillsResponse[number]) => {
    navigateTo("assessment", {
      skill: skill.skillName,
      skillId: skill.skillId,
      progress: skill.accuracy * 100, // Convert 0-1 to 0-100
      isNewSkill: false,
    });
  };

  // Handle add skill (navigate to assessment for enrollment)
  const handleAddSkill = (skill: GetSkillsResponse[number]) => {
    // Navigate to assessment page where user will set their difficulty level
    navigateTo("assessment", {
      skill: skill.name,
      skillId: skill.id,
      progress: 0,
      isNewSkill: true, // Flag to indicate this is enrollment flow
    });
  };
  
  // Handle delete skill
  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please try signing in again.');
      return;
    }
    
    Alert.alert(
      'Delete Skill',
      `Are you sure you want to remove ${skillName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Skills] 🗑️ Deleting skill:', skillName);
              
              await deleteSkillApi({ userId, skillId });
              
              console.log('[Skills] ✅ Successfully deleted skill:', skillName);
              
              // Refetch user skills to update UI
              const updatedSkills = await fetchUserSkills({ userId });
              setUserSkills(updatedSkills);
              
              Alert.alert('Success', `${skillName} removed successfully`);
            } catch (error) {
              console.error('[Skills] ❌ Delete failed:', error);
              Alert.alert('Error', 'Could not delete skill. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Render grid item for new skills
  const renderNewSkillCard = (skill: GetSkillsResponse[number]) => {
    // Generate color based on skill name
    const skillColors = [
      '#eb8b47', '#ff6b9d', '#4a9eff', '#00d4aa', '#ffd93d', '#a78bfa'
    ];
    const iconColor = skillColors[
      skill.name.charCodeAt(0) % skillColors.length
    ];
    
    return (
      <View key={skill.id} style={styles.newSkillCard}>
        <View>
          <View 
            style={[
              styles.newSkillIconContainer,
              { backgroundColor: iconColor } // Dynamic color
            ]}
          >
            <Ionicons name="code-outline" size={28} color="#ffffff" />
          </View>
          <Text style={styles.newSkillName}>{skill.name}</Text>
          <Text style={styles.newSkillDescription} numberOfLines={3}>
            {skill.description}
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
  };

  const calculateTotalSkills = () => userSkills.length;

  const getActivePath = () => {
    // Just use the first skill as active, or "None" if no skills
    return userSkills.length > 0 ? userSkills[0].skillName.split(" ")[0] : "None";
  };
  
  const isLoading = isLoadingUserSkills || isLoadingAvailableSkills || isDeleting;

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
                {isLoadingUserSkills ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary.main} />
                    <Text style={styles.loadingText}>Loading your skills...</Text>
                  </View>
                ) : userSkillsError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load skills</Text>
                  </View>
                ) : userSkills.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      No skills enrolled yet. Add your first skill!
                    </Text>
                  </View>
                ) : (
                  userSkills.map((skill) => {
                    // Generate random color for visual distinction
                    const skillColors = [
                      '#eb8b47', '#ff6b9d', '#4a9eff', '#00d4aa', '#ffd93d', '#a78bfa'
                    ];
                    const randomColor = skillColors[
                      skill.skillName.charCodeAt(0) % skillColors.length
                    ];
                    
                    return (
                      <SkillCard
                        key={skill.skillId}
                        skill={{
                          id: skill.skillId,
                          name: skill.skillName,
                          icon: 'code-outline' as keyof typeof Ionicons.glyphMap,
                          category: skill.skillDescription,
                          progress: Math.round(skill.accuracy * 100),
                          level: skill.difficultyTarget,
                          isPrimary: false,
                          subtopics: skill.attemptsTotal,
                          aiPowered: true,
                        }}
                        onSelect={() => handleSkillSelect(skill)}
                        onDelete={() => handleDeleteSkill(skill.skillId, skill.skillName)}
                      />
                    );
                  })
                )}
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
                {isLoadingAvailableSkills ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary.main} />
                    <Text style={styles.loadingText}>Loading available skills...</Text>
                  </View>
                ) : availableSkillsError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load available skills</Text>
                  </View>
                ) : availableSkills.length > 0 ? (
                  availableSkills
                    .filter(skill => {
                      // 1. Skill must be active
                      if (!skill.active) return false;
                      
                      // 2. Skill must NOT be already enrolled by user
                      const isEnrolled = userSkills.some(
                        userSkill => userSkill.skillId === skill.id
                      );
                      
                      return !isEnrolled; // Show only if NOT enrolled
                    })
                    .map(renderNewSkillCard)
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
