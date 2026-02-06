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
import { styles } from "./SelectDropdown.styles";

export interface SelectOption {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SelectDropdownProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  placeholder?: string;
}

export function SelectDropdown({
  options,
  value,
  onChange,
  icon,
  placeholder = "Select...",
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  const selectedOption = options.find((opt) => opt.value === value);

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
    (option: SelectOption) => {
      onChange(option.value);
      closeDropdown();
    },
    [onChange, closeDropdown]
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
          name={icon || selectedOption?.icon || "chevron-down-outline"}
          size={16}
          color={Theme.colors.primary.main}
        />
        <Text style={styles.triggerText}>
          {selectedOption?.label || placeholder}
        </Text>
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
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={String(option.value)}
                    style={[
                      styles.option,
                      index !== options.length - 1 && styles.optionBorder,
                      value === option.value && styles.optionActive,
                    ]}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      {option.icon && (
                        <Ionicons
                          name={option.icon}
                          size={16}
                          color={
                            value === option.value
                              ? Theme.colors.primary.main
                              : Theme.colors.text.secondary
                          }
                        />
                      )}
                      <Text
                        style={[
                          styles.optionText,
                          value === option.value && styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {value === option.value && (
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
