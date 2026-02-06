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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigationTitle } from "@/contexts/NavigationTitleContext";
import { SkillCard } from "@/components/skill-card/SkillCard";
import SkillsMetricsCard from "@/components/skills-metrics-card/SkillsMetricsCard";
import { navigateTo } from "@/navigation/navigation";
import { router, useLocalSearchParams } from "expo-router";
import { styles } from "./_index.styles";
import { spacing } from "@/theme/ThemeUtils";
import { Theme } from "@/theme/Theme";
import {
  fetchUserSkills,
  fetchSkills,
  deleteSkill,
  enrollSkill,
  skillsKeys,
} from "@/api/routes";
import { useUser } from "@/contexts/UserContext";
import type {
  GetUserSkillsResponse,
  GetSkillsResponse,
} from "@learning-platform/shared";
import {
  SkillSortDropdown,
  type SortOption,
} from "@/components/skill-sort-dropdown/SkillSortDropdown";
import { useNotificationStore } from "@/stores/notificationStore";
import { requestNotificationPermissions } from "@/utils/notifications";

export default function SkillSelectScreen() {
  // Read tab parameter from navigation
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  
  const [selectedSegment, setSelectedSegment] = useState<
    "Current Skills" | "New Skills"
  >(tab === "new" ? "New Skills" : "Current Skills");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSort, setCurrentSort] = useState<SortOption>("level");
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const queryClient = useQueryClient();

  // Get userId from UserContext
  const { userId, user, updateLocalUserData } = useUser();

  // Notification store
  const { 
    hasPromptedUser, 
    setHasPromptedUser, 
    setExpoPushToken,
    permissionStatus 
  } = useNotificationStore();

  // TanStack Query for user skills
  const {
    data: userSkills = [],
    isLoading: isLoadingUserSkills,
    error: userSkillsError,
  } = useQuery({
    queryKey: userId ? skillsKeys.user(userId) : ["user-skills", "no-user"],
    queryFn: () => (userId ? fetchUserSkills(userId) : Promise.resolve([])),
    enabled: !!userId,
  });

  // TanStack Query for available skills
  const {
    data: availableSkills = [],
    isLoading: isLoadingAvailableSkills,
    error: availableSkillsError,
    refetch: refetchAvailableSkills,
  } = useQuery({
    queryKey: skillsKeys.lists(),
    queryFn: fetchSkills,
  });

  // Background refetch when switching to "New Skills" tab
  useEffect(() => {
    if (selectedSegment === "New Skills") {
      console.log("[Skills] 🔄 Background refetch for available skills");
      refetchAvailableSkills();
    }
  }, [selectedSegment, refetchAvailableSkills]);

  // Mutations
  const deleteSkillMutation = useMutation({
    mutationFn: ({
      userId,
      skillId,
    }: {
      userId: string;
      skillId: string;
    }) => deleteSkill(userId, skillId),
    onSuccess: () => {
      // Invalidate user skills cache
      if (userId) {
        queryClient.invalidateQueries({ queryKey: skillsKeys.user(userId) });
      }
    },
  });

  const enrollSkillMutation = useMutation({
    mutationFn: ({
      userId,
      skillId,
      difficultyTarget,
    }: {
      userId: string;
      skillId: string;
      difficultyTarget: number;
    }) => enrollSkill(userId, { skillId, difficultyTarget }),
    onSuccess: () => {
      // Invalidate user skills cache
      if (userId) {
        queryClient.invalidateQueries({ queryKey: skillsKeys.user(userId) });
      }
    },
  });

  // Debug logging for skills data
  useEffect(() => {
    console.log("[Skills] 📊 Data update:", {
      userSkillsCount: userSkills.length,
      availableSkillsCount: availableSkills.length,
      isLoadingUserSkills,
      isLoadingAvailableSkills,
      hasUserError: !!userSkillsError,
      hasAvailableError: !!availableSkillsError,
      selectedSegment,
    });
  }, [
    userSkills,
    availableSkills,
    isLoadingUserSkills,
    isLoadingAvailableSkills,
    userSkillsError,
    availableSkillsError,
    selectedSegment,
  ]);

  // Reset navigation title when skills screen comes into focus
  const { setTitle } = useNavigationTitle();
  useEffect(() => {
    setTitle(null);
  }, [setTitle]);

  // Show notification prompt on first visit after sign-in
  useEffect(() => {
    // Only request if:
    // 1. User is authenticated (has userId)
    // 2. We haven't prompted the user yet
    // 3. Notifications are not already granted
    if (userId && !hasPromptedUser && permissionStatus !== 'granted') {
      // Small delay to let the screen load first
      const timer = setTimeout(async () => {
        console.log('[Skills] 🔔 Requesting notification permissions via native dialog');
        
        try {
          const { success, token } = await requestNotificationPermissions();
          
          if (success && token) {
            // Save token to notification store
            setExpoPushToken(token);
            console.log('[Skills] ✅ Push token saved to notification store');
            
            // Update user with deviceId (push token)
            if (user && updateLocalUserData) {
              await updateLocalUserData({ deviceId: token });
              console.log('[Skills] ✅ User updated with deviceId');
            }
          } else {
            console.log('[Skills] ⚠️ Notification permission denied or failed');
          }
        } catch (error) {
          console.error('[Skills] ❌ Error requesting notification permissions:', error);
        } finally {
          // Mark as prompted so we don't show again
          setHasPromptedUser(true);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [userId, hasPromptedUser, permissionStatus, setExpoPushToken, setHasPromptedUser, user, updateLocalUserData]);

  // Handle skill selection (navigate to assessment)
  const handleSkillSelect = (skill: GetUserSkillsResponse[number]) => {
    navigateTo("assessment", {
      skill: skill.skillName,
      skillId: skill.skillId,
      progress: skill.accuracy * 100, // Convert 0-1 to 0-100
      isNewSkill: false,
    });
  };

  // Handle add skill - optimistic update then fire-and-forget API call
  const handleAddSkill = (skill: GetSkillsResponse[number]) => {
    if (!userId) {
      Alert.alert("Error", "User not found. Please try signing in again.");
      return;
    }

    console.log("[Skills] ➕ Enrolling in skill:", skill.name);

    // Optimistically update cache immediately
    const newUserSkill = {
      skillId: skill.id,
      skillName: skill.name,
      skillDescription: skill.description,
      difficultyTarget: 0,
      attemptsTotal: 0,
      accuracy: 0,
      streak: 0,
      maxStreak: 0,
      needsCalibration: true,
      lastChallengedAt: null,
    };

    // Store previous state for rollback
    const previousSkills = queryClient.getQueryData<GetUserSkillsResponse>(
      userId ? skillsKeys.user(userId) : ["user-skills", "no-user"]
    );

    queryClient.setQueryData(
      userId ? skillsKeys.user(userId) : ["user-skills", "no-user"],
      (old: GetUserSkillsResponse | undefined) => [
        ...(old || []),
        newUserSkill,
      ]
    );

    // Switch to Current Skills tab immediately (snappy UX)
    setSelectedSegment("Current Skills");

    // Fire-and-forget API call - don't block UI
    enrollSkillMutation.mutate(
      {
        userId,
        skillId: skill.id,
        difficultyTarget: 0,
      },
      {
        onSuccess: () => {
          console.log("[Skills] ✅ Successfully enrolled in skill:", skill.name);
        },
        onError: (error) => {
          console.error("[Skills] ❌ Failed to enroll in skill:", error);
          // Rollback: restore previous skills state
          queryClient.setQueryData(
            userId ? skillsKeys.user(userId) : ["user-skills", "no-user"],
            previousSkills
          );
          // Silent error - skill is removed, user can try again
        },
      }
    );
  };

  // Handle delete skill
  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    if (!userId) {
      Alert.alert("Error", "User not found. Please try signing in again.");
      return;
    }

    Alert.alert("Delete Skill", `Are you sure you want to remove ${skillName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("[Skills] 🗑️ Deleting skill:", skillName);

            // Optimistically update cache immediately
            queryClient.setQueryData(
              userId ? skillsKeys.user(userId) : ["user-skills", "no-user"],
              (old: GetUserSkillsResponse | undefined) =>
                (old || []).filter(
                  (s: GetUserSkillsResponse[number]) => s.skillId !== skillId
                )
            );

            await deleteSkillMutation.mutateAsync({ userId, skillId });

            console.log("[Skills] ✅ Successfully deleted skill:", skillName);

            Alert.alert("Success", `${skillName} removed successfully`);
          } catch (error) {
            console.error("[Skills] ❌ Delete failed:", error);
            Alert.alert("Error", "Could not delete skill. Please try again.");
          }
        },
      },
    ]);
  };



  // Render grid item for new skills
  const renderNewSkillCard = (skill: GetSkillsResponse[number]) => {
    // Generate color based on skill name
    const skillColors = [
      "#eb8b47",
      "#ff6b9d",
      "#4a9eff",
      "#00d4aa",
      "#ffd93d",
      "#a78bfa",
    ];
    const iconColor =
      skillColors[skill.name.charCodeAt(0) % skillColors.length];

    return (
      <View key={skill.id} style={styles.newSkillCard}>
        <View>
          <View
            style={[
              styles.newSkillIconContainer,
              { backgroundColor: iconColor }, // Dynamic color
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
          return (
            new Date(b.lastChallengedAt).getTime() -
            new Date(a.lastChallengedAt).getTime()
          );
        });
      default:
        return skills;
    }
  }, [userSkills, currentSort]);

  const sortedSkills = getSortedSkills();

  // Get filtered skills for New Skills tab
  const getFilteredNewSkills = useCallback((): GetSkillsResponse => {
    return availableSkills.filter((skill) => {
      if (!skill.active) return false;
      const isEnrolled = userSkills.some(
        (userSkill: GetUserSkillsResponse[number]) =>
          userSkill.skillId === skill.id
      );
      if (isEnrolled) return false;
      if (searchQuery.trim() === "") return true;
      const query = searchQuery.toLowerCase().trim();
      return (
        skill.name.toLowerCase().includes(query) ||
        skill.description?.toLowerCase().includes(query)
      );
    });
  }, [availableSkills, userSkills, searchQuery]);

  // Handle FlatList end reached
  const handleEndReached = useCallback(() => {
    const filteredSkills = getFilteredNewSkills();

    if (displayCount < filteredSkills.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayCount((prev) =>
          Math.min(prev + 10, filteredSkills.length)
        );
        setIsLoadingMore(false);
      }, 300);
    }
  }, [displayCount, getFilteredNewSkills, isLoadingMore]);

  // Reset pagination when search query changes or tab changes
  useEffect(() => {
    setDisplayCount(10);
  }, [searchQuery, selectedSegment]);

  // Memoized filtered skills for New Skills tab to prevent recalculation on every render
  const filteredSkills = useMemo(
    () => getFilteredNewSkills(),
    [getFilteredNewSkills]
  );
  const paginatedSkills = useMemo(
    () => filteredSkills.slice(0, displayCount),
    [filteredSkills, displayCount]
  );

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
    Component.displayName = "SkillsListHeader";
    return Component;
  }, []);

  // Memoized ListEmptyComponent to prevent recreation on every render
  const ListEmptyComponent = useMemo(() => {
    const Component = () => {
      if (availableSkillsError) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Failed to load available skills
            </Text>
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
    Component.displayName = "SkillsListEmpty";
    return Component;
  }, [availableSkillsError]);

  // Memoized ListFooterComponent to prevent recreation on every render
  const ListFooterComponent = useMemo(() => {
    const Component = () => {
      if (isLoadingMore) {
        return (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator
              size="small"
              color={Theme.colors.primary.main}
            />
            <Text style={styles.loadingMoreText}>
              Loading more skills...
            </Text>
          </View>
        );
      }
      if (
        paginatedSkills.length > 0 &&
        displayCount >= filteredSkills.length &&
        filteredSkills.length > 10
      ) {
        return (
          <View style={styles.endOfListContainer}>
            <Text style={styles.endOfListText}>No more skills to show</Text>
          </View>
        );
      }
      return null;
    };
    Component.displayName = "SkillsListFooter";
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
                selectedSegment === "New Skills" && styles.segmentButtonActive,
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
              {userSkillsError ? (
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
                        icon: "code-outline" as keyof typeof Ionicons.glyphMap,
                        category: skill.skillDescription,
                        progress: difficultyProgress,
                        level: skill.difficultyTarget,
                        isPrimary: false,
                        subtopics: skill.attemptsTotal,
                        aiPowered: true,
                        needsCalibration: skill.needsCalibration,
                      }}
                      onSelect={() => handleSkillSelect(skill)}
                      onDelete={() =>
                        handleDeleteSkill(skill.skillId, skill.skillName)
                      }
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
