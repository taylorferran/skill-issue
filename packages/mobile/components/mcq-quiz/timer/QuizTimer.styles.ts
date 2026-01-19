import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Timer Container
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Linear Progress Bar Container
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Theme.colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  
  // Progress Fill
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Time Text
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  timeTextWarning: {
    color: '#F59E0B',
  },
  timeTextTimeUp: {
    color: Theme.colors.primary.main,
  },
});
