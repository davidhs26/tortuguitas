import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Habitacion, Sector, CategoriaHabitacion } from '@/types';

const COLLECTION_NAME = 'habitaciones';

// Configuración inicial de habitaciones
export const HABITACIONES_INICIALES: Habitacion[] = [
  // Habitación libre - Abuela Luisa
  {
    id: 'abuela_luisa',
    nombre: 'Habitación Abuela Luisa',
    sector: 'libre',
    categoria: 'principal',
    capacidad: {
      camas: 2,
      camasMatrimoniales: 1,
      colchones: 2,
      cunas: 1,
      maxNinos: 3,
    },
    configuracion: 'Cama matrimonial separable en 2 camas simples. Espacio para 2 colchones en piso (hasta 3 niños). 1 cuna.',
    tieneBanoPrivado: true,
    activa: true,
  },
  // Sector David - 3 habitaciones
  {
    id: 'david_principal',
    nombre: 'Principal David (Suite)',
    sector: 'david',
    categoria: 'principal',
    capacidad: {
      camas: 2,
      camasMatrimoniales: 1,
      colchones: 1,
      cunas: 1,
      maxNinos: 2,
    },
    configuracion: 'Cama matrimonial separable. 1 colchón para niño. 1 cuna. Baño en suite.',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'david_suite_2',
    nombre: 'Secundaria David (Suite)',
    sector: 'david',
    categoria: 'en_suite',
    capacidad: {
      camas: 2,
      colchones: 1,
      cunas: 1,
      maxNinos: 2,
    },
    configuracion: '2 camas separadas. 1 colchón para niño y/o cuna. Baño en suite.',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'david_externa',
    nombre: 'Tercera David (Baño externo)',
    sector: 'david',
    categoria: 'bano_externo',
    capacidad: {
      camas: 2,
      colchones: 1,
      cunas: 1,
      maxNinos: 2,
    },
    configuracion: '2 camas separadas. 1 colchón para niño y/o cuna. Baño externo.',
    tieneBanoPrivado: false,
    activa: true,
  },
  // Sector Mumi - 3 habitaciones
  {
    id: 'mumi_principal',
    nombre: 'Principal Mumi (Suite)',
    sector: 'mumi',
    categoria: 'principal',
    capacidad: {
      camas: 2,
      camasMatrimoniales: 1,
      colchones: 1,
      cunas: 1,
      maxNinos: 2,
    },
    configuracion: 'Cama matrimonial separable. 1 colchón para niño. 1 cuna. Baño en suite.',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'mumi_suite_2',
    nombre: 'Secundaria Mumi (Suite)',
    sector: 'mumi',
    categoria: 'en_suite',
    capacidad: {
      camas: 2,
      colchones: 1,
      cunas: 1,
      maxNinos: 2,
    },
    configuracion: '2 camas separadas. 1 colchón para niño y/o cuna. Baño en suite.',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'mumi_externa',
    nombre: 'Tercera Mumi (Baño externo)',
    sector: 'mumi',
    categoria: 'bano_externo',
    capacidad: {
      camas: 2,
      colchones: 1,
      cunas: 1,
      maxNinos: 2,
    },
    configuracion: '2 camas separadas. 1 colchón para niño y/o cuna. Baño externo.',
    tieneBanoPrivado: false,
    activa: true,
  },
  // Sector Tuni - 3 habitaciones
  {
    id: 'tuni_principal',
    nombre: 'Principal Tuni (Suite)',
    sector: 'tuni',
    categoria: 'principal',
    capacidad: {
      camas: 2,
      camasMatrimoniales: 1,
      colchones: 1,
      cunas: 1,
      maxNinos: 2,
    },
    configuracion: 'Cama matrimonial separable. 1 colchón para niño. 1 cuna. Baño en suite.',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'tuni_suite_2',
    nombre: 'Secundaria Tuni (Suite)',
    sector: 'tuni',
    categoria: 'en_suite',
    capacidad: {
      camas: 2,
      colchones: 1,
      cunas: 1,
      maxNinos: 2,
    },
    configuracion: '2 camas separadas. 1 colchón para niño y/o cuna. Baño en suite.',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'tuni_suite_3',
    nombre: 'Tercera Tuni (Suite)',
    sector: 'tuni',
    categoria: 'en_suite',
    capacidad: {
      camas: 2,
      colchones: 1,
      cunas: 1,
      maxNinos: 2,
    },
    configuracion: '2 camas separadas. 1 colchón para niño y/o cuna. Baño en suite.',
    tieneBanoPrivado: true,
    activa: true,
  },
  // Quincho - Dormis
  {
    id: 'quincho_dormi1_hab1',
    nombre: 'Quincho Dormi 1 - Hab Matrimonial',
    sector: 'quincho',
    categoria: 'quincho',
    capacidad: {
      camas: 2,
      camasMatrimoniales: 1,
      colchones: 1,
      cunas: 0,
      maxNinos: 1,
    },
    configuracion: 'Cama matrimonial (no separable). Baño compartido con hab 2.',
    tieneBanoPrivado: false,
    activa: true,
  },
  {
    id: 'quincho_dormi1_hab2',
    nombre: 'Quincho Dormi 1 - Hab Triple',
    sector: 'quincho',
    categoria: 'quincho',
    capacidad: {
      camas: 3,
      colchones: 1,
      cunas: 0,
      maxNinos: 2,
    },
    configuracion: '3 camas separadas. 1 colchón (restringe movilidad). Baño compartido.',
    tieneBanoPrivado: false,
    activa: true,
  },
  {
    id: 'quincho_dormi2_hab1',
    nombre: 'Quincho Dormi 2 - Hab Matrimonial',
    sector: 'quincho',
    categoria: 'quincho',
    capacidad: {
      camas: 2,
      camasMatrimoniales: 1,
      colchones: 1,
      cunas: 0,
      maxNinos: 1,
    },
    configuracion: 'Cama matrimonial (no separable). Baño compartido con hab 2.',
    tieneBanoPrivado: false,
    activa: true,
  },
  {
    id: 'quincho_dormi2_hab2',
    nombre: 'Quincho Dormi 2 - Hab Triple',
    sector: 'quincho',
    categoria: 'quincho',
    capacidad: {
      camas: 3,
      colchones: 1,
      cunas: 0,
      maxNinos: 2,
    },
    configuracion: '3 camas separadas. 1 colchón (restringe movilidad). Baño compartido.',
    tieneBanoPrivado: false,
    activa: true,
  },
  {
    id: 'quincho_grande',
    nombre: 'Quincho Habitación Grande',
    sector: 'quincho',
    categoria: 'quincho',
    capacidad: {
      camas: 5,
      colchones: 0,
      cunas: 0,
      maxNinos: 3,
    },
    configuracion: '5 camas separadas. 1 baño.',
    tieneBanoPrivado: true,
    activa: true,
  },
];

