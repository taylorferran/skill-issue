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
  triggerCompact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.primary.light,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.sm,
    gap: 2,
  },
  triggerText: {
    ...createTextStyle("sm", "bold", "primary"),
    color: Theme.colors.primary.main,
    letterSpacing: 0.3,
  },
  triggerTextCompact: {
    ...createTextStyle("xs", "bold", "primary"),
    color: Theme.colors.primary.main,
    letterSpacing: 0.3,
  },
  triggerFullWidth: {
    width: "100%",
    justifyContent: "space-between",
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Theme.spacing["2xl"],
  },
  dropdownContainer: {
    width: "100%",
    maxWidth: 320,
  },
  dropdown: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.gray[200],
    ...Theme.shadows.card,
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
