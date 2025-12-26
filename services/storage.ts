import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  USER: '@tortuguitas/user',
  RESERVAS: '@tortuguitas/reservas',
  HABITACIONES: '@tortuguitas/habitaciones',
  NOTIFICACIONES: '@tortuguitas/notificaciones',
  SETTINGS: '@tortuguitas/settings',
  LAST_SYNC: '@tortuguitas/last_sync',
} as const;

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  USER: 24 * 60 * 60 * 1000, // 24 hours
  RESERVAS: 5 * 60 * 1000, // 5 minutes
  HABITACIONES: 30 * 60 * 1000, // 30 minutes
  NOTIFICACIONES: 5 * 60 * 1000, // 5 minutes
  SETTINGS: 7 * 24 * 60 * 60 * 1000, // 7 days
};

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Generic cache functions
export async function setCache<T>(key: string, data: T, expirationMs?: number): Promise<void> {
  try {
    const now = Date.now();
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: expirationMs ? now + expirationMs : now + CACHE_EXPIRATION.RESERVAS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheItem: CacheItem<T> = JSON.parse(cached);

    // Check if expired
    if (Date.now() > cacheItem.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

export async function clearCache(key?: string): Promise<void> {
  try {
    if (key) {
      await AsyncStorage.removeItem(key);
    } else {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// User cache
export async function cacheUser(user: any): Promise<void> {
  await setCache(CACHE_KEYS.USER, user, CACHE_EXPIRATION.USER);
}

export async function getCachedUser(): Promise<any | null> {
  return getCache(CACHE_KEYS.USER);
}

export async function clearUserCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEYS.USER);
}

// Reservas cache
export async function cacheReservas(reservas: any[]): Promise<void> {
  await setCache(CACHE_KEYS.RESERVAS, reservas, CACHE_EXPIRATION.RESERVAS);
}

export async function getCachedReservas(): Promise<any[] | null> {
  return getCache<any[]>(CACHE_KEYS.RESERVAS);
}

// Habitaciones cache
export async function cacheHabitaciones(habitaciones: any[]): Promise<void> {
  await setCache(CACHE_KEYS.HABITACIONES, habitaciones, CACHE_EXPIRATION.HABITACIONES);
}

export async function getCachedHabitaciones(): Promise<any[] | null> {
  return getCache<any[]>(CACHE_KEYS.HABITACIONES);
}

// Notificaciones cache
export async function cacheNotificaciones(notificaciones: any[]): Promise<void> {
  await setCache(CACHE_KEYS.NOTIFICACIONES, notificaciones, CACHE_EXPIRATION.NOTIFICACIONES);
}

export async function getCachedNotificaciones(): Promise<any[] | null> {
  return getCache<any[]>(CACHE_KEYS.NOTIFICACIONES);
}

// Settings cache
export interface AppSettings {
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  lastBiometricPrompt?: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  biometricEnabled: false,
  notificationsEnabled: true,
  darkModeEnabled: false,
};

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await setCache(CACHE_KEYS.SETTINGS, { ...current, ...settings }, CACHE_EXPIRATION.SETTINGS);
}

export async function getSettings(): Promise<AppSettings> {
  const cached = await getCache<AppSettings>(CACHE_KEYS.SETTINGS);
  return cached || DEFAULT_SETTINGS;
}

// Last sync tracking
export async function updateLastSync(): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
}

export async function getLastSync(): Promise<number | null> {
  const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
  return lastSync ? parseInt(lastSync, 10) : null;
}

// Offline queue for pending actions
const OFFLINE_QUEUE_KEY = '@tortuguitas/offline_queue';

interface QueuedAction {
  id: string;
  type: 'reserva' | 'cancelacion' | 'pago' | 'invitado';
  payload: any;
  createdAt: number;
}

export async function addToOfflineQueue(action: Omit<QueuedAction, 'id' | 'createdAt'>): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const newAction: QueuedAction = {
      ...action,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    queue.push(newAction);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
}

export async function getOfflineQueue(): Promise<QueuedAction[]> {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

export async function removeFromOfflineQueue(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter(a => a.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from offline queue:', error);
  }
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// Network status helpers
export async function isDataStale(key: string, maxAgeMs: number): Promise<boolean> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return true;

    const cacheItem = JSON.parse(cached);
    return Date.now() - cacheItem.timestamp > maxAgeMs;
  } catch (error) {
    return true;
  }
}
