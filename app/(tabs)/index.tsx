import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedCard,
  AnimatedButton,
  Avatar,
  Badge,
  Skeleton,
  useToast,
} from '@/components/ui';
import { Theme } from '@/constants/Theme';
import { calcularMinyan } from '@/services/actividades';

// Mock minyan info para modo demo
const MOCK_MINYAN_INFO = {
  cantidad: 7,
  completo: false,
  faltantes: 3,
};

const { width } = Dimensions.get('window');

// Sector names constant (outside component to avoid recreation)
const SECTOR_NAMES: Record<string, string> = {
  david: 'Sector David',
  mumi: 'Sector Mumi',
  tuni: 'Sector Tuni',
  quincho: 'Quincho',
  libre: 'Sin asignar',
};

export default function HomeScreen() {
  const { user, isDemo } = useAuth();
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
      // En modo demo, si hay error igual mostramos los datos mock
      if (isDemo) {
        setMinyanInfo(MOCK_MINYAN_INFO);
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Actualizado', 'Datos actualizados correctamente');
  }, []);

  // Memoized computed values
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

  if (initialLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.greetingSection}>
          <Skeleton width={200} height={32} />
          <Skeleton width={160} height={20} style={{ marginTop: 8 }} />
        </View>
        <Skeleton height={180} borderRadius={20} style={{ marginBottom: 16 }} />
        <Skeleton height={120} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton height={80} borderRadius={16} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Theme.colors.primary}
        />
      }
    >
      {/* Greeting Section */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={styles.greetingSection}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={styles.greeting}>Shalom,</Text>
            <Text style={styles.userName}>{user?.nombre || 'Familia'}</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/perfil')}>
            <Avatar
              name={userFullName}
              size="large"
              color={Theme.colors.primary}
            />
          </Pressable>
        </View>
        <View style={styles.userBadges}>
          <Badge
            label={SECTOR_NAMES[user?.grupoFamiliar || 'libre']}
            variant="info"
            size="small"
          />
          {user?.esAdmin && (
            <Badge label="Admin" variant="error" size="small" />
          )}
        </View>
      </Animated.View>

      {/* Shabbat Card */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shabbatCard}
        >
          <View style={styles.shabbatHeader}>
            <View style={styles.shabbatBadge}>
              <Text style={styles.shabbatBadgeText}>PROXIMO SHABBAT</Text>
            </View>
            <View style={styles.statusDot}>
              <View style={[
                styles.statusDotInner,
                { backgroundColor: puedeReservar ? Theme.colors.success : Theme.colors.warning }
              ]} />
            </View>
          </View>

          <Text style={styles.shabbatDate}>{shabbatDate}</Text>
          <Text style={styles.shabbatArrival}>
            <FontAwesome name="calendar" size={14} color="rgba(255,255,255,0.7)" />
            {'  '}Llegada: {llegadaDate}
          </Text>

          {puedeReservar && !proximaReserva && (
            <AnimatedButton
              title="Hacer Reserva"
              onPress={() => router.push('/(tabs)/reservas')}
              variant="secondary"
              style={styles.reserveButton}
              haptic
            />
          )}

          {!puedeReservar && (
            <View style={styles.closedBanner}>
              <FontAwesome name="lock" size={12} color={Theme.colors.warning} />
              <Text style={styles.closedText}>Reservas abren el lunes</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Current Reservation */}
      {proximaReserva && (
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <AnimatedCard
            variant="elevated"
            style={styles.reservaCard}
            onPress={() => router.push(`/reserva/${proximaReserva.id}`)}
          >
            <View style={styles.reservaHeader}>
              <View>
                <Text style={styles.reservaLabel}>Tu reserva</Text>
                <Text style={styles.reservaHabitacion}>
                  {proximaReserva.habitacionNombre}
                </Text>
              </View>
              <Badge
                label={proximaReserva.estado.charAt(0).toUpperCase() + proximaReserva.estado.slice(1)}
                variant={
                  proximaReserva.estado === 'confirmada'
                    ? 'success'
                    : proximaReserva.estado === 'mudada'
                    ? 'warning'
                    : 'default'
                }
              />
            </View>

            <View style={styles.reservaDetails}>
              <View style={styles.reservaDetail}>
                <FontAwesome name="users" size={14} color={Theme.colors.textSecondary} />
                <Text style={styles.reservaDetailText}>
                  {proximaReserva.participantes.length} participantes
                </Text>
              </View>
              {proximaReserva.invitados.length > 0 && (
                <View style={styles.reservaDetail}>
                  <FontAwesome name="user-plus" size={14} color={Theme.colors.textSecondary} />
                  <Text style={styles.reservaDetailText}>
                    {proximaReserva.invitados.length} invitados
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.reservaFooter}>
              <Text style={styles.viewDetails}>Ver detalles</Text>
              <FontAwesome name="chevron-right" size={12} color={Theme.colors.primary} />
            </View>
          </AnimatedCard>
        </Animated.View>
      )}

      {/* Minyan Status */}
      {minyanInfo && (
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <AnimatedCard variant="outlined" style={styles.minyanCard}>
            <View style={styles.minyanHeader}>
              <Text style={styles.minyanIcon}>📖</Text>
              <View style={styles.minyanInfo}>
                <Text style={styles.minyanTitle}>Minyan</Text>
                <Text style={styles.minyanSubtitle}>
                  {minyanInfo.completo ? 'Completo' : `Faltan ${minyanInfo.faltantes}`}
                </Text>
              </View>
              <View style={styles.minyanProgress}>
                <Text style={styles.minyanCount}>{minyanInfo.cantidad}</Text>
                <Text style={styles.minyanTotal}>/10</Text>
              </View>
            </View>
            <View style={styles.minyanBar}>
              <View
                style={[
                  styles.minyanBarFill,
                  {
                    width: `${Math.min((minyanInfo.cantidad / 10) * 100, 100)}%`,
                    backgroundColor: minyanInfo.completo
                      ? Theme.colors.success
                      : Theme.colors.warning,
                  },
                ]}
              />
            </View>
          </AnimatedCard>
        </Animated.View>
      )}

      {/* Quick Actions */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(500)}
        style={styles.quickActionsSection}
      >
        <Text style={styles.sectionTitle}>Acceso Rapido</Text>

        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            emoji="📅"
            title="Habitaciones"
            subtitle="Ver disponibilidad"
            onPress={() => router.push('/(tabs)/reservas')}
            delay={0}
          />
          <QuickActionCard
            emoji="⚽"
            title="Futbol"
            subtitle="Domingo"
            onPress={() => router.push('/(tabs)/actividades')}
            delay={50}
          />
          <QuickActionCard
            emoji="🥩"
            title="Asado"
            subtitle="Inscribirse"
            onPress={() => router.push('/(tabs)/actividades')}
            delay={100}
          />
          <QuickActionCard
            emoji="👨‍👩‍👧‍👦"
            title="Familia"
            subtitle="Mi grupo"
            onPress={() => router.push('/(tabs)/perfil')}
            delay={150}
          />
        </View>
      </Animated.View>

      {/* Admin Quick Access */}
      {user?.esAdmin && (
        <Animated.View entering={FadeInDown.duration(400).delay(600)}>
          <AnimatedCard
            variant="filled"
            color={Theme.colors.errorBackground}
            onPress={() => router.push('/admin')}
            style={styles.adminCard}
          >
            <View style={styles.adminContent}>
              <View style={styles.adminIcon}>
                <FontAwesome name="cog" size={20} color={Theme.colors.error} />
              </View>
              <View style={styles.adminText}>
                <Text style={styles.adminTitle}>Panel de Administracion</Text>
                <Text style={styles.adminSubtitle}>Gestionar precios, usuarios y mas</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Theme.colors.error} />
            </View>
          </AnimatedCard>
        </Animated.View>
      )}
    </ScrollView>
  );
}

