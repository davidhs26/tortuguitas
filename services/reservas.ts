import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Reserva,
  EstadoReserva,
  ParticipanteReserva,
  MudanzaLog,
  Habitacion,
  Usuario,
  NivelPrioridad,
  ResultadoMudanza,
  Notificacion,
} from '@/types';
import { getHabitacion, getHabitacionesOrdenadas, ORDEN_CATEGORIAS } from './habitaciones';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfWeek, addDays, isAfter, isBefore, parseISO } from 'date-fns';

const COLLECTION_NAME = 'reservas';

// Obtener fecha del próximo viernes (Shabbat)
export function getProximoShabbat(fromDate: Date = new Date()): Date {
  const dayOfWeek = fromDate.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = addDays(fromDate, daysUntilFriday);
  nextFriday.setHours(0, 0, 0, 0);
  return nextFriday;
}

// Obtener fechas de ventana de reservas para una semana
export function getVentanaReservas(fechaShabbat: Date): {
  inicioReservas: Date; // Lunes 00:00
  finConfirmacion: Date; // Miércoles 23:59
  inicioInvitados: Date; // Miércoles 00:00
} {
  const lunes = addDays(fechaShabbat, -4);
  lunes.setHours(0, 0, 0, 0);

  const miercoles = addDays(fechaShabbat, -2);
  const miercolesInicio = new Date(miercoles);
  miercolesInicio.setHours(0, 0, 0, 0);

  const miercolesFin = new Date(miercoles);
  miercolesFin.setHours(23, 59, 59, 999);

  return {
    inicioReservas: lunes,
    finConfirmacion: miercolesFin,
    inicioInvitados: miercolesInicio,
  };
}

// Verificar si estamos en período de reservas
export function enPeriodoReservas(fechaShabbat: Date): boolean {
  const ahora = new Date();
  const { inicioReservas, finConfirmacion } = getVentanaReservas(fechaShabbat);
  return isAfter(ahora, inicioReservas) && isBefore(ahora, finConfirmacion);
}

// Verificar si estamos en período de invitados
export function enPeriodoInvitados(fechaShabbat: Date): boolean {
  const ahora = new Date();
  const { inicioInvitados } = getVentanaReservas(fechaShabbat);
  return isAfter(ahora, inicioInvitados);
}

// Crear nueva reserva
export async function crearReserva(
  usuario: Usuario,
  habitacionId: string,
  fechaShabbat: Date,
  participantes: ParticipanteReserva[],
  invitados: ParticipanteReserva[] = [],
  notas?: string
): Promise<{ reserva: Reserva; mudanzas: ResultadoMudanza | null }> {
  const habitacion = await getHabitacion(habitacionId);
  if (!habitacion) {
    throw new Error('Habitación no encontrada');
  }

  const reservaId = uuidv4();
  const fechaShabbatStr = format(fechaShabbat, 'yyyy-MM-dd');

  // Verificar si hay conflicto con reserva existente
  const reservasExistentes = await getReservasPorSemana(fechaShabbat);
  const reservaConflicto = reservasExistentes.find(r => r.habitacionId === habitacionId);

  let mudanzaResult: ResultadoMudanza | null = null;

  if (reservaConflicto) {
    // Intentar resolver el conflicto con mudanzas
    mudanzaResult = await resolverMudanza(
      {
        usuarioId: usuario.id,
        usuarioNombre: `${usuario.nombre} ${usuario.apellido}`,
        prioridad: usuario.prioridadNivel,
        habitacionId,
        fechaShabbat,
      },
      reservaConflicto,
      habitacion,
      reservasExistentes
    );

    if (!mudanzaResult.exitoso) {
      throw new Error(mudanzaResult.error || 'No se pudo resolver el conflicto de habitaciones');
    }
  }

  const nuevaReserva: Reserva = {
    id: reservaId,
    usuarioId: usuario.id,
    usuarioNombre: `${usuario.nombre} ${usuario.apellido}`,
    habitacionId,
    habitacionNombre: habitacion.nombre,
    fechaShabbat,
    participantes,
    estado: 'pendiente',
    prioridad: usuario.prioridadNivel,
    fechaReserva: new Date(),
    invitados,
    pagado: false,
    notas,
    historialMudanzas: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, COLLECTION_NAME, reservaId), serializeReserva(nuevaReserva));

  return { reserva: nuevaReserva, mudanzas: mudanzaResult };
}

