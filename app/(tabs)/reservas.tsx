import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Calendar, DateData } from 'react-native-calendars';
import { format, addDays, getDay } from 'date-fns';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedCard,
  AnimatedButton,
  Badge,
  StatusBadge,
  Avatar,
  EmptyState,
  SkeletonHabitacion,
  useToast,
} from '@/components/ui';
import { Habitacion, Sector } from '@/types';
import { Theme } from '@/constants/Theme';

const SECTOR_COLORS: Record<Sector, string> = {
  david: '#3B82F6',
  mumi: '#10B981',
  tuni: '#F59E0B',
  quincho: '#8B5CF6',
  libre: '#EC4899',
};

const SECTOR_GRADIENTS: Record<Sector, string[]> = {
  david: ['#3B82F6', '#1D4ED8'],
  mumi: ['#10B981', '#059669'],
  tuni: ['#F59E0B', '#D97706'],
  quincho: ['#8B5CF6', '#7C3AED'],
  libre: ['#EC4899', '#DB2777'],
};

const SECTOR_NAMES: Record<Sector, string> = {
  david: 'Sector David',
  mumi: 'Sector Mumi',
  tuni: 'Sector Tuni',
  quincho: 'Quincho',
  libre: 'Libre',
};

const SECTOR_ICONS: Record<Sector, keyof typeof FontAwesome.glyphMap> = {
  david: 'home',
  mumi: 'home',
  tuni: 'home',
  quincho: 'cutlery',
  libre: 'users',
};

