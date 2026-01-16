import { Theme } from "@/theme/Theme";
import { Language } from "@/types/Language";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text } from "react-native";
import { styles } from "./LanguageCard.styles";


interface LanguageCardProps {
  language: Language;
  onSelect: (language: Language) => void;
}

export function LanguageCard({ language, onSelect }: LanguageCardProps) {
  return (
    <View style={[styles.card, language.isPrimary && styles.cardPrimary]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.badgeContainer}>
            <View style={styles.badgeSubtopics}>
              <Text style={styles.badgeText}>
                {language.subtopics} SUBTOPICS
              </Text>
            </View>
            {language.aiPowered && (
              <View style={styles.badgeAI}>
                <Ionicons
                  name="sparkles"
                  size={Theme.iconSize.xs}
                  color={Theme.colors.primary.main}
                />
                <Text style={styles.badgeAIText}>AI POWERED</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle}>{language.name}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons
            name={language.icon}
            size={Theme.iconSize.xl / 3}
            color={Theme.colors.primary.main}
          />
        </View>
      </View>

      {/* Description */}
      <Text style={styles.cardDescription}>{language.description}</Text>

      {/* Button */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          language.isPrimary
            ? styles.selectButtonPrimary
            : styles.selectButtonSecondary,
        ]}
        onPress={() => onSelect(language)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.selectButtonText,
            language.isPrimary && styles.selectButtonTextPrimary,
          ]}
        >
          Select Track
        </Text>
        <Ionicons
          name="chevron-forward"
          size={Theme.iconSize.sm}
          color={
            language.isPrimary
              ? Theme.colors.text.inverse
              : Theme.colors.text.primary
          }
        />
      </TouchableOpacity>
    </View>
  );
}
