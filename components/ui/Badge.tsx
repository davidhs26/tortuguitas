import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Theme } from '@/constants/Theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'sector';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: string;
  icon?: React.ReactNode;
  animated?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'medium',
  color,
  icon,
  animated = false,
  style,
  textStyle,
}: BadgeProps) {
  const variantStyles = getVariantStyles(variant, color);
  const sizeStyles = getSizeStyles(size);

  const content = (
    <View style={[styles.badge, variantStyles.container, sizeStyles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
        {label}
      </Text>
    </View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
        {content}
      </Animated.View>
    );
  }

  return content;
}

// Dot badge for notifications
interface DotBadgeProps {
  count?: number;
  color?: string;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export function DotBadge({ count, color, size = 'small', style }: DotBadgeProps) {
  const dotSize = size === 'small' ? 8 : 12;
  const showCount = count !== undefined && count > 0;
  const displayCount = count && count > 99 ? '99+' : count;

  return (
    <View
      style={[
        styles.dot,
        {
          width: showCount ? 'auto' : dotSize,
          height: showCount ? 'auto' : dotSize,
          borderRadius: showCount ? Theme.borderRadius.full : dotSize / 2,
          backgroundColor: color || Theme.colors.error,
          minWidth: showCount ? 18 : dotSize,
          paddingHorizontal: showCount ? 4 : 0,
          paddingVertical: showCount ? 2 : 0,
        },
        style,
      ]}
    >
      {showCount && (
        <Text style={styles.dotText}>{displayCount}</Text>
      )}
    </View>
  );
}

// Status badge with pulsing animation
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export function StatusBadge({ status, size = 'small', style }: StatusBadgeProps) {
  const dotSize = size === 'small' ? 10 : 14;
  const statusColors = {
    online: Theme.colors.success,
    offline: Theme.colors.textTertiary,
    busy: Theme.colors.error,
    away: Theme.colors.warning,
  };

  return (
    <View
      style={[
        styles.statusBadge,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: statusColors[status],
        },
        style,
      ]}
    />
  );
}

function getVariantStyles(variant: BadgeVariant, customColor?: string) {
  if (customColor) {
    return {
      container: { backgroundColor: customColor + '20' },
      text: { color: customColor },
    };
  }

  const variants = {
    default: {
      container: { backgroundColor: Theme.colors.backgroundSecondary },
      text: { color: Theme.colors.text },
    },
    success: {
      container: { backgroundColor: Theme.colors.successBackground },
      text: { color: Theme.colors.successDark },
    },
    warning: {
      container: { backgroundColor: Theme.colors.warningBackground },
      text: { color: Theme.colors.warningDark },
    },
    error: {
      container: { backgroundColor: Theme.colors.errorBackground },
      text: { color: Theme.colors.errorDark },
    },
    info: {
      container: { backgroundColor: Theme.colors.primaryBackground },
      text: { color: Theme.colors.primaryDark },
    },
    sector: {
      container: { backgroundColor: Theme.colors.primaryBackground },
      text: { color: Theme.colors.primary },
    },
  };

  return variants[variant];
}

function getSizeStyles(size: BadgeSize) {
  const sizes = {
    small: {
      container: {
        paddingHorizontal: Theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: Theme.borderRadius.sm,
      },
      text: { fontSize: Theme.fontSize.xs },
    },
    medium: {
      container: {
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.xs,
        borderRadius: Theme.borderRadius.md,
      },
      text: { fontSize: Theme.fontSize.sm },
    },
    large: {
      container: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.sm,
        borderRadius: Theme.borderRadius.md,
      },
      text: { fontSize: Theme.fontSize.md },
    },
  };

  return sizes[size];
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: Theme.fontWeight.semibold,
  },
  iconContainer: {
    marginRight: Theme.spacing.xs,
  },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    color: Theme.colors.white,
    fontSize: 10,
    fontWeight: Theme.fontWeight.bold,
  },
  statusBadge: {
    borderWidth: 2,
    borderColor: Theme.colors.white,
  },
});
