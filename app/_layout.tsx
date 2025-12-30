import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback, useMemo, memo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth, ReservasProvider } from '@/context';
import { ToastProvider, BottomSheetModalProvider } from '@/components/ui';
import { Theme } from '@/constants/Theme';
import ErrorBoundary from '@/components/ErrorBoundary';

export {
  ErrorBoundary as ExpoErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

// Memoized screen options for better performance
const screenOptions = {
  headerStyle: {
    backgroundColor: Theme.colors.primary,
  },
  headerTintColor: Theme.colors.white,
  headerTitleStyle: {
    fontWeight: '600' as const,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: Theme.colors.background,
  },
  animation: 'slide_from_right' as const,
};

const RootLayoutNav = memo(function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Memoized navigation handler
  const handleNavigation = useCallback(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  useEffect(() => {
    handleNavigation();
  }, [handleNavigation]);

  // Memoized theme value
  const themeValue = useMemo(
    () => (colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    [colorScheme]
  );

  return (
    <ThemeProvider value={themeValue}>
      <ErrorBoundary>
        <ReservasProvider>
          <BottomSheetModalProvider>
            <ToastProvider>
              <Stack screenOptions={screenOptions}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="admin"
                options={{
                  title: 'Administracion',
                  headerBackTitle: 'Volver',
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="reserva/[id]"
                options={{
                  title: 'Detalle de Reserva',
                  headerBackTitle: 'Volver',
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="configuracion"
                options={{
                  title: 'Configuración',
                  headerBackTitle: 'Volver',
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="historial"
                options={{
                  title: 'Historial de Reservas',
                  headerBackTitle: 'Volver',
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="notificaciones"
                options={{
                  title: 'Notificaciones',
                  headerBackTitle: 'Volver',
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="pagos"
                options={{
                  title: 'Mis Pagos',
                  headerBackTitle: 'Volver',
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="estadisticas"
                options={{
                  title: 'Estadísticas',
                  headerBackTitle: 'Volver',
                  presentation: 'card',
                }}
              />
              </Stack>
            </ToastProvider>
          </BottomSheetModalProvider>
        </ReservasProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
