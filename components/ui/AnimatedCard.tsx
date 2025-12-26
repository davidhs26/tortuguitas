import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/Theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  color?: string;
  disabled?: boolean;
  haptic?: boolean;
}

export function AnimatedCard({
  children,
  style,
  onPress,
  variant = 'default',
  color,
  disabled = false,
  haptic = true,
}: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const elevation = interpolate(pressed.value, [0, 1], [4, 2]);

    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: interpolate(pressed.value, [0, 1], [0.1, 0.05]),
      elevation,
    };
  });

  const handlePressIn = () => {
    if (!onPress || disabled) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    pressed.value = withTiming(0, { duration: 150 });
  };

  const handlePress = () => {
    if (!onPress || disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const variantStyles = getVariantStyles(variant, color);

  const content = (
    <Animated.View
      style={[
        styles.card,
        variantStyles,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

function getVariantStyles(
  variant: AnimatedCardProps['variant'],
  color?: string
): ViewStyle {
  const baseStyles: ViewStyle = {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
  };

  switch (variant) {
    case 'elevated':
      return {
        ...baseStyles,
        ...Theme.shadows.lg,
      };
    case 'outlined':
      return {
        ...baseStyles,
        borderWidth: 1,
        borderColor: Theme.colors.border,
      };
    case 'filled':
      return {
        ...baseStyles,
        backgroundColor: color || Theme.colors.primaryBackground,
      };
    default:
      return {
        ...baseStyles,
        ...Theme.shadows.sm,
      };
  }
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.6,
  },
});
