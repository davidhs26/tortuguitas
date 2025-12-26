import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedCard,
  Avatar,
  Badge,
} from '@/components/ui';
import { Theme } from '@/constants/Theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - Theme.spacing.md * 4;
const BAR_MAX_HEIGHT = 100;

const SECTOR_COLORS: Record<string, string> = {
  david: '#3B82F6',
  mumi: '#10B981',
  tuni: '#F59E0B',
  quincho: '#8B5CF6',
  libre: '#EC4899',
};

export default function EstadisticasScreen() {
  const { user } = useAuth();
  const { misReservas } = useReservas();

  // Estadísticas generales
  const stats = useMemo(() => {
    const hoy = new Date();
    const totalReservas = misReservas.length;
    const reservasCompletadas = misReservas.filter(
      r => new Date(r.fechaShabbat) < hoy && r.estado !== 'cancelada'
    ).length;
    const reservasCanceladas = misReservas.filter(r => r.estado === 'cancelada').length;
    const reservasPendientes = misReservas.filter(
      r => new Date(r.fechaShabbat) >= hoy && r.estado === 'confirmada'
    ).length;

    // Total de participantes en todas las reservas
    const totalParticipantes = misReservas.reduce(
      (sum, r) => sum + r.participantes.length,
      0
    );

    // Total de invitados
    const totalInvitados = misReservas.reduce(
      (sum, r) => sum + r.invitados.length,
      0
    );

    // Total pagado
    const totalPagado = misReservas
      .filter(r => r.pagado)
      .reduce((sum, r) => sum + (r.montoPago || 0), 0);

    return {
      totalReservas,
      reservasCompletadas,
      reservasCanceladas,
      reservasPendientes,
      totalParticipantes,
      totalInvitados,
      totalPagado,
      tasaAsistencia: totalReservas > 0
        ? Math.round((reservasCompletadas / totalReservas) * 100)
        : 0,
    };
  }, [misReservas]);

  // Reservas por mes (últimos 6 meses)
  const reservasPorMes = useMemo(() => {
    const hoy = new Date();
    const hace6Meses = subMonths(hoy, 5);
    const meses = eachMonthOfInterval({ start: hace6Meses, end: hoy });

    return meses.map(mes => {
      const inicio = startOfMonth(mes);
      const fin = endOfMonth(mes);

      const reservasDelMes = misReservas.filter(r => {
        const fecha = new Date(r.fechaShabbat);
        return fecha >= inicio && fecha <= fin && r.estado !== 'cancelada';
      });

      return {
        mes: format(mes, 'MMM', { locale: es }),
        mesCompleto: format(mes, 'MMMM yyyy', { locale: es }),
        cantidad: reservasDelMes.length,
      };
    });
  }, [misReservas]);

  const maxReservasEnMes = Math.max(...reservasPorMes.map(m => m.cantidad), 1);

  // Reservas por sector
  const reservasPorSector = useMemo(() => {
    const porSector: Record<string, number> = {};

    misReservas.forEach(r => {
      if (r.estado !== 'cancelada') {
        porSector[r.sector] = (porSector[r.sector] || 0) + 1;
      }
    });

    return Object.entries(porSector)
      .map(([sector, cantidad]) => ({ sector, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [misReservas]);

  const totalPorSector = reservasPorSector.reduce((sum, s) => sum + s.cantidad, 0);

  // Top habitaciones
  const topHabitaciones = useMemo(() => {
    const porHabitacion: Record<string, { nombre: string; cantidad: number }> = {};

    misReservas.forEach(r => {
      if (r.estado !== 'cancelada') {
        if (!porHabitacion[r.habitacionId]) {
          porHabitacion[r.habitacionId] = { nombre: r.habitacionNombre, cantidad: 0 };
        }
        porHabitacion[r.habitacionId].cantidad++;
      }
    });

    return Object.values(porHabitacion)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [misReservas]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Stats */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.primaryDark]}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Avatar
              name={`${user?.nombre} ${user?.apellido}`}
              size="large"
              style={styles.headerAvatar}
            />
            <Text style={styles.headerName}>{user?.nombre} {user?.apellido}</Text>
            <Text style={styles.headerSubtitle}>Estadísticas personales</Text>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{stats.totalReservas}</Text>
              <Text style={styles.headerStatLabel}>Reservas</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{stats.tasaAsistencia}%</Text>
              <Text style={styles.headerStatLabel}>Asistencia</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{stats.totalInvitados}</Text>
              <Text style={styles.headerStatLabel}>Invitados</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Quick Stats Grid */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <View style={styles.statsGrid}>
          <AnimatedCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <FontAwesome name="calendar-check-o" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statCardValue}>{stats.reservasCompletadas}</Text>
            <Text style={styles.statCardLabel}>Completadas</Text>
          </AnimatedCard>

          <AnimatedCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome name="clock-o" size={18} color="#D97706" />
            </View>
            <Text style={styles.statCardValue}>{stats.reservasPendientes}</Text>
            <Text style={styles.statCardLabel}>Pendientes</Text>
          </AnimatedCard>

          <AnimatedCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <FontAwesome name="users" size={18} color="#059669" />
            </View>
            <Text style={styles.statCardValue}>{stats.totalParticipantes}</Text>
            <Text style={styles.statCardLabel}>Participantes</Text>
          </AnimatedCard>

          <AnimatedCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FCE7F3' }]}>
              <FontAwesome name="credit-card" size={18} color="#DB2777" />
            </View>
            <Text style={styles.statCardValue}>
              ${(stats.totalPagado / 1000).toFixed(0)}k
            </Text>
            <Text style={styles.statCardLabel}>Total Pagado</Text>
          </AnimatedCard>
        </View>
      </Animated.View>

      {/* Gráfico de barras - Reservas por mes */}
      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <AnimatedCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>Reservas por Mes</Text>
          <Text style={styles.chartSubtitle}>Últimos 6 meses</Text>

          <View style={styles.barChart}>
            {reservasPorMes.map((mes, index) => (
              <Animated.View
                key={mes.mes}
                entering={FadeInRight.delay(400 + index * 50).springify()}
                style={styles.barContainer}
              >
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (mes.cantidad / maxReservasEnMes) * BAR_MAX_HEIGHT || 4,
                        backgroundColor: Theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{mes.mes}</Text>
                <Text style={styles.barValue}>{mes.cantidad}</Text>
              </Animated.View>
            ))}
          </View>
        </AnimatedCard>
      </Animated.View>

      {/* Reservas por sector */}
      <Animated.View entering={FadeInDown.delay(400).springify()}>
        <AnimatedCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>Por Sector</Text>
          <Text style={styles.chartSubtitle}>Distribución de reservas</Text>

          {reservasPorSector.map((item, index) => {
            const porcentaje = totalPorSector > 0
              ? Math.round((item.cantidad / totalPorSector) * 100)
              : 0;

            return (
              <Animated.View
                key={item.sector}
                entering={FadeInRight.delay(500 + index * 50).springify()}
                style={styles.sectorRow}
              >
                <View style={styles.sectorInfo}>
                  <View
                    style={[
                      styles.sectorDot,
                      { backgroundColor: SECTOR_COLORS[item.sector] || Theme.colors.textTertiary },
                    ]}
                  />
                  <Text style={styles.sectorName}>
                    {item.sector.charAt(0).toUpperCase() + item.sector.slice(1)}
                  </Text>
                </View>
                <View style={styles.sectorBarContainer}>
                  <View
                    style={[
                      styles.sectorBar,
                      {
                        width: `${porcentaje}%`,
                        backgroundColor: SECTOR_COLORS[item.sector] || Theme.colors.textTertiary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.sectorValue}>{item.cantidad}</Text>
              </Animated.View>
            );
          })}
        </AnimatedCard>
      </Animated.View>

      {/* Top habitaciones */}
      {topHabitaciones.length > 0 && (
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <AnimatedCard style={styles.chartCard}>
            <Text style={styles.chartTitle}>Habitaciones Favoritas</Text>
            <Text style={styles.chartSubtitle}>Más reservadas</Text>

            {topHabitaciones.map((hab, index) => (
              <Animated.View
                key={hab.nombre}
                entering={FadeInRight.delay(600 + index * 50).springify()}
                style={styles.habitacionRow}
              >
                <View style={styles.habitacionRank}>
                  <Text style={styles.habitacionRankText}>{index + 1}</Text>
                </View>
                <Text style={styles.habitacionNombre}>{hab.nombre}</Text>
                <Badge
                  label={`${hab.cantidad} reserva${hab.cantidad !== 1 ? 's' : ''}`}
                  variant="info"
                  size="small"
                />
              </Animated.View>
            ))}
          </AnimatedCard>
        </Animated.View>
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
  headerCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  headerAvatar: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: Theme.spacing.md,
  },
  headerName: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  headerSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
  },
  headerStat: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  headerStatLabel: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: Theme.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    width: (width - Theme.spacing.md * 2 - Theme.spacing.sm) / 2 - Theme.spacing.sm / 2,
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  statCardValue: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
  },
  statCardLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  chartCard: {
    marginBottom: Theme.spacing.lg,
  },
  chartTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  chartSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT + 50,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.sm,
    textTransform: 'capitalize',
  },
  barValue: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginTop: 2,
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  sectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Theme.spacing.sm,
  },
  sectorName: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.text,
  },
  sectorBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: 4,
    marginHorizontal: Theme.spacing.md,
  },
  sectorBar: {
    height: '100%',
    borderRadius: 4,
  },
  sectorValue: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    width: 30,
    textAlign: 'right',
  },
  habitacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  habitacionRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  habitacionRankText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.primary,
  },
  habitacionNombre: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
  },
  bottomSpacer: {
    height: 32,
  },
});
