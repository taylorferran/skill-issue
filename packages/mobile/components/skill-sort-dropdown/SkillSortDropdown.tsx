import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/theme/Theme";
import { styles } from "./SkillSortDropdown.styles";

export type SortOption = "level" | "a-z" | "z-a" | "date";

interface SortConfig {
  value: SortOption;
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SORT_OPTIONS: SortConfig[] = [
  { value: "level", label: "Level (High → Low)", shortLabel: "Level", icon: "trending-up-outline" },
  { value: "a-z", label: "Name (A → Z)", shortLabel: "A-Z", icon: "text-outline" },
  { value: "z-a", label: "Name (Z → A)", shortLabel: "Z-A", icon: "text-outline" },
  { value: "date", label: "Recently Practiced", shortLabel: "Recent", icon: "time-outline" },
];

interface SkillSortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function SkillSortDropdown({
  currentSort,
  onSortChange,
}: SkillSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  const currentConfig = SORT_OPTIONS.find((opt) => opt.value === currentSort);

  const openDropdown = useCallback(() => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const closeDropdown = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
    });
  }, [fadeAnim, slideAnim]);

  const handleSelect = useCallback(
    (option: SortConfig) => {
      onSortChange(option.value);
      closeDropdown();
    },
    [onSortChange, closeDropdown]
  );

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={openDropdown}
        activeOpacity={0.7}
      >
        <Ionicons
          name={currentConfig?.icon || "filter-outline"}
          size={14}
          color={Theme.colors.primary.main}
        />
        <Text style={styles.triggerText}>{currentConfig?.shortLabel}</Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={Theme.colors.primary.main}
          style={isOpen ? styles.triggerIconOpen : styles.triggerIcon}
        />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      {isOpen && (
        <Modal
          visible={isOpen}
          transparent={true}
          animationType="none"
          onRequestClose={closeDropdown}
        >
          <Pressable style={styles.backdrop} onPress={closeDropdown}>
            <Animated.View
              style={[
                styles.dropdownContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.dropdown}>
                {SORT_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      index !== SORT_OPTIONS.length - 1 && styles.optionBorder,
                      currentSort === option.value && styles.optionActive,
                    ]}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Ionicons
                        name={option.icon}
                        size={16}
                        color={
                          currentSort === option.value
                            ? Theme.colors.primary.main
                            : Theme.colors.text.secondary
                        }
                      />
                      <Text
                        style={[
                          styles.optionText,
                          currentSort === option.value &&
                            styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {currentSort === option.value && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={Theme.colors.primary.main}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
