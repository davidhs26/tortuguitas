import React, { ReactNode, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  SlideInDown,
  SlideInUp,
  ZoomIn,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/Theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// SCALE PRESS - Pressable with scale animation
// =============================================================================
interface ScalePressProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  activeScale?: number;
  haptic?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  disabled?: boolean;
  style?: ViewStyle;
}

export function ScalePress({
  children,
  onPress,
  onLongPress,
  activeScale = 0.96,
  haptic = true,
  hapticStyle = 'light',
  disabled = false,
  style,
}: ScalePressProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(activeScale, Theme.animation.spring.stiff);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Theme.animation.spring.default);
  };

  const handlePress = () => {
    if (haptic) {
      const impactStyle =
        hapticStyle === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : hapticStyle === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Heavy;
      Haptics.impactAsync(impactStyle);
    }
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

// =============================================================================
// FADE VIEW - Animated container with fade
// =============================================================================
type FadeDirection = 'up' | 'down' | 'left' | 'right' | 'none';

interface FadeViewProps {
  children: ReactNode;
  direction?: FadeDirection;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  onAnimationComplete?: () => void;
}

export function FadeView({
  children,
  direction = 'up',
  delay = 0,
  duration = 400,
  style,
  onAnimationComplete,
}: FadeViewProps) {
  const getEntering = () => {
    switch (direction) {
      case 'up':
        return FadeInUp.delay(delay).duration(duration).springify();
      case 'down':
        return FadeInDown.delay(delay).duration(duration).springify();
      case 'left':
        return FadeInLeft.delay(delay).duration(duration).springify();
      case 'right':
        return FadeInRight.delay(delay).duration(duration).springify();
      default:
        return FadeIn.delay(delay).duration(duration);
    }
  };

  return (
    <Animated.View
      entering={getEntering().withCallback((finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      })}
      layout={Layout.springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

// =============================================================================
// STAGGERED LIST - List with staggered animations
// =============================================================================
interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
  direction?: FadeDirection;
  style?: ViewStyle;
}

export function StaggeredList({
  children,
  staggerDelay = 50,
  direction = 'up',
  style,
}: StaggeredListProps) {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <FadeView
          key={index}
          direction={direction}
          delay={index * staggerDelay}
        >
          {child}
        </FadeView>
      ))}
    </View>
  );
}

// =============================================================================
// PULSE - Pulsing animation for attention
// =============================================================================
interface PulseProps {
  children: ReactNode;
  duration?: number;
  scale?: number;
  active?: boolean;
  style?: ViewStyle;
}

export function Pulse({
  children,
  duration = 1500,
  scale = 1.05,
  active = true,
  style,
}: PulseProps) {
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (active) {
      pulseValue.value = withSequence(
        withTiming(scale, { duration: duration / 2 }),
        withTiming(1, { duration: duration / 2 })
      );

      const interval = setInterval(() => {
        pulseValue.value = withSequence(
          withTiming(scale, { duration: duration / 2 }),
          withTiming(1, { duration: duration / 2 })
        );
      }, duration);

      return () => clearInterval(interval);
    } else {
      pulseValue.value = withTiming(1);
    }
  }, [active, duration, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// =============================================================================
// SHAKE - Shake animation for errors
// =============================================================================
interface ShakeProps {
  children: ReactNode;
  trigger?: boolean;
  intensity?: number;
  style?: ViewStyle;
}

export function Shake({
  children,
  trigger = false,
  intensity = 10,
  style,
}: ShakeProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateX.value = withSequence(
        withTiming(intensity, { duration: 50 }),
        withTiming(-intensity, { duration: 50 }),
        withTiming(intensity, { duration: 50 }),
        withTiming(-intensity, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// =============================================================================
// BOUNCE - Bounce animation
// =============================================================================
interface BounceProps {
  children: ReactNode;
  trigger?: boolean;
  height?: number;
  style?: ViewStyle;
}

export function Bounce({
  children,
  trigger = false,
  height = 20,
  style,
}: BounceProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateY.value = withSequence(
        withTiming(-height, { duration: 150 }),
        withSpring(0, Theme.animation.spring.bouncy)
      );
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// =============================================================================
// SLIDE IN PANEL - Sliding panel animation
// =============================================================================
interface SlideInPanelProps {
  children: ReactNode;
  visible: boolean;
  direction?: 'up' | 'down';
  duration?: number;
  style?: ViewStyle;
}

export function SlideInPanel({
  children,
  visible,
  direction = 'up',
  duration = 300,
  style,
}: SlideInPanelProps) {
  const translateY = useSharedValue(direction === 'up' ? 500 : -500);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : (direction === 'up' ? 500 : -500), {
      duration,
    });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && translateY.value === (direction === 'up' ? 500 : -500)) {
    return null;
  }

  return (
    <Animated.View style={[styles.slidePanel, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// =============================================================================
// ANIMATED COUNTER - Counting number animation
// =============================================================================
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: any;
}

export function AnimatedCounter({
  value,
  duration = 500,
  style,
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration }, (finished) => {
      if (finished) {
        runOnJS(setDisplayValue)(value);
      }
    });
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => {
    const newValue = Math.round(animatedValue.value);
    runOnJS(setDisplayValue)(newValue);
    return {};
  });

  return (
    <Animated.Text style={[style, animatedStyle]}>
      {displayValue}
    </Animated.Text>
  );
}

// =============================================================================
// PROGRESS BAR - Animated progress bar
// =============================================================================
interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color = Theme.colors.primary,
  backgroundColor = Theme.colors.border,
  height = 6,
  animated = true,
  style,
}: ProgressBarProps) {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = animated
      ? withSpring(Math.min(100, Math.max(0, progress)), Theme.animation.spring.default)
      : progress;
  }, [progress, animated]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  return (
    <View
      style={[
        styles.progressContainer,
        { height, backgroundColor, borderRadius: height / 2 },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor, borderRadius: height / 2 },
          { backgroundColor: color },
          progressStyle,
        ]}
      />
    </View>
  );
}

// =============================================================================
// FLOATING ACTION - Floating element with animation
// =============================================================================
interface FloatingActionProps {
  children: ReactNode;
  visible?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  style?: ViewStyle;
}

export function FloatingAction({
  children,
  visible = true,
  position = 'bottom-right',
  style,
}: FloatingActionProps) {
  const scale = useSharedValue(visible ? 1 : 0);
  const translateY = useSharedValue(visible ? 0 : 100);

  useEffect(() => {
    scale.value = withSpring(visible ? 1 : 0, Theme.animation.spring.bouncy);
    translateY.value = withSpring(visible ? 0 : 100, Theme.animation.spring.default);
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: scale.value,
  }));

  const positionStyle = {
    'bottom-right': { right: Theme.spacing.lg, bottom: Theme.spacing.xxl },
    'bottom-left': { left: Theme.spacing.lg, bottom: Theme.spacing.xxl },
    'bottom-center': { left: SCREEN_WIDTH / 2 - 28, bottom: Theme.spacing.xxl },
  }[position];

  return (
    <Animated.View
      style={[
        styles.floatingAction,
        positionStyle,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slidePanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xxl,
    borderTopRightRadius: Theme.borderRadius.xxl,
    ...Theme.shadows.xl,
  },
  progressContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  floatingAction: {
    position: 'absolute',
    ...Theme.shadows.xl,
  },
});
