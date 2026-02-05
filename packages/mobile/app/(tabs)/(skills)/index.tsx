import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigationTitle } from "@/contexts/NavigationTitleContext";
import { SkillCard } from "@/components/skill-card/SkillCard";
import { StatsCard } from "@/components/stats-card/StatsCard";
import { navigateTo } from "@/navigation/navigation";
import { router } from "expo-router";
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

// Helper to check if two arrays are deeply equal
function isArrayEqual<T>(a: T[] | null | undefined, b: T[] | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function SkillSelectScreen() {
  const [selectedSegment, setSelectedSegment] = useState<
    "Current Skills" | "New Skills"
  >("Current Skills");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track initial load state
  const isFirstMount = useRef(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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
  
  // API hooks - clearDataOnCall: false for cache-first behavior
  const { 
    execute: fetchUserSkills, 
    error: userSkillsError 
  } = useGetUserSkills();
  
  const { 
    execute: fetchAvailableSkills, 
    error: availableSkillsError 
  } = useGetSkills();
  
  const { 
    execute: deleteSkillApi
  } = useDeleteSkill();
  
  // Initial load - use cached data immediately if available
  useEffect(() => {
    if (!userId) {
      setIsInitialLoading(false);
      return;
    }
    
    const loadInitialData = async () => {
      console.log('[Skills] 🔄 Initial load - checking cache...');
      
      // Check if we have cached data and if it's fresh
      const hasCachedUserSkills = userSkills.length > 0;
      const hasCachedAvailableSkills = availableSkills.length > 0;
      const needsRefetchUserSkills = shouldRefetchUserSkills();
      const needsRefetchAvailableSkills = shouldRefetchAvailableSkills();
      
      // If we have fresh cached data, don't show loading
      const hasFreshCache = hasCachedUserSkills && hasCachedAvailableSkills && 
                           !needsRefetchUserSkills && !needsRefetchAvailableSkills;
      
      if (hasFreshCache) {
        console.log('[Skills] ✅ Using cached data (fresh)');
        setIsInitialLoading(false);
        isFirstMount.current = false;
        
        // Still do a background refresh
        refreshSkillsInBackground();
        return;
      }
      
      // If we have stale cache, show it immediately but fetch in background
      if (hasCachedUserSkills || hasCachedAvailableSkills) {
        console.log('[Skills] ⏱️ Using cached data (stale), fetching fresh...');
        setIsInitialLoading(false);
        
        // Fetch fresh data in background
        try {
          await refreshSkills();
        } catch (error) {
          console.error('[Skills] ❌ Background refresh failed:', error);
        }
        
        isFirstMount.current = false;
        return;
      }
      
      // No cached data - show loading and fetch
      console.log('[Skills] ⏳ No cache available, fetching...');
      setIsInitialLoading(true);
      
      try {
        await refreshSkills();
      } catch (error) {
        console.error('[Skills] ❌ Initial load failed:', error);
        Alert.alert(
          'Loading Failed',
          'Could not load skills. Please try again later.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsInitialLoading(false);
        isFirstMount.current = false;
      }
    };
    
    loadInitialData();
  }, [userId]);
  
  // Background refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!userId || isFirstMount.current) return;
      
      console.log('[Skills] 🔄 Background refresh on focus...');
      refreshSkillsInBackground();
      
      // Clear search query when returning to this screen
      setSearchQuery("");
    }, [userId])
  );

  // Reset navigation title when skills screen comes into focus
  const { setTitle } = useNavigationTitle();
  useFocusEffect(
    useCallback(() => {
      setTitle(null);
    }, [setTitle])
  );
  
  const refreshSkills = async () => {
    if (!userId) return;
    
    console.log('[Skills] 🔄 Fetching fresh data from backend...');
    
    const [userSkillsResult, availableSkillsResult] = await Promise.all([
      fetchUserSkills({ userId }),
      fetchAvailableSkills()
    ]);
    
    // Only update store if data actually changed
    if (!isArrayEqual(userSkills, userSkillsResult)) {
      console.log('[Skills] ✅ User skills updated:', userSkillsResult.length);
      setUserSkills(userSkillsResult);
    } else {
      console.log('[Skills] ✅ User skills unchanged');
    }
    
    if (!isArrayEqual(availableSkills, availableSkillsResult)) {
      console.log('[Skills] ✅ Available skills updated:', availableSkillsResult.length);
      setAvailableSkills(availableSkillsResult);
    } else {
      console.log('[Skills] ✅ Available skills unchanged');
    }
  };
  
  const refreshSkillsInBackground = async () => {
    if (!userId) return;
    
    try {
      await refreshSkills();
    } catch (error) {
      console.error('[Skills] ❌ Background refresh failed:', error);
      // Don't show error on background refresh
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
  
  // Only show initial loading spinner if we have no cached data at all
  const showInitialLoading = isInitialLoading && userSkills.length === 0 && availableSkills.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Sticky Segmented Control - Outside ScrollView */}
        <View style={[spacing.containerPadding, styles.segmentedContainer]}>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  selectedSegment === "Current Skills" &&
                  styles.segmentButtonActive,
                ]}
                onPress={() => {
                  setSelectedSegment("Current Skills");
                  setSearchQuery("");
                }}
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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
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
                {/* Only show loading spinner if we have NO cached data at all */}
                {showInitialLoading && selectedSegment === "Current Skills" ? (
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
                    
                    // Calculate progress based on difficulty level (1-10 scale to 0-100%)
                    const difficultyProgress = skill.difficultyTarget 
                      ? Math.round((skill.difficultyTarget / 10) * 100)
                      : 0;
                    
                    return (
                      <SkillCard
                        key={skill.skillId}
                        skill={{
                          id: skill.skillId,
                          name: skill.skillName,
                          icon: 'code-outline' as keyof typeof Ionicons.glyphMap,
                          category: skill.skillDescription,
                          progress: difficultyProgress,
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
              {/* Create New Skill Button */}
              <TouchableOpacity
                style={styles.createSkillButton}
                onPress={() => router.push("/(tabs)/(skills)/create")}
                activeOpacity={0.7}
              >
                <View style={styles.createSkillIconContainer}>
                  <Ionicons name="add" size={20} color="#ffffff" />
                </View>
                <View style={styles.createSkillTextContainer}>
                  <Text style={styles.createSkillTitle}>Create New Skill</Text>
                  <Text style={styles.createSkillSubtitle}>
                    Can&apos;t find what you&apos;re looking for? Create your own
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Theme.colors.text.secondary}
                />
              </TouchableOpacity>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={Theme.colors.text.secondary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search skills..."
                    placeholderTextColor={Theme.colors.text.quaternary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => setSearchQuery("")}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={Theme.colors.text.quaternary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Skills Grid */}
              <View style={styles.newSkillsGrid}>
                {/* Only show loading spinner if we have NO cached data at all */}
                {showInitialLoading && selectedSegment === "New Skills" ? (
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

                      if (isEnrolled) return false;

                      // 3. Filter by search query
                      if (searchQuery.trim() === "") return true;

                      const query = searchQuery.toLowerCase().trim();
                      const nameMatch = skill.name.toLowerCase().includes(query);
                      const descriptionMatch = skill.description?.toLowerCase().includes(query);

                      return nameMatch || descriptionMatch;
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
