import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSettings, saveSettings } from './storage';

// Secure storage keys
const BIOMETRIC_KEYS = {
  CREDENTIALS: 'tortuguitas_biometric_credentials',
  ENABLED: 'tortuguitas_biometric_enabled',
};

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricCapabilities {
  available: boolean;
  biometricTypes: BiometricType[];
  enrolled: boolean;
  securityLevel: 'none' | 'weak' | 'strong';
}

export interface BiometricCredentials {
  email: string;
  userId: string;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricAvailability(): Promise<BiometricCapabilities> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const biometricTypes: BiometricType[] = supportedTypes.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'facial';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'iris';
        default:
          return 'none';
      }
    });

    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    return {
      available: hasHardware,
      biometricTypes: biometricTypes.filter(t => t !== 'none'),
      enrolled: isEnrolled,
      securityLevel:
        securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG
          ? 'strong'
          : securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK
          ? 'weak'
          : 'none',
    };
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return {
      available: false,
      biometricTypes: [],
      enrolled: false,
      securityLevel: 'none',
    };
  }
}

/**
 * Get a friendly name for the biometric type
 */
export function getBiometricTypeName(types: BiometricType[]): string {
  if (types.includes('facial')) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Reconocimiento Facial';
  }
  if (types.includes('fingerprint')) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Huella Digital';
  }
  return 'Biométricos';
}

/**
 * Authenticate user with biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const capabilities = await checkBiometricAvailability();

    if (!capabilities.available || !capabilities.enrolled) {
      return {
        success: false,
        error: 'Autenticación biométrica no disponible',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Autenticarse para continuar',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
      fallbackLabel: 'Usar contraseña',
    });

    if (result.success) {
      return { success: true };
    }

    // Handle specific error types
    if (result.error === 'user_cancel') {
      return { success: false, error: 'Autenticación cancelada' };
    }
    if (result.error === 'user_fallback') {
      return { success: false, error: 'Usar contraseña' };
    }
    if (result.error === 'lockout') {
      return { success: false, error: 'Demasiados intentos. Intenta más tarde.' };
    }

    return { success: false, error: 'Autenticación fallida' };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return { success: false, error: 'Error de autenticación' };
  }
}

/**
 * Save credentials for biometric login
 */
export async function saveBiometricCredentials(
  credentials: BiometricCredentials
): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(
      BIOMETRIC_KEYS.CREDENTIALS,
      JSON.stringify(credentials)
    );
    await SecureStore.setItemAsync(BIOMETRIC_KEYS.ENABLED, 'true');
    await saveSettings({ biometricEnabled: true });
    return true;
  } catch (error) {
    console.error('Error saving biometric credentials:', error);
    return false;
  }
}

/**
 * Get saved biometric credentials
 */
export async function getBiometricCredentials(): Promise<BiometricCredentials | null> {
  try {
    const credentials = await SecureStore.getItemAsync(BIOMETRIC_KEYS.CREDENTIALS);
    if (!credentials) return null;
    return JSON.parse(credentials);
  } catch (error) {
    console.error('Error getting biometric credentials:', error);
    return null;
  }
}

/**
 * Check if biometric login is enabled
 */
export async function isBiometricLoginEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_KEYS.ENABLED);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Disable biometric login
 */
export async function disableBiometricLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_KEYS.CREDENTIALS);
    await SecureStore.deleteItemAsync(BIOMETRIC_KEYS.ENABLED);
    await saveSettings({ biometricEnabled: false });
  } catch (error) {
    console.error('Error disabling biometric login:', error);
  }
}

/**
 * Perform biometric login - authenticates and returns stored credentials
 */
export async function biometricLogin(): Promise<{
  success: boolean;
  credentials?: BiometricCredentials;
  error?: string;
}> {
  try {
    // First check if biometric is enabled
    const isEnabled = await isBiometricLoginEnabled();
    if (!isEnabled) {
      return { success: false, error: 'Biométricos no configurados' };
    }

    // Get stored credentials
    const credentials = await getBiometricCredentials();
    if (!credentials) {
      return { success: false, error: 'No hay credenciales guardadas' };
    }

    // Authenticate
    const authResult = await authenticateWithBiometrics(
      'Inicia sesión con biométricos'
    );

    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    return { success: true, credentials };
  } catch (error) {
    console.error('Biometric login error:', error);
    return { success: false, error: 'Error en el inicio de sesión' };
  }
}
