import * as Notifications from 'expo-notifications';
import * as Device from 'expo-constants';
import { Platform } from 'react-native';
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
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { Notificacion, Usuario } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { updatePushToken } from './auth';

const COLLECTION_NAME = 'notificaciones';

// Configurar handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Registrar para notificaciones push
export async function registrarParaPush(userId: string): Promise<string | null> {
  let token: string | null = null;

  if (!Device.default.isDevice) {
    console.log('Push notifications solo funcionan en dispositivos físicos');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permisos de notificaciones no otorgados');
    return null;
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    token = pushToken.data;

    // Guardar token en el usuario
    await updatePushToken(userId, token);

    // Configurar canal para Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registrando push token:', error);
    return null;
  }
}

// Crear notificación en Firestore
export async function crearNotificacion(
  usuarioId: string,
  titulo: string,
  mensaje: string,
  tipo: Notificacion['tipo'],
  datos?: Record<string, any>
): Promise<Notificacion> {
  const notificacionId = uuidv4();

  const notificacion: Notificacion = {
    id: notificacionId,
    usuarioId,
    titulo,
    mensaje,
    tipo,
    leida: false,
    datos,
    createdAt: new Date(),
  };

  await setDoc(doc(db, COLLECTION_NAME, notificacionId), {
    ...notificacion,
    createdAt: serverTimestamp(),
  });

  // Enviar push notification
  await enviarPushNotification(usuarioId, titulo, mensaje, datos);

  return notificacion;
}

// Enviar push notification
export async function enviarPushNotification(
  usuarioId: string,
  titulo: string,
  mensaje: string,
  datos?: Record<string, any>
): Promise<void> {
  // Obtener token del usuario
  const userDoc = await getDoc(doc(db, 'users', usuarioId));

  if (!userDoc.exists()) {
    return;
  }

  const pushToken = userDoc.data().pushToken;

  if (!pushToken) {
    console.log('Usuario no tiene push token registrado');
    return;
  }

  // Enviar via Expo Push API
  const message = {
    to: pushToken,
    sound: 'default',
    title: titulo,
    body: mensaje,
    data: datos || {},
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Error enviando push notification:', error);
  }
}

// Obtener notificaciones de un usuario
export async function getNotificacionesUsuario(
  usuarioId: string,
  soloNoLeidas: boolean = false
): Promise<Notificacion[]> {
  let q = query(
    collection(db, COLLECTION_NAME),
    where('usuarioId', '==', usuarioId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  if (soloNoLeidas) {
    q = query(
      collection(db, COLLECTION_NAME),
      where('usuarioId', '==', usuarioId),
      where('leida', '==', false),
      orderBy('createdAt', 'desc')
    );
  }

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Notificacion[];
}

// Marcar notificación como leída
export async function marcarComoLeida(notificacionId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, notificacionId), {
    leida: true,
  });
}

// Marcar todas como leídas
export async function marcarTodasComoLeidas(usuarioId: string): Promise<void> {
  const notificaciones = await getNotificacionesUsuario(usuarioId, true);

  for (const notif of notificaciones) {
    await marcarComoLeida(notif.id);
  }
}

// Contar notificaciones no leídas
export async function contarNoLeidas(usuarioId: string): Promise<number> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('usuarioId', '==', usuarioId),
    where('leida', '==', false)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.length;
}

// ============================================
// NOTIFICACIONES PREDEFINIDAS
// ============================================

// Notificar reserva confirmada
export async function notificarReservaConfirmada(
  usuarioId: string,
  habitacionNombre: string,
  fechaShabbat: string
): Promise<void> {
  await crearNotificacion(
    usuarioId,
    'Reserva Confirmada',
    `Tu reserva en ${habitacionNombre} para el Shabbat del ${fechaShabbat} ha sido confirmada.`,
    'reserva',
    { tipo: 'confirmada' }
  );
}

// Notificar mudanza
export async function notificarMudanza(
  usuarioId: string,
  habitacionAnterior: string,
  habitacionNueva: string,
  motivoUsuario: string
): Promise<void> {
  await crearNotificacion(
    usuarioId,
    'Reserva Mudada',
    `Tu reserva en ${habitacionAnterior} ha sido mudada a ${habitacionNueva} debido a una reserva de mayor prioridad de ${motivoUsuario}.`,
    'mudanza',
    { habitacionAnterior, habitacionNueva, motivoUsuario }
  );
}

// Notificar pago pendiente
export async function notificarPagoPendiente(
  usuarioId: string,
  monto: number,
  concepto: string
): Promise<void> {
  await crearNotificacion(
    usuarioId,
    'Pago Pendiente',
    `Tienes un pago pendiente de $${monto} por ${concepto}.`,
    'pago',
    { monto, concepto }
  );
}

// Notificar pago recibido
export async function notificarPagoRecibido(
  usuarioId: string,
  monto: number,
  concepto: string
): Promise<void> {
  await crearNotificacion(
    usuarioId,
    'Pago Recibido',
    `Hemos recibido tu pago de $${monto} por ${concepto}. ¡Gracias!`,
    'pago',
    { monto, concepto }
  );
}

// Notificar recordatorio de reserva
export async function notificarRecordatorioReserva(
  usuarioId: string,
  habitacionNombre: string,
  diasRestantes: number
): Promise<void> {
  await crearNotificacion(
    usuarioId,
    'Recordatorio de Shabbat',
    `Tu reserva en ${habitacionNombre} es en ${diasRestantes} días. ¡No olvides confirmar tu asistencia!`,
    'recordatorio',
    { diasRestantes }
  );
}

// Notificar actividad próxima
export async function notificarActividadProxima(
  usuarioId: string,
  tipoActividad: string,
  hora: string
): Promise<void> {
  await crearNotificacion(
    usuarioId,
    `${tipoActividad} Próximo`,
    `El ${tipoActividad} comenzará a las ${hora}. ¡No faltes!`,
    'actividad',
    { tipoActividad, hora }
  );
}

// Notificar aprobación de asado nocturno
export async function notificarAsadoAprobado(
  usuarioId: string,
  fecha: string
): Promise<void> {
  await crearNotificacion(
    usuarioId,
    'Asado Nocturno Aprobado',
    `Tu solicitud de asado nocturno para el ${fecha} ha sido aprobada.`,
    'actividad',
    { tipo: 'asado_aprobado' }
  );
}

// Notificar falta de minyan
export async function notificarFaltaMinyan(
  usuarioId: string,
  faltantes: number
): Promise<void> {
  await crearNotificacion(
    usuarioId,
    'Minyan Incompleto',
    `Faltan ${faltantes} varones para completar el minyan este Shabbat.`,
    'admin',
    { faltantes }
  );
}