// Orden de categorías para mudanzas (mayor a menor prioridad)
export const ORDEN_CATEGORIAS: CategoriaHabitacion[] = [
  'principal',
  'en_suite',
  'bano_externo',
  'quincho',
];

// Inicializar habitaciones en Firestore
export async function inicializarHabitaciones(): Promise<void> {
  for (const habitacion of HABITACIONES_INICIALES) {
    await setDoc(doc(db, COLLECTION_NAME, habitacion.id), habitacion);
  }
}

// Obtener todas las habitaciones
export async function getHabitaciones(): Promise<Habitacion[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as Habitacion[];
}

// Obtener habitación por ID
export async function getHabitacion(id: string): Promise<Habitacion | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { ...docSnap.data(), id: docSnap.id } as Habitacion;
}

// Obtener habitaciones por sector
export async function getHabitacionesPorSector(sector: Sector): Promise<Habitacion[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('sector', '==', sector),
    where('activa', '==', true)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  })) as Habitacion[];
}

// Obtener habitaciones ordenadas por categoría (para algoritmo de mudanzas)
export async function getHabitacionesOrdenadas(sector: Sector): Promise<Habitacion[]> {
  const habitaciones = await getHabitacionesPorSector(sector);

  return habitaciones.sort((a, b) => {
    const indexA = ORDEN_CATEGORIAS.indexOf(a.categoria);
    const indexB = ORDEN_CATEGORIAS.indexOf(b.categoria);
    return indexA - indexB;
  });
}

// Buscar habitación inferior disponible en un sector
export function buscarHabitacionInferior(
  habitaciones: Habitacion[],
  categoriaActual: CategoriaHabitacion,
  habitacionesOcupadas: string[]
): Habitacion | null {
  const indexActual = ORDEN_CATEGORIAS.indexOf(categoriaActual);

  // Buscar en categorías inferiores
  for (let i = indexActual + 1; i < ORDEN_CATEGORIAS.length; i++) {
    const categoria = ORDEN_CATEGORIAS[i];
    const disponible = habitaciones.find(
      h => h.categoria === categoria && !habitacionesOcupadas.includes(h.id)
    );
    if (disponible) {
      return disponible;
    }
  }

  return null;
}