// Serializar reserva para Firestore
function serializeReserva(reserva: Reserva): Record<string, any> {
  return {
    ...reserva,
    fechaShabbat: reserva.fechaShabbat.toISOString(),
    fechaReserva: reserva.fechaReserva.toISOString(),
    historialMudanzas: reserva.historialMudanzas?.map(m => ({
      ...m,
      fecha: m.fecha.toISOString(),
    })) || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

// Deserializar reserva desde Firestore
function deserializeReserva(data: Record<string, any>): Reserva {
  return {
    ...data,
    fechaShabbat: new Date(data.fechaShabbat),
    fechaReserva: new Date(data.fechaReserva),
    historialMudanzas: data.historialMudanzas?.map((m: any) => ({
      ...m,
      fecha: new Date(m.fecha),
    })) || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Reserva;
}

// Obtener reservas por semana
export async function getReservasPorSemana(fechaShabbat: Date): Promise<Reserva[]> {
  const fechaStr = format(fechaShabbat, 'yyyy-MM-dd');
  const q = query(
    collection(db, COLLECTION_NAME),
    where('fechaShabbat', '>=', fechaStr),
    where('fechaShabbat', '<=', fechaStr + 'T23:59:59')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => deserializeReserva({ ...doc.data(), id: doc.id }));
}

// Obtener reservas de un usuario
export async function getReservasUsuario(usuarioId: string): Promise<Reserva[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('usuarioId', '==', usuarioId),
    orderBy('fechaShabbat', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => deserializeReserva({ ...doc.data(), id: doc.id }));
}

// Obtener reserva por ID
export async function getReserva(id: string): Promise<Reserva | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return deserializeReserva({ ...docSnap.data(), id: docSnap.id });
}

// Actualizar reserva
export async function actualizarReserva(id: string, updates: Partial<Reserva>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Cancelar reserva
export async function cancelarReserva(id: string): Promise<void> {
  await actualizarReserva(id, { estado: 'cancelada' });
}

// Confirmar reservas (proceso del miércoles)
export async function confirmarReservasSemana(fechaShabbat: Date): Promise<void> {
  const reservas = await getReservasPorSemana(fechaShabbat);

  for (const reserva of reservas) {
    if (reserva.estado === 'pendiente') {
      await actualizarReserva(reserva.id, { estado: 'confirmada' });
    }
  }
}

// ============================================
// ALGORITMO DE MUDANZAS
// ============================================

interface ReservaCandidato {
  usuarioId: string;
  usuarioNombre: string;
  prioridad: NivelPrioridad;
  habitacionId: string;
  fechaShabbat: Date;
}

// Comparar prioridades (true si la nueva tiene mayor prioridad)
function tieneMayorPrioridad(
  nueva: { prioridad: NivelPrioridad },
  existente: { prioridad: NivelPrioridad }
): boolean {
  // Menor número = mayor prioridad (1 es máxima)
  return nueva.prioridad < existente.prioridad;
}

// Resolver conflicto de mudanzas con efecto cascada
export async function resolverMudanza(
  reservaNueva: ReservaCandidato,
  reservaExistente: Reserva,
  habitacionObjetivo: Habitacion,
  todasLasReservas: Reserva[]
): Promise<ResultadoMudanza> {
  const mudanzas: MudanzaLog[] = [];
  const notificaciones: Notificacion[] = [];

  // Verificar si la nueva reserva tiene mayor prioridad
  if (!tieneMayorPrioridad(reservaNueva, reservaExistente)) {
    return {
      exitoso: false,
      mudanzas: [],
      notificaciones: [],
      error: 'La reserva existente tiene igual o mayor prioridad',
    };
  }

  // Obtener habitaciones del sector ordenadas
  const habitacionesSector = await getHabitacionesOrdenadas(habitacionObjetivo.sector);
  const habitacionesQuincho = await getHabitacionesOrdenadas('quincho');
  const todasHabitaciones = [...habitacionesSector, ...habitacionesQuincho];

  // IDs de habitaciones ya ocupadas esta semana
  const habitacionesOcupadas = todasLasReservas
    .filter(r => r.id !== reservaExistente.id)
    .map(r => r.habitacionId);

  // Buscar habitación inferior disponible
  const indexCategoriaActual = ORDEN_CATEGORIAS.indexOf(habitacionObjetivo.categoria);
  let habitacionDestino: Habitacion | null = null;

  // Primero buscar en el mismo sector
  for (let i = indexCategoriaActual + 1; i < ORDEN_CATEGORIAS.length; i++) {
    const categoria = ORDEN_CATEGORIAS[i];
    habitacionDestino = habitacionesSector.find(
      h => h.categoria === categoria &&
          !habitacionesOcupadas.includes(h.id) &&
          h.id !== habitacionObjetivo.id
    ) || null;

    if (habitacionDestino) break;
  }

  // Si no hay en el sector, buscar en quincho
  if (!habitacionDestino) {
    habitacionDestino = habitacionesQuincho.find(
      h => !habitacionesOcupadas.includes(h.id)
    ) || null;
  }

  if (!habitacionDestino) {
    // Intentar efecto cascada: mudar a otra persona de menor prioridad
    const reservasInferiores = todasLasReservas.filter(
      r => r.prioridad > reservaExistente.prioridad && r.id !== reservaExistente.id
    );

    for (const resInferior of reservasInferiores) {
      const habInferior = todasHabitaciones.find(h => h.id === resInferior.habitacionId);
      if (habInferior) {
        // Recursión para efecto cascada
        const resultadoCascada = await resolverMudanza(
          {
            usuarioId: reservaExistente.usuarioId,
            usuarioNombre: reservaExistente.usuarioNombre,
            prioridad: reservaExistente.prioridad,
            habitacionId: habInferior.id,
            fechaShabbat: reservaNueva.fechaShabbat,
          },
          resInferior,
          habInferior,
          todasLasReservas.filter(r => r.id !== reservaExistente.id)
        );

        if (resultadoCascada.exitoso) {
          habitacionDestino = habInferior;
          mudanzas.push(...resultadoCascada.mudanzas);
          notificaciones.push(...resultadoCascada.notificaciones);
          break;
        }
      }
    }
  }

  if (!habitacionDestino) {
    return {
      exitoso: false,
      mudanzas: [],
      notificaciones: [],
      error: 'No hay habitaciones disponibles para la mudanza',
    };
  }

  // Registrar la mudanza
  const mudanzaLog: MudanzaLog = {
    fecha: new Date(),
    habitacionAnterior: habitacionObjetivo.nombre,
    habitacionNueva: habitacionDestino.nombre,
    motivoUsuarioId: reservaNueva.usuarioId,
    motivoUsuarioNombre: reservaNueva.usuarioNombre,
  };
  mudanzas.push(mudanzaLog);

  // Actualizar la reserva existente
  await actualizarReserva(reservaExistente.id, {
    habitacionId: habitacionDestino.id,
    habitacionNombre: habitacionDestino.nombre,
    estado: 'mudada',
    historialMudanzas: [...(reservaExistente.historialMudanzas || []), mudanzaLog],
  });

  // Crear notificación
  const notificacion: Notificacion = {
    id: uuidv4(),
    usuarioId: reservaExistente.usuarioId,
    titulo: 'Tu reserva ha sido mudada',
    mensaje: `Tu reserva en ${habitacionObjetivo.nombre} ha sido mudada a ${habitacionDestino.nombre} debido a una reserva de mayor prioridad.`,
    tipo: 'mudanza',
    leida: false,
    datos: {
      reservaId: reservaExistente.id,
      habitacionAnterior: habitacionObjetivo.id,
      habitacionNueva: habitacionDestino.id,
    },
    createdAt: new Date(),
  };
  notificaciones.push(notificacion);

  return {
    exitoso: true,
    mudanzas,
    notificaciones,
  };
}

// Obtener disponibilidad de habitaciones para una semana
export async function getDisponibilidadSemana(fechaShabbat: Date): Promise<{
  habitacionId: string;
  habitacionNombre: string;
  disponible: boolean;
  reserva?: Reserva;
}[]> {
  const { getHabitaciones } = await import('./habitaciones');
  const habitaciones = await getHabitaciones();
  const reservas = await getReservasPorSemana(fechaShabbat);

  return habitaciones.map(hab => {
    const reserva = reservas.find(r => r.habitacionId === hab.id && r.estado !== 'cancelada');
    return {
      habitacionId: hab.id,
      habitacionNombre: hab.nombre,
      disponible: !reserva,
      reserva,
    };
  });
}
