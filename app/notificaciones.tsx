import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeOut, Layout } from 'react-native-reanimated';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '@/context';
import {
  AnimatedCard,
  AnimatedButton,
  EmptyState,
  Skeleton,
  useToast,
} from '@/components/ui';
import { Theme } from '@/constants/Theme';
import {
  getNotificacionesUsuario,
  marcarComoLeida,
  marcarTodasComoLeidas,
} from '@/services/notificaciones';
import { Notificacion } from '@/types';

type NotificacionTipo = Notificacion['tipo'];

const TIPO_CONFIG: Record<NotificacionTipo, {
  icon: keyof typeof FontAwesome.glyphMap;
  colors: string[];
  iconColor: string;
}> = {
  reserva: {
    icon: 'calendar-check-o',
    colors: ['#DBEAFE', '#BFDBFE'],
    iconColor: '#2563EB',
  },
  mudanza: {
    icon: 'exchange',
    colors: ['#FEF3C7', '#FDE68A'],
    iconColor: '#D97706',
  },
  pago: {
    icon: 'credit-card',
    colors: ['#D1FAE5', '#A7F3D0'],
    iconColor: '#059669',
  },
  recordatorio: {
    icon: 'bell',
    colors: ['#E0E7FF', '#C7D2FE'],
    iconColor: '#4F46E5',
  },
  actividad: {
    icon: 'futbol-o',
    colors: ['#FCE7F3', '#FBCFE8'],
    iconColor: '#DB2777',
  },
  admin: {
    icon: 'cog',
    colors: ['#FEE2E2', '#FECACA'],
    iconColor: '#DC2626',
  },
};

