// Theme constants for consistent styling across the app
export const Theme = {
  colors: {
    // Primary
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    primaryBackground: '#EFF6FF',

    // Secondary
    secondary: '#6366F1',
    secondaryLight: '#818CF8',
    secondaryDark: '#4F46E5',

    // Success
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',
    successBackground: '#D1FAE5',

    // Warning
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#D97706',
    warningBackground: '#FEF3C7',

    // Error/Danger
    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',
    errorBackground: '#FEE2E2',

    // Neutrals
    white: '#FFFFFF',
    background: '#F9FAFB',
    backgroundSecondary: '#F3F4F6',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Text
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Sectors
    sectorDavid: '#3B82F6',
    sectorMumi: '#10B981',
    sectorTuni: '#F59E0B',
    sectorQuincho: '#8B5CF6',
    sectorLibre: '#EC4899',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};

export type ThemeColors = typeof Theme.colors;
export type ThemeSpacing = typeof Theme.spacing;
