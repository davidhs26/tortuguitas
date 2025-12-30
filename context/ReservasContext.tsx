import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Reserva, Habitacion, ParticipanteReserva, ResultadoMudanza } from '@/types';
import {
  crearReserva,
  getReservasPorSemana,
  getReservasUsuario,
  getReserva,
  actualizarReserva,
  cancelarReserva,
  getDisponibilidadSemana,
  enPeriodoReservas,
  enPeriodoInvitados,
  getProximoShabbat,
} from '@/services/reservas';
import { getHabitaciones, getHabitacion } from '@/services/habitaciones';
import { useAuth } from './AuthContext';
import { addDays } from 'date-fns';

// ==========================================
// DATOS MOCK PARA MODO DEMO
// ==========================================
const MOCK_HABITACIONES: Habitacion[] = [
  {
    id: 'hab-1',
    nombre: 'Habitación Principal David',
    sector: 'david',
    categoria: 'principal',
    capacidad: { camas: 2, camasMatrimoniales: 1, colchones: 2, cunas: 1, maxNinos: 3 },
    configuracion: 'Cama matrimonial + 2 colchones + cuna',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'hab-2',
    nombre: 'Habitación Azul David',
    sector: 'david',
    categoria: 'en_suite',
    capacidad: { camas: 3, colchones: 1, cunas: 0, maxNinos: 2 },
    configuracion: '3 camas individuales + 1 colchón',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'hab-3',
    nombre: 'Habitación Verde David',
    sector: 'david',
    categoria: 'bano_externo',
    capacidad: { camas: 2, colchones: 2, cunas: 1, maxNinos: 2 },
    configuracion: '2 camas + 2 colchones + cuna',
    tieneBanoPrivado: false,
    activa: true,
  },
  {
    id: 'hab-4',
    nombre: 'Habitación Principal Mumi',
    sector: 'mumi',
    categoria: 'principal',
    capacidad: { camas: 2, camasMatrimoniales: 1, colchones: 2, cunas: 1, maxNinos: 3 },
    configuracion: 'Cama matrimonial + 2 colchones + cuna',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'hab-5',
    nombre: 'Habitación Rosa Mumi',
    sector: 'mumi',
    categoria: 'en_suite',
    capacidad: { camas: 2, colchones: 2, cunas: 0, maxNinos: 2 },
    configuracion: '2 camas + 2 colchones',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'hab-6',
    nombre: 'Habitación Principal Tuni',
    sector: 'tuni',
    categoria: 'principal',
    capacidad: { camas: 2, camasMatrimoniales: 1, colchones: 3, cunas: 1, maxNinos: 4 },
    configuracion: 'Cama matrimonial + 3 colchones + cuna',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'hab-7',
    nombre: 'Habitación Amarilla Tuni',
    sector: 'tuni',
    categoria: 'en_suite',
    capacidad: { camas: 3, colchones: 1, cunas: 0, maxNinos: 2 },
    configuracion: '3 camas individuales + 1 colchón',
    tieneBanoPrivado: true,
    activa: true,
  },
  {
    id: 'hab-8',
    nombre: 'Quincho Grande',
    sector: 'quincho',
    categoria: 'quincho',
    capacidad: { camas: 0, colchones: 6, cunas: 0, maxNinos: 4 },
    configuracion: '6 colchones en espacio abierto',
    tieneBanoPrivado: false,
    activa: true,
  },
];

