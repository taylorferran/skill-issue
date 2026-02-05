import { StyleSheet } from "react-native";
import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.gray[100],
  },
  headerTitle: {
    ...createTextStyle("lg", "bold", "primary"),
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  stepContainer: {
    gap: Theme.spacing.lg,
  },
  inputGroup: {
    gap: Theme.spacing.sm,
  },
  label: {
    ...createTextStyle("sm", "bold", "primary"),
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Theme.colors.background.primary,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.gray[200],
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.regular,
    color: Theme.colors.text.primary,
    ...createTextStyle("base", "regular", "primary"),
  },
  textInputDisabled: {
    backgroundColor: Theme.colors.gray[50],
    color: Theme.colors.text.secondary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Theme.spacing.md,
  },
  characterCount: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.regular,
    color: Theme.colors.text.quaternary,
    textAlign: "right",
  },
  helperText: {
    ...createTextStyle("sm", "regular", "secondary"),
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.primary.main,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.subtle,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...createTextStyle("base", "bold", "inverse"),
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.gray[300],
  },
  secondaryButtonText: {
    ...createTextStyle("base", "bold", "primary"),
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Theme.spacing.md,
  },
  warningContainer: {
    backgroundColor: Theme.colors.warning.light,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.warning.medium,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  warningTitle: {
    ...createTextStyle("base", "bold", "primary"),
    color: Theme.colors.warning.main,
  },
  warningMessage: {
    ...createTextStyle("sm", "regular", "secondary"),
    lineHeight: 20,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.success.light,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.success.medium,
  },
  successMessage: {
    ...createTextStyle("sm", "regular", "primary"),
    flex: 1,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.error.light,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.error.medium,
  },
  errorText: {
    ...createTextStyle("sm", "regular", "primary"),
    flex: 1,
    color: Theme.colors.error.main,
    lineHeight: 20,
  },
});
