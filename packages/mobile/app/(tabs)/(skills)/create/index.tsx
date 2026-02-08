import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Theme } from "@/theme/Theme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateSkillDescription,
  createSkill,
  skillsKeys,
} from "@/api/routes";
import type { GenerateSkillDescriptionResponse } from "@learning-platform/shared";
import { styles } from "./index.styles";

export default function CreateSkillScreen() {
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [descriptionHeight, setDescriptionHeight] = useState(100);
  const [generatedData, setGeneratedData] =
    useState<GenerateSkillDescriptionResponse | null>(null);
  const [step, setStep] = useState<"input" | "review">("input");

  const queryClient = useQueryClient();

  // Mutations
  const generateDescriptionMutation = useMutation({
    mutationFn: (skillName: string) => generateSkillDescription(skillName),
  });

  const createSkillMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => createSkill(data),
    
    // Optimistically add skill to cache before API call
    onMutate: async (data) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: skillsKeys.lists() });
      
      // Snapshot previous value for rollback
      const previousSkills = queryClient.getQueryData(skillsKeys.lists());
      
      // Generate optimistic skill with temp ID
      const optimisticSkill = {
        id: `temp-${Date.now()}`,
        name: data.name,
        description: data.description,
        active: true,
      };
      
      // Optimistically add to cache
      queryClient.setQueryData(
        skillsKeys.lists(),
        (old: any[]) => [optimisticSkill, ...(old || [])]
      );
      
      console.log("[CreateSkill] ✅ Optimistically added skill:", data.name);
      
      // Return context for potential rollback
      return { previousSkills, optimisticSkill };
    },
    
    // On success, replace optimistic skill with real data
    onSuccess: (response, variables, context) => {
      queryClient.setQueryData(
        skillsKeys.lists(),
        (old: any[]) => {
          if (!old) return [response];
          // Replace optimistic skill with real data
          return old.map((skill) =>
            skill.id === context?.optimisticSkill.id ? response : skill
          );
        }
      );
      console.log("[CreateSkill] ✅ Skill created successfully:", response.name);
    },
    
    // On error, rollback to previous state and show alert
    onError: (error, variables, context) => {
      if (context?.previousSkills) {
        queryClient.setQueryData(skillsKeys.lists(), context.previousSkills);
      }
      console.error("[CreateSkill] ❌ Failed to create skill, rolled back:", error);
      // Show error after brief delay (user may have navigated back)
      setTimeout(() => {
        Alert.alert(
          "Error",
          `Failed to create "${variables.name}". The skill has been removed. Please try again.`,
          [{ text: "OK" }]
        );
      }, 500);
    },
    
    // Always invalidate to ensure fresh data from server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: skillsKeys.lists() });
    },
  });

  const handleGenerateDescription = useCallback(async () => {
    if (!skillName.trim()) {
      Alert.alert("Error", "Please enter a skill name");
      return;
    }

    try {
      const result = await generateDescriptionMutation.mutateAsync(skillName.trim());
      setGeneratedData(result);
      setSkillDescription(result.description);
      setStep("review");
    } catch (error) {
      console.error("Failed to generate description:", error);
      Alert.alert(
        "Error",
        "Failed to generate skill description. Please try again."
      );
    }
  }, [skillName, generateDescriptionMutation]);

  const handleCreateSkill = useCallback(async () => {
    if (!skillName.trim() || !skillDescription.trim()) {
      Alert.alert("Error", "Please provide both name and description");
      return;
    }

    // Trigger mutation with optimistic update
    createSkillMutation.mutate({
      name: skillName.trim(),
      description: skillDescription.trim(),
    });

    // Navigate to skills list with New Skills tab selected
    router.replace({
      pathname: "/(tabs)/(skills)",
      params: { tab: "new" },
    });
  }, [skillName, skillDescription, createSkillMutation]);

  const handleBack = useCallback(() => {
    setStep("input");
    setGeneratedData(null);
    setSkillDescription("");
  }, []);

  const isLoading = generateDescriptionMutation.isPending || createSkillMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {step === "input" ? "Create New Skill" : "Review Skill"}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === "input" ? (
          /* Step 1: Input Skill Name */
          <View style={styles.stepContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Skill Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Python Programming"
                placeholderTextColor={Theme.colors.text.quaternary}
                value={skillName}
                onChangeText={setSkillName}
                maxLength={200}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleGenerateDescription}
                editable={!isLoading}
              />
              <Text style={styles.characterCount}>
                {skillName.length}/200
              </Text>
            </View>

            <Text style={styles.helperText}>
              Enter a specific skill name. Our AI will generate a description
              and check if the name is clear and well-defined.
            </Text>

            {/* Generate Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!skillName.trim() || generateDescriptionMutation.isPending) &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={handleGenerateDescription}
              disabled={!skillName.trim() || generateDescriptionMutation.isPending}
              activeOpacity={0.7}
            >
              {generateDescriptionMutation.isPending ? (
                <ActivityIndicator color={Theme.colors.text.inverse} />
              ) : (
                <>
                  <Ionicons
                    name="sparkles"
                    size={18}
                    color={Theme.colors.text.inverse}
                  />
                  <Text style={styles.primaryButtonText}>
                    Generate Description
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Step 2: Review Generated Description */
          <View style={styles.stepContainer}>
            {/* Vague Warning */}
            {generatedData?.isVague && (
              <View style={styles.warningContainer}>
                <View style={styles.warningHeader}>
                  <Ionicons
                    name="warning"
                    size={20}
                    color={Theme.colors.warning.main}
                  />
                  <Text style={styles.warningTitle}>Vague Skill Name</Text>
                </View>
                <Text style={styles.warningMessage}>
                  {generatedData.message}
                </Text>
              </View>
            )}

            {/* Success Message */}
            {!generatedData?.isVague && (
              <View style={styles.successContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Theme.colors.success.main}
                />
                <Text style={styles.successMessage}>
                  {generatedData?.message}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Skill Name</Text>
              <TextInput
                style={[styles.textInput, styles.textInputDisabled]}
                value={skillName}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { height: Math.max(100, descriptionHeight) }]}
                placeholder="Enter skill description..."
                placeholderTextColor={Theme.colors.text.quaternary}
                value={skillDescription}
                onChangeText={setSkillDescription}
                onContentSizeChange={(event) => {
                  setDescriptionHeight(event.nativeEvent.contentSize.height);
                }}
                multiline
                maxLength={2000}
                textAlignVertical="top"
                editable={!createSkillMutation.isPending}
              />
              <Text style={styles.characterCount}>
                {skillDescription.length}/2000
              </Text>
            </View>

            <Text style={styles.helperText}>
              You can edit the description above. Once created, this skill will
              be available for everyone to learn.
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBack}
                disabled={createSkillMutation.isPending}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!skillDescription.trim() || createSkillMutation.isPending) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={handleCreateSkill}
                disabled={!skillDescription.trim() || createSkillMutation.isPending}
                activeOpacity={0.7}
              >
                {createSkillMutation.isPending ? (
                  <ActivityIndicator color={Theme.colors.text.inverse} />
                ) : (
                  <>
                    <Ionicons
                      name="add"
                      size={18}
                      color={Theme.colors.text.inverse}
                    />
                    <Text style={styles.primaryButtonText}>Create Skill</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Error Display */}
        {(generateDescriptionMutation.error || createSkillMutation.error) && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={Theme.colors.error.main}
            />
            <Text style={styles.errorText}>
              {(generateDescriptionMutation.error || createSkillMutation.error)?.message || "An error occurred"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
