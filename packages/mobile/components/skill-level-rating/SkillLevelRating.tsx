import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Slider from "@react-native-community/slider";
import { MaterialIcons } from "@expo/vector-icons";
import { Theme } from "@/theme/Theme";
import { styles } from "./SkillLevelRating.styles";

type SkillLevelRatingProps = {
  skillName: string;
  onRatingSubmit: (rating: number) => void;
  isSubmitting?: boolean; // NEW - show loading state
};

const SkillLevelRating: React.FC<SkillLevelRatingProps> = ({
  skillName,
  onRatingSubmit,
  isSubmitting = false, // NEW
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(5);

  const handleConfirm = () => {
    if (!isSubmitting) {
      onRatingSubmit(selectedLevel);
    }
  };

  return (
    <View style={styles.ratingCardWrapper}>
      <View style={styles.ratingCard}>
        {/* Decorative Background Element */}
        <View style={styles.decorativeBlob} />

        <View style={styles.ratingContent}>
          {/* Header Section */}
          <View>
            <View style={styles.ratingHeader}>
              <MaterialIcons
                name="assessment"
                size={20}
                color={Theme.colors.primary.main}
              />
              <Text style={styles.ratingTitle}>Set Your Skill Level</Text>
            </View>

            <Text style={styles.ratingDescription}>
              Rate your confidence in {skillName} from 1 (beginner) to 10
              (expert)
            </Text>
          </View>

          {/* Slider Section */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderRow}>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderEndLabel}>1</Text>
                  <Text style={styles.sliderEndLabel}>10</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={selectedLevel}
                  onValueChange={setSelectedLevel}
                  minimumTrackTintColor={Theme.colors.primary.main}
                  maximumTrackTintColor={Theme.colors.primary.border}
                  thumbTintColor={Theme.colors.primary.main}
                />
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isSubmitting && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirm}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Theme.colors.text.inverse} />
                ) : (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={Theme.colors.text.inverse}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Current Value Display */}
            <Text style={styles.currentValue}>Current: {selectedLevel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SkillLevelRating;
