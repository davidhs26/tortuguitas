import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedButton,
  AnimatedCard,
  Badge,
  StatusBadge,
  AvatarGroup,
  EmptyState,
  Skeleton,
  useToast,
} from '@/components/ui';
import { Actividad, TipoActividad } from '@/types';
import { Theme } from '@/constants/Theme';
import {
  getOCrearActividadesSemana,
  inscribirseActividad,
  desinscribirseActividad,
  armarEquiposFutbol,
  solicitarAsadoNocturno,
} from '@/services/actividades';

// Datos mock para modo demo
const createMockActividades = (proximoShabbat: Date): Actividad[] => {
  const domingo = addDays(proximoShabbat, 2);
  domingo.setHours(12, 0, 0, 0);

  return [
    {
      id: 'act-futbol-demo',
      tipo: 'futbol',
      fechaShabbat: proximoShabbat,
      fecha: domingo,
      participantes: [
        { usuarioId: 'u1', nombre: 'David Cohen', confirmado: true },
        { usuarioId: 'u2', nombre: 'Miguel Levy', confirmado: true },
        { usuarioId: 'u3', nombre: 'Carlos Rubin', confirmado: true },
        { usuarioId: 'u4', nombre: 'José Mizrahi', confirmado: true },
        { usuarioId: 'u5', nombre: 'Daniel Benmergui', confirmado: true },
        { usuarioId: 'u6', nombre: 'Marcos Teper', confirmado: true },
      ],
      aprobada: true,
      createdAt: new Date(),
    },
    {
      id: 'act-asado-demo',
      tipo: 'asado_domingo',
      fechaShabbat: proximoShabbat,
      fecha: domingo,
      participantes: [
        { usuarioId: 'u1', nombre: 'David Cohen', confirmado: true },
        { usuarioId: 'u7', nombre: 'Sara Cohen', confirmado: true },
        { usuarioId: 'u2', nombre: 'Miguel Levy', confirmado: true },
        { usuarioId: 'u8', nombre: 'Ruth Levy', confirmado: true },
      ],
      aprobada: true,
      estimacionCarne: 2,
      createdAt: new Date(),
    },
  ];
};

const TIPO_LABELS: Record<TipoActividad, string> = {
  futbol: 'Partido de Futbol',
  asado_domingo: 'Asado del Domingo',
  asado_noche: 'Asado Nocturno',
  minyan: 'Minyan',
};

const TIPO_ICONS: Record<TipoActividad, keyof typeof FontAwesome.glyphMap> = {
  futbol: 'futbol-o',
  asado_domingo: 'fire',
  asado_noche: 'moon-o',
  minyan: 'book',
};

const TIPO_GRADIENTS: Record<TipoActividad, string[]> = {
  futbol: ['#10B981', '#059669'],
  asado_domingo: ['#F59E0B', '#D97706'],
  asado_noche: ['#8B5CF6', '#7C3AED'],
  minyan: ['#3B82F6', '#1D4ED8'],
};

