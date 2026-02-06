import { StyleSheet } from "react-native";
import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";

export const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.primary.light,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    gap: 4,
  },
  triggerText: {
    ...createTextStyle("sm", "bold", "primary"),
    color: Theme.colors.primary.main,
    letterSpacing: 0.3,
  },
  triggerIcon: {
    marginLeft: 2,
  },
  triggerIconOpen: {
    marginLeft: 2,
    transform: [{ rotate: "180deg" }],
  },

  // Modal / Dropdown
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 220, // Position below the section header
    paddingRight: Theme.spacing["2xl"],
  },
  dropdownContainer: {
    position: "absolute",
    top: 220,
    right: Theme.spacing["2xl"],
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.gray[200],
    ...Theme.shadows.card,
    minWidth: 200,
    overflow: "hidden",
  },

  // Options
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.gray[100],
  },
  optionActive: {
    backgroundColor: Theme.colors.primary.light,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  optionText: {
    ...createTextStyle("sm", "medium", "secondary"),
  },
  optionTextActive: {
    color: Theme.colors.primary.main,
    fontWeight: "700",
  },
});
