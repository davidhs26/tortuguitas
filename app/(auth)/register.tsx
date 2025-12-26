import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context';
import { AnimatedButton, Input, useToast } from '@/components/ui';
import { Theme } from '@/constants/Theme';
import { Genero } from '@/types';

export default function RegisterScreen() {
  const { register, loading, error, clearError } = useAuth();
  const { showToast } = useToast();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [genero, setGenero] = useState<Genero>('varon');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateStep1 = () => {
    if (!nombre.trim()) {
      showToast('Ingresa tu nombre', 'warning');
      return false;
    }
    if (!apellido.trim()) {
      showToast('Ingresa tu apellido', 'warning');
      return false;
    }
    if (!fechaNacimiento) {
      showToast('Ingresa tu fecha de nacimiento', 'warning');
      return false;
    }
    const fechaRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!fechaNacimiento.match(fechaRegex)) {
      showToast('Formato: DD/MM/AAAA', 'error');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!email.trim()) {
      showToast('Ingresa tu email', 'warning');
      return false;
    }
    if (!password) {
      showToast('Ingresa una contraseña', 'warning');
      return false;
    }
    if (password.length < 6) {
      showToast('Mínimo 6 caracteres', 'warning');
      return false;
    }
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 1 && validateStep1()) {
      setStep(2);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(1);
  };

  const handleRegister = async () => {
    clearError();

    if (!validateStep2()) return;

    const fechaRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = fechaNacimiento.match(fechaRegex);
    if (!match) return;

    const [, dia, mes, anio] = match;
    const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        fechaNacimiento: fecha,
        genero,
        telefono: telefono.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('¡Cuenta creada exitosamente!', 'success');
      router.replace('/(tabs)');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(err.message || 'Error al crear cuenta', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669', '#047857']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.logoBackground}
              >
                <FontAwesome name="user-plus" size={40} color={Theme.colors.white} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la familia Tortuguitas</Text>
          </Animated.View>

          {/* Progress indicator */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.progressContainer}
          >
            <View style={styles.progressBar}>
              <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
                <Text style={[styles.progressNumber, step >= 1 && styles.progressNumberActive]}>1</Text>
              </View>
              <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
              <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
                <Text style={[styles.progressNumber, step >= 2 && styles.progressNumberActive]}>2</Text>
              </View>
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, step === 1 && styles.progressLabelActive]}>
                Datos personales
              </Text>
              <Text style={[styles.progressLabel, step === 2 && styles.progressLabelActive]}>
                Cuenta
              </Text>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={styles.formContainer}
          >
            <View style={styles.form}>
              {step === 1 ? (
                <Animated.View entering={FadeInRight.springify()}>
                  <Text style={styles.formTitle}>Datos Personales</Text>

                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Input
                        label="Nombre"
                        placeholder="Tu nombre"
                        value={nombre}
                        onChangeText={setNombre}
                        autoCapitalize="words"
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Input
                        label="Apellido"
                        placeholder="Tu apellido"
                        value={apellido}
                        onChangeText={setApellido}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <Input
                    label="Fecha de Nacimiento"
                    placeholder="DD/MM/AAAA"
                    value={fechaNacimiento}
                    onChangeText={setFechaNacimiento}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Género</Text>
                  <View style={styles.genderButtons}>
                    <Pressable
                      style={[
                        styles.genderButton,
                        genero === 'varon' && styles.genderButtonActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setGenero('varon');
                      }}
                    >
                      <FontAwesome
                        name="male"
                        size={24}
                        color={genero === 'varon' ? Theme.colors.primary : Theme.colors.textSecondary}
                      />
                      <Text style={[
                        styles.genderText,
                        genero === 'varon' && styles.genderTextActive
                      ]}>
                        Varón
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.genderButton,
                        genero === 'mujer' && styles.genderButtonActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setGenero('mujer');
                      }}
                    >
                      <FontAwesome
                        name="female"
                        size={24}
                        color={genero === 'mujer' ? Theme.colors.primary : Theme.colors.textSecondary}
                      />
                      <Text style={[
                        styles.genderText,
                        genero === 'mujer' && styles.genderTextActive
                      ]}>
                        Mujer
                      </Text>
                    </Pressable>
                  </View>

                  <Input
                    label="Teléfono (opcional)"
                    placeholder="+54 11 1234-5678"
                    value={telefono}
                    onChangeText={setTelefono}
                    keyboardType="phone-pad"
                  />

                  <AnimatedButton
                    title="Siguiente"
                    variant="primary"
                    icon="arrow-right"
                    onPress={handleNextStep}
                    style={styles.nextButton}
                  />
                </Animated.View>
              ) : (
                <Animated.View entering={FadeInRight.springify()}>
                  <Pressable style={styles.backButton} onPress={handlePrevStep}>
                    <FontAwesome name="arrow-left" size={16} color={Theme.colors.primary} />
                    <Text style={styles.backButtonText}>Volver</Text>
                  </Pressable>

                  <Text style={styles.formTitle}>Crear Cuenta</Text>

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
                      style={styles.iconInput}
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
                      style={styles.iconInput}
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

                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <FontAwesome name="check-circle" size={18} color={Theme.colors.textSecondary} />
                    </View>
                    <Input
                      placeholder="Confirmar contraseña"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      style={styles.iconInput}
                    />
                  </View>

                  {error && (
                    <Animated.View entering={FadeInDown.springify()} style={styles.errorContainer}>
                      <FontAwesome name="exclamation-circle" size={16} color={Theme.colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                  )}

                  <AnimatedButton
                    title="Crear Cuenta"
                    variant="success"
                    icon="check"
                    onPress={handleRegister}
                    loading={loading}
                    style={styles.registerButton}
                  />
                </Animated.View>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                    <Text style={styles.link}>Inicia sesión</Text>
                  </Pressable>
                </Link>
              </View>
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
    padding: Theme.spacing.lg,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  logoContainer: {
    marginBottom: Theme.spacing.md,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    marginBottom: Theme.spacing.lg,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    backgroundColor: Theme.colors.white,
  },
  progressNumber: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressNumberActive: {
    color: '#10B981',
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: Theme.spacing.sm,
  },
  progressLineActive: {
    backgroundColor: Theme.colors.white,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressLabel: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressLabelActive: {
    color: Theme.colors.white,
    fontWeight: Theme.fontWeight.semibold,
  },
  formContainer: {
    flex: 1,
  },
  form: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.xxl,
    padding: Theme.spacing.xl,
    ...Theme.shadows.lg,
  },
  formTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  genderButtonActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryLight,
  },
  genderText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textSecondary,
  },
  genderTextActive: {
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  backButtonText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.medium,
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
  iconInput: {
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
  nextButton: {
    marginTop: Theme.spacing.md,
  },
  registerButton: {
    marginTop: Theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
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
});
