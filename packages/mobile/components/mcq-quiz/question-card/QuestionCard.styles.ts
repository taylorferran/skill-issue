
import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Question Card (iOS-style design)
  questionCard: {
    marginBottom: Theme.spacing['2xl'],
  },
  
  // Question Header (hidden in this design)
  questionHeader: {
    marginBottom: Theme.spacing.lg,
  },
  
  // Question Text (large, prominent)
  questionText: {
    fontSize: 24, // Large for iOS style
    fontWeight: '700',
    color: Theme.colors.text.primary,
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: Theme.spacing['2xl'] + Theme.spacing.lg,
  },
  
  // Answers Container
  answersContainer: {
    gap: Theme.spacing.lg,
  },

  answerOptionSelected: {
  backgroundColor: Theme.colors.primary.light,
  borderColor: Theme.colors.primary.main,
  borderWidth: Theme.borderWidth.medium,
},
  // Answer Option (card-style)
  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: Theme.colors.gray[200],
    padding: Theme.spacing.xl,
    minHeight: 64,
    ...Theme.shadows.subtle,
  },
  
    // Correct Answer Option
  answerOptionCorrect: {
    borderWidth: 2,
    borderColor: Theme.colors.primary.main,
    ...Theme.shadows.skillCard,
  },
  
  // Incorrect Answer Option
  answerOptionIncorrect: {
    backgroundColor: Theme.colors.background.secondary,
    borderColor: Theme.colors.gray[200],
  },
  
  // Answer Text
  answerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    flex: 1,
    marginRight: Theme.spacing.lg,
  },
  
  // Answer Text States
  answerTextCorrect: {
    color: Theme.colors.text.primary,
    fontWeight: '700',
  },
  answerTextIncorrect: {
    color: Theme.colors.text.primary,
  },
  
  // Radio Button Container
  radioContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  
  // Selected Radio Button
  radioSelected: {
    backgroundColor: Theme.colors.primary.main,
    borderColor: Theme.colors.primary.main,
  },
  
  // Radio Button Inner Circle
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.text.inverse,
  },
});
