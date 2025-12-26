import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedCard,
  Badge,
  StatusBadge,
  Avatar,
  EmptyState,
  Skeleton,
  useToast,
} from '@/components/ui';
import { Theme } from '@/constants/Theme';
import { Reserva } from '@/types';

type HistorialFilter = 'todas' | 'pasadas' | 'canceladas';

const SECTOR_COLORS: Record<string, string[]> = {
  david: ['#3B82F6', '#1D4ED8'],
  mumi: ['#10B981', '#059669'],
  tuni: ['#F59E0B', '#D97706'],
  quincho: ['#8B5CF6', '#7C3AED'],
  libre: ['#6B7280', '#4B5563'],
};

const SECTOR_NAMES: Record<string, string> = {
  david: 'David',
  mumi: 'Mumi',
  tuni: 'Tuni',
  quincho: 'Quincho',
  libre: 'Libre',
};

export default function HistorialScreen() {
  const { user } = useAuth();
  const { misReservas, loading } = useReservas();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<HistorialFilter>('todas');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    showToast('Historial actualizado', 'success');
  }, []);

  const filteredReservas = useMemo(() => {
    const hoy = new Date();

    return misReservas
      .filter(reserva => {
        const fechaReserva = new Date(reserva.fechaShabbat);
        const esPasada = isBefore(fechaReserva, hoy);
        const esCancelada = reserva.estado === 'cancelada';

        switch (filter) {
          case 'pasadas':
            return esPasada && !esCancelada;
          case 'canceladas':
            return esCancelada;
          case 'todas':
          default:
            return true;
        }
      })
      .sort((a, b) => {
        return new Date(b.fechaShabbat).getTime() - new Date(a.fechaShabbat).getTime();
      });
  }, [misReservas, filter]);

  const stats = useMemo(() => {
    const hoy = new Date();
    const pasadas = misReservas.filter(
      r => isBefore(new Date(r.fechaShabbat), hoy) && r.estado !== 'cancelada'
    ).length;
    const canceladas = misReservas.filter(r => r.estado === 'cancelada').length;
    const proximas = misReservas.filter(
      r => isAfter(new Date(r.fechaShabbat), hoy) && r.estado === 'confirmada'
    ).length;

    return { pasadas, canceladas, proximas, total: misReservas.length };
  }, [misReservas]);

  const renderFilterButton = (
    filterValue: HistorialFilter,
    label: string,
    count: number
  ) => (
    <Pressable
      style={[styles.filterButton, filter === filterValue && styles.filterButtonActive]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFilter(filterValue);
      }}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterValue && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
      <Badge
        label={count.toString()}
        variant={filter === filterValue ? 'primary' : 'default'}
        size="small"
      />
    </Pressable>
  );

  const renderReservaCard = (reserva: Reserva, index: number) => {
    const fechaReserva = new Date(reserva.fechaShabbat);
    const hoy = new Date();
    const esPasada = isBefore(fechaReserva, hoy);
    const esCancelada = reserva.estado === 'cancelada';

    return (
      <Animated.View
        key={reserva.id}
        entering={FadeInRight.delay(100 + index * 50).springify()}
      >
        <AnimatedCard
          style={[styles.reservaCard, esCancelada && styles.reservaCancelada]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/reserva/${reserva.id}`);
          }}
        >
          {/* Header con sector y estado */}
          <View style={styles.reservaHeader}>
            <LinearGradient
              colors={SECTOR_COLORS[reserva.sector] || SECTOR_COLORS.libre}
              style={styles.sectorBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome name="home" size={12} color={Theme.colors.white} />
              <Text style={styles.sectorText}>{SECTOR_NAMES[reserva.sector]}</Text>
            </LinearGradient>

            <StatusBadge
              status={
                esCancelada
                  ? 'error'
                  : esPasada
                  ? 'default'
                  : 'success'
              }
              label={
                esCancelada
                  ? 'Cancelada'
                  : esPasada
                  ? 'Completada'
                  : 'Activa'
              }
            />
          </View>

          {/* Info de la habitación */}
          <View style={styles.reservaBody}>
            <Text style={styles.habitacionNombre}>{reserva.habitacionNombre}</Text>
            <View style={styles.fechaRow}>
              <FontAwesome name="calendar" size={14} color={Theme.colors.textSecondary} />
              <Text style={styles.fechaText}>
                {format(fechaReserva, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </Text>
            </View>
          </View>

          {/* Participantes */}
          <View style={styles.participantesRow}>
            <View style={styles.avatarStack}>
              {reserva.participantes.slice(0, 3).map((p, idx) => (
                <Avatar
                  key={p.id}
                  name={p.nombre}
                  size="small"
                  style={[styles.stackedAvatar, { marginLeft: idx > 0 ? -8 : 0 }]}
                />
              ))}
            </View>
            <Text style={styles.participantesText}>
              {reserva.participantes.length} participante
              {reserva.participantes.length !== 1 ? 's' : ''}
            </Text>
            <FontAwesome name="chevron-right" size={14} color={Theme.colors.textTertiary} />
          </View>

          {/* Info de pago si existe */}
          {reserva.pagado && (
            <View style={styles.pagoInfo}>
              <FontAwesome name="check-circle" size={14} color={Theme.colors.success} />
              <Text style={styles.pagoText}>Pagada</Text>
              {reserva.montoPago && (
                <Text style={styles.montoText}>${reserva.montoPago.toLocaleString()}</Text>
              )}
            </View>
          )}
        </AnimatedCard>
      </Animated.View>
    );
  };

  if (loading && misReservas.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={20} style={{ marginBottom: 8 }} />
              <Skeleton width="60%" height={16} />
            </View>
          ))}
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
      {/* Stats Header */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.primaryDark]}
          style={styles.statsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.pasadas}</Text>
              <Text style={styles.statLabel}>Pasadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.proximas}</Text>
              <Text style={styles.statLabel}>Próximas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.canceladas}</Text>
              <Text style={styles.statLabel}>Canceladas</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Filters */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <View style={styles.filtersContainer}>
          {renderFilterButton('todas', 'Todas', stats.total)}
          {renderFilterButton('pasadas', 'Pasadas', stats.pasadas)}
          {renderFilterButton('canceladas', 'Canceladas', stats.canceladas)}
        </View>
      </Animated.View>

      {/* Lista de reservas */}
      {filteredReservas.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <EmptyState
            icon="calendar-times-o"
            title={
              filter === 'canceladas'
                ? 'Sin reservas canceladas'
                : filter === 'pasadas'
                ? 'Sin reservas pasadas'
                : 'Sin reservas'
            }
            description={
              filter === 'todas'
                ? 'Aún no tienes reservas registradas'
                : `No tienes reservas ${filter}`
            }
          />
        </Animated.View>
      ) : (
        <View style={styles.reservasList}>
          {filteredReservas.map((reserva, index) => renderReservaCard(reserva, index))}
        </View>
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
  loadingContainer: {
    gap: Theme.spacing.md,
  },
  skeletonCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    ...Theme.shadows.sm,
  },
  statsCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: Theme.colors.primaryLight,
    borderColor: Theme.colors.primary,
  },
  filterButtonText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Theme.colors.primary,
  },
  reservasList: {
    gap: Theme.spacing.md,
  },
  reservaCard: {
    padding: Theme.spacing.lg,
  },
  reservaCancelada: {
    opacity: 0.7,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  sectorText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.white,
  },
  reservaBody: {
    marginBottom: Theme.spacing.md,
  },
  habitacionNombre: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  fechaText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  participantesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackedAvatar: {
    borderWidth: 2,
    borderColor: Theme.colors.surface,
  },
  participantesText: {
    flex: 1,
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginLeft: Theme.spacing.sm,
  },
  pagoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  pagoText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.success,
    fontWeight: Theme.fontWeight.medium,
    flex: 1,
  },
  montoText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  bottomSpacer: {
    height: 32,
  },
});
