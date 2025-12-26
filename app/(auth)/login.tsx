import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context';
import { AnimatedButton, Input, useToast } from '@/components/ui';
import { Theme } from '@/constants/Theme';

export default function LoginScreen() {
  const { signIn, loading, error, clearError } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    clearError();

    if (!email.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Ingresa tu email', 'warning');
      return;
    }

    if (!password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Ingresa tu contraseña', 'warning');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await signIn(email.trim().toLowerCase(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(err.message || 'Error al iniciar sesión', 'error');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark, '#1E3A5F']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo y título */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.logoBackground}
              >
                <FontAwesome name="home" size={48} color={Theme.colors.white} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Tortuguitas</Text>
            <Text style={styles.subtitle}>Quinta Familiar</Text>
          </Animated.View>

          {/* Formulario */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={styles.formContainer}
          >
            <View style={styles.form}>
              <Text style={styles.formTitle}>Bienvenido</Text>
              <Text style={styles.formSubtitle}>Inicia sesión para continuar</Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <FontAwesome name="envelope" size={18} color={Theme.colors.textSecondary} />
                </View>
                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <FontAwesome name="lock" size={20} color={Theme.colors.textSecondary} />
                </View>
                <Input
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPassword(!showPassword);
                  }}
                >
                  <FontAwesome
                    name={showPassword ? 'eye' : 'eye-slash'}
                    size={18}
                    color={Theme.colors.textSecondary}
                  />
                </Pressable>
              </View>

              {error && (
                <Animated.View entering={FadeInDown.springify()} style={styles.errorContainer}>
                  <FontAwesome name="exclamation-circle" size={16} color={Theme.colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              <AnimatedButton
                title="Ingresar"
                variant="primary"
                icon="sign-in"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                    <Text style={styles.link}>Regístrate</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </Animated.View>

          {/* Features */}
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.features}
          >
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <FontAwesome name="bed" size={16} color={Theme.colors.white} />
              </View>
              <Text style={styles.featureText}>Reservas</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <FontAwesome name="users" size={16} color={Theme.colors.white} />
              </View>
              <Text style={styles.featureText}>Actividades</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <FontAwesome name="star" size={16} color={Theme.colors.white} />
              </View>
              <Text style={styles.featureText}>Shabbat</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  logoContainer: {
    marginBottom: Theme.spacing.lg,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    marginBottom: Theme.spacing.xl,
  },
  form: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.xxl,
    padding: Theme.spacing.xl,
    ...Theme.shadows.lg,
  },
  formTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  formSubtitle: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  inputIcon: {
    position: 'absolute',
    left: Theme.spacing.md,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingLeft: 48,
    marginBottom: 0,
  },
  eyeIcon: {
    position: 'absolute',
    right: Theme.spacing.md,
    padding: Theme.spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: '#FEE2E2',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: Theme.fontSize.sm,
  },
  loginButton: {
    marginTop: Theme.spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  dividerText: {
    marginHorizontal: Theme.spacing.md,
    color: Theme.colors.textTertiary,
    fontSize: Theme.fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.fontSize.md,
  },
  link: {
    color: Theme.colors.primary,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Theme.spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
