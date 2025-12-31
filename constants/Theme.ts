// Premium Design System - Inspired by Airbnb, Uber, and modern apps
// This theme provides a comprehensive design language for a world-class app experience

export const Theme = {
  colors: {
    // Primary Brand - Modern blue with depth
    primary: '#FF385C', // Airbnb-inspired coral/red
    primaryLight: '#FF5A7A',
    primaryDark: '#E31C5F',
    primaryBackground: '#FFF5F7',
    primaryGradient: ['#FF385C', '#E31C5F'] as [string, string],

    // Secondary - Deep purple for accents
    secondary: '#6366F1',
    secondaryLight: '#818CF8',
    secondaryDark: '#4F46E5',
    secondaryBackground: '#EEF2FF',
    secondaryGradient: ['#6366F1', '#4F46E5'] as [string, string],

    // Accent - Vibrant teal
    accent: '#14B8A6',
    accentLight: '#2DD4BF',
    accentDark: '#0D9488',
    accentBackground: '#CCFBF1',
    accentGradient: ['#14B8A6', '#0D9488'] as [string, string],

    // Success - Fresh green
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    successBackground: '#D1FAE5',
    successGradient: ['#10B981', '#059669'] as [string, string],

    // Warning - Warm amber
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#D97706',
    warningBackground: '#FEF3C7',
    warningGradient: ['#F59E0B', '#D97706'] as [string, string],

    // Error/Danger - Bold red
    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',
    errorBackground: '#FEE2E2',
    errorGradient: ['#EF4444', '#DC2626'] as [string, string],

    // Neutrals - Refined gray scale
    white: '#FFFFFF',
    black: '#000000',
    background: '#FAFAFA',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#EBEBEB',
    surface: '#FFFFFF',
    surfaceSecondary: '#F9FAFB',
    surfaceElevated: '#FFFFFF',

    // Borders
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    borderFocus: '#FF385C',

    // Text - Accessible contrast
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textDisabled: '#D1D5DB',
    textInverse: '#FFFFFF',
    textLink: '#FF385C',

    // Sectors with premium gradients
    sectorDavid: '#3B82F6',
    sectorDavidGradient: ['#3B82F6', '#1D4ED8'] as [string, string],
    sectorMumi: '#10B981',
    sectorMumiGradient: ['#10B981', '#059669'] as [string, string],
    sectorTuni: '#F59E0B',
    sectorTuniGradient: ['#F59E0B', '#D97706'] as [string, string],
    sectorQuincho: '#8B5CF6',
    sectorQuinchoGradient: ['#8B5CF6', '#7C3AED'] as [string, string],
    sectorLibre: '#EC4899',
    sectorLibreGradient: ['#EC4899', '#DB2777'] as [string, string],

    // Overlay & Glass effects
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    overlayDark: 'rgba(0, 0, 0, 0.7)',
    glass: 'rgba(255, 255, 255, 0.8)',
    glassDark: 'rgba(0, 0, 0, 0.1)',

    // Special effects
    shimmer: '#F3F4F6',
    skeleton: '#E5E7EB',
    ripple: 'rgba(0, 0, 0, 0.1)',
  },

  // Spacing system with golden ratio influence
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
    massive: 64,
  },

  // Border radius - from subtle to bold
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    full: 9999,
    // Special radii for cards
    card: 16,
    cardLarge: 24,
    button: 12,
    input: 12,
    badge: 8,
    avatar: 9999,
  },

  // Typography - Premium font system
  typography: {
    // Font families
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },

    // Font sizes with line heights
    display: {
      fontSize: 48,
      lineHeight: 56,
      letterSpacing: -1,
    },
    h1: {
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: 0,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
    },
    tiny: {
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.3,
    },
    label: {
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.5,
    },
  },

  // Legacy fontSize for backward compatibility
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
  },

  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Premium shadow system
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 12,
    },
    xxl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.15,
      shadowRadius: 32,
      elevation: 16,
    },
    // Colored shadows
    primary: {
      shadowColor: '#FF385C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHover: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 8,
    },
    float: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    glow: {
      shadowColor: '#FF385C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 0,
    },
  },

  // Animation system - Smooth, delightful interactions
  animation: {
    // Durations
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,

    // Spring configurations
    spring: {
      gentle: { damping: 20, stiffness: 100 },
      default: { damping: 15, stiffness: 200 },
      bouncy: { damping: 10, stiffness: 300 },
      stiff: { damping: 20, stiffness: 400 },
      swift: { damping: 25, stiffness: 500 },
    },

    // Easing curves (for non-spring animations)
    easing: {
      default: [0.4, 0, 0.2, 1] as [number, number, number, number],
      easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
      easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
      easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
      bounce: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
    },

    // Scale values for press states
    scale: {
      pressed: 0.96,
      pressedSubtle: 0.98,
      hover: 1.02,
    },
  },

  // Layout constants
  layout: {
    screenPadding: 16,
    cardPadding: 16,
    headerHeight: 56,
    tabBarHeight: 80,
    bottomSheetRadius: 24,
    maxContentWidth: 500,
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: 375,
    md: 414,
    lg: 768,
    xl: 1024,
  },

  // Z-index layers
  zIndex: {
    base: 0,
    content: 10,
    header: 100,
    overlay: 200,
    modal: 300,
    toast: 400,
    tooltip: 500,
  },
};

