import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Usuario, RegisterFormData } from '@/types';
import {
  subscribeToAuthChanges,
  getUsuario,
  signIn as authSignIn,
  signOut as authSignOut,
  registerUser,
} from '@/services/auth';
import { registrarParaPush } from '@/services/notificaciones';

interface AuthContextType {
  user: Usuario | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const usuario = await getUsuario(fbUser.uid);
          setUser(usuario);

          // Registrar para push notifications
          if (usuario) {
            await registrarParaPush(usuario.id);
          }
        } catch (err) {
          console.error('Error obteniendo usuario:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const usuario = await authSignIn(email, password);
      setUser(usuario);

      // Registrar para push notifications
      await registrarParaPush(usuario.id);
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      await authSignOut();
      setUser(null);
    } catch (err: any) {
      setError('Error al cerrar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (data.password !== data.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const usuario = await registerUser(data);
      setUser(usuario);

      // Registrar para push notifications
      await registrarParaPush(usuario.id);
    } catch (err: any) {
      const errorMessage = err.code ? getFirebaseErrorMessage(err.code) : err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        signIn,
        signOut,
        register,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
}

// Traducir errores de Firebase
function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/invalid-email': 'Email inválido',
    'auth/operation-not-allowed': 'Operación no permitida',
    'auth/weak-password': 'La contraseña es muy débil',
    'auth/user-disabled': 'Usuario deshabilitado',
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-credential': 'Credenciales inválidas',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  };

  return messages[code] || 'Error de autenticación';
}