export default function ReservasScreen() {
  const { user } = useAuth();
  const {
    habitaciones,
    disponibilidad,
    proximoShabbat,
    puedeReservar,
    cargarHabitaciones,
    cargarDisponibilidad,
    hacerReserva,
    loading,
  } = useReservas();

  const [selectedDate, setSelectedDate] = useState<string>(
    format(proximoShabbat, 'yyyy-MM-dd')
  );
  const [selectedHabitacion, setSelectedHabitacion] = useState<Habitacion | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await cargarHabitaciones();
    await cargarDisponibilidad(proximoShabbat);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setRefreshing(false);
    showToast('Datos actualizados', 'success');
  }, []);

  const handleDateSelect = (date: DateData) => {
    const selectedDateObj = new Date(date.dateString);
    if (getDay(selectedDateObj) === 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedDate(date.dateString);
      cargarDisponibilidad(selectedDateObj);
      setShowCalendar(false);
      showToast(`Shabbat ${format(selectedDateObj, 'dd MMM')} seleccionado`, 'info');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Solo puedes seleccionar viernes', 'warning');
    }
  };

  const handleReservar = async (habitacion: Habitacion) => {
    if (!user) {
      showToast('Debes iniciar sesión', 'error');
      return;
    }

    if (!puedeReservar) {
      showToast('Reservas cerradas (Lunes a Miércoles)', 'warning');
      return;
    }

    if (habitacion.sector !== 'libre' && habitacion.sector !== 'quincho') {
      if (user.grupoFamiliar !== habitacion.sector) {
        showToast(`Solo puedes reservar en ${SECTOR_NAMES[user.grupoFamiliar]}`, 'error');
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Confirmar Reserva',
      `¿Deseas reservar ${habitacion.nombre} para el Shabbat del ${format(new Date(selectedDate), 'dd/MM/yyyy')}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reservar',
          onPress: async () => {
            try {
              const result = await hacerReserva(
                habitacion.id,
                new Date(selectedDate),
                [
                  {
                    id: user.id,
                    nombre: `${user.nombre} ${user.apellido}`,
                    genero: user.genero,
                    edad: calcularEdad(user.fechaNacimiento),
                    esInvitado: false,
                  },
                ]
              );

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              if (result.mudanzas && result.mudanzas.mudanzas.length > 0) {
                showToast(`Reserva creada con ${result.mudanzas.mudanzas.length} mudanza(s)`, 'success');
              } else {
                showToast('¡Reserva exitosa!', 'success');
              }
            } catch (err: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              showToast(err.message, 'error');
            }
          },
        },
      ]
    );
  };

  const calcularEdad = (fechaNacimiento: Date): number => {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const m = hoy.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const habitacionesPorSector = habitaciones.reduce((acc, hab) => {
    if (!acc[hab.sector]) {
      acc[hab.sector] = [];
    }
    acc[hab.sector].push(hab);
    return acc;
  }, {} as Record<Sector, Habitacion[]>);

  const getMarkedDates = () => {
    const marked: Record<string, any> = {};

    for (let i = 0; i < 8; i++) {
      const friday = addDays(proximoShabbat, i * 7);
      const dateStr = format(friday, 'yyyy-MM-dd');
      marked[dateStr] = {
        marked: true,
        dotColor: Theme.colors.primary,
      };
    }

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: Theme.colors.primary,
      };
    }

    return marked;
  };

  const totalHabitaciones = habitaciones.length;
  const habitacionesDisponibles = disponibilidad.filter(d => d.disponible).length;
  const porcentajeOcupacion = totalHabitaciones > 0
    ? Math.round(((totalHabitaciones - habitacionesDisponibles) / totalHabitaciones) * 100)
    : 0;

  if (loading && habitaciones.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.loadingContainer}>
          <SkeletonHabitacion />
          <SkeletonHabitacion />
          <SkeletonHabitacion />
          <SkeletonHabitacion />
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
      {/* Header con fecha y estado */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.primaryDark]}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerLabel}>Shabbat Seleccionado</Text>
              <Text style={styles.headerDate}>
                {format(new Date(selectedDate), 'dd MMMM yyyy')}
              </Text>
            </View>
            <Pressable
              style={styles.calendarToggle}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCalendar(!showCalendar);
              }}
            >
              <FontAwesome name="calendar" size={20} color={Theme.colors.white} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{habitacionesDisponibles}</Text>
              <Text style={styles.statLabel}>Disponibles</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalHabitaciones - habitacionesDisponibles}</Text>
              <Text style={styles.statLabel}>Ocupadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{porcentajeOcupacion}%</Text>
              <Text style={styles.statLabel}>Ocupación</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Calendario expandible */}
      {showCalendar && (
        <Animated.View entering={FadeInDown.springify()}>
          <AnimatedCard style={styles.calendarCard}>
            <Calendar
              current={selectedDate}
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              theme={{
                calendarBackground: 'transparent',
                todayTextColor: Theme.colors.primary,
                selectedDayBackgroundColor: Theme.colors.primary,
                selectedDayTextColor: Theme.colors.white,
                arrowColor: Theme.colors.primary,
                monthTextColor: Theme.colors.text,
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                dayTextColor: Theme.colors.text,
                textDisabledColor: Theme.colors.textTertiary,
              }}
              firstDay={0}
            />
          </AnimatedCard>
        </Animated.View>
      )}

      {/* Estado de reservas */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={styles.statusContainer}
      >
        <View style={styles.statusCard}>
          <View style={[
            styles.statusDot,
            puedeReservar ? styles.statusOpen : styles.statusClosed,
          ]} />
          <Text style={styles.statusText}>
            {puedeReservar
              ? 'Reservas abiertas'
              : 'Reservas cerradas'}
          </Text>
          <Text style={styles.statusSubtext}>
            {puedeReservar
              ? 'Hasta el miércoles'
              : 'Abren el lunes'}
          </Text>
        </View>
      </Animated.View>

      {/* Habitaciones por sector */}
      {Object.keys(habitacionesPorSector).length === 0 ? (
        <EmptyState
          icon="bed"
          title="No hay habitaciones"
          description="Aún no se han configurado las habitaciones disponibles"
        />
      ) : (
        Object.entries(habitacionesPorSector).map(([sector, habs], sectorIndex) => (
          <Animated.View
            key={sector}
            entering={FadeInDown.delay(300 + sectorIndex * 100).springify()}
          >
            <View style={styles.sectorHeader}>
              <LinearGradient
                colors={SECTOR_GRADIENTS[sector as Sector]}
                style={styles.sectorIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome
                  name={SECTOR_ICONS[sector as Sector]}
                  size={16}
                  color={Theme.colors.white}
                />
              </LinearGradient>
              <Text style={styles.sectorTitle}>
                {SECTOR_NAMES[sector as Sector]}
              </Text>
              <Badge
                label={`${habs.length}`}
                variant="default"
                size="small"
              />
            </View>

            {habs.map((hab, habIndex) => {
              const disp = disponibilidad.find(d => d.habitacionId === hab.id);
              const estaDisponible = disp?.disponible ?? true;

              return (
                <Animated.View
                  key={hab.id}
                  entering={FadeInRight.delay(400 + sectorIndex * 100 + habIndex * 50).springify()}
                >
                  <AnimatedCard
                    variant={estaDisponible ? 'default' : 'outlined'}
                    style={[
                      styles.habitacionCard,
                      !estaDisponible && styles.habitacionOcupada,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedHabitacion(hab);
                    }}
                  >
                    <View style={styles.habitacionHeader}>
                      <View style={styles.habitacionInfo}>
                        <Text style={styles.habitacionNombre}>{hab.nombre}</Text>
                        <Text style={styles.habitacionConfig}>{hab.configuracion}</Text>
                      </View>
                      <StatusBadge
                        status={estaDisponible ? 'success' : 'error'}
                        label={estaDisponible ? 'Disponible' : 'Ocupada'}
                      />
                    </View>

                    <View style={styles.capacidadRow}>
                      <View style={styles.capacidadItem}>
                        <FontAwesome name="bed" size={14} color={Theme.colors.textSecondary} />
                        <Text style={styles.capacidadText}>{hab.capacidad.camas} camas</Text>
                      </View>
                      {hab.capacidad.colchones > 0 && (
                        <View style={styles.capacidadItem}>
                          <FontAwesome name="square" size={14} color={Theme.colors.textSecondary} />
                          <Text style={styles.capacidadText}>{hab.capacidad.colchones} colchones</Text>
                        </View>
                      )}
                      {hab.capacidad.cunas > 0 && (
                        <View style={styles.capacidadItem}>
                          <FontAwesome name="child" size={14} color={Theme.colors.textSecondary} />
                          <Text style={styles.capacidadText}>{hab.capacidad.cunas} cuna</Text>
                        </View>
                      )}
                    </View>

                    {!estaDisponible && disp?.reserva && (
                      <View style={styles.ocupadaInfo}>
                        <Avatar name={disp.reserva.usuarioNombre} size="small" />
                        <Text style={styles.ocupadaPor}>
                          Reservada por {disp.reserva.usuarioNombre}
                        </Text>
                      </View>
                    )}

                    {estaDisponible && puedeReservar && (
                      <AnimatedButton
                        title="Reservar"
                        variant="primary"
                        size="small"
                        icon="check"
                        onPress={() => handleReservar(hab)}
                        style={styles.reservarButton}
                      />
                    )}

                    {estaDisponible && !puedeReservar && (
                      <View style={styles.closedInfo}>
                        <FontAwesome name="lock" size={12} color={Theme.colors.textTertiary} />
                        <Text style={styles.closedText}>Reservas cerradas</Text>
                      </View>
                    )}
                  </AnimatedCard>
                </Animated.View>
              );
            })}
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
  loadingContainer: {
    gap: Theme.spacing.md,
  },
  headerCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  headerLabel: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Theme.spacing.xs,
  },
  headerDate: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  calendarToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  calendarCard: {
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.sm,
  },
  statusContainer: {
    marginBottom: Theme.spacing.lg,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Theme.spacing.sm,
  },
  statusOpen: {
    backgroundColor: Theme.colors.success,
  },
  statusClosed: {
    backgroundColor: Theme.colors.error,
  },
  statusText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    flex: 1,
  },
  statusSubtext: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  sectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  sectorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  sectorTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    flex: 1,
  },
  habitacionCard: {
    marginBottom: Theme.spacing.sm,
  },
  habitacionOcupada: {
    opacity: 0.75,
  },
  habitacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  habitacionInfo: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  habitacionNombre: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginBottom: 2,
  },
  habitacionConfig: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  capacidadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  capacidadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  capacidadText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  ocupadaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  ocupadaPor: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  reservarButton: {
    marginTop: Theme.spacing.md,
  },
  closedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.sm,
  },
  closedText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textTertiary,
  },
  bottomSpacer: {
    height: 32,
  },
});