export default function NotificacionesScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotificaciones();
    }
  }, [user]);

  const loadNotificaciones = async () => {
    if (!user) return;

    try {
      const data = await getNotificacionesUsuario(user.id);
      setNotificaciones(data);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      showToast('Error al cargar notificaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadNotificaciones();
    setRefreshing(false);
  }, [user]);

  const handleMarcarLeida = useCallback(async (notificacion: Notificacion) => {
    if (notificacion.leida) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await marcarComoLeida(notificacion.id);
      setNotificaciones(prev =>
        prev.map(n => (n.id === notificacion.id ? { ...n, leida: true } : n))
      );
    } catch (error) {
      showToast('Error al marcar como leída', 'error');
    }
  }, []);

  const handleMarcarTodasLeidas = useCallback(async () => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Marcar todas como leídas',
      '¿Deseas marcar todas las notificaciones como leídas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar todas',
          onPress: async () => {
            try {
              await marcarTodasComoLeidas(user.id);
              setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
              showToast('Todas marcadas como leídas', 'success');
            } catch (error) {
              showToast('Error al marcar notificaciones', 'error');
            }
          },
        },
      ]
    );
  }, [user]);

  const handleNotificacionPress = useCallback((notificacion: Notificacion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleMarcarLeida(notificacion);

    // Navigate based on notification type
    if (notificacion.tipo === 'reserva' || notificacion.tipo === 'mudanza') {
      if (notificacion.datos?.reservaId) {
        router.push(`/reserva/${notificacion.datos.reservaId}`);
      } else {
        router.push('/(tabs)/reservas');
      }
    } else if (notificacion.tipo === 'pago') {
      router.push('/pagos');
    } else if (notificacion.tipo === 'actividad') {
      router.push('/(tabs)/actividades');
    }
  }, [handleMarcarLeida]);

  const noLeidas = useMemo(
    () => notificaciones.filter(n => !n.leida).length,
    [notificaciones]
  );

  const notificacionesAgrupadas = useMemo(() => {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const grupos: { titulo: string; notificaciones: Notificacion[] }[] = [];
    const hoyList: Notificacion[] = [];
    const ayerList: Notificacion[] = [];
    const anterioresList: Notificacion[] = [];

    notificaciones.forEach(n => {
      const fecha = new Date(n.createdAt);
      if (fecha.toDateString() === hoy.toDateString()) {
        hoyList.push(n);
      } else if (fecha.toDateString() === ayer.toDateString()) {
        ayerList.push(n);
      } else {
        anterioresList.push(n);
      }
    });

    if (hoyList.length > 0) grupos.push({ titulo: 'Hoy', notificaciones: hoyList });
    if (ayerList.length > 0) grupos.push({ titulo: 'Ayer', notificaciones: ayerList });
    if (anterioresList.length > 0) grupos.push({ titulo: 'Anteriores', notificaciones: anterioresList });

    return grupos;
  }, [notificaciones]);

  const renderNotificacion = (notificacion: Notificacion, index: number) => {
    const config = TIPO_CONFIG[notificacion.tipo];
    const tiempoRelativo = formatDistanceToNow(new Date(notificacion.createdAt), {
      addSuffix: true,
      locale: es,
    });

    return (
      <Animated.View
        key={notificacion.id}
        entering={FadeInRight.delay(index * 50).springify()}
        exiting={FadeOut}
        layout={Layout.springify()}
      >
        <Pressable
          style={[styles.notificacionCard, !notificacion.leida && styles.notificacionNoLeida]}
          onPress={() => handleNotificacionPress(notificacion)}
        >
          <LinearGradient
            colors={config.colors}
            style={styles.notificacionIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome name={config.icon} size={18} color={config.iconColor} />
          </LinearGradient>

          <View style={styles.notificacionContent}>
            <View style={styles.notificacionHeader}>
              <Text style={styles.notificacionTitulo} numberOfLines={1}>
                {notificacion.titulo}
              </Text>
              {!notificacion.leida && <View style={styles.noLeidaDot} />}
            </View>
            <Text style={styles.notificacionMensaje} numberOfLines={2}>
              {notificacion.mensaje}
            </Text>
            <Text style={styles.notificacionTiempo}>{tiempoRelativo}</Text>
          </View>

          <FontAwesome name="chevron-right" size={12} color={Theme.colors.textTertiary} />
        </Pressable>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={styles.skeletonCard}>
            <Skeleton width={44} height={44} style={{ borderRadius: 22 }} />
            <View style={styles.skeletonContent}>
              <Skeleton width="70%" height={16} />
              <Skeleton width="90%" height={14} style={{ marginTop: 8 }} />
              <Skeleton width="30%" height={12} style={{ marginTop: 8 }} />
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header con contador */}
      {notificaciones.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo leído'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {notificaciones.length} notificaciones en total
              </Text>
            </View>
            {noLeidas > 0 && (
              <AnimatedButton
                title="Marcar todas"
                variant="ghost"
                size="small"
                onPress={handleMarcarTodasLeidas}
              />
            )}
          </View>
        </Animated.View>
      )}

      {/* Lista de notificaciones */}
      {notificaciones.length === 0 ? (
        <EmptyState
          icon="bell-slash"
          title="Sin notificaciones"
          description="Cuando recibas notificaciones aparecerán aquí"
        />
      ) : (
        notificacionesAgrupadas.map((grupo, grupoIndex) => (
          <Animated.View
            key={grupo.titulo}
            entering={FadeInDown.delay(150 + grupoIndex * 100).springify()}
          >
            <Text style={styles.grupoTitulo}>{grupo.titulo}</Text>
            {grupo.notificaciones.map((notif, index) =>
              renderNotificacion(notif, index)
            )}
          </Animated.View>
        ))
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.md,
  },
  skeletonContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  headerSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  grupoTitulo: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  notificacionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  notificacionNoLeida: {
    backgroundColor: Theme.colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  notificacionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificacionContent: {
    flex: 1,
  },
  notificacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  notificacionTitulo: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    flex: 1,
  },
  noLeidaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
  },
  notificacionMensaje: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notificacionTiempo: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textTertiary,
    marginTop: 6,
  },
  bottomSpacer: {
    height: 32,
  },
});
