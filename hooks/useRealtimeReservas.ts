import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Reserva } from '@/types';

interface UseRealtimeReservasOptions {
  userId?: string;
  fechaShabbat?: Date;
  enabled?: boolean;
}

interface UseRealtimeReservasResult {
  reservas: Reserva[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook for real-time reservation updates using Firebase listeners
 */
export function useRealtimeReservas({
  userId,
  fechaShabbat,
  enabled = true,
}: UseRealtimeReservasOptions = {}): UseRealtimeReservasResult {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: Unsubscribe | null = null;

    const setupListener = async () => {
      try {
        let q = query(
          collection(db, 'reservas'),
          orderBy('fechaShabbat', 'desc')
        );

        if (userId) {
          q = query(
            collection(db, 'reservas'),
            where('usuarioId', '==', userId),
            orderBy('fechaShabbat', 'desc')
          );
        }

        if (fechaShabbat) {
          const startOfDay = new Date(fechaShabbat);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(fechaShabbat);
          endOfDay.setHours(23, 59, 59, 999);

          q = query(
            collection(db, 'reservas'),
            where('fechaShabbat', '>=', startOfDay),
            where('fechaShabbat', '<=', endOfDay),
            orderBy('fechaShabbat', 'desc')
          );
        }

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const reservasData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              fechaShabbat: doc.data().fechaShabbat?.toDate() || new Date(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Reserva[];

            setReservas(reservasData);
            setLoading(false);
          },
          (err) => {
            console.error('Error in realtime reservas listener:', err);
            setError(err as Error);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error setting up realtime listener:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId, fechaShabbat, enabled, refreshTrigger]);

  return { reservas, loading, error, refresh };
}

/**
 * Hook for real-time availability updates
 */
export function useRealtimeDisponibilidad(fechaShabbat: Date) {
  const [disponibilidad, setDisponibilidad] = useState<
    Array<{
      habitacionId: string;
      disponible: boolean;
      reserva?: { id: string; usuarioNombre: string };
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const startOfDay = new Date(fechaShabbat);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaShabbat);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'reservas'),
      where('fechaShabbat', '>=', startOfDay),
      where('fechaShabbat', '<=', endOfDay),
      where('estado', '!=', 'cancelada')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reservasActivas = snapshot.docs.map(doc => ({
          habitacionId: doc.data().habitacionId,
          reserva: {
            id: doc.id,
            usuarioNombre: doc.data().usuarioNombre,
          },
        }));

        // This should be combined with habitaciones data
        setDisponibilidad(
          reservasActivas.map(r => ({
            habitacionId: r.habitacionId,
            disponible: false,
            reserva: r.reserva,
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error('Error in disponibilidad listener:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fechaShabbat]);

  return { disponibilidad, loading };
}

/**
 * Hook for real-time notifications count
 */
export function useRealtimeNotificacionesCount(userId?: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', userId),
      where('leida', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCount(snapshot.docs.length);
      },
      (err) => {
        console.error('Error in notifications count listener:', err);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return count;
}
