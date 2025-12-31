import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  badge?: number;
}

interface AnimatedTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
  variant?: 'default' | 'floating' | 'glass';
  showLabels?: boolean;
  haptic?: boolean;
}

export function AnimatedTabBar({
  tabs,
  activeTab,
  onTabPress,
  variant = 'default',
  showLabels = true,
  haptic = true,
}: AnimatedTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = tabs.findIndex((t) => t.key === activeTab);
  const indicatorPosition = useSharedValue(activeIndex);

  useEffect(() => {
    indicatorPosition.value = withSpring(activeIndex, Theme.animation.spring.stiff);
  }, [activeIndex]);

  const tabWidth = (SCREEN_WIDTH - Theme.spacing.lg * 2) / tabs.length;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorPosition.value * tabWidth + tabWidth / 2 - 24 },
    ],
  }));

  const handlePress = (key: string) => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTabPress(key);
  };

  const renderContent = () => (
    <View style={styles.tabsContainer}>
      {/* Animated indicator */}
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      {/* Tabs */}
      {tabs.map((tab, index) => (
        <TabButton
          key={tab.key}
          tab={tab}
          isActive={tab.key === activeTab}
          onPress={() => handlePress(tab.key)}
          showLabel={showLabels}
          index={index}
          activeIndex={activeIndex}
        />
      ))}
    </View>
  );

  if (variant === 'floating') {
    return (
      <View style={[styles.floatingContainer, { bottom: insets.bottom + Theme.spacing.lg }]}>
        <View style={styles.floatingBar}>
          {renderContent()}
        </View>
      </View>
    );
  }

  if (variant === 'glass') {
    return (
      <BlurView intensity={80} tint="light" style={[styles.glassContainer, { paddingBottom: insets.bottom }]}>
        {renderContent()}
      </BlurView>
    );
  }

  return (
    <View style={[styles.defaultContainer, { paddingBottom: insets.bottom }]}>
      {renderContent()}
    </View>
  );
}

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  showLabel: boolean;
  index: number;
  activeIndex: number;
}

function TabButton({
  tab,
  isActive,
  onPress,
  showLabel,
  index,
  activeIndex,
}: TabButtonProps) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive]);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, Theme.animation.spring.stiff);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Theme.animation.spring.default);
  };

  const animatedIconStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, -4]);

    return {
      transform: [
        { scale: scale.value },
        { translateY },
      ],
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0.6, 1]);
    const translateY = interpolate(progress.value, [0, 1], [0, -2]);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const iconColor = isActive ? Theme.colors.primary : Theme.colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <FontAwesome name={tab.icon} size={22} color={iconColor} />
        {tab.badge !== undefined && tab.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </Animated.View>

      {showLabel && (
        <Animated.Text
          style={[
            styles.label,
            { color: iconColor },
            animatedLabelStyle,
          ]}
        >
          {tab.label}
        </Animated.Text>
      )}
    </Pressable>
  );
}

// Segment control variant
interface SegmentControlProps {
  segments: { key: string; label: string }[];
  activeSegment: string;
  onSegmentPress: (key: string) => void;
  style?: any;
}

export function SegmentControl({
  segments,
  activeSegment,
  onSegmentPress,
  style,
}: SegmentControlProps) {
  const activeIndex = segments.findIndex((s) => s.key === activeSegment);
  const indicatorPosition = useSharedValue(activeIndex);
  const segmentWidth = 100 / segments.length;

  useEffect(() => {
    indicatorPosition.value = withSpring(activeIndex, Theme.animation.spring.stiff);
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${indicatorPosition.value * segmentWidth}%`,
    width: `${segmentWidth}%`,
  }));

  return (
    <View style={[styles.segmentContainer, style]}>
      <Animated.View style={[styles.segmentIndicator, indicatorStyle]} />
      {segments.map((segment) => (
        <Pressable
          key={segment.key}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSegmentPress(segment.key);
          }}
          style={styles.segment}
        >
          <Text
            style={[
              styles.segmentLabel,
              segment.key === activeSegment && styles.segmentLabelActive,
            ]}
          >
            {segment.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  defaultContainer: {
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: Theme.spacing.sm,
  },
  floatingContainer: {
    position: 'absolute',
    left: Theme.spacing.lg,
    right: Theme.spacing.lg,
  },
  floatingBar: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xxl,
    ...Theme.shadows.xl,
    paddingVertical: Theme.spacing.sm,
  },
  glassContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: Theme.spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Theme.spacing.lg,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: -Theme.spacing.sm,
    width: 48,
    height: 3,
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  label: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
    marginTop: Theme.spacing.xs,
  },

  // Segment control
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xs,
    position: 'relative',
  },
  segmentIndicator: {
    position: 'absolute',
    top: Theme.spacing.xs,
    bottom: Theme.spacing.xs,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.sm,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  segmentLabel: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textSecondary,
  },
  segmentLabelActive: {
    color: Theme.colors.text,
    fontWeight: Theme.fontWeight.semibold,
  },
});
