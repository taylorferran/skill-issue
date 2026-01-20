import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Circular Timer Container
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Circular Timer Design
  circularTimer: {
    width: 48,
    height: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // SVG Container
  svgContainer: {
    position: 'absolute',
  },
  
  // Time Text Container
  timeTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Time Text
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  timeTextWarning: {
    color: '#F59E0B',
  },
  timeTextTimeUp: {
    color: Theme.colors.primary.main,
  },
});