export default function ActividadesScreen() {
  const { user, isDemo } = useAuth();
  const { proximoShabbat } = useReservas();
  const { showToast } = useToast();

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActividades();
  }, [isDemo]);

  const loadActividades = async () => {
    try {
      if (isDemo) {
        setActividades(createMockActividades(proximoShabbat));
        setLoading(false);
        return;
      }
      const data = await getOCrearActividadesSemana(proximoShabbat);
      setActividades(data);
    } catch (err) {
      console.error('Error cargando actividades:', err);
      showToast('Error al cargar actividades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadActividades();
    setRefreshing(false);
    showToast('Actividades actualizadas', 'success');
  }, []);

  const handleInscribirse = async (actividad: Actividad) => {
    if (!user) {
      showToast('Debes iniciar sesión', 'error');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isDemo) {
      // En modo demo, simular inscripción
      setActividades(prev => prev.map(a => {
        if (a.id === actividad.id) {
          return {
            ...a,
            participantes: [...a.participantes, {
              usuarioId: user.id,
              nombre: `${user.nombre} ${user.apellido}`,
              confirmado: true,
            }],
          };
        }
        return a;
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Te inscribiste en ${TIPO_LABELS[actividad.tipo]}`, 'success');
      return;
    }

    try {
      await inscribirseActividad(actividad.id, user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Te inscribiste en ${TIPO_LABELS[actividad.tipo]}`, 'success');
      await loadActividades();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(err.message, 'error');
    }
  };

  const handleDesinscribirse = async (actividad: Actividad) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Confirmar',
      `¿Deseas cancelar tu inscripción en ${TIPO_LABELS[actividad.tipo]}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            if (isDemo) {
              // En modo demo, simular desinscripción
              setActividades(prev => prev.map(a => {
                if (a.id === actividad.id) {
                  return {
                    ...a,
                    participantes: a.participantes.filter(p => p.usuarioId !== user.id),
                  };
                }
                return a;
              }));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Inscripción cancelada', 'info');
              return;
            }

            try {
              await desinscribirseActividad(actividad.id, user.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Inscripción cancelada', 'info');
              await loadActividades();
            } catch (err: any) {
              showToast(err.message, 'error');
            }
          },
        },
      ]
    );
  };

  const handleArmarEquipos = async (actividad: Actividad) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const equipos = await armarEquiposFutbol(actividad.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('¡Equipos armados!', 'success');
      Alert.alert(
        '⚽ Equipos',
        `${equipos[0].nombre}:\n${equipos[0].jugadores.join(', ')}\n\n${equipos[1].nombre}:\n${equipos[1].jugadores.join(', ')}`
      );
      await loadActividades();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSolicitarAsadoNocturno = async () => {
    if (!user) {
      showToast('Debes iniciar sesión', 'error');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Solicitar Asado Nocturno',
      '¿Deseas solicitar un asado nocturno para este viernes? Requiere aprobación del administrador.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          onPress: async () => {
            try {
              await solicitarAsadoNocturno(proximoShabbat, user.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Solicitud enviada', 'success');
              await loadActividades();
            } catch (err: any) {
              showToast(err.message, 'error');
            }
          },
        },
      ]
    );
  };

  const isInscrito = (actividad: Actividad): boolean => {
    if (!user) return false;
    return actividad.participantes.some(p => p.usuarioId === user.id);
  };

  const domingo = addDays(proximoShabbat, 2);

  // Stats
  const totalInscritos = actividades.reduce((acc, a) => acc + a.participantes.length, 0);
  const actividadesActivas = actividades.filter(a => a.tipo !== 'minyan').length;

  if (loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={120} style={styles.skeletonHeader} />
          <Skeleton width="100%" height={180} />
          <Skeleton width="100%" height={180} />
        </View>
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
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.primaryDark]}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerLabel}>Actividades</Text>
              <Text style={styles.headerDate}>
                Domingo {format(domingo, 'd/M')}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <FontAwesome name="calendar-check-o" size={28} color={Theme.colors.white} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{actividadesActivas}</Text>
              <Text style={styles.statLabel}>Actividades</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalInscritos}</Text>
              <Text style={styles.statLabel}>Inscripciones</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Lista de actividades */}
      {actividades.filter(a => a.tipo !== 'minyan').length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No hay actividades"
          description="Las actividades aparecerán aquí cuando estén disponibles"
        />
      ) : (
        actividades
          .filter(a => a.tipo !== 'minyan')
          .map((actividad, index) => (
            <Animated.View
              key={actividad.id}
              entering={FadeInRight.delay(200 + index * 100).springify()}
            >
              <AnimatedCard style={styles.actividadCard}>
                <View style={styles.actividadHeader}>
                  <LinearGradient
                    colors={TIPO_GRADIENTS[actividad.tipo]}
                    style={styles.actividadIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <FontAwesome
                      name={TIPO_ICONS[actividad.tipo]}
                      size={24}
                      color={Theme.colors.white}
                    />
                  </LinearGradient>
                  <View style={styles.actividadInfo}>
                    <Text style={styles.actividadTitulo}>
                      {TIPO_LABELS[actividad.tipo]}
                    </Text>
                    <Text style={styles.actividadFecha}>
                      {format(actividad.fecha, "HH:mm 'hs'")}
                    </Text>
                  </View>
                  {actividad.tipo === 'asado_noche' && !actividad.aprobada && (
                    <StatusBadge status="warning" label="Pendiente" />
                  )}
                  {isInscrito(actividad) && (
                    <StatusBadge status="success" label="Inscrito" />
                  )}
                </View>

                <View style={styles.participantesContainer}>
                  <View style={styles.participantesHeader}>
                    <FontAwesome name="users" size={14} color={Theme.colors.textSecondary} />
                    <Text style={styles.participantesLabel}>
                      {actividad.participantes.length} inscrito{actividad.participantes.length !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  {actividad.participantes.length > 0 && (
                    <View style={styles.avatarsRow}>
                      <AvatarGroup
                        names={actividad.participantes.map(p => p.nombre)}
                        max={5}
                        size="small"
                      />
                    </View>
                  )}
                </View>

                {/* Equipos de futbol */}
                {actividad.tipo === 'futbol' && actividad.equipos && (
                  <Animated.View entering={FadeInUp.springify()} style={styles.equiposContainer}>
                    {actividad.equipos.map((equipo, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.equipoCard,
                          idx === 0 ? styles.equipoAzul : styles.equipoRojo,
                        ]}
                      >
                        <Text style={styles.equipoNombre}>{equipo.nombre}</Text>
                        <Text style={styles.equipoJugadores}>
                          {equipo.jugadores.join(', ')}
                        </Text>
                      </View>
                    ))}
                  </Animated.View>
                )}

                {/* Estimacion de carne */}
                {actividad.tipo === 'asado_domingo' && actividad.estimacionCarne && (
                  <View style={styles.estimacionContainer}>
                    <FontAwesome name="fire" size={16} color="#D97706" />
                    <Text style={styles.estimacionLabel}>
                      {actividad.estimacionCarne} kg de carne estimados
                    </Text>
                  </View>
                )}

                <View style={styles.actividadActions}>
                  {isInscrito(actividad) ? (
                    <AnimatedButton
                      title="Cancelar"
                      variant="outline"
                      size="small"
                      icon="times"
                      onPress={() => handleDesinscribirse(actividad)}
                      style={styles.actionButton}
                    />
                  ) : (
                    <AnimatedButton
                      title="Inscribirme"
                      variant="primary"
                      size="small"
                      icon="check"
                      onPress={() => handleInscribirse(actividad)}
                      disabled={actividad.tipo === 'asado_noche' && !actividad.aprobada}
                      style={styles.actionButton}
                    />
                  )}

                  {actividad.tipo === 'futbol' &&
                    user?.esAdmin &&
                    actividad.participantes.length >= 4 && (
                      <AnimatedButton
                        title="Armar Equipos"
                        variant="secondary"
                        size="small"
                        icon="random"
                        onPress={() => handleArmarEquipos(actividad)}
                        style={styles.actionButton}
                      />
                    )}
                </View>
              </AnimatedCard>
            </Animated.View>
          ))
      )}

      {/* Solicitar asado nocturno */}
      <Animated.View entering={FadeInDown.delay(500).springify()}>
        <AnimatedCard variant="outlined" style={styles.solicitudCard}>
          <LinearGradient
            colors={['#FEF3C7', '#FDE68A']}
            style={styles.solicitudGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.solicitudHeader}>
              <View style={styles.solicitudIconContainer}>
                <FontAwesome name="moon-o" size={24} color="#D97706" />
              </View>
              <View style={styles.solicitudInfo}>
                <Text style={styles.solicitudTitulo}>Asado Nocturno</Text>
                <Text style={styles.solicitudDescripcion}>
                  Solicita un asado para el viernes por la noche
                </Text>
              </View>
            </View>
            <AnimatedButton
              title="Solicitar"
              variant="outline"
              size="small"
              icon="plus"
              onPress={handleSolicitarAsadoNocturno}
            />
          </LinearGradient>
        </AnimatedCard>
      </Animated.View>

      {/* Info */}
      <Animated.View entering={FadeInDown.delay(600).springify()}>
        <AnimatedCard variant="filled" style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <FontAwesome name="info-circle" size={18} color={Theme.colors.primary} />
            <Text style={styles.infoTitle}>Información</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <FontAwesome name="clock-o" size={14} color={Theme.colors.textSecondary} />
              <Text style={styles.infoText}>Inscripciones hasta el miércoles</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome name="cutlery" size={14} color={Theme.colors.textSecondary} />
              <Text style={styles.infoText}>Asado: 0.5 kg por persona</Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome name="futbol-o" size={14} color={Theme.colors.textSecondary} />
              <Text style={styles.infoText}>Equipos armados aleatoriamente</Text>
            </View>
          </View>
        </AnimatedCard>
      </Animated.View>

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
  loadingContainer: {
    gap: Theme.spacing.md,
  },
  skeletonHeader: {
    borderRadius: Theme.borderRadius.xl,
  },
  headerCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  headerLabel: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Theme.spacing.xs,
  },
  headerDate: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actividadCard: {
    marginBottom: Theme.spacing.md,
  },
  actividadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  actividadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  actividadInfo: {
    flex: 1,
  },
  actividadTitulo: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  actividadFecha: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  participantesContainer: {
    marginBottom: Theme.spacing.md,
  },
  participantesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  participantesLabel: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textSecondary,
  },
  avatarsRow: {
    marginTop: Theme.spacing.xs,
  },
  equiposContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  equipoCard: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  equipoAzul: {
    backgroundColor: '#DBEAFE',
  },
  equipoRojo: {
    backgroundColor: '#FEE2E2',
  },
  equipoNombre: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  equipoJugadores: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
  },
  estimacionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: '#FEF3C7',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  estimacionLabel: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: '#92400E',
  },
  actividadActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  solicitudCard: {
    marginBottom: Theme.spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  solicitudGradient: {
    padding: Theme.spacing.lg,
  },
  solicitudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  solicitudIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  solicitudInfo: {
    flex: 1,
  },
  solicitudTitulo: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: '#92400E',
  },
  solicitudDescripcion: {
    fontSize: Theme.fontSize.sm,
    color: '#B45309',
    marginTop: 2,
  },
  infoCard: {
    marginBottom: Theme.spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  infoTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  infoList: {
    gap: Theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  infoText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  bottomSpacer: {
    height: 32,
  },
});
