import { Theme } from "@/theme/Theme";
import { flex } from "@/theme/ThemeUtils";
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { styles } from "./TopicCard.styles";

interface SubtopicCardProps {
  title: string;
  grade: number;
  maxGrade: number;
  iconName: string;
  backgroundColor: string;
  isLarge?: boolean;
  onPress: () => void;
}

// Icon component placeholder - replace with your actual icon component
const Icon = ({ name, size = 24, color = Theme.colors.text.primary }: { 
  name: string; 
  size?: number; 
  color?: string;
}) => (
  <View style={{ width: size, height: size }} />
);



export const SubtopicCard: React.FC<SubtopicCardProps> = ({
  title,
  grade,
  maxGrade,
  iconName,
  backgroundColor,
  isLarge = false,
  onPress,
}) => {
if (isLarge) {
  return (
    <View style={[styles.cardLarge, Theme.shadows.card]}>
      <View style={flex.rowCenter}>
        <View style={[styles.iconContainerLarge, { backgroundColor }]}>
          <Icon name={iconName} size={32} color={Theme.colors.text.primary} />
        </View>
        <View style={{ marginLeft: Theme.spacing.lg, flex: 1 }}>
          <Text style={styles.cardTitleLarge}>{title}</Text>
          <Text style={styles.cardGrade}>
            Grade: {grade}/{maxGrade}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.assessButtonLarge, {marginTop: Theme.spacing.lg}]} onPress={onPress}>
        <Text style={styles.assessButtonText}>ASSESS</Text>
      </TouchableOpacity>
    </View>
  );
}

  return (
    <View style={[styles.card, Theme.shadows.card]}>
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor }]}>
          <Icon name={iconName} size={20} color={Theme.colors.text.primary} />
        </View>
        <View style={{ marginTop: Theme.spacing.md }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardGradeSmall}>
            Grade: {grade}/{maxGrade}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.assessButton} onPress={onPress}>
        <Text style={styles.assessButtonTextSmall}>ASSESS</Text>
      </TouchableOpacity>
    </View>
  );
};


