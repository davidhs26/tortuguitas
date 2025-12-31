import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Theme, SectorConfig } from '@/constants/Theme';
import { Sector } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Theme.spacing.lg * 2;
const CARD_HEIGHT = 280;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ImageCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  sector?: Sector;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'error' | 'info';
  rating?: number;
  capacity?: number;
  price?: string;
  available?: boolean;
  onPress?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  style?: any;
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
];

export function ImageCard({
  title,
  subtitle,
  image,
  sector,
  badge,
  badgeVariant = 'info',
  rating,
  capacity,
  price,
  available = true,
  onPress,
  onFavorite,
  isFavorite = false,
  style,
}: ImageCardProps) {
  const scale = useSharedValue(1);
  const [imageError, setImageError] = useState(false);

  const sectorConfig = sector ? SectorConfig[sector] : null;
  const displayImage = imageError || !image
    ? PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)]
    : image;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, Theme.animation.spring.stiff);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Theme.animation.spring.default);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFavorite?.();
  };

  const getBadgeColors = () => {
    switch (badgeVariant) {
      case 'success':
        return { bg: Theme.colors.success, text: Theme.colors.white };
      case 'warning':
        return { bg: Theme.colors.warning, text: Theme.colors.white };
      case 'error':
        return { bg: Theme.colors.error, text: Theme.colors.white };
      default:
        return { bg: Theme.colors.primary, text: Theme.colors.white };
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.container, !available && styles.unavailable]}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: displayImage }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />

          {/* Top badges */}
          <View style={styles.topRow}>
            {sectorConfig && (
              <LinearGradient
                colors={sectorConfig.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sectorBadge}
              >
                <FontAwesome
                  name={sectorConfig.icon}
                  size={10}
                  color={Theme.colors.white}
                />
                <Text style={styles.sectorText}>{sectorConfig.name}</Text>
              </LinearGradient>
            )}

            {badge && (
              <View style={[styles.badge, { backgroundColor: getBadgeColors().bg }]}>
                <Text style={[styles.badgeText, { color: getBadgeColors().text }]}>
                  {badge}
                </Text>
              </View>
            )}

            <View style={styles.spacer} />

            {onFavorite && (
              <Pressable onPress={handleFavorite} style={styles.favoriteButton}>
                <FontAwesome
                  name={isFavorite ? 'heart' : 'heart-o'}
                  size={20}
                  color={isFavorite ? Theme.colors.primary : Theme.colors.white}
                />
              </Pressable>
            )}
          </View>

          {/* Bottom content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>

            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}

            <View style={styles.detailsRow}>
              {rating !== undefined && (
                <View style={styles.ratingContainer}>
                  <FontAwesome name="star" size={12} color={Theme.colors.warning} />
                  <Text style={styles.rating}>{rating.toFixed(1)}</Text>
                </View>
              )}

              {capacity !== undefined && (
                <View style={styles.capacityContainer}>
                  <FontAwesome name="users" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.capacity}>{capacity}</Text>
                </View>
              )}

              <View style={styles.spacer} />

              {price && (
                <Text style={styles.price}>{price}</Text>
              )}
            </View>
          </View>

          {/* Unavailable overlay */}
          {!available && (
            <View style={styles.unavailableOverlay}>
              <View style={styles.unavailableTag}>
                <FontAwesome name="lock" size={14} color={Theme.colors.white} />
                <Text style={styles.unavailableText}>No disponible</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

// Compact variant for lists
export function ImageCardCompact({
  title,
  subtitle,
  image,
  sector,
  capacity,
  available = true,
  onPress,
}: Omit<ImageCardProps, 'badge' | 'rating' | 'price' | 'onFavorite' | 'isFavorite'>) {
  const scale = useSharedValue(1);
  const [imageError, setImageError] = useState(false);
  const sectorConfig = sector ? SectorConfig[sector] : null;

  const displayImage = imageError || !image
    ? PLACEHOLDER_IMAGES[0]
    : image;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, Theme.animation.spring.stiff);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Theme.animation.spring.default);
  };

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      <View style={[styles.compactContainer, !available && styles.unavailable]}>
        <Image
          source={{ uri: displayImage }}
          style={styles.compactImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />

        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactTitle} numberOfLines={1}>{title}</Text>
            {sectorConfig && (
              <View style={[styles.compactSectorDot, { backgroundColor: sectorConfig.color }]} />
            )}
          </View>

          {subtitle && (
            <Text style={styles.compactSubtitle} numberOfLines={1}>{subtitle}</Text>
          )}

          <View style={styles.compactDetails}>
            {capacity !== undefined && (
              <View style={styles.compactCapacity}>
                <FontAwesome name="bed" size={11} color={Theme.colors.textSecondary} />
                <Text style={styles.compactCapacityText}>{capacity} camas</Text>
              </View>
            )}

            <View style={styles.compactStatus}>
              <View style={[
                styles.compactStatusDot,
                { backgroundColor: available ? Theme.colors.success : Theme.colors.error }
              ]} />
              <Text style={[
                styles.compactStatusText,
                { color: available ? Theme.colors.success : Theme.colors.error }
              ]}>
                {available ? 'Disponible' : 'Ocupada'}
              </Text>
            </View>
          </View>
        </View>

        <FontAwesome
          name="chevron-right"
          size={14}
          color={Theme.colors.textTertiary}
          style={styles.compactArrow}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.borderRadius.cardLarge,
    overflow: 'hidden',
    ...Theme.shadows.lg,
  },
  unavailable: {
    opacity: 0.85,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Theme.colors.skeleton,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  sectorText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
  },
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  badgeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
  },
  spacer: {
    flex: 1,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Theme.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  rating: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  capacity: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  price: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
  },
  unavailableText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.sm,
    ...Theme.shadows.sm,
  },
  compactImage: {
    width: 80,
    height: 80,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.skeleton,
  },
  compactContent: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  compactTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    flex: 1,
  },
  compactSectorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xxs,
  },
  compactDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  compactCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  compactCapacityText: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
  },
  compactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  compactStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactStatusText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
  },
  compactArrow: {
    marginLeft: Theme.spacing.sm,
  },
});
