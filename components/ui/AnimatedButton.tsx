import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FontAwesome } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode | string; // Acepta string (nombre de icono) o componente
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  haptic = true,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const isDisabled = disabled || loading;

  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  // Determinar el tamaño del icono según el size del botón
  const iconSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;
  
  // Renderizar el icono: si es string, crear FontAwesome; si es ReactNode, usarlo directamente
  const renderIcon = () => {
    if (!icon) return null;
    
    if (typeof icon === 'string') {
      return (
        <FontAwesome 
          name={icon as any} 
          size={iconSize} 
          color={variantStyles.text.color} 
        />
      );
    }
    
    return icon;
  };

  const iconElement = renderIcon();

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        variantStyles.button,
        sizeStyles.button,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.loaderColor}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <>
          {iconElement && iconPosition === 'left' && (
            <Animated.View style={styles.iconLeft}>{iconElement}</Animated.View>
          )}
          <Text
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconElement && iconPosition === 'right' && (
            <Animated.View style={styles.iconRight}>{iconElement}</Animated.View>
          )}
        </>
      )}
    </AnimatedTouchable>
  );
}

function getVariantStyles(variant: AnimatedButtonProps['variant']) {
  const variants = {
    primary: {
      button: {
        backgroundColor: Theme.colors.primary,
      },
      text: {
        color: Theme.colors.white,
      },
      loaderColor: Theme.colors.white,
    },
    secondary: {
      button: {
        backgroundColor: Theme.colors.backgroundSecondary,
      },
      text: {
        color: Theme.colors.text,
      },
      loaderColor: Theme.colors.text,
    },
    outline: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Theme.colors.primary,
      },
      text: {
        color: Theme.colors.primary,
      },
      loaderColor: Theme.colors.primary,
    },
    danger: {
      button: {
        backgroundColor: Theme.colors.error,
      },
      text: {
        color: Theme.colors.white,
      },
      loaderColor: Theme.colors.white,
    },
    success: {
      button: {
        backgroundColor: Theme.colors.success,
      },
      text: {
        color: Theme.colors.white,
      },
      loaderColor: Theme.colors.white,
    },
    ghost: {
      button: {
        backgroundColor: 'transparent',
      },
      text: {
        color: Theme.colors.primary,
      },
      loaderColor: Theme.colors.primary,
    },
  };

  return variants[variant || 'primary'];
}

function getSizeStyles(size: AnimatedButtonProps['size']) {
  const sizes = {
    small: {
      button: {
        paddingVertical: Theme.spacing.sm,
        paddingHorizontal: Theme.spacing.lg,
        borderRadius: Theme.borderRadius.sm,
      },
      text: {
        fontSize: Theme.fontSize.sm,
      },
    },
    medium: {
      button: {
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.xl,
        borderRadius: Theme.borderRadius.md,
      },
      text: {
        fontSize: Theme.fontSize.md,
      },
    },
    large: {
      button: {
        paddingVertical: Theme.spacing.lg,
        paddingHorizontal: Theme.spacing.xxl,
        borderRadius: Theme.borderRadius.lg,
      },
      text: {
        fontSize: Theme.fontSize.lg,
      },
    },
  };

  return sizes[size || 'medium'];
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: Theme.fontWeight.semibold,
  },
  iconLeft: {
    marginRight: Theme.spacing.sm,
  },
  iconRight: {
    marginLeft: Theme.spacing.sm,
  },
});
