import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ScalePress,
  FadeView,
  ProgressBar,
} from '@/components/ui';
import { Actividad, TipoActividad } from '@/types';
import { Theme, Gradients } from '@/constants/Theme';
import {
  getOCrearActividadesSemana,
  inscribirseActividad,
  desinscribirseActividad,
  armarEquiposFutbol,
  solicitarAsadoNocturno,
} from '@/services/actividades';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Activity images
const ACTIVITY_IMAGES = {
  futbol: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
  asado_domingo: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80',
  asado_noche: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  minyan: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80',
};

// Mock activities for demo mode
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
        { usuarioId: 'u4', nombre: 'Jose Mizrahi', confirmado: true },
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

const ACTIVITY_CONFIG = {
  futbol: {
    label: 'Partido de Futbol',
    icon: 'futbol-o' as const,
    gradient: Gradients.forest,
    emoji: '⚽',
  },
  asado_domingo: {
    label: 'Asado del Domingo',
    icon: 'fire' as const,
    gradient: Gradients.sunset,
    emoji: '🥩',
  },
  asado_noche: {
    label: 'Asado Nocturno',
    icon: 'moon-o' as const,
    gradient: Gradients.night,
    emoji: '🌙',
  },
  minyan: {
    label: 'Minyan',
    icon: 'book' as const,
    gradient: Gradients.ocean,
    emoji: '📖',
  },
};

