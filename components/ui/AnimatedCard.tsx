import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle, Pressable, Image, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/Theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'glass' | 'gradient' | 'image';
  color?: string;
  gradient?: [string, string];
  image?: string;
  imageOverlay?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  activeScale?: number;
}

export function AnimatedCard({
  children,
  style,
  onPress,
  variant = 'default',
  color,
  gradient,
  image,
  imageOverlay = true,
  disabled = false,
  haptic = true,
  activeScale = 0.98,
}: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(pressed.value, [0, 1], [0.08, 0.04]);
    const elevation = interpolate(pressed.value, [0, 1], [4, 2]);

    return {
      transform: [{ scale: scale.value }],
      shadowOpacity,
      elevation,
    };
  });

  const handlePressIn = () => {
    if (!onPress || disabled) return;
    scale.value = withSpring(activeScale, Theme.animation.spring.stiff);
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Theme.animation.spring.default);
    pressed.value = withTiming(0, { duration: 150 });
  };

  const handlePress = () => {
    if (!onPress || disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const renderContent = () => {
    switch (variant) {
      case 'glass':
        return (
          <BlurView intensity={80} tint="light" style={[styles.card, styles.glassCard, style]}>
            {children}
          </BlurView>
        );

      case 'gradient':
        return (
          <LinearGradient
            colors={gradient || Theme.colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.gradientCard, style]}
          >
            {children}
          </LinearGradient>
        );

      case 'image':
        return (
          <View style={[styles.card, styles.imageCard, style]}>
            {image && (
              <Image
                source={{ uri: image }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}
            {imageOverlay && <View style={styles.imageOverlay} />}
            <View style={styles.imageContent}>{children}</View>
          </View>
        );

      default:
        return (
          <View
            style={[
              styles.card,
              getVariantStyles(variant, color),
              disabled && styles.disabled,
              style,
            ]}
          >
            {children}
          </View>
        );
    }
  };

  const content = (
    <Animated.View style={animatedStyle}>
      {renderContent()}
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
    borderRadius: Theme.borderRadius.cardLarge,
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
        ...Theme.shadows.xs,
      };
    case 'filled':
      return {
        ...baseStyles,
        backgroundColor: color || Theme.colors.primaryBackground,
      };
    default:
      return {
        ...baseStyles,
        ...Theme.shadows.card,
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
  glassCard: {
    borderRadius: Theme.borderRadius.cardLarge,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  gradientCard: {
    borderRadius: Theme.borderRadius.cardLarge,
    padding: Theme.spacing.lg,
  },
  imageCard: {
    borderRadius: Theme.borderRadius.cardLarge,
    overflow: 'hidden',
    minHeight: 200,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageContent: {
    flex: 1,
    padding: Theme.spacing.lg,
    justifyContent: 'flex-end',
  },
});
