import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Animated, Text } from "react-native";
import { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { styles } from "./TabButton.styles";

type TabButtonProps = {
  isFocused: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
};

export function TabButton({ isFocused, icon, label, onPress, onLongPress }: TabButtonProps) {
  const scale = useSharedValue(1);
  const iconColor = isFocused ? Theme.colors.primary.main : Theme.colors.text.secondary;

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <MaterialIcons name={icon} size={Theme.iconSize.xl / 3.5} color={iconColor} />
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: isFocused ? Theme.colors.primary.main : Theme.colors.text.secondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


