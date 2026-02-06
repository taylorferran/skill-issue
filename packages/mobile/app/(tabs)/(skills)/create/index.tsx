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
  fetchSkills,
  skillsKeys,
} from "@/api/routes";
import { useSkillsStore } from "@/stores/skillsStore";
import type { GenerateSkillDescriptionResponse } from "@learning-platform/shared";
import { styles } from "./index.styles";

export default function CreateSkillScreen() {
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [generatedData, setGeneratedData] =
    useState<GenerateSkillDescriptionResponse | null>(null);
  const [step, setStep] = useState<"input" | "review">("input");

  const queryClient = useQueryClient();
  const { setAvailableSkills } = useSkillsStore();

  // Mutations
  const generateDescriptionMutation = useMutation({
    mutationFn: (skillName: string) => generateSkillDescription(skillName),
  });

  const createSkillMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => createSkill(data),
    onSuccess: async () => {
      // Refresh available skills
      try {
        const updatedSkills = await queryClient.fetchQuery({
          queryKey: skillsKeys.lists(),
          queryFn: fetchSkills,
        });
        setAvailableSkills(updatedSkills);
      } catch (error) {
        console.error("Failed to refresh skills after creation:", error);
      }
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

    try {
      await createSkillMutation.mutateAsync({
        name: skillName.trim(),
        description: skillDescription.trim(),
      });

      Alert.alert("Success", "Skill created successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to create skill:", error);
      Alert.alert("Error", "Failed to create skill. Please try again.");
    }
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
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter skill description..."
                placeholderTextColor={Theme.colors.text.quaternary}
                value={skillDescription}
                onChangeText={setSkillDescription}
                multiline
                numberOfLines={4}
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
