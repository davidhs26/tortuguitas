import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
  Dimensions,
  FlatList,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  Layout,
} from 'react-native-reanimated';
import { Calendar, DateData } from 'react-native-calendars';
import { format, addDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedButton,
  SearchBar,
  ImageCard,
  ImageCardCompact,
  SegmentControl,
  Badge,
  StatusBadge,
  Avatar,
  EmptyState,
  SkeletonHabitacion,
  useToast,
  FadeView,
  ScalePress,
  StatsHero,
} from '@/components/ui';
import { Habitacion, Sector } from '@/types';
import { Theme, Gradients, SectorConfig } from '@/constants/Theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type FilterOption = 'todos' | Sector;
type ViewMode = 'cards' | 'list';

const ROOM_IMAGES: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  david: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
  mumi: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
  tuni: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
  quincho: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  libre: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
};

export default function ReservasScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<FilterOption>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const { showToast } = useToast();

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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
      showToast('Debes iniciar sesion', 'error');
      return;
    }

    if (!puedeReservar) {
      showToast('Reservas cerradas (Lunes a Miercoles)', 'warning');
      return;
    }

    const sectorNames = {
      david: 'Sector David',
      mumi: 'Sector Mumi',
      tuni: 'Sector Tuni',
      quincho: 'Quincho',
      libre: 'Libre',
    };

    if (habitacion.sector !== 'libre' && habitacion.sector !== 'quincho') {
      if (user.grupoFamiliar !== habitacion.sector) {
        showToast(`Solo puedes reservar en ${sectorNames[user.grupoFamiliar]}`, 'error');
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Confirmar Reserva',
      `Reservar ${habitacion.nombre} para el Shabbat del ${format(new Date(selectedDate), 'dd/MM/yyyy')}?`,
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
                showToast('Reserva exitosa!', 'success');
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

  const habitacionesFiltradas = useMemo(() => {
    return habitaciones.filter(hab => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNombre = hab.nombre.toLowerCase().includes(query);
        const matchConfig = hab.configuracion.toLowerCase().includes(query);
        if (!matchNombre && !matchConfig) return false;
      }

      if (sectorFilter !== 'todos' && hab.sector !== sectorFilter) {
        return false;
      }

      return true;
    });
  }, [habitaciones, searchQuery, sectorFilter]);

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

  const sectorFilters = [
    { key: 'todos', label: 'Todos' },
    { key: 'david', label: 'David' },
    { key: 'mumi', label: 'Mumi' },
    { key: 'tuni', label: 'Tuni' },
    { key: 'quincho', label: 'Quincho' },
    { key: 'libre', label: 'Libre' },
  ];

  if (loading && habitaciones.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <SkeletonHabitacion />
          <SkeletonHabitacion />
          <SkeletonHabitacion />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, headerAnimatedStyle, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Reservas</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode(viewMode === 'cards' ? 'list' : 'cards');
            }}
          >
            <FontAwesome
              name={viewMode === 'cards' ? 'th-list' : 'th-large'}
              size={20}
              color={Theme.colors.text}
            />
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
        {/* Date Header */}
        <FadeView direction="down" delay={0}>
          <ScalePress onPress={() => setShowCalendar(!showCalendar)}>
            <View style={styles.dateHeader}>
              <LinearGradient
                colors={Theme.colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dateGradient}
              >
                <View style={styles.dateContent}>
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>SHABBAT SELECCIONADO</Text>
                    <Text style={styles.dateValue}>
                      {format(new Date(selectedDate), "d 'de' MMMM", { locale: es })}
                    </Text>
                    <View style={styles.dateSubRow}>
                      <FontAwesome name="calendar" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.dateSubtext}>
                        Llegada: {format(new Date(selectedDate), 'EEEE', { locale: es })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.calendarButton}>
                    <FontAwesome
                      name={showCalendar ? 'chevron-up' : 'calendar'}
                      size={18}
                      color={Theme.colors.white}
                    />
                  </View>
                </View>

                {/* Stats */}
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
                    <Text style={styles.statLabel}>Ocupacion</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </ScalePress>
        </FadeView>

        {/* Calendar (Collapsible) */}
        {showCalendar && (
          <FadeView direction="down">
            <View style={styles.calendarContainer}>
              <Calendar
                current={selectedDate}
                onDayPress={handleDateSelect}
                markedDates={getMarkedDates()}
                theme={{
                  calendarBackground: Theme.colors.surface,
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
            </View>
          </FadeView>
        )}

        {/* Status Banner */}
        <FadeView direction="up" delay={100}>
          <View style={[
            styles.statusBanner,
            { backgroundColor: puedeReservar ? Theme.colors.successBackground : Theme.colors.errorBackground }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: puedeReservar ? Theme.colors.success : Theme.colors.error }
            ]} />
            <Text style={[
              styles.statusText,
              { color: puedeReservar ? Theme.colors.successDark : Theme.colors.errorDark }
            ]}>
              {puedeReservar ? 'Reservas abiertas hasta el miercoles' : 'Reservas cerradas - Abren el lunes'}
            </Text>
          </View>
        </FadeView>

        {/* Search and Filters */}
        <FadeView direction="up" delay={150}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar habitacion..."
            style={styles.searchBar}
          />
        </FadeView>

        {/* Sector Filter Pills */}
        <FadeView direction="up" delay={200}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            {sectorFilters.map((filter) => {
              const isActive = sectorFilter === filter.key;
              const sectorConfig = filter.key !== 'todos' ? SectorConfig[filter.key as Sector] : null;

              return (
                <ScalePress
                  key={filter.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSectorFilter(filter.key as FilterOption);
                  }}
                >
                  <View style={[
                    styles.filterPill,
                    isActive && styles.filterPillActive,
                    isActive && sectorConfig && { backgroundColor: sectorConfig.color },
                  ]}>
                    {sectorConfig && (
                      <View style={[
                        styles.filterDot,
                        { backgroundColor: isActive ? Theme.colors.white : sectorConfig.color }
                      ]} />
                    )}
                    <Text style={[
                      styles.filterText,
                      isActive && styles.filterTextActive,
                    ]}>
                      {filter.label}
                    </Text>
                  </View>
                </ScalePress>
              );
            })}
          </ScrollView>
        </FadeView>

        {/* Results count */}
        <FadeView direction="up" delay={250}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {habitacionesFiltradas.length} habitacion{habitacionesFiltradas.length !== 1 ? 'es' : ''}
            </Text>
          </View>
        </FadeView>

        {/* Rooms List */}
        {habitacionesFiltradas.length === 0 ? (
          <EmptyState
            icon="bed"
            title="No hay habitaciones"
            description="Prueba ajustando los filtros de busqueda"
          />
        ) : viewMode === 'cards' ? (
          // Card View
          habitacionesFiltradas.map((habitacion, index) => {
            const disp = disponibilidad.find(d => d.habitacionId === habitacion.id);
            const estaDisponible = disp?.disponible ?? true;
            const sectorConfig = SectorConfig[habitacion.sector];

            return (
              <FadeView key={habitacion.id} direction="up" delay={300 + index * 50}>
                <View style={styles.cardWrapper}>
                  <ImageCard
                    title={habitacion.nombre}
                    subtitle={habitacion.configuracion}
                    image={ROOM_IMAGES[habitacion.sector] || ROOM_IMAGES.default}
                    sector={habitacion.sector}
                    capacity={habitacion.capacidad.camas + habitacion.capacidad.colchones}
                    badge={estaDisponible ? undefined : 'Ocupada'}
                    badgeVariant={estaDisponible ? 'success' : 'error'}
                    available={estaDisponible}
                    onPress={() => {
                      if (estaDisponible && puedeReservar) {
                        handleReservar(habitacion);
                      } else if (!estaDisponible) {
                        showToast('Esta habitacion ya esta reservada', 'info');
                      } else {
                        showToast('Las reservas estan cerradas', 'warning');
                      }
                    }}
                  />

                  {/* Quick Reserve Button */}
                  {estaDisponible && puedeReservar && (
                    <View style={styles.quickReserveButton}>
                      <AnimatedButton
                        title="Reservar ahora"
                        variant="primary"
                        size="small"
                        icon="check"
                        onPress={() => handleReservar(habitacion)}
                        haptic
                      />
                    </View>
                  )}

                  {/* Reserved by info */}
                  {!estaDisponible && disp?.reserva && (
                    <View style={styles.reservedByContainer}>
                      <Avatar name={disp.reserva.usuarioNombre} size="small" />
                      <Text style={styles.reservedByText}>
                        Reservada por {disp.reserva.usuarioNombre}
                      </Text>
                    </View>
                  )}
                </View>
              </FadeView>
            );
          })
        ) : (
          // List View
          habitacionesFiltradas.map((habitacion, index) => {
            const disp = disponibilidad.find(d => d.habitacionId === habitacion.id);
            const estaDisponible = disp?.disponible ?? true;

            return (
              <FadeView key={habitacion.id} direction="up" delay={300 + index * 30}>
                <View style={styles.listItemWrapper}>
                  <ImageCardCompact
                    title={habitacion.nombre}
                    subtitle={habitacion.configuracion}
                    image={ROOM_IMAGES[habitacion.sector]}
                    sector={habitacion.sector}
                    capacity={habitacion.capacidad.camas}
                    available={estaDisponible}
                    onPress={() => {
                      if (estaDisponible && puedeReservar) {
                        handleReservar(habitacion);
                      }
                    }}
                  />
                </View>
              </FadeView>
            );
          })
        )}

        {/* Bottom Spacer */}
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
    gap: Theme.spacing.md,
  },

  // Date Header
  dateHeader: {
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    borderRadius: Theme.borderRadius.cardLarge,
    overflow: 'hidden',
    ...Theme.shadows.lg,
  },
  dateGradient: {
    padding: Theme.spacing.lg,
  },
  dateContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: Theme.spacing.xs,
  },
  dateValue: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
    marginBottom: Theme.spacing.sm,
  },
  dateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  dateSubtext: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: Theme.fontSize.xl,
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
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Calendar
  calendarContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.sm,
    ...Theme.shadows.md,
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
  },

  // Search
  searchBar: {
    marginBottom: Theme.spacing.md,
  },

  // Filters
  filtersScroll: {
    marginBottom: Theme.spacing.md,
    marginHorizontal: -Theme.spacing.lg,
  },
  filtersContent: {
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.sm,
    flexDirection: 'row',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterPillActive: {
    borderColor: 'transparent',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textSecondary,
  },
  filterTextActive: {
    color: Theme.colors.white,
  },

  // Results
  resultsHeader: {
    marginBottom: Theme.spacing.md,
  },
  resultsCount: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeight.medium,
  },

  // Cards
  cardWrapper: {
    marginBottom: Theme.spacing.xl,
  },
  quickReserveButton: {
    marginTop: Theme.spacing.md,
  },
  reservedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  reservedByText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  // List View
  listItemWrapper: {
    marginBottom: Theme.spacing.sm,
  },
});
