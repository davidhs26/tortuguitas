import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Usuario, RegisterFormData, NivelPrioridad, Sector } from '@/types';

// Crear nuevo usuario
export async function registerUser(data: RegisterFormData): Promise<Usuario> {
  const { email, password, nombre, apellido, fechaNacimiento, genero, telefono } = data;

  // Crear usuario en Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Actualizar perfil con nombre
  await updateProfile(firebaseUser, {
    displayName: `${nombre} ${apellido}`,
  });

  // Crear documento de usuario en Firestore
  const usuario: Usuario = {
    id: firebaseUser.uid,
    email,
    nombre,
    apellido,
    fechaNacimiento: new Date(fechaNacimiento),
    genero,
    grupoFamiliar: 'libre' as Sector, // Admin asignará el grupo correcto
    prioridadNivel: 3 as NivelPrioridad, // Por defecto nivel más bajo, admin ajustará
    historialAsistencias: [],
    familia: [],
    esAdmin: false,
    telefono,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, 'users', firebaseUser.uid), {
    ...usuario,
    fechaNacimiento: usuario.fechaNacimiento.toISOString(),
    historialAsistencias: [],
    familia: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return usuario;
}

// Iniciar sesión
export async function signIn(email: string, password: string): Promise<Usuario> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const usuario = await getUsuario(userCredential.user.uid);

  if (!usuario) {
    throw new Error('Usuario no encontrado en la base de datos');
  }

  return usuario;
}

// Cerrar sesión
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Obtener datos de usuario desde Firestore
export async function getUsuario(uid: string): Promise<Usuario | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    fechaNacimiento: new Date(data.fechaNacimiento),
    historialAsistencias: data.historialAsistencias?.map((d: string) => new Date(d)) || [],
    familia: data.familia || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Usuario;
}

// Actualizar usuario
export async function updateUsuario(uid: string, updates: Partial<Usuario>): Promise<void> {
  const docRef = doc(db, 'users', uid);

  const updateData: Record<string, any> = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  // Convertir fechas a strings para Firestore
  if (updates.fechaNacimiento) {
    updateData.fechaNacimiento = updates.fechaNacimiento.toISOString();
  }
  if (updates.historialAsistencias) {
    updateData.historialAsistencias = updates.historialAsistencias.map(d => d.toISOString());
  }

  await updateDoc(docRef, updateData);
}

// Actualizar token de push notifications
export async function updatePushToken(uid: string, token: string): Promise<void> {
  await updateUsuario(uid, { pushToken: token });
}

// Suscribirse a cambios de autenticación
export function subscribeToAuthChanges(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// Obtener usuario actual
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}
