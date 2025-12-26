import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context';
import { Button, Input } from '@/components/ui';
import { Genero } from '@/types';

export default function RegisterScreen() {
  const { register, loading, error, clearError } = useAuth();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [genero, setGenero] = useState<Genero>('varon');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [formError, setFormError] = useState('');

  const handleRegister = async () => {
    setFormError('');
    clearError();

    // Validaciones
    if (!nombre.trim()) {
      setFormError('Ingresa tu nombre');
      return;
    }

    if (!apellido.trim()) {
      setFormError('Ingresa tu apellido');
      return;
    }

    if (!email.trim()) {
      setFormError('Ingresa tu email');
      return;
    }

    if (!fechaNacimiento) {
      setFormError('Ingresa tu fecha de nacimiento (DD/MM/AAAA)');
      return;
    }

    // Validar formato de fecha
    const fechaRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = fechaNacimiento.match(fechaRegex);
    if (!match) {
      setFormError('Formato de fecha inválido. Usa DD/MM/AAAA');
      return;
    }

    const [, dia, mes, anio] = match;
    const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));

    if (isNaN(fecha.getTime())) {
      setFormError('Fecha de nacimiento inválida');
      return;
    }

    if (!password) {
      setFormError('Ingresa una contraseña');
      return;
    }

    if (password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }

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
      router.replace('/(tabs)');
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a la familia</Text>
        </View>

        <View style={styles.form}>
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
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Teléfono (opcional)"
            placeholder="+54 11 1234-5678"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          <Input
            label="Fecha de Nacimiento"
            placeholder="DD/MM/AAAA"
            value={fechaNacimiento}
            onChangeText={setFechaNacimiento}
            keyboardType="numeric"
          />

          <View style={styles.genderContainer}>
            <Text style={styles.label}>Género</Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  genero === 'varon' && styles.genderButtonActive,
                ]}
                onPress={() => setGenero('varon')}
              >
                <Text
                  style={[
                    styles.genderText,
                    genero === 'varon' && styles.genderTextActive,
                  ]}
                >
                  Varón
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  genero === 'mujer' && styles.genderButtonActive,
                ]}
                onPress={() => setGenero('mujer')}
              >
                <Text
                  style={[
                    styles.genderText,
                    genero === 'mujer' && styles.genderTextActive,
                  ]}
                >
                  Mujer
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="Confirmar Contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {(formError || error) && (
            <Text style={styles.error}>{formError || error}</Text>
          )}

          <Button
            title="Crear Cuenta"
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" style={styles.link}>
              Inicia sesión
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  genderText: {
    fontSize: 16,
    color: '#6B7280',
  },
  genderTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  link: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
});
