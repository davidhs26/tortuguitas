import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

interface Photo {
  id: string;
  uri: string;
  caption?: string;
}

interface RoomPhotoGalleryProps {
  photos: Photo[];
  roomName: string;
}

// Placeholder photos for demo (would come from Firebase Storage in production)
const PLACEHOLDER_PHOTOS: Record<string, Photo[]> = {
  default: [
    { id: '1', uri: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', caption: 'Vista general' },
    { id: '2', uri: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800', caption: 'Camas' },
    { id: '3', uri: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', caption: 'Baño' },
  ],
};

const PhotoThumbnail = memo(function PhotoThumbnail({
  photo,
  index,
  onPress,
}: {
  photo: Photo;
  index: number;
  onPress: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <Pressable
      style={styles.thumbnail}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      {loading && (
        <View style={styles.thumbnailLoader}>
          <ActivityIndicator color={Theme.colors.primary} size="small" />
        </View>
      )}
      {error ? (
        <View style={styles.thumbnailError}>
          <FontAwesome name="image" size={24} color={Theme.colors.textTertiary} />
        </View>
      ) : (
        <Image
          source={{ uri: photo.uri }}
          style={styles.thumbnailImage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
      {index === 0 && (
        <View style={styles.mainBadge}>
          <Text style={styles.mainBadgeText}>Principal</Text>
        </View>
      )}
    </Pressable>
  );
});

const FullscreenViewer = memo(function FullscreenViewer({
  visible,
  photos,
  initialIndex,
  onClose,
}: {
  visible: boolean;
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);

  const handleScroll = useCallback((event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.fullscreenContainer}
      >
        {/* Header */}
        <View style={styles.fullscreenHeader}>
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          >
            <FontAwesome name="times" size={24} color={Theme.colors.white} />
          </Pressable>
          <Text style={styles.fullscreenCounter}>
            {currentIndex + 1} / {photos.length}
          </Text>
          <View style={styles.closeButton} />
        </View>

        {/* Image carousel */}
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onScroll={handleScroll}
          renderItem={({ item }) => (
            <View style={styles.fullscreenImageContainer}>
              {loading && (
                <ActivityIndicator
                  color={Theme.colors.white}
                  size="large"
                  style={styles.fullscreenLoader}
                />
              )}
              <Image
                source={{ uri: item.uri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
              />
            </View>
          )}
          keyExtractor={item => item.id}
        />

        {/* Caption */}
        {photos[currentIndex]?.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionText}>{photos[currentIndex].caption}</Text>
          </View>
        )}

        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
});

function RoomPhotoGallery({ photos, roomName }: RoomPhotoGalleryProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use placeholder if no photos provided
  const displayPhotos = photos.length > 0 ? photos : PLACEHOLDER_PHOTOS.default;

  const openViewer = useCallback((index: number) => {
    setSelectedIndex(index);
    setViewerVisible(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerVisible(false);
  }, []);

  if (displayPhotos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="camera" size={32} color={Theme.colors.textTertiary} />
        <Text style={styles.emptyText}>Sin fotos disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fotos</Text>
        <Text style={styles.subtitle}>{displayPhotos.length} fotos</Text>
      </View>

      <View style={styles.grid}>
        {displayPhotos.slice(0, 4).map((photo, index) => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            index={index}
            onPress={() => openViewer(index)}
          />
        ))}
        {displayPhotos.length > 4 && (
          <Pressable
            style={styles.morePhotos}
            onPress={() => openViewer(4)}
          >
            <Text style={styles.morePhotosText}>
              +{displayPhotos.length - 4}
            </Text>
          </Pressable>
        )}
      </View>

      <FullscreenViewer
        visible={viewerVisible}
        photos={displayPhotos}
        initialIndex={selectedIndex}
        onClose={closeViewer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  thumbnail: {
    width: (width - Theme.spacing.md * 2 - Theme.spacing.lg * 2 - Theme.spacing.sm * 3) / 4,
    aspectRatio: 1,
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  thumbnailError: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: Theme.borderRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  mainBadgeText: {
    fontSize: 8,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.white,
    textAlign: 'center',
  },
  morePhotos: {
    width: (width - Theme.spacing.md * 2 - Theme.spacing.lg * 2 - Theme.spacing.sm * 3) / 4,
    aspectRatio: 1,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePhotosText: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.sm,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenCounter: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.white,
    fontWeight: Theme.fontWeight.medium,
  },
  fullscreenImageContainer: {
    width,
    height: height - 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenLoader: {
    position: 'absolute',
  },
  captionContainer: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
  },
  captionText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.white,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    paddingBottom: 50,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: Theme.colors.white,
    width: 24,
  },
});

export default memo(RoomPhotoGallery);
