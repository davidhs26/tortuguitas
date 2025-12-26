import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Pago, Reserva, ConfigAdmin } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'pagos';
const CONFIG_DOC = 'config';

// Obtener configuración de precios
export async function getConfigPrecios(): Promise<ConfigAdmin | null> {
  const docRef = doc(db, 'config', CONFIG_DOC);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as ConfigAdmin;
}

// Calcular monto de reserva
export async function calcularMontoReserva(reserva: Reserva): Promise<number> {
  const config = await getConfigPrecios();

  if (!config) {
    // Precios por defecto si no hay configuración
    const precioBasePorCama = 5000; // ARS
    const serviciosFijos = 2000; // ARS
    const totalCamas = reserva.participantes.length;
    return totalCamas * precioBasePorCama + serviciosFijos;
  }

  const totalCamas = reserva.participantes.length;
  const precioVerduras = totalCamas * config.precios.verdurasPorCama;
  const servicios = config.precios.serviciosFijos;

  // Aplicar ajuste IPC si corresponde
  let total = precioVerduras + servicios;

  if (config.ipcPorcentaje > 0) {
    total = total * (1 + config.ipcPorcentaje / 100);
  }

  return Math.round(total);
}

// Calcular monto de asado
export async function calcularMontoAsado(cantidadPersonas: number): Promise<number> {
  const config = await getConfigPrecios();

  if (!config) {
    // Precio por defecto
    return cantidadPersonas * 3000; // ARS por persona
  }

  const personalRequerido = Math.ceil(cantidadPersonas / config.personalAsado.porCada);
  const personalFinal = Math.min(personalRequerido, config.personalAsado.maxDisponible);

  return personalFinal * config.personalAsado.costoPorPersonal;
}

// Crear pago para reserva
export async function crearPagoReserva(reserva: Reserva): Promise<Pago> {
  const monto = await calcularMontoReserva(reserva);
  const pagoId = uuidv4();

  const pago: Pago = {
    id: pagoId,
    reservaId: reserva.id,
    usuarioId: reserva.usuarioId,
    monto,
    moneda: 'ARS',
    estado: 'pendiente',
    concepto: `Reserva ${reserva.habitacionNombre} - Shabbat`,
    createdAt: new Date(),
  };

  await setDoc(doc(db, COLLECTION_NAME, pagoId), {
    ...pago,
    createdAt: serverTimestamp(),
  });

  // Actualizar reserva con ID de pago
  await updateDoc(doc(db, 'reservas', reserva.id), {
    pagoId,
    montoPago: monto,
  });

  return pago;
}

// Crear pago para actividad (asado)
export async function crearPagoActividad(
  actividadId: string,
  usuarioId: string,
  cantidadPersonas: number,
  concepto: string
): Promise<Pago> {
  const monto = await calcularMontoAsado(cantidadPersonas);
  const pagoId = uuidv4();

  const pago: Pago = {
    id: pagoId,
    actividadId,
    usuarioId,
    monto,
    moneda: 'ARS',
    estado: 'pendiente',
    concepto,
    createdAt: new Date(),
  };

  await setDoc(doc(db, COLLECTION_NAME, pagoId), {
    ...pago,
    createdAt: serverTimestamp(),
  });

  return pago;
}

// Obtener pago por ID
export async function getPago(id: string): Promise<Pago | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    ...docSnap.data(),
    id: docSnap.id,
    createdAt: docSnap.data().createdAt?.toDate() || new Date(),
    fechaPago: docSnap.data().fechaPago?.toDate(),
  } as Pago;
}

// Obtener pagos de un usuario
export async function getPagosUsuario(usuarioId: string): Promise<Pago[]> {
  const q = query(collection(db, COLLECTION_NAME), where('usuarioId', '==', usuarioId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    fechaPago: doc.data().fechaPago?.toDate(),
  })) as Pago[];
}

// Marcar pago como aprobado (webhook de MercadoPago)
export async function aprobarPago(pagoId: string, mercadoPagoId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, pagoId), {
    estado: 'aprobado',
    mercadoPagoId,
    fechaPago: serverTimestamp(),
  });

  // Actualizar reserva como pagada
  const pago = await getPago(pagoId);
  if (pago?.reservaId) {
    await updateDoc(doc(db, 'reservas', pago.reservaId), {
      pagado: true,
    });
  }
}

// Rechazar pago
export async function rechazarPago(pagoId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, pagoId), {
    estado: 'rechazado',
  });
}

// ============================================
// MERCADOPAGO INTEGRATION
// ============================================

// Crear preferencia de pago para MercadoPago
export async function crearPreferenciaMercadoPago(pago: Pago): Promise<string> {
  // Esta función debería llamar a tu backend que tenga las credenciales de MercadoPago
  // Por seguridad, las credenciales NO deben estar en el cliente

  // URL del backend para crear preferencia
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://tu-backend.com';

  try {
    const response = await fetch(`${backendUrl}/api/mercadopago/preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pagoId: pago.id,
        monto: pago.monto,
        concepto: pago.concepto,
        usuarioId: pago.usuarioId,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al crear preferencia de pago');
    }

    const data = await response.json();

    // Guardar preferenceId en el pago
    await updateDoc(doc(db, COLLECTION_NAME, pago.id), {
      preferenceId: data.preferenceId,
    });

    return data.preferenceId;
  } catch (error) {
    console.error('Error creando preferencia MercadoPago:', error);
    throw error;
  }
}

// Obtener URL de pago de MercadoPago
export async function getUrlPagoMercadoPago(preferenceId: string): Promise<string> {
  // En producción, esto vendría del backend
  // Por ahora retornamos URL de sandbox
  return `https://www.mercadopago.com.ar/checkout/v1/redirect?preference_id=${preferenceId}`;
}

// ============================================
// ADMIN: CONFIGURACIÓN DE PRECIOS
// ============================================

// Guardar configuración de precios
export async function guardarConfigPrecios(config: Partial<ConfigAdmin>): Promise<void> {
  const docRef = doc(db, 'config', CONFIG_DOC);

  await setDoc(
    docRef,
    {
      ...config,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Actualizar precios con IPC
export async function actualizarPreciosIPC(porcentajeIPC: number): Promise<void> {
  const config = await getConfigPrecios();

  if (!config) {
    throw new Error('No hay configuración de precios');
  }

  const nuevosPrecios = {
    verdurasPorCama: Math.round(config.precios.verdurasPorCama * (1 + porcentajeIPC / 100)),
    serviciosFijos: Math.round(config.precios.serviciosFijos * (1 + porcentajeIPC / 100)),
  };

  await guardarConfigPrecios({
    precios: nuevosPrecios,
    ipcUltimaActualizacion: new Date(),
    ipcPorcentaje: porcentajeIPC,
  });
}
