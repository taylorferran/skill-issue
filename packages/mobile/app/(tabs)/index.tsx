
import React, { useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // or react-native-vector-icons
import { Theme } from "@/theme/Theme";
import { Language, languageMock } from "@/types/Language";
import { LanguageCard } from "@/components/language-card/LanguageCard";
import { navigateTo } from "@/navigation/navigation";
import { styles } from "./_index.styles";


export default function SkillSelectScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleLanguageSelect = (language: Language) => {
    navigateTo('questions', {
        skill: language.name,
        topic: "test"
    })
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={Theme.iconSize.lg}
            color={Theme.colors.primary.main}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages or frameworks..."
            placeholderTextColor={Theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Language Cards */}
      <View style={styles.cardsContainer}>
        {languageMock.map((language) => (
          <LanguageCard
            key={language.id}
            language={language}
            onSelect={handleLanguageSelect}
          />
        ))}
      </View>
    </ScrollView>
  );
}



