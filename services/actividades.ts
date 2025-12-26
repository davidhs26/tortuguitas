import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Actividad, TipoActividad, ParticipanteActividad, EquipoFutbol, Usuario } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays } from 'date-fns';

const COLLECTION_NAME = 'actividades';

// Crear nueva actividad
export async function crearActividad(
  tipo: TipoActividad,
  fechaShabbat: Date,
  fecha: Date
): Promise<Actividad> {
  const actividadId = uuidv4();

  const actividad: Actividad = {
    id: actividadId,
    tipo,
    fechaShabbat,
    fecha,
    participantes: [],
    aprobada: tipo !== 'asado_noche', // Asados nocturnos requieren aprobación
    createdAt: new Date(),
  };

  await setDoc(doc(db, COLLECTION_NAME, actividadId), {
    ...actividad,
    fechaShabbat: fechaShabbat.toISOString(),
    fecha: fecha.toISOString(),
    createdAt: serverTimestamp(),
  });

  return actividad;
}

// Obtener actividades por semana
export async function getActividadesPorSemana(fechaShabbat: Date): Promise<Actividad[]> {
  const fechaStr = format(fechaShabbat, 'yyyy-MM-dd');

  const q = query(
    collection(db, COLLECTION_NAME),
    where('fechaShabbat', '>=', fechaStr),
    where('fechaShabbat', '<=', fechaStr + 'T23:59:59')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    fechaShabbat: new Date(doc.data().fechaShabbat),
    fecha: new Date(doc.data().fecha),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Actividad[];
}

// Inscribirse en actividad
export async function inscribirseActividad(
  actividadId: string,
  usuario: Usuario
): Promise<void> {
  const actividadRef = doc(db, COLLECTION_NAME, actividadId);
  const actividadSnap = await getDoc(actividadRef);

  if (!actividadSnap.exists()) {
    throw new Error('Actividad no encontrada');
  }

  const actividad = actividadSnap.data() as Actividad;
  const yaInscrito = actividad.participantes.some(p => p.usuarioId === usuario.id);

  if (yaInscrito) {
    throw new Error('Ya estás inscrito en esta actividad');
  }

  const nuevoParticipante: ParticipanteActividad = {
    usuarioId: usuario.id,
    nombre: `${usuario.nombre} ${usuario.apellido}`,
    confirmado: true,
  };

  await updateDoc(actividadRef, {
    participantes: [...actividad.participantes, nuevoParticipante],
  });
}

// Desinscribirse de actividad
export async function desinscribirseActividad(
  actividadId: string,
  usuarioId: string
): Promise<void> {
  const actividadRef = doc(db, COLLECTION_NAME, actividadId);
  const actividadSnap = await getDoc(actividadRef);

  if (!actividadSnap.exists()) {
    throw new Error('Actividad no encontrada');
  }

  const actividad = actividadSnap.data() as Actividad;
  const participantesActualizados = actividad.participantes.filter(
    p => p.usuarioId !== usuarioId
  );

  await updateDoc(actividadRef, {
    participantes: participantesActualizados,
  });
}

// ============================================
// FÚTBOL
// ============================================

// Armar equipos de fútbol automáticamente
export async function armarEquiposFutbol(actividadId: string): Promise<EquipoFutbol[]> {
  const actividadRef = doc(db, COLLECTION_NAME, actividadId);
  const actividadSnap = await getDoc(actividadRef);

  if (!actividadSnap.exists()) {
    throw new Error('Actividad no encontrada');
  }

  const actividad = actividadSnap.data() as Actividad;

  if (actividad.tipo !== 'futbol') {
    throw new Error('Esta actividad no es de fútbol');
  }

  const participantes = [...actividad.participantes];

  // Mezclar aleatoriamente
  for (let i = participantes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participantes[i], participantes[j]] = [participantes[j], participantes[i]];
  }

  // Dividir en 2 equipos
  const mitad = Math.ceil(participantes.length / 2);
  const equipos: EquipoFutbol[] = [
    {
      nombre: 'Equipo A',
      jugadores: participantes.slice(0, mitad).map(p => p.nombre),
    },
    {
      nombre: 'Equipo B',
      jugadores: participantes.slice(mitad).map(p => p.nombre),
    },
  ];

  await updateDoc(actividadRef, { equipos });

  return equipos;
}

