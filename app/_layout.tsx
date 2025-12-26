import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth, ReservasProvider } from '@/context';
import { ToastProvider, BottomSheetModalProvider } from '@/components/ui';
import { Theme } from '@/constants/Theme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ReservasProvider>
        <BottomSheetModalProvider>
          <ToastProvider>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: Theme.colors.primary,
                },
                headerTintColor: Theme.colors.white,
                headerTitleStyle: {
                  fontWeight: '600',
                },
                headerShadowVisible: false,
                contentStyle: {
                  backgroundColor: Theme.colors.background,
                },
                animation: 'slide_from_right',
              }}
            >
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
                name="nueva-reserva"
                options={{
                  title: 'Nueva Reserva',
                  headerBackTitle: 'Cancelar',
                  presentation: 'modal',
                }}
              />
            </Stack>
          </ToastProvider>
        </BottomSheetModalProvider>
      </ReservasProvider>
    </ThemeProvider>
  );
}

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
