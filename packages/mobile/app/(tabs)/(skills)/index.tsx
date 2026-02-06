import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  FlatList,
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
import SkillsMetricsCard from "@/components/skills-metrics-card/SkillsMetricsCard";
import { navigateTo } from "@/navigation/navigation";
import { router } from "expo-router";
import { styles } from "./_index.styles";
import { spacing } from "@/theme/ThemeUtils";
import { Theme } from "@/theme/Theme";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { useGetSkills } from "@/api-routes/getSkills";
import { useDeleteSkill } from "@/api-routes/deleteSkill";
import { useEnrollSkill } from "@/api-routes/enrollSkill";
import { useSkillsStore } from "@/stores/skillsStore";
import { useUser } from "@/contexts/UserContext";
import type {
  GetUserSkillsResponse,
  GetSkillsResponse
} from "@learning-platform/shared";
import { SkillSortDropdown, type SortOption } from "@/components/skill-sort-dropdown/SkillSortDropdown";

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
  const [currentSort, setCurrentSort] = useState<SortOption>("level");
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Track initial loading state (only show spinner on first load with no cache)
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Get userId from UserContext
  const { userId } = useUser();
  
  // Zustand store for cached data
  const {
    userSkills,
    availableSkills,
    setUserSkills,
    setAvailableSkills,
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

  const {
    execute: enrollSkillApi
  } = useEnrollSkill();
  
  // Initial load - always fetch fresh data while showing cached data
  useEffect(() => {
    if (!userId) {
      setIsInitialLoading(false);
      return;
    }
    
    const loadInitialData = async () => {
      const hasCachedData = userSkills.length > 0 || availableSkills.length > 0;
      
      if (!hasCachedData) {
        // No cached data - show loading spinner
        console.log('[Skills] ⏳ No cache available, showing loading...');
        setIsInitialLoading(true);
      } else {
        // Have cached data - show it immediately
        console.log('[Skills] ✅ Using cached data, fetching fresh in background...');
        setIsInitialLoading(false);
      }
      
      try {
        // Always fetch fresh data
        await refreshSkills();
      } catch (error) {
        console.error('[Skills] ❌ Initial load failed:', error);
        if (!hasCachedData) {
          // Only show error if we have no cached data to display
          Alert.alert(
            'Loading Failed',
            'Could not load skills. Please try again later.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadInitialData();
  }, [userId]);
  
  // Refresh when screen comes into focus (always fetch)
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      
      console.log('[Skills] 🔄 Focus refresh - fetching fresh data...');
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
    // Get cached data synchronously and pass as initialData to prevent flicker
    const store = useSkillsStore.getState();
    const initialData = {
      userSkills: store.getCacheData(`userSkills:${userId}`),
      pending: store.getCacheData(`assessment-${skill.skillId}-pending`),
      history: store.getCacheData(`assessment-${skill.skillId}-history`),
    };

    navigateTo("assessment", {
      skill: skill.skillName,
      skillId: skill.skillId,
      progress: skill.accuracy * 100, // Convert 0-1 to 0-100
      isNewSkill: false,
      initialData,
    });
  };

  // Handle add skill - enroll immediately then navigate to assessment
  const handleAddSkill = async (skill: GetSkillsResponse[number]) => {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please try signing in again.');
      return;
    }

    try {
      console.log('[Skills] ➕ Enrolling in skill:', skill.name);

      // Enroll user in the skill with default difficulty
      await enrollSkillApi({ userId, skillId: skill.id, difficultyTarget: 0 });

      console.log('[Skills] ✅ Successfully enrolled in skill:', skill.name);

      // Refresh user skills to show the new skill with calibration flag
      const updatedSkills = await fetchUserSkills({ userId });
      setUserSkills(updatedSkills);

      // Switch to Current Skills tab to show the newly added skill
      setSelectedSegment("Current Skills");
    } catch (error) {
      console.error('[Skills] ❌ Failed to enroll in skill:', error);
      Alert.alert('Error', 'Failed to add skill. Please try again.');
    }
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

  // Sorting logic for user skills
  const getSortedSkills = useCallback((): GetUserSkillsResponse => {
    const skills = [...userSkills];

    switch (currentSort) {
      case "level":
        return skills.sort((a, b) => b.difficultyTarget - a.difficultyTarget);
      case "a-z":
        return skills.sort((a, b) => a.skillName.localeCompare(b.skillName));
      case "z-a":
        return skills.sort((a, b) => b.skillName.localeCompare(a.skillName));
      case "date":
        // Sort by lastChallengedAt (most recent first), nulls at bottom
        return skills.sort((a, b) => {
          if (!a.lastChallengedAt && !b.lastChallengedAt) return 0;
          if (!a.lastChallengedAt) return 1;
          if (!b.lastChallengedAt) return -1;
          return new Date(b.lastChallengedAt).getTime() - new Date(a.lastChallengedAt).getTime();
        });
      default:
        return skills;
    }
  }, [userSkills, currentSort]);

  // Only show initial loading spinner if we have no cached data at all
  const showInitialLoading = isInitialLoading && userSkills.length === 0 && availableSkills.length === 0;

  const sortedSkills = getSortedSkills();

  // Get filtered skills for New Skills tab
  const getFilteredNewSkills = useCallback((): GetSkillsResponse => {
    return availableSkills.filter(skill => {
      if (!skill.active) return false;
      const isEnrolled = userSkills.some(userSkill => userSkill.skillId === skill.id);
      if (isEnrolled) return false;
      if (searchQuery.trim() === "") return true;
      const query = searchQuery.toLowerCase().trim();
      return skill.name.toLowerCase().includes(query) || 
             skill.description?.toLowerCase().includes(query);
    });
  }, [availableSkills, userSkills, searchQuery]);

  // Handle FlatList end reached
  const handleEndReached = useCallback(() => {
    const filteredSkills = getFilteredNewSkills();
    
    if (displayCount < filteredSkills.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + 10, filteredSkills.length));
        setIsLoadingMore(false);
      }, 300);
    }
  }, [displayCount, getFilteredNewSkills, isLoadingMore]);

  // Reset pagination when search query changes or tab changes
  useEffect(() => {
    setDisplayCount(10);
  }, [searchQuery, selectedSegment]);

  // Memoized filtered skills for New Skills tab to prevent recalculation on every render
  const filteredSkills = useMemo(() => getFilteredNewSkills(), [getFilteredNewSkills]);
  const paginatedSkills = useMemo(() => filteredSkills.slice(0, displayCount), [filteredSkills, displayCount]);

  // Memoized ListHeaderComponent - only contains static content
  const ListHeaderComponent = useMemo(() => {
    const Component = () => (
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
      </>
    );
    Component.displayName = 'SkillsListHeader';
    return Component;
  }, []);

  // Memoized ListEmptyComponent to prevent recreation on every render
  const ListEmptyComponent = useMemo(() => {
    const Component = () => {
      if (showInitialLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary.main} />
            <Text style={styles.loadingText}>Loading available skills...</Text>
          </View>
        );
      }
      if (availableSkillsError) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load available skills</Text>
          </View>
        );
      }
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            All skills have been added!
          </Text>
        </View>
      );
    };
    Component.displayName = 'SkillsListEmpty';
    return Component;
  }, [showInitialLoading, availableSkillsError]);

  // Memoized ListFooterComponent to prevent recreation on every render
  const ListFooterComponent = useMemo(() => {
    const Component = () => {
      if (isLoadingMore) {
        return (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color={Theme.colors.primary.main} />
            <Text style={styles.loadingMoreText}>Loading more skills...</Text>
          </View>
        );
      }
      if (paginatedSkills.length > 0 && displayCount >= filteredSkills.length && filteredSkills.length > 10) {
        return (
          <View style={styles.endOfListContainer}>
            <Text style={styles.endOfListText}>No more skills to show</Text>
          </View>
        );
      }
      return null;
    };
    Component.displayName = 'SkillsListFooter';
    return Component;
  }, [isLoadingMore, paginatedSkills.length, displayCount, filteredSkills.length]);

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

          {/* Tab Content - Conditional rendering based on selected tab */}
          {selectedSegment === "Current Skills" ? (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Expandable Metrics Card - Always visible */}
              <SkillsMetricsCard
                userSkills={userSkills}
                defaultExpanded={false}
              />

              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Professional Mastery</Text>
                <SkillSortDropdown
                  currentSort={currentSort}
                  onSortChange={setCurrentSort}
                />
              </View>

              {/* Skills Cards */}
              <View style={styles.cardsContainer}>
                {/* Only show loading spinner if we have NO cached data at all */}
                {showInitialLoading ? (
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
                  sortedSkills.map((skill) => {
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
                          needsCalibration: skill.needsCalibration,
                        }}
                        onSelect={() => handleSkillSelect(skill)}
                        onDelete={() => handleDeleteSkill(skill.skillId, skill.skillName)}
                      />
                    );
                  })
                )}
              </View>
            </ScrollView>
          ) : (
            /* New Skills View - Search + FlatList */
            <View style={styles.newSkillsContainer}>
              {/* Search Input - Outside FlatList to prevent focus loss */}
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

              <FlatList
                data={paginatedSkills}
                renderItem={({ item }) => renderNewSkillCard(item)}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.flatListColumnWrapper}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={false}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={ListEmptyComponent}
                ListFooterComponent={ListFooterComponent}
              />
            </View>
          )}


      </View>
    </SafeAreaView>
  );
}
