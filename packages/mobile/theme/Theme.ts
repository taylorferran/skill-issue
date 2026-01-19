/**
 * Design System Theme
 * Central location for all design tokens including colors, typography, spacing, and more.
 */
export const Theme = {
  // ============= COLORS =============
  colors: {
    // Base Colors
    background: {
      primary: '#fcf9f3',
      secondary: '#fff',
      tertiary: 'rgba(255, 255, 255, 0.5)',
    },
    
    // Text Colors
    text: {
      primary: '#181310',
      secondary: '#8d705e',
      inverse: '#fff',
    },
    
    // Brand/Primary Colors
    primary: {
      main: '#ff8b42',
      light: 'rgba(255, 139, 66, 0.05)',
      medium: 'rgba(255, 139, 66, 0.1)',
      border: 'rgba(255, 139, 66, 0.2)',
      borderMedium: 'rgba(255, 139, 66, 0.3)',
    },
    
    // Success Colors
    success: {
      main: '#A0D9B1',
      light: 'rgba(160, 217, 177, 0.2)',
    },
    
    // Error/Warning Colors (Added for incorrect answers)
    error: {
      main: '#FF8B42',
      light: 'rgba(255, 139, 66, 0.1)',
      medium: 'rgba(255, 139, 66, 0.3)',
    },
    
    // Warning Colors (for timer warnings)
    warning: {
      main: '#F59E0B', // Amber-500
      light: 'rgba(245, 158, 11, 0.1)',
    },
    
    // Shadow Colors
    shadow: {
      default: '#000',
      primary: '#ff8b42',
    },
    
    // Accent Colors (for special UI elements)
    accent: {
      teal: '#22c3c3',
      tealDark: '#18a4a4',
      tealLight: 'rgba(107, 199, 184, 0.2)',
      orange: '#ED7733',
      orangeLight: 'rgba(237, 119, 51, 0.1)',
    },
    
    // Surface Colors (for cards, code blocks, etc.)
    surface: {
      light: '#F5F4F2',
      dark: '#242830',
    },
    
    // Pastel Colors (for category backgrounds)
    pastel: {
      peach: '#F7D4CC',
      yellow: '#F9F1C5',
      lavender: '#E5E5F2',
      mint: '#D1F2EB',
      grey: '#F0F0F0',
    },
    
    // Timeline/Progress Colors
    timeline: {
      trackInactive: 'rgba(0, 0, 0, 0.05)',
      borderInactive: 'rgba(0, 0, 0, 0.05)',
    },
    
    // Settings Screen Colors
    settings: {
      chevron: 'rgba(0, 0, 0, 0.2)',
      progressBarBg: 'rgba(0, 0, 0, 0.1)',
    },
  },
  
  // ============= TYPOGRAPHY =============
  typography: {
    // Font Sizes
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 18,
      xl: 24,
      '2xl': 28,
      '3xl': 30,
    },
    
    // Font Weights
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      bold: '700' as const,
    },
    
    // Line Heights
    lineHeight: {
      tight: 20,
      normal: 32,
      relaxed: 24,
    },
    
    // Letter Spacing
    letterSpacing: {
      wide: 1,
    },
  },
  
  // ============= SPACING =============
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
    '5xl': 128,
  },
  
  // ============= BORDER RADIUS =============
  borderRadius: {
    sm: 3,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // ============= ICON SIZES =============
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 100,
  },
  
  // ============= SHADOWS =============
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    primaryCard: {
      shadowColor: '#ff8b42',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
  },
  
  // ============= BORDER WIDTHS =============
  borderWidth: {
    thin: 1,
    medium: 2,
    thick: 3,
  },
  
  // ============= OPACITY =============
  opacity: {
    low: 0.4,
    medium: 0.5,
    high: 0.8,
  },
  
  // ============= COMPONENT SPECIFIC =============
  components: {
    card: {
      stackedScale: {
        back2: 0.88,
        back1: 0.94,
      },
      stackedTranslateY: {
        back2: 16,
        back1: 8,
      },
      stackedTop: {
        back2: 32,
        back1: 16,
        front: 0,
      },
    },
    progressBar: {
      height: 6,
      width: 96,
    },
    button: {
      height: 56,
    },
  },
} as const;

// ============= TYPE EXPORTS =============
export type ThemeColors = typeof Theme.colors;
export type ThemeTypography = typeof Theme.typography;
export type ThemeSpacing = typeof Theme.spacing;
