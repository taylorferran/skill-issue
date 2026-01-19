/**
 * Design System Theme
 * Central location for all design tokens including colors, typography, spacing, and more.
 * Updated to match professional HTML blueprint designs.
 */
export const Theme = {
  // ============= COLORS =============
  colors: {
    // Primary Colors (standardized #1e3648 from HTML blueprints)
    primary: {
      main: '#1e3648',
      light: 'rgba(30, 54, 72, 0.1)',
      medium: 'rgba(30, 54, 72, 0.2)',
      border: 'rgba(30, 54, 72, 0.3)',
      borderMedium: 'rgba(30, 54, 72, 0.4)',
    },
    
    // Background Colors (iOS-style everywhere)
    background: {
      primary: '#f5f5f7',        // iOS background from HTML
      secondary: '#ffffff',      // Card backgrounds
      tertiary: '#fbfbfd',       // Quiz-style background
      quaternary: 'rgba(255, 255, 255, 0.5)',
      dark: '#141414',           // Dark mode
    },
    
    // Text Colors (from HTML blueprints)
    text: {
      primary: '#1d1d1f',        // Main text (quiz HTML)
      secondary: '#6c777f',      // Footer text (sign-in HTML)
      tertiary: '#262626',       // Description text
      quaternary: '#9ca3af',     // Light secondary text
      inverse: '#ffffff',
    },
    
    // Gray Scale (inferred from HTML designs)
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',            // Light borders
      200: '#e5e7eb',            // Medium borders  
      300: '#d1d5db',            // Border light from quiz HTML
      400: '#9ca3af',            // Text secondary
      500: '#6b7280',            // Text tertiary
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',            // Dark elements
      900: '#111827',            // Dark cards
    },
    
    // Card Styling (from skills HTML)
    card: {
      background: '#ffffff',
      border: '#e5e5e5',
      shadow: 'rgba(0, 0, 0, 0.03)',
      borderSecondary: 'rgba(0, 0, 0, 0.1)',
    },
    
    // Success Colors
    success: {
      main: '#10b981',           // Green-500
      light: 'rgba(16, 185, 129, 0.1)',
      medium: 'rgba(16, 185, 129, 0.2)',
    },
    
    // Error Colors
    error: {
      main: '#ef4444',           // Red-500
      light: 'rgba(239, 68, 68, 0.1)',
      medium: 'rgba(239, 68, 68, 0.2)',
    },
    
    // Warning Colors
    warning: {
      main: '#f59e0b',           // Amber-500
      light: 'rgba(245, 158, 11, 0.1)',
      medium: 'rgba(245, 158, 11, 0.2)',
    },
    
    // Legacy Colors (for compatibility)
    accent: {
      teal: '#22c3c3',
      tealDark: '#18a4a4',
      tealLight: 'rgba(107, 199, 184, 0.2)',
      orange: '#ED7733',
      orangeLight: 'rgba(237, 119, 51, 0.1)',
    },
    
    // Surface Colors
    surface: {
      light: '#f9fafb',
      medium: '#f3f4f6',
      dark: '#1f2937',
    },
    
    // Skill Icon Colors (for visual differentiation)
    skillIcons: {
      rust: '#ce422b',           // Rust orange
      javascript: '#f7df1e',     // JavaScript yellow
      typescript: '#3178c6',     // TypeScript blue
      python: '#3776ab',         // Python blue
      design: '#3b82f6',         // Blue
      management: '#10b981',     // Green
      analytics: '#8b5cf6',      // Purple
      default: '#1e3648',        // Primary fallback
    },
    
    // Shadow Colors
    shadow: {
      default: '#000000',
      light: 'rgba(0, 0, 0, 0.03)',
      medium: 'rgba(0, 0, 0, 0.1)',
      primary: '#1e3648',
    },
    
    // Legacy Colors (for backward compatibility)
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
  // Updated to medium scale (standardized from HTML blueprints)
  borderRadius: {
    sm: 4,              // 0.25rem
    md: 8,              // 0.5rem
    lg: 12,             // 0.75rem  
    xl: 16,             // 1rem
    '2xl': 20,          // 1.25rem
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
    // Updated card shadow to match skills HTML: 0px 4px 12px rgba(0, 0, 0, 0.03)
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    // Skills card shadow (from HTML blueprint)
    skillCard: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 12,
      elevation: 2,
    },
    // Primary card (enhanced)
    primaryCard: {
      shadowColor: '#1e3648',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    // Subtle shadow for buttons and interactive elements
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 1,
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
