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
import { useGenerateSkillDescription } from "@/api-routes/generateSkillDescription";
import { useCreateSkill } from "@/api-routes/createSkill";
import { useGetSkills } from "@/api-routes/getSkills";
import { useSkillsStore } from "@/stores/skillsStore";
import type { GenerateSkillDescriptionResponse } from "@learning-platform/shared";
import { styles } from "./index.styles";

export default function CreateSkillScreen() {
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [generatedData, setGeneratedData] =
    useState<GenerateSkillDescriptionResponse | null>(null);
  const [step, setStep] = useState<"input" | "review">("input");

  const { setAvailableSkills } = useSkillsStore();
  const { execute: fetchAvailableSkills } = useGetSkills();

  const {
    execute: generateDescription,
    isLoading: isGenerating,
    error: generateError,
  } = useGenerateSkillDescription();

  const {
    execute: createSkill,
    isLoading: isCreating,
    error: createError,
  } = useCreateSkill();

  const handleGenerateDescription = useCallback(async () => {
    if (!skillName.trim()) {
      Alert.alert("Error", "Please enter a skill name");
      return;
    }

    try {
      const result = await generateDescription({ skillName: skillName.trim() });
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
  }, [skillName, generateDescription]);

  const handleCreateSkill = useCallback(async () => {
    if (!skillName.trim() || !skillDescription.trim()) {
      Alert.alert("Error", "Please provide both name and description");
      return;
    }

    try {
      await createSkill({
        name: skillName.trim(),
        description: skillDescription.trim(),
      });

      // Refresh available skills
      try {
        const updatedSkills = await fetchAvailableSkills();
        setAvailableSkills(updatedSkills);
      } catch (error) {
        console.error("Failed to refresh skills after creation:", error);
      }

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
  }, [
    skillName,
    skillDescription,
    createSkill,
    fetchAvailableSkills,
    setAvailableSkills,
  ]);

  const handleBack = useCallback(() => {
    setStep("input");
    setGeneratedData(null);
    setSkillDescription("");
  }, []);

  const isLoading = isGenerating || isCreating;

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
                (!skillName.trim() || isGenerating) &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={handleGenerateDescription}
              disabled={!skillName.trim() || isGenerating}
              activeOpacity={0.7}
            >
              {isGenerating ? (
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
                editable={!isCreating}
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
                disabled={isCreating}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!skillDescription.trim() || isCreating) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={handleCreateSkill}
                disabled={!skillDescription.trim() || isCreating}
                activeOpacity={0.7}
              >
                {isCreating ? (
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
        {(generateError || createError) && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={Theme.colors.error.main}
            />
            <Text style={styles.errorText}>
              {(generateError || createError)?.message || "An error occurred"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
