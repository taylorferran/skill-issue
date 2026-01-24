// components/mcq-quiz/star-rating/StarRating.styles.ts
import { StyleSheet } from "react-native";
import { Theme } from "@/theme/Theme";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
    alignItems: "center",
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.border,
  },
  title: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
    justifyContent: "center",
  },
  starButton: {
    padding: Theme.spacing.xs,
  },
  ratingText: {
    marginTop: Theme.spacing.sm,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    fontStyle: "italic",
  },
});