// Memoized QuickActionCard for better performance
const QuickActionCard = memo(function QuickActionCard({
  emoji,
  title,
  subtitle,
  onPress,
  delay,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInRight.duration(300).delay(delay)}
      style={styles.quickActionWrapper}
    >
      <AnimatedCard
        variant="default"
        onPress={onPress}
        style={styles.quickActionCard}
      >
        <Text style={styles.quickActionEmoji}>{emoji}</Text>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </AnimatedCard>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxxl,
  },
  greetingSection: {
    marginBottom: Theme.spacing.xl,
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
  },
  userName: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
  },
  userBadges: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  shabbatCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  shabbatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  shabbatBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  shabbatBadgeText: {
    color: Theme.colors.white,
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    letterSpacing: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shabbatDate: {
    fontSize: 32,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  shabbatArrival: {
    fontSize: Theme.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Theme.spacing.lg,
  },
  reserveButton: {
    backgroundColor: Theme.colors.white,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  closedText: {
    color: Theme.colors.white,
    fontSize: Theme.fontSize.sm,
  },
  reservaCard: {
    marginBottom: Theme.spacing.lg,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  reservaLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reservaHabitacion: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginTop: 2,
  },
  reservaDetails: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  reservaDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  reservaDetailText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  reservaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Theme.spacing.xs,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  viewDetails: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  minyanCard: {
    marginBottom: Theme.spacing.xl,
  },
  minyanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  minyanIcon: {
    fontSize: 28,
    marginRight: Theme.spacing.md,
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
  },
  minyanProgress: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  minyanCount: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
  },
  minyanTotal: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
  },
  minyanBar: {
    height: 6,
    backgroundColor: Theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  minyanBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  quickActionsSection: {
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  quickActionWrapper: {
    width: (width - Theme.spacing.lg * 2 - Theme.spacing.md) / 2,
  },
  quickActionCard: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  quickActionEmoji: {
    fontSize: 32,
    marginBottom: Theme.spacing.sm,
  },
  quickActionTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  quickActionSubtitle: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  adminCard: {
    marginTop: Theme.spacing.sm,
  },
  adminContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  adminText: {
    flex: 1,
  },
  adminTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.errorDark,
  },
  adminSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.error,
  },
});