// Gradient presets for easy use
export const Gradients = {
  primary: ['#FF385C', '#E31C5F'] as [string, string],
  secondary: ['#6366F1', '#4F46E5'] as [string, string],
  accent: ['#14B8A6', '#0D9488'] as [string, string],
  success: ['#10B981', '#059669'] as [string, string],
  warning: ['#F59E0B', '#D97706'] as [string, string],
  error: ['#EF4444', '#DC2626'] as [string, string],

  // Premium gradients
  sunset: ['#FF6B6B', '#FFC93C'] as [string, string],
  ocean: ['#667EEA', '#764BA2'] as [string, string],
  forest: ['#11998E', '#38EF7D'] as [string, string],
  night: ['#2C3E50', '#4CA1AF'] as [string, string],
  rose: ['#FF9A9E', '#FECFEF'] as [string, string],
  peach: ['#FFD89B', '#19547B'] as [string, string],
  cosmic: ['#FF00CC', '#333399'] as [string, string],

  // Subtle gradients
  softBlue: ['#E0E7FF', '#C7D2FE'] as [string, string],
  softGreen: ['#D1FAE5', '#A7F3D0'] as [string, string],
  softPink: ['#FCE7F3', '#FBCFE8'] as [string, string],
  softOrange: ['#FEF3C7', '#FDE68A'] as [string, string],

  // Glass effect gradients
  glass: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)'] as [string, string],
  glassDark: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.2)'] as [string, string],

  // Sector gradients
  sectorDavid: ['#3B82F6', '#1D4ED8'] as [string, string],
  sectorMumi: ['#10B981', '#059669'] as [string, string],
  sectorTuni: ['#F59E0B', '#D97706'] as [string, string],
  sectorQuincho: ['#8B5CF6', '#7C3AED'] as [string, string],
  sectorLibre: ['#EC4899', '#DB2777'] as [string, string],
};

// Sector configuration with all styling info
export const SectorConfig = {
  david: {
    name: 'Sector David',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
    icon: 'home' as const,
    lightBg: '#DBEAFE',
  },
  mumi: {
    name: 'Sector Mumi',
    color: '#10B981',
    gradient: ['#10B981', '#059669'] as [string, string],
    icon: 'home' as const,
    lightBg: '#D1FAE5',
  },
  tuni: {
    name: 'Sector Tuni',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'] as [string, string],
    icon: 'home' as const,
    lightBg: '#FEF3C7',
  },
  quincho: {
    name: 'Quincho',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'] as [string, string],
    icon: 'cutlery' as const,
    lightBg: '#EDE9FE',
  },
  libre: {
    name: 'Libre',
    color: '#EC4899',
    gradient: ['#EC4899', '#DB2777'] as [string, string],
    icon: 'users' as const,
    lightBg: '#FCE7F3',
  },
};

export type ThemeColors = typeof Theme.colors;
export type ThemeSpacing = typeof Theme.spacing;
export type ThemeTypography = typeof Theme.typography;
export type ThemeShadows = typeof Theme.shadows;
