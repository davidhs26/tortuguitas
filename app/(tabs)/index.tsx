import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
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
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedCard,
  AnimatedButton,
  Avatar,
  Badge,
  Skeleton,
  useToast,
  ScalePress,
  FadeView,
  ProgressBar,
  StatsHero,
} from '@/components/ui';
import { Theme, Gradients, SectorConfig } from '@/constants/Theme';
import { calcularMinyan } from '@/services/actividades';

// Mock minyan info for demo mode
const MOCK_MINYAN_INFO = {
  cantidad: 7,
  completo: false,
  faltantes: 3,
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_IMAGE = 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=80';

const QUICK_ACTIONS = [
  { emoji: '🏠', title: 'Habitaciones', subtitle: 'Reservar', route: '/(tabs)/reservas', gradient: Gradients.ocean },
  { emoji: '⚽', title: 'Futbol', subtitle: 'Domingo', route: '/(tabs)/actividades', gradient: Gradients.forest },
  { emoji: '🥩', title: 'Asado', subtitle: 'Inscribirme', route: '/(tabs)/actividades', gradient: Gradients.sunset },
  { emoji: '👨‍👩‍👧‍👦', title: 'Familia', subtitle: 'Mi grupo', route: '/(tabs)/perfil', gradient: Gradients.rose },
];

export default function HomeScreen() {
  const { user, isDemo } = useAuth();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const {
    misReservas,
    proximoShabbat,
    puedeReservar,
    cargarMisReservas,
    cargarDisponibilidad,
  } = useReservas();

  const [minyanInfo, setMinyanInfo] = useState<{
    cantidad: number;
    completo: boolean;
    faltantes: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, isDemo]);

  const loadData = async () => {
    try {
      await Promise.all([
        cargarMisReservas(),
        cargarDisponibilidad(proximoShabbat),
      ]);

      if (isDemo) {
        setMinyanInfo(MOCK_MINYAN_INFO);
      } else {
        const minyan = await calcularMinyan(proximoShabbat);
        setMinyanInfo(minyan);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      if (isDemo) {
        setMinyanInfo(MOCK_MINYAN_INFO);
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setRefreshing(false);
    toast.success('Actualizado', 'Datos actualizados correctamente');
  }, []);

  const proximaReserva = useMemo(
    () => misReservas.find(
      r => r.estado !== 'cancelada' && new Date(r.fechaShabbat) >= new Date()
    ),
    [misReservas]
  );

  const shabbatDate = useMemo(
    () => format(addDays(proximoShabbat, 1), "d 'de' MMMM", { locale: es }),
    [proximoShabbat]
  );

  const llegadaDate = useMemo(
    () => format(proximoShabbat, "EEEE d", { locale: es }),
    [proximoShabbat]
  );

  const userFullName = useMemo(
    () => `${user?.nombre} ${user?.apellido}`,
    [user?.nombre, user?.apellido]
  );

  const sectorConfig = user?.grupoFamiliar ? SectorConfig[user.grupoFamiliar as keyof typeof SectorConfig] : null;

  // Animated header styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 150],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    };
  });

  if (initialLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Skeleton width={200} height={32} style={{ marginBottom: 8 }} />
          <Skeleton width={160} height={20} style={{ marginBottom: 24 }} />
          <Skeleton height={200} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={140} borderRadius={20} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Skeleton height={120} borderRadius={16} style={{ flex: 1 }} />
            <Skeleton height={120} borderRadius={16} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, headerAnimatedStyle, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tortuguitas</Text>
          <Pressable onPress={() => router.push('/notificaciones')}>
            <FontAwesome name="bell-o" size={22} color={Theme.colors.text} />
          </Pressable>
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
          <View style={styles.heroSection}>
            {/* Greeting */}
            <View style={styles.greetingRow}>
              <View style={styles.greetingText}>
                <Text style={styles.greeting}>Shalom,</Text>
                <Text style={styles.userName}>{user?.nombre || 'Familia'}</Text>
              </View>
              <ScalePress onPress={() => router.push('/(tabs)/perfil')}>
                <View style={styles.avatarContainer}>
                  <Avatar
                    name={userFullName}
                    size="large"
                    color={sectorConfig?.color || Theme.colors.primary}
                  />
                  {user?.esAdmin && (
                    <View style={styles.adminStar}>
                      <FontAwesome name="star" size={10} color={Theme.colors.warning} />
                    </View>
                  )}
                </View>
              </ScalePress>
            </View>

            {/* User badges */}
            <View style={styles.userBadges}>
              {sectorConfig && (
                <LinearGradient
                  colors={sectorConfig.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectorBadge}
                >
                  <FontAwesome name={sectorConfig.icon} size={10} color={Theme.colors.white} />
                  <Text style={styles.sectorBadgeText}>{sectorConfig.name}</Text>
                </LinearGradient>
              )}
              {user?.esAdmin && (
                <View style={styles.adminBadge}>
                  <FontAwesome name="shield" size={10} color={Theme.colors.error} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
        </FadeView>

        {/* Shabbat Hero Card */}
        <FadeView direction="up" delay={100}>
          <View style={styles.shabbatCardWrapper}>
            <AnimatedCard
              variant="image"
              image={HERO_IMAGE}
              imageOverlay
              onPress={() => router.push('/(tabs)/reservas')}
              style={styles.shabbatCard}
            >
              <View style={styles.shabbatContent}>
                {/* Status pill */}
                <View style={styles.shabbatStatusRow}>
                  <View style={[
                    styles.statusPill,
                    { backgroundColor: puedeReservar ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)' }
                  ]}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: Theme.colors.white }
                    ]} />
                    <Text style={styles.statusText}>
                      {puedeReservar ? 'Reservas abiertas' : 'Reservas cerradas'}
                    </Text>
                  </View>
                </View>

                {/* Shabbat info */}
                <View style={styles.shabbatInfo}>
                  <Text style={styles.shabbatLabel}>PROXIMO SHABBAT</Text>
                  <Text style={styles.shabbatDate}>{shabbatDate}</Text>
                  <View style={styles.arrivalRow}>
                    <FontAwesome name="calendar-check-o" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.arrivalText}>Llegada: {llegadaDate}</Text>
                  </View>
                </View>

                {/* CTA Button */}
                {puedeReservar && !proximaReserva && (
                  <AnimatedButton
                    title="Hacer Reserva"
                    variant="secondary"
                    icon="arrow-right"
                    onPress={() => router.push('/(tabs)/reservas')}
                    style={styles.heroButton}
                    haptic
                  />
                )}
              </View>
            </AnimatedCard>
          </View>
        </FadeView>

        {/* Current Reservation Card */}
        {proximaReserva && (
          <FadeView direction="up" delay={200}>
            <ScalePress onPress={() => router.push(`/reserva/${proximaReserva.id}`)}>
              <View style={styles.reservaCard}>
                <LinearGradient
                  colors={Gradients.ocean}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.reservaGradient}
                >
                  <View style={styles.reservaContent}>
                    <View style={styles.reservaIcon}>
                      <FontAwesome name="check-circle" size={24} color={Theme.colors.white} />
                    </View>
                    <View style={styles.reservaInfo}>
                      <Text style={styles.reservaLabel}>Tu reserva confirmada</Text>
                      <Text style={styles.reservaHabitacion}>
                        {proximaReserva.habitacionNombre}
                      </Text>
                      <View style={styles.reservaDetails}>
                        <FontAwesome name="users" size={12} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.reservaDetailText}>
                          {proximaReserva.participantes.length} personas
                        </Text>
                      </View>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color="rgba(255,255,255,0.8)" />
                  </View>
                </LinearGradient>
              </View>
            </ScalePress>
          </FadeView>
        )}

        {/* Minyan Progress Card */}
        {minyanInfo && (
          <FadeView direction="up" delay={300}>
            <AnimatedCard variant="elevated" style={styles.minyanCard}>
              <View style={styles.minyanHeader}>
                <View style={styles.minyanIconContainer}>
                  <Text style={styles.minyanEmoji}>📖</Text>
                </View>
                <View style={styles.minyanInfo}>
                  <Text style={styles.minyanTitle}>Minyan Shabat</Text>
                  <Text style={styles.minyanSubtitle}>
                    {minyanInfo.completo
                      ? '¡Minyan completo!'
                      : `Faltan ${minyanInfo.faltantes} para minyan`}
                  </Text>
                </View>
                <View style={styles.minyanCounter}>
                  <Text style={styles.minyanCount}>{minyanInfo.cantidad}</Text>
                  <Text style={styles.minyanTotal}>/10</Text>
                </View>
              </View>
              <ProgressBar
                progress={(minyanInfo.cantidad / 10) * 100}
                color={minyanInfo.completo ? Theme.colors.success : Theme.colors.warning}
                backgroundColor={Theme.colors.border}
                height={8}
              />
            </AnimatedCard>
          </FadeView>
        )}

        {/* Quick Actions Section */}
        <FadeView direction="up" delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Acceso Rapido</Text>
          </View>

          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action, index) => (
              <QuickActionCard
                key={action.title}
                {...action}
                delay={index * 50}
                onPress={() => router.push(action.route as any)}
              />
            ))}
          </View>
        </FadeView>

        {/* Admin Card */}
        {user?.esAdmin && (
          <FadeView direction="up" delay={500}>
            <ScalePress onPress={() => router.push('/admin')}>
              <View style={styles.adminCard}>
                <LinearGradient
                  colors={Gradients.sunset}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.adminGradient}
                >
                  <View style={styles.adminContent}>
                    <View style={styles.adminIconContainer}>
                      <FontAwesome name="cog" size={24} color={Theme.colors.white} />
                    </View>
                    <View style={styles.adminInfo}>
                      <Text style={styles.adminTitle}>Panel de Admin</Text>
                      <Text style={styles.adminSubtitle}>Gestionar la quinta</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color="rgba(255,255,255,0.8)" />
                  </View>
                </LinearGradient>
              </View>
            </ScalePress>
          </FadeView>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

// Memoized Quick Action Card
const QuickActionCard = memo(function QuickActionCard({
  emoji,
  title,
  subtitle,
  gradient,
  onPress,
  delay,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  gradient: [string, string];
  onPress: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(delay).springify()}
      style={[styles.quickActionWrapper, animatedStyle]}
    >
      <ScalePress onPress={onPress} activeScale={0.95}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionCard}
        >
          <Text style={styles.quickActionEmoji}>{emoji}</Text>
          <Text style={styles.quickActionTitle}>{title}</Text>
          <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
        </LinearGradient>
      </ScalePress>
    </Animated.View>
  );
});

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
  content: {
    padding: Theme.spacing.lg,
  },

  // Hero Section
  heroSection: {
    marginBottom: Theme.spacing.xl,
    paddingTop: Theme.spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xxs,
  },
  userName: {
    fontSize: Theme.typography.h2.fontSize,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
    letterSpacing: -0.5,
  },
  avatarContainer: {
    position: 'relative',
  },
  adminStar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  userBadges: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  sectorBadgeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.errorBackground,
  },
  adminBadgeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.error,
  },

  // Shabbat Card
  shabbatCardWrapper: {
    marginBottom: Theme.spacing.lg,
  },
  shabbatCard: {
    minHeight: 240,
    borderRadius: Theme.borderRadius.cardLarge,
  },
  shabbatContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  shabbatStatusRow: {
    flexDirection: 'row',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
  },
  shabbatInfo: {
    marginTop: 'auto',
  },
  shabbatLabel: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: Theme.spacing.xs,
  },
  shabbatDate: {
    fontSize: Theme.typography.h1.fontSize,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
    letterSpacing: -0.5,
  },
  arrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  arrivalText: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  heroButton: {
    marginTop: Theme.spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },

  // Reservation Card
  reservaCard: {
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    ...Theme.shadows.lg,
  },
  reservaGradient: {
    padding: Theme.spacing.lg,
  },
  reservaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reservaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  reservaInfo: {
    flex: 1,
  },
  reservaLabel: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Theme.spacing.xxs,
  },
  reservaHabitacion: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  reservaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.xs,
  },
  reservaDetailText: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },

  // Minyan Card
  minyanCard: {
    marginBottom: Theme.spacing.xl,
    padding: Theme.spacing.lg,
  },
  minyanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  minyanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.warningBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  minyanEmoji: {
    fontSize: 24,
  },
  minyanInfo: {
    flex: 1,
  },
  minyanTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  minyanSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xxs,
  },
  minyanCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  minyanCount: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
  },
  minyanTotal: {
    fontSize: Theme.fontSize.lg,
    color: Theme.colors.textSecondary,
  },

  // Section Header
  sectionHeader: {
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  quickActionWrapper: {
    width: (SCREEN_WIDTH - Theme.spacing.lg * 2 - Theme.spacing.md) / 2,
  },
  quickActionCard: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    alignItems: 'center',
    ...Theme.shadows.md,
  },
  quickActionEmoji: {
    fontSize: 36,
    marginBottom: Theme.spacing.sm,
  },
  quickActionTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  quickActionSubtitle: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Theme.spacing.xxs,
  },

  // Admin Card
  adminCard: {
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    ...Theme.shadows.lg,
  },
  adminGradient: {
    padding: Theme.spacing.lg,
  },
  adminContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  adminInfo: {
    flex: 1,
  },
  adminTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  adminSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Theme.spacing.xxs,
  },
});
