import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroSectionProps {
  image?: string | ImageSourcePropType;
  title: string;
  subtitle?: string;
  gradient?: [string, string];
  height?: number;
  children?: ReactNode;
  overlayOpacity?: number;
}

export function HeroSection({
  image,
  title,
  subtitle,
  gradient = Theme.colors.primaryGradient,
  height = 280,
  children,
  overlayOpacity = 0.4,
}: HeroSectionProps) {
  const insets = useSafeAreaInsets();

  const imageSource = typeof image === 'string' ? { uri: image } : image;

  return (
    <View style={[styles.container, { height: height + insets.top }]}>
      {/* Background */}
      {image ? (
        <>
          <Image
            source={imageSource as ImageSourcePropType}
            style={styles.image}
            resizeMode="cover"
          />
          <View
            style={[
              styles.overlay,
              { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
            ]}
          />
        </>
      ) : (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      )}

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + Theme.spacing.xl }]}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </View>
  );
}

// Parallax Hero that responds to scroll
interface ParallaxHeroProps extends HeroSectionProps {
  scrollY: Animated.SharedValue<number>;
  parallaxFactor?: number;
}

export function ParallaxHero({
  image,
  title,
  subtitle,
  gradient = Theme.colors.primaryGradient,
  height = 320,
  children,
  overlayOpacity = 0.4,
  scrollY,
  parallaxFactor = 0.5,
}: ParallaxHeroProps) {
  const insets = useSafeAreaInsets();

  const imageSource = typeof image === 'string' ? { uri: image } : image;

  const containerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-height, 0, height],
      [-height * parallaxFactor, 0, height * parallaxFactor],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-height, 0],
      [1.5, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const opacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, height * 0.8],
      [1, 0],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  return (
    <View style={[styles.container, { height: height + insets.top }]}>
      <Animated.View style={[styles.imageWrapper, containerStyle]}>
        {image ? (
          <>
            <Image
              source={imageSource as ImageSourcePropType}
              style={styles.image}
              resizeMode="cover"
            />
            <View
              style={[
                styles.overlay,
                { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
              ]}
            />
          </>
        ) : (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        )}
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          { paddingTop: insets.top + Theme.spacing.xl },
          opacityStyle,
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </Animated.View>
    </View>
  );
}

// Mini hero for section headers
interface MiniHeroProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  gradient?: [string, string];
  action?: ReactNode;
}

export function MiniHero({
  icon,
  title,
  subtitle,
  gradient = Theme.colors.primaryGradient,
  action,
}: MiniHeroProps) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.miniContainer}
    >
      <View style={styles.miniContent}>
        {icon && <View style={styles.miniIcon}>{icon}</View>}
        <View style={styles.miniText}>
          <Text style={styles.miniTitle}>{title}</Text>
          {subtitle && <Text style={styles.miniSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {action}
    </LinearGradient>
  );
}

// Stats banner hero
interface StatItem {
  value: string | number;
  label: string;
}

interface StatsHeroProps {
  gradient?: [string, string];
  stats: StatItem[];
  title?: string;
}

export function StatsHero({
  gradient = Theme.colors.primaryGradient,
  stats,
  title,
}: StatsHeroProps) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statsContainer}
    >
      {title && <Text style={styles.statsTitle}>{title}</Text>}
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <React.Fragment key={index}>
            {index > 0 && <View style={styles.statsDivider} />}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  imageWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxl,
  },
  title: {
    fontSize: Theme.typography.h1.fontSize,
    lineHeight: Theme.typography.h1.lineHeight,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
    letterSpacing: Theme.typography.h1.letterSpacing,
  },
  subtitle: {
    fontSize: Theme.typography.body.fontSize,
    lineHeight: Theme.typography.body.lineHeight,
    color: 'rgba(255,255,255,0.9)',
    marginTop: Theme.spacing.sm,
  },

  // Mini hero
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  miniContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  miniText: {
    flex: 1,
  },
  miniTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
  },
  miniSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Theme.spacing.xxs,
  },

  // Stats hero
  statsContainer: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    marginHorizontal: Theme.spacing.lg,
  },
  statsTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Theme.spacing.xxs,
  },
  statsDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
