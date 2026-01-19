import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Finish Button (iOS-style)
  finishButton: {
    width: '100%',
    height: 56,
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.xl,
    alignItems: "center",
    justifyContent: 'center',
    ...Theme.shadows.subtle,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text.inverse,
    letterSpacing: 0.16,
  },
});