// ============================================
// ASADO
// ============================================

// Calcular estimación de carne para asado
export async function calcularEstimacionCarne(
  actividadId: string,
  kgPorPersona: number = 0.5
): Promise<number> {
  const actividadRef = doc(db, COLLECTION_NAME, actividadId);
  const actividadSnap = await getDoc(actividadRef);

  if (!actividadSnap.exists()) {
    throw new Error('Actividad no encontrada');
  }

  const actividad = actividadSnap.data() as Actividad;
  const cantidadPersonas = actividad.participantes.length;
  const estimacion = cantidadPersonas * kgPorPersona;

  await updateDoc(actividadRef, { estimacionCarne: estimacion });

  return estimacion;
}

// Solicitar asado nocturno (requiere aprobación)
export async function solicitarAsadoNocturno(
  fechaShabbat: Date,
  solicitanteId: string,
  notas?: string
): Promise<Actividad> {
  // El asado nocturno es el viernes por la noche
  const fechaAsado = new Date(fechaShabbat);
  fechaAsado.setHours(21, 0, 0, 0);

  const actividad = await crearActividad('asado_noche', fechaShabbat, fechaAsado);

  // Marcar como pendiente de aprobación
  await updateDoc(doc(db, COLLECTION_NAME, actividad.id), {
    aprobada: false,
    notas,
    solicitanteId,
  });

  return { ...actividad, aprobada: false };
}

// Aprobar asado nocturno (solo admin)
export async function aprobarAsadoNocturno(actividadId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, actividadId), {
    aprobada: true,
  });
}

// ============================================
// MINYAN
// ============================================

// Calcular minyan (varones mayores de 13 años)
export async function calcularMinyan(fechaShabbat: Date): Promise<{
  cantidad: number;
  completo: boolean;
  faltantes: number;
  participantes: string[];
}> {
  const { getReservasPorSemana } = await import('./reservas');
  const reservas = await getReservasPorSemana(fechaShabbat);

  const varonesConfirmados: string[] = [];
  const hoy = new Date();

  for (const reserva of reservas) {
    if (reserva.estado === 'cancelada') continue;

    // Verificar participantes
    for (const participante of [...reserva.participantes, ...reserva.invitados]) {
      if (participante.genero === 'varon') {
        // Calcular edad
        const edad = participante.edad || 0;

        if (edad >= 13) {
          varonesConfirmados.push(participante.nombre);
        }
      }
    }
  }

  const cantidad = varonesConfirmados.length;
  const MINYAN_REQUERIDO = 10;

  return {
    cantidad,
    completo: cantidad >= MINYAN_REQUERIDO,
    faltantes: Math.max(0, MINYAN_REQUERIDO - cantidad),
    participantes: varonesConfirmados,
  };
}

// Crear actividad de minyan para una semana
export async function crearMinyan(fechaShabbat: Date): Promise<Actividad> {
  // El minyan es el sábado por la mañana
  const fechaMinyan = addDays(fechaShabbat, 1);
  fechaMinyan.setHours(9, 0, 0, 0);

  return crearActividad('minyan', fechaShabbat, fechaMinyan);
}

// Obtener o crear actividades para una semana
export async function getOCrearActividadesSemana(fechaShabbat: Date): Promise<Actividad[]> {
  let actividades = await getActividadesPorSemana(fechaShabbat);

  if (actividades.length === 0) {
    // Crear actividades por defecto
    const domingo = addDays(fechaShabbat, 2);
    domingo.setHours(12, 0, 0, 0);

    const futbol = await crearActividad('futbol', fechaShabbat, domingo);
    const asadoDomingo = await crearActividad('asado_domingo', fechaShabbat, domingo);
    const minyan = await crearMinyan(fechaShabbat);

    actividades = [futbol, asadoDomingo, minyan];
  }

  return actividades;
}
