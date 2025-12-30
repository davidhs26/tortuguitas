import React, { useEffect, createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (title: string, type: ToastType, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    title: string,
    type: ToastType,
    message?: string,
    duration: number = 3000
  ) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success: (title, message) => showToast(title, 'success', message),
        error: (title, message) => showToast(title, 'error', message),
        warning: (title, message) => showToast(title, 'warning', message),
        info: (title, message) => showToast(title, 'info', message),
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { top: insets.top + Theme.spacing.lg }]}>
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onRemove={() => onRemove(toast.id)}
        />
      ))}
    </View>
  );
}

function ToastItem({
  toast,
  index,
  onRemove,
}: {
  toast: ToastMessage;
  index: number;
  onRemove: () => void;
}) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });

    // Auto dismiss
    const duration = toast.duration || 3000;
    const hideAnimation = () => {
      translateY.value = withTiming(-50, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.9, { duration: 200 });
    };

    const timeout = setTimeout(() => {
      hideAnimation();
      setTimeout(onRemove, 250);
    }, duration);

    return () => clearTimeout(timeout);
  }, []);

  const config = getToastConfig(toast.type);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: config.backgroundColor },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.iconBackground }]}>
        <FontAwesome name={config.icon} size={16} color={config.iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: config.textColor }]}>{toast.title}</Text>
        {toast.message && (
          <Text style={[styles.message, { color: config.messageColor }]}>
            {toast.message}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function getToastConfig(type: ToastType) {
  const configs = {
    success: {
      backgroundColor: Theme.colors.successBackground,
      iconBackground: Theme.colors.success,
      iconColor: Theme.colors.white,
      textColor: Theme.colors.successDark,
      messageColor: Theme.colors.success,
      icon: 'check' as const,
    },
    error: {
      backgroundColor: Theme.colors.errorBackground,
      iconBackground: Theme.colors.error,
      iconColor: Theme.colors.white,
      textColor: Theme.colors.errorDark,
      messageColor: Theme.colors.error,
      icon: 'times' as const,
    },
    warning: {
      backgroundColor: Theme.colors.warningBackground,
      iconBackground: Theme.colors.warning,
      iconColor: Theme.colors.white,
      textColor: Theme.colors.warningDark,
      messageColor: Theme.colors.warning,
      icon: 'exclamation' as const,
    },
    info: {
      backgroundColor: Theme.colors.primaryBackground,
      iconBackground: Theme.colors.primary,
      iconColor: Theme.colors.white,
      textColor: Theme.colors.primaryDark,
      messageColor: Theme.colors.primary,
      icon: 'info' as const,
    },
  };

  return configs[type];
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Theme.spacing.lg,
    right: Theme.spacing.lg,
    zIndex: 9999,
    gap: Theme.spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.lg,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
  },
  message: {
    fontSize: Theme.fontSize.xs,
    marginTop: 2,
  },
});
