import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
    pointerEvents: 'none',
  },
  text: {
    fontSize: 280,              // Large monogram text
    fontWeight: '900',          // Extra bold
    color: '#000000',
    letterSpacing: -10,         // Tight tracking
    lineHeight: 280,
    textAlign: 'center',
    userSelect: 'none',
  },
});