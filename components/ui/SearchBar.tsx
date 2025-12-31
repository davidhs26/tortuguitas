import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Keyboard,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/Theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  onFilterPress?: () => void;
  filterActive?: boolean;
  filterCount?: number;
  autoFocus?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
  style?: any;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  onFocus,
  onBlur,
  onClear,
  onFilterPress,
  filterActive = false,
  filterCount = 0,
  autoFocus = false,
  showCancel = false,
  onCancel,
  style,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusValue = useSharedValue(0);
  const scale = useSharedValue(1);

  const containerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusValue.value,
      [0, 1],
      [Theme.colors.border, Theme.colors.primary]
    );

    return {
      borderColor,
      transform: [{ scale: scale.value }],
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    focusValue.value = withTiming(1, { duration: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusValue.value = withTiming(0, { duration: 200 });
    onBlur?.();
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onChangeText('');
    onCancel?.();
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.99, Theme.animation.spring.stiff);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Theme.animation.spring.default);
  };

  return (
    <View style={[styles.wrapper, style]}>
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => inputRef.current?.focus()}
        style={[styles.container, containerStyle]}
      >
        <FontAwesome
          name="search"
          size={16}
          color={isFocused ? Theme.colors.primary : Theme.colors.textSecondary}
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {value.length > 0 && (
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
            <Pressable onPress={handleClear} style={styles.clearButton}>
              <FontAwesome
                name="times-circle"
                size={16}
                color={Theme.colors.textSecondary}
              />
            </Pressable>
          </Animated.View>
        )}

        {onFilterPress && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFilterPress();
            }}
            style={[
              styles.filterButton,
              filterActive && styles.filterButtonActive,
            ]}
          >
            <FontAwesome
              name="sliders"
              size={14}
              color={filterActive ? Theme.colors.white : Theme.colors.textSecondary}
            />
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </Pressable>
        )}
      </AnimatedPressable>

      {showCancel && isFocused && (
        <Animated.View
          entering={SlideInRight.springify()}
          exiting={SlideOutRight.springify()}
        >
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

// Modern search header with suggestions
interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  recentSearches?: string[];
  onRecentSearchPress?: (search: string) => void;
  onClearRecent?: () => void;
}

export function SearchHeader({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  suggestions = [],
  onSuggestionPress,
  recentSearches = [],
  onRecentSearchPress,
  onClearRecent,
}: SearchHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.headerContainer}>
      <SearchBar
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        showCancel
        onCancel={() => setIsFocused(false)}
      />

      {isFocused && value.length === 0 && recentSearches.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.suggestionsContainer}
        >
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsTitle}>Busquedas recientes</Text>
            {onClearRecent && (
              <Pressable onPress={onClearRecent}>
                <Text style={styles.clearText}>Limpiar</Text>
              </Pressable>
            )}
          </View>
          {recentSearches.map((search, index) => (
            <Pressable
              key={index}
              onPress={() => onRecentSearchPress?.(search)}
              style={styles.suggestionItem}
            >
              <FontAwesome name="history" size={14} color={Theme.colors.textSecondary} />
              <Text style={styles.suggestionText}>{search}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {isFocused && value.length > 0 && suggestions.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.suggestionsContainer}
        >
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={index}
              onPress={() => onSuggestionPress?.(suggestion)}
              style={styles.suggestionItem}
            >
              <FontAwesome name="search" size={14} color={Theme.colors.textSecondary} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderWidth: 1.5,
    ...Theme.shadows.sm,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
    paddingVertical: Theme.spacing.xs,
  },
  clearButton: {
    padding: Theme.spacing.xs,
    marginLeft: Theme.spacing.xs,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  cancelButton: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
  },
  cancelText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },

  // Header styles
  headerContainer: {
    backgroundColor: Theme.colors.surface,
    paddingTop: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  suggestionsContainer: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  suggestionsTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textSecondary,
  },
  clearText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.primary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  suggestionText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
  },
});
