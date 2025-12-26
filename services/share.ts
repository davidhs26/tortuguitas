import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reserva, Habitacion } from '@/types';

export interface ShareResult {
  success: boolean;
  action?: 'shared' | 'dismissed' | 'copied';
  error?: string;
}

/**
 * Share reservation details
 */
export async function shareReserva(reserva: Reserva): Promise<ShareResult> {
  try {
    const fechaShabbat = format(
      new Date(reserva.fechaShabbat),
      "EEEE d 'de' MMMM, yyyy",
      { locale: es }
    );

    const participantesText = reserva.participantes
      .map(p => `• ${p.nombre}`)
      .join('\n');

    const invitadosText = reserva.invitados.length > 0
      ? `\n\nInvitados:\n${reserva.invitados.map(i => `• ${i.nombre}`).join('\n')}`
      : '';

    const message = `🏠 Reserva en Tortuguitas

📍 Habitación: ${reserva.habitacionNombre}
📅 Shabbat: ${fechaShabbat}
👥 Participantes:
${participantesText}${invitadosText}

Estado: ${reserva.estado === 'confirmada' ? '✅ Confirmada' : '⏳ Pendiente'}
${reserva.pagado ? '💳 Pagada' : ''}

¡Nos vemos en Tortuguitas!`;

    const result = await Share.share(
      {
        message,
        title: `Reserva - ${reserva.habitacionNombre}`,
      },
      {
        dialogTitle: 'Compartir Reserva',
        subject: `Reserva en Tortuguitas - ${fechaShabbat}`,
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'shared' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, action: 'dismissed' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sharing reservation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Share room availability
 */
export async function shareHabitacion(
  habitacion: Habitacion,
  fechaShabbat: Date,
  disponible: boolean
): Promise<ShareResult> {
  try {
    const fechaText = format(fechaShabbat, "d 'de' MMMM", { locale: es });

    const message = `🏠 ${habitacion.nombre}

📍 Sector: ${habitacion.sector.charAt(0).toUpperCase() + habitacion.sector.slice(1)}
🛏️ Configuración: ${habitacion.configuracion}
👥 Capacidad: ${habitacion.capacidad.camas} camas${habitacion.capacidad.colchones > 0 ? `, ${habitacion.capacidad.colchones} colchones` : ''}

📅 Shabbat ${fechaText}
${disponible ? '✅ Disponible' : '❌ Ocupada'}

Tortuguitas - Quinta Familiar`;

    const result = await Share.share({
      message,
      title: habitacion.nombre,
    });

    return {
      success: result.action === Share.sharedAction,
      action: result.action === Share.sharedAction ? 'shared' : 'dismissed',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Copy reservation info to clipboard
 */
export async function copyReservaToClipboard(reserva: Reserva): Promise<ShareResult> {
  try {
    const fechaShabbat = format(
      new Date(reserva.fechaShabbat),
      'dd/MM/yyyy',
      { locale: es }
    );

    const text = `Reserva: ${reserva.habitacionNombre}
Fecha: ${fechaShabbat}
Participantes: ${reserva.participantes.length}
Estado: ${reserva.estado}`;

    await Clipboard.setStringAsync(text);

    return { success: true, action: 'copied' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Share app invitation
 */
export async function shareAppInvite(inviterName: string): Promise<ShareResult> {
  try {
    const message = `¡Hola! ${inviterName} te invita a unirte a Tortuguitas.

Tortuguitas es la app para gestionar las reservas de nuestra quinta familiar. Con ella puedes:

📅 Reservar habitaciones para Shabbat
👥 Gestionar participantes e invitados
💳 Pagar con MercadoPago
🔔 Recibir notificaciones

¡Descarga la app y únete a la familia!`;

    const result = await Share.share({
      message,
      title: 'Únete a Tortuguitas',
    });

    return {
      success: result.action === Share.sharedAction,
      action: result.action === Share.sharedAction ? 'shared' : 'dismissed',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Share minyan status
 */
export async function shareMinyanStatus(
  fechaShabbat: Date,
  cantidad: number,
  completo: boolean
): Promise<ShareResult> {
  try {
    const fechaText = format(fechaShabbat, "d 'de' MMMM", { locale: es });

    const message = completo
      ? `✅ ¡Minyan completo para el Shabbat del ${fechaText}!

Tenemos ${cantidad} varones confirmados. ¡Nos vemos en Tortuguitas!`
      : `⚠️ Minyan incompleto para el Shabbat del ${fechaText}

Tenemos ${cantidad}/10 varones. ¡Faltan ${10 - cantidad}!

Si puedes venir, confirma tu asistencia en la app Tortuguitas.`;

    const result = await Share.share({
      message,
      title: 'Estado del Minyan',
    });

    return {
      success: result.action === Share.sharedAction,
      action: result.action === Share.sharedAction ? 'shared' : 'dismissed',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