const createMockReservas = (proximoShabbat: Date, userId: string): Reserva[] => [
  {
    id: 'reserva-demo-1',
    usuarioId: userId,
    usuarioNombre: 'Usuario Demo',
    habitacionId: 'hab-1',
    habitacionNombre: 'Habitación Principal David',
    fechaShabbat: proximoShabbat,
    participantes: [
      { id: 'p1', nombre: 'Usuario Demo', genero: 'varon', edad: 35, esInvitado: false },
      { id: 'p2', nombre: 'María Demo', genero: 'mujer', edad: 9, esInvitado: false },
      { id: 'p3', nombre: 'Tomás Demo', genero: 'varon', edad: 6, esInvitado: false },
    ],
    estado: 'confirmada',
    prioridad: 2,
    fechaReserva: new Date(),
    invitados: [],
    pagado: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'reserva-demo-2',
    usuarioId: 'otro-usuario',
    usuarioNombre: 'Juan Pérez',
    habitacionId: 'hab-4',
    habitacionNombre: 'Habitación Principal Mumi',
    fechaShabbat: proximoShabbat,
    participantes: [
      { id: 'p4', nombre: 'Juan Pérez', genero: 'varon', edad: 42, esInvitado: false },
      { id: 'p5', nombre: 'Ana Pérez', genero: 'mujer', edad: 38, esInvitado: false },
    ],
    estado: 'confirmada',
    prioridad: 1,
    fechaReserva: new Date(),
    invitados: [],
    pagado: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const createMockDisponibilidad = (habitaciones: Habitacion[], reservas: Reserva[]) => {
  return habitaciones.map(hab => {
    const reserva = reservas.find(r => r.habitacionId === hab.id);
    return {
      habitacionId: hab.id,
      habitacionNombre: hab.nombre,
      disponible: !reserva,
      reserva: reserva,
    };
  });
};

interface DisponibilidadHabitacion {
  habitacionId: string;
  habitacionNombre: string;
  disponible: boolean;
  reserva?: Reserva;
}

interface ReservasContextType {
  reservas: Reserva[];
  misReservas: Reserva[];
  habitaciones: Habitacion[];
  disponibilidad: DisponibilidadHabitacion[];
  reservaActual: Reserva | null;
  loading: boolean;
  error: string | null;
  proximoShabbat: Date;
  puedeReservar: boolean;
  puedeInvitar: boolean;
  cargarReservasSemana: (fechaShabbat: Date) => Promise<void>;
  cargarMisReservas: () => Promise<void>;
  cargarHabitaciones: () => Promise<void>;
  cargarDisponibilidad: (fechaShabbat: Date) => Promise<void>;
  hacerReserva: (
    habitacionId: string,
    fechaShabbat: Date,
    participantes: ParticipanteReserva[],
    invitados?: ParticipanteReserva[],
    notas?: string
  ) => Promise<{ reserva: Reserva; mudanzas: ResultadoMudanza | null }>;
  cancelarMiReserva: (reservaId: string) => Promise<void>;
  seleccionarReserva: (reservaId: string) => Promise<void>;
  clearError: () => void;
}

const ReservasContext = createContext<ReservasContextType | undefined>(undefined);

export function ReservasProvider({ children }: { children: ReactNode }) {
  const { user, isDemo } = useAuth();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [misReservas, setMisReservas] = useState<Reserva[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadHabitacion[]>([]);
  const [reservaActual, setReservaActual] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proximoShabbat = getProximoShabbat();
  const puedeReservar = isDemo ? true : enPeriodoReservas(proximoShabbat);
  const puedeInvitar = isDemo ? true : enPeriodoInvitados(proximoShabbat);

  // Cargar datos mock cuando estamos en modo demo
  useEffect(() => {
    if (isDemo && user) {
      const mockReservas = createMockReservas(proximoShabbat, user.id);
      setHabitaciones(MOCK_HABITACIONES);
      setReservas(mockReservas);
      setMisReservas(mockReservas.filter(r => r.usuarioId === user.id));
      setDisponibilidad(createMockDisponibilidad(MOCK_HABITACIONES, mockReservas));
    }
  }, [isDemo, user]);

  const cargarReservasSemana = useCallback(async (fechaShabbat: Date) => {
    if (isDemo && user) {
      const mockReservas = createMockReservas(fechaShabbat, user.id);
      setReservas(mockReservas);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getReservasPorSemana(fechaShabbat);
      setReservas(data);
    } catch (err: any) {
      setError('Error cargando reservas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isDemo, user]);

  const cargarMisReservas = useCallback(async () => {
    if (!user) return;

    if (isDemo) {
      const mockReservas = createMockReservas(proximoShabbat, user.id);
      setMisReservas(mockReservas.filter(r => r.usuarioId === user.id));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getReservasUsuario(user.id);
      setMisReservas(data);
    } catch (err: any) {
      setError('Error cargando tus reservas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, proximoShabbat]);

  const cargarHabitaciones = useCallback(async () => {
    if (isDemo) {
      setHabitaciones(MOCK_HABITACIONES);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getHabitaciones();
      setHabitaciones(data);
    } catch (err: any) {
      setError('Error cargando habitaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  const cargarDisponibilidad = useCallback(async (fechaShabbat: Date) => {
    if (isDemo && user) {
      const mockReservas = createMockReservas(fechaShabbat, user.id);
      setDisponibilidad(createMockDisponibilidad(MOCK_HABITACIONES, mockReservas));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getDisponibilidadSemana(fechaShabbat);
      setDisponibilidad(data);
    } catch (err: any) {
      setError('Error cargando disponibilidad');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isDemo, user]);

  const hacerReserva = useCallback(
    async (
      habitacionId: string,
      fechaShabbat: Date,
      participantes: ParticipanteReserva[],
      invitados: ParticipanteReserva[] = [],
      notas?: string
    ) => {
      if (!user) {
        throw new Error('Debes iniciar sesión para hacer una reserva');
      }

      setLoading(true);
      setError(null);

      try {
        const resultado = await crearReserva(
          user,
          habitacionId,
          fechaShabbat,
          participantes,
          invitados,
          notas
        );

        // Recargar datos
        await cargarReservasSemana(fechaShabbat);
        await cargarMisReservas();
        await cargarDisponibilidad(fechaShabbat);

        return resultado;
      } catch (err: any) {
        setError(err.message || 'Error al hacer la reserva');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, cargarReservasSemana, cargarMisReservas, cargarDisponibilidad]
  );

  const cancelarMiReserva = useCallback(
    async (reservaId: string) => {
      setLoading(true);
      setError(null);

      try {
        await cancelarReserva(reservaId);

        // Recargar datos
        await cargarMisReservas();
        await cargarDisponibilidad(proximoShabbat);
      } catch (err: any) {
        setError('Error al cancelar la reserva');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cargarMisReservas, cargarDisponibilidad, proximoShabbat]
  );

  const seleccionarReserva = useCallback(async (reservaId: string) => {
    if (isDemo && user) {
      const mockReservas = createMockReservas(proximoShabbat, user.id);
      const reserva = mockReservas.find(r => r.id === reservaId);
      if (reserva) {
        setReservaActual(reserva);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reserva = await getReserva(reservaId);
      setReservaActual(reserva);
    } catch (err: any) {
      setError('Error cargando reserva');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isDemo, user, proximoShabbat]);

  const clearError = () => setError(null);

  return (
    <ReservasContext.Provider
      value={{
        reservas,
        misReservas,
        habitaciones,
        disponibilidad,
        reservaActual,
        loading,
        error,
        proximoShabbat,
        puedeReservar,
        puedeInvitar,
        cargarReservasSemana,
        cargarMisReservas,
        cargarHabitaciones,
        cargarDisponibilidad,
        hacerReserva,
        cancelarMiReserva,
        seleccionarReserva,
        clearError,
      }}
    >
      {children}
    </ReservasContext.Provider>
  );
}

export function useReservas() {
  const context = useContext(ReservasContext);

  if (context === undefined) {
    throw new Error('useReservas debe usarse dentro de un ReservasProvider');
  }

  return context;
}
