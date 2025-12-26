import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format, addDays, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth, useReservas } from '@/context';
import { Button, Card } from '@/components/ui';
import { Habitacion, Sector } from '@/types';

const SECTOR_COLORS: Record<Sector, string> = {
  david: '#3B82F6',
  mumi: '#10B981',
  tuni: '#F59E0B',
  quincho: '#8B5CF6',
  libre: '#EC4899',
};

const SECTOR_NAMES: Record<Sector, string> = {
  david: 'Sector David',
  mumi: 'Sector Mumi',
  tuni: 'Sector Tuni',
  quincho: 'Quincho',
  libre: 'Libre',
};

export default function ReservasScreen() {
  const { user } = useAuth();
  const {
    habitaciones,
    disponibilidad,
    proximoShabbat,
    puedeReservar,
    puedeInvitar,
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await cargarHabitaciones();
    await cargarDisponibilidad(proximoShabbat);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDateSelect = (date: DateData) => {
    // Solo permitir seleccionar viernes
    const selectedDateObj = new Date(date.dateString);
    if (getDay(selectedDateObj) === 5) {
      setSelectedDate(date.dateString);
      cargarDisponibilidad(selectedDateObj);
    } else {
      Alert.alert('Info', 'Solo puedes seleccionar viernes para las reservas de Shabbat');
    }
  };

  const handleReservar = async (habitacion: Habitacion) => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para hacer una reserva');
      return;
    }

    if (!puedeReservar) {
      Alert.alert(
        'Reservas cerradas',
        'Las reservas abren el lunes y cierran el miércoles'
      );
      return;
    }

    // Verificar si el usuario puede reservar esta habitación
    if (habitacion.sector !== 'libre' && habitacion.sector !== 'quincho') {
      if (user.grupoFamiliar !== habitacion.sector) {
        Alert.alert(
          'Sector incorrecto',
          `Esta habitación pertenece al ${SECTOR_NAMES[habitacion.sector]}. Solo puedes reservar en tu sector (${SECTOR_NAMES[user.grupoFamiliar]}) o en el Quincho.`
        );
        return;
      }
    }

    Alert.alert(
      'Confirmar Reserva',
      `¿Deseas reservar ${habitacion.nombre}?`,
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

              if (result.mudanzas && result.mudanzas.mudanzas.length > 0) {
                Alert.alert(
                  'Reserva con Mudanza',
                  `Tu reserva fue creada. Se realizaron ${result.mudanzas.mudanzas.length} mudanza(s) por prioridad.`
                );
              } else {
                Alert.alert('Reserva Exitosa', 'Tu reserva ha sido creada');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message);
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

  // Agrupar habitaciones por sector
  const habitacionesPorSector = habitaciones.reduce((acc, hab) => {
    if (!acc[hab.sector]) {
      acc[hab.sector] = [];
    }
    acc[hab.sector].push(hab);
    return acc;
  }, {} as Record<Sector, Habitacion[]>);

  // Marcar viernes en el calendario
  const getMarkedDates = () => {
    const marked: Record<string, any> = {};
    const today = new Date();

    // Marcar próximos 8 viernes
    for (let i = 0; i < 8; i++) {
      const friday = addDays(proximoShabbat, i * 7);
      const dateStr = format(friday, 'yyyy-MM-dd');
      marked[dateStr] = {
        marked: true,
        dotColor: '#2563EB',
      };
    }

    // Marcar fecha seleccionada
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#2563EB',
      };
    }

    return marked;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Calendario */}
      <Card style={styles.calendarCard}>
        <Text style={styles.sectionTitle}>Seleccionar Shabbat</Text>
        <Calendar
          current={selectedDate}
          onDayPress={handleDateSelect}
          markedDates={getMarkedDates()}
          theme={{
            todayTextColor: '#2563EB',
            selectedDayBackgroundColor: '#2563EB',
            arrowColor: '#2563EB',
            textDayFontWeight: '500',
            textMonthFontWeight: '600',
          }}
          firstDay={0}
        />
      </Card>

      {/* Estado de reservas */}
      <View style={styles.statusBar}>
        <View
          style={[
            styles.statusIndicator,
            puedeReservar ? styles.statusOpen : styles.statusClosed,
          ]}
        />
        <Text style={styles.statusText}>
          {puedeReservar
            ? 'Reservas abiertas (hasta miércoles)'
            : 'Reservas cerradas'}
        </Text>
      </View>

      {/* Habitaciones por sector */}
      {Object.entries(habitacionesPorSector).map(([sector, habs]) => (
        <View key={sector} style={styles.sectorContainer}>
          <View style={styles.sectorHeader}>
            <View
              style={[
                styles.sectorDot,
                { backgroundColor: SECTOR_COLORS[sector as Sector] },
              ]}
            />
            <Text style={styles.sectorTitle}>
              {SECTOR_NAMES[sector as Sector]}
            </Text>
          </View>

          {habs.map(hab => {
            const disp = disponibilidad.find(d => d.habitacionId === hab.id);
            const estaDisponible = disp?.disponible ?? true;

            return (
              <Card
                key={hab.id}
                style={[
                  styles.habitacionCard,
                  !estaDisponible && styles.habitacionOcupada,
                ]}
                onPress={() => setSelectedHabitacion(hab)}
              >
                <View style={styles.habitacionHeader}>
                  <Text style={styles.habitacionNombre}>{hab.nombre}</Text>
                  <View
                    style={[
                      styles.disponibilidadBadge,
                      estaDisponible
                        ? styles.badgeDisponible
                        : styles.badgeOcupada,
                    ]}
                  >
                    <Text style={styles.disponibilidadText}>
                      {estaDisponible ? 'Disponible' : 'Ocupada'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.habitacionConfig}>{hab.configuracion}</Text>

                <View style={styles.capacidadRow}>
                  <Text style={styles.capacidadItem}>
                    🛏️ {hab.capacidad.camas} camas
                  </Text>
                  {hab.capacidad.colchones > 0 && (
                    <Text style={styles.capacidadItem}>
                      🛋️ {hab.capacidad.colchones} colchones
                    </Text>
                  )}
                  {hab.capacidad.cunas > 0 && (
                    <Text style={styles.capacidadItem}>
                      👶 {hab.capacidad.cunas} cuna
                    </Text>
                  )}
                </View>

                {estaDisponible && puedeReservar && (
                  <Button
                    title="Reservar"
                    size="small"
                    onPress={() => handleReservar(hab)}
                    style={styles.reservarButton}
                  />
                )}

                {!estaDisponible && disp?.reserva && (
                  <Text style={styles.ocupadaPor}>
                    Reservada por: {disp.reserva.usuarioNombre}
                  </Text>
                )}
              </Card>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  calendarCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusOpen: {
    backgroundColor: '#10B981',
  },
  statusClosed: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectorContainer: {
    marginBottom: 24,
  },
  sectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  sectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  habitacionCard: {
    marginBottom: 12,
  },
  habitacionOcupada: {
    opacity: 0.7,
  },
  habitacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitacionNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  disponibilidadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDisponible: {
    backgroundColor: '#D1FAE5',
  },
  badgeOcupada: {
    backgroundColor: '#FEE2E2',
  },
  disponibilidadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  habitacionConfig: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  capacidadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  capacidadItem: {
    fontSize: 13,
    color: '#374151',
  },
  reservarButton: {
    marginTop: 8,
  },
  ocupadaPor: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
