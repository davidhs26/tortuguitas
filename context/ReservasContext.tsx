import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  const { user } = useAuth();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [misReservas, setMisReservas] = useState<Reserva[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadHabitacion[]>([]);
  const [reservaActual, setReservaActual] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proximoShabbat = getProximoShabbat();
  const puedeReservar = enPeriodoReservas(proximoShabbat);
  const puedeInvitar = enPeriodoInvitados(proximoShabbat);

  const cargarReservasSemana = useCallback(async (fechaShabbat: Date) => {
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
  }, []);

  const cargarMisReservas = useCallback(async () => {
    if (!user) return;

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
  }, [user]);

  const cargarHabitaciones = useCallback(async () => {
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
  }, []);

  const cargarDisponibilidad = useCallback(async (fechaShabbat: Date) => {
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
  }, []);

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
  }, []);

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