export default function ActividadesScreen() {
  const { user, isDemo } = useAuth();
  const { proximoShabbat } = useReservas();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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
      showToast('Debes iniciar sesion', 'error');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isDemo) {
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
      showToast(`Te inscribiste en ${ACTIVITY_CONFIG[actividad.tipo].label}`, 'success');
      return;
    }

    try {
      await inscribirseActividad(actividad.id, user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Te inscribiste en ${ACTIVITY_CONFIG[actividad.tipo].label}`, 'success');
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
      'Cancelar Inscripcion',
      `Cancelar tu inscripcion en ${ACTIVITY_CONFIG[actividad.tipo].label}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Si, cancelar',
          style: 'destructive',
          onPress: async () => {
            if (isDemo) {
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
              showToast('Inscripcion cancelada', 'info');
              return;
            }

            try {
              await desinscribirseActividad(actividad.id, user.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Inscripcion cancelada', 'info');
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
      showToast('Equipos armados!', 'success');
      Alert.alert(
        'Equipos',
        `${equipos[0].nombre}:\n${equipos[0].jugadores.join(', ')}\n\n${equipos[1].nombre}:\n${equipos[1].jugadores.join(', ')}`
      );
      await loadActividades();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSolicitarAsadoNocturno = async () => {
    if (!user) {
      showToast('Debes iniciar sesion', 'error');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Solicitar Asado Nocturno',
      'Solicitar un asado para el viernes por la noche? Requiere aprobacion del administrador.',
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
  const totalInscritos = actividades.reduce((acc, a) => acc + a.participantes.length, 0);
  const actividadesActivas = actividades.filter(a => a.tipo !== 'minyan').length;

  // Animated header
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    };
  });

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Skeleton height={160} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={200} borderRadius={20} style={{ marginBottom: 12 }} />
          <Skeleton height={200} borderRadius={20} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, headerAnimatedStyle, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Actividades</Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.primary}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* Hero Section */}
        <FadeView direction="down" delay={0}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={Gradients.forest}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroText}>
                  <Text style={styles.heroLabel}>ACTIVIDADES DEL</Text>
                  <Text style={styles.heroDate}>
                    Domingo {format(domingo, "d 'de' MMMM", { locale: es })}
                  </Text>
                </View>
                <View style={styles.heroIcon}>
                  <Text style={styles.heroEmoji}>🎉</Text>
                </View>
              </View>

              {/* Stats Row */}
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
          </View>
        </FadeView>

        {/* Activities List */}
        {actividades.filter(a => a.tipo !== 'minyan').length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No hay actividades"
            description="Las actividades apareceran aqui cuando esten disponibles"
          />
        ) : (
          actividades
            .filter(a => a.tipo !== 'minyan')
            .map((actividad, index) => {
              const config = ACTIVITY_CONFIG[actividad.tipo];
              const inscrito = isInscrito(actividad);

              return (
                <FadeView key={actividad.id} direction="up" delay={100 + index * 100}>
                  <View style={styles.activityCard}>
                    {/* Activity Image Header */}
                    <View style={styles.activityImageContainer}>
                      <Image
                        source={{ uri: ACTIVITY_IMAGES[actividad.tipo] }}
                        style={styles.activityImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.activityImageOverlay}
                      />

                      {/* Badges */}
                      <View style={styles.activityBadges}>
                        <LinearGradient
                          colors={config.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.typeBadge}
                        >
                          <Text style={styles.typeBadgeEmoji}>{config.emoji}</Text>
                          <Text style={styles.typeBadgeText}>{config.label}</Text>
                        </LinearGradient>

                        {inscrito && (
                          <View style={styles.inscritoBadge}>
                            <FontAwesome name="check" size={10} color={Theme.colors.white} />
                            <Text style={styles.inscritoBadgeText}>Inscrito</Text>
                          </View>
                        )}
                      </View>

                      {/* Time */}
                      <View style={styles.activityTimeContainer}>
                        <FontAwesome name="clock-o" size={14} color={Theme.colors.white} />
                        <Text style={styles.activityTime}>
                          {format(actividad.fecha, "HH:mm 'hs'")}
                        </Text>
                      </View>
                    </View>

                    {/* Activity Content */}
                    <View style={styles.activityContent}>
                      {/* Participants */}
                      <View style={styles.participantsSection}>
                        <View style={styles.participantsHeader}>
                          <FontAwesome name="users" size={14} color={Theme.colors.textSecondary} />
                          <Text style={styles.participantsCount}>
                            {actividad.participantes.length} inscrito{actividad.participantes.length !== 1 ? 's' : ''}
                          </Text>
                        </View>

                        {actividad.participantes.length > 0 && (
                          <AvatarGroup
                            names={actividad.participantes.map(p => p.nombre)}
                            max={6}
                            size="small"
                          />
                        )}
                      </View>

                      {/* Teams (for football) */}
                      {actividad.tipo === 'futbol' && actividad.equipos && (
                        <View style={styles.teamsContainer}>
                          {actividad.equipos.map((equipo, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.teamCard,
                                idx === 0 ? styles.teamBlue : styles.teamRed,
                              ]}
                            >
                              <Text style={styles.teamName}>{equipo.nombre}</Text>
                              <Text style={styles.teamPlayers}>
                                {equipo.jugadores.join(', ')}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Meat estimation (for BBQ) */}
                      {actividad.tipo === 'asado_domingo' && actividad.estimacionCarne && (
                        <View style={styles.meatEstimate}>
                          <FontAwesome name="fire" size={16} color={Theme.colors.warning} />
                          <Text style={styles.meatText}>
                            {actividad.estimacionCarne} kg de carne estimados
                          </Text>
                        </View>
                      )}

                      {/* Actions */}
                      <View style={styles.actionsRow}>
                        {inscrito ? (
                          <AnimatedButton
                            title="Cancelar inscripcion"
                            variant="outline"
                            size="small"
                            icon="times"
                            onPress={() => handleDesinscribirse(actividad)}
                            style={styles.actionButton}
                            haptic
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
                            haptic
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
                              haptic
                            />
                          )}
                      </View>
                    </View>
                  </View>
                </FadeView>
              );
            })
        )}

        {/* Night BBQ Request Card */}
        <FadeView direction="up" delay={400}>
          <ScalePress onPress={handleSolicitarAsadoNocturno}>
            <View style={styles.requestCard}>
              <LinearGradient
                colors={Gradients.night}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.requestGradient}
              >
                <View style={styles.requestContent}>
                  <View style={styles.requestIcon}>
                    <Text style={styles.requestEmoji}>🌙</Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>Asado Nocturno</Text>
                    <Text style={styles.requestSubtitle}>
                      Solicita un asado para el viernes por la noche
                    </Text>
                  </View>
                  <FontAwesome name="plus-circle" size={24} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </View>
          </ScalePress>
        </FadeView>

        {/* Info Card */}
        <FadeView direction="up" delay={500}>
          <AnimatedCard variant="outlined" style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <FontAwesome name="info-circle" size={18} color={Theme.colors.primary} />
              <Text style={styles.infoTitle}>Informacion</Text>
            </View>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <FontAwesome name="clock-o" size={14} color={Theme.colors.textSecondary} />
                <Text style={styles.infoText}>Inscripciones hasta el miercoles</Text>
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
        </FadeView>

        {/* Bottom spacer */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
  },
  loadingContainer: {
    padding: Theme.spacing.lg,
  },

  // Hero
  heroCard: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.cardLarge,
    overflow: 'hidden',
    ...Theme.shadows.lg,
  },
  heroGradient: {
    padding: Theme.spacing.lg,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  heroText: {
    flex: 1,
  },
  heroLabel: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: Theme.spacing.xs,
  },
  heroDate: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 28,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    color: 'rgba(255,255,255,0.8)',
    marginTop: Theme.spacing.xxs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Activity Card
  activityCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.cardLarge,
    overflow: 'hidden',
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.md,
  },
  activityImageContainer: {
    height: 160,
    position: 'relative',
  },
  activityImage: {
    ...StyleSheet.absoluteFillObject,
  },
  activityImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  activityBadges: {
    position: 'absolute',
    top: Theme.spacing.md,
    left: Theme.spacing.md,
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  typeBadgeEmoji: {
    fontSize: 14,
  },
  typeBadgeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
  },
  inscritoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.success,
  },
  inscritoBadgeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
  },
  activityTimeContainer: {
    position: 'absolute',
    bottom: Theme.spacing.md,
    left: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  activityTime: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  activityContent: {
    padding: Theme.spacing.lg,
  },
  participantsSection: {
    marginBottom: Theme.spacing.lg,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  participantsCount: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textSecondary,
  },
  teamsContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  teamCard: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  teamBlue: {
    backgroundColor: '#DBEAFE',
  },
  teamRed: {
    backgroundColor: '#FEE2E2',
  },
  teamName: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  teamPlayers: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
  },
  meatEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.warningBackground,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  meatText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.warningDark,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },

  // Request Card
  requestCard: {
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    ...Theme.shadows.md,
  },
  requestGradient: {
    padding: Theme.spacing.lg,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  requestEmoji: {
    fontSize: 24,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  requestSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Theme.spacing.xxs,
  },

  // Info Card
  infoCard: {
    marginBottom: Theme.spacing.lg,
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
});
