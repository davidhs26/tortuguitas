import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth, useReservas } from '@/context';
import { Button, Card } from '@/components/ui';
import { Actividad, TipoActividad } from '@/types';
import {
  getOCrearActividadesSemana,
  inscribirseActividad,
  desinscribirseActividad,
  armarEquiposFutbol,
  calcularEstimacionCarne,
  solicitarAsadoNocturno,
} from '@/services/actividades';

const TIPO_LABELS: Record<TipoActividad, string> = {
  futbol: 'Partido de Futbol',
  asado_domingo: 'Asado del Domingo',
  asado_noche: 'Asado Nocturno',
  minyan: 'Minyan',
};

const TIPO_ICONS: Record<TipoActividad, string> = {
  futbol: '⚽',
  asado_domingo: '🥩',
  asado_noche: '🔥',
  minyan: '📖',
};

export default function ActividadesScreen() {
  const { user } = useAuth();
  const { proximoShabbat } = useReservas();

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActividades();
  }, []);

  const loadActividades = async () => {
    try {
      const data = await getOCrearActividadesSemana(proximoShabbat);
      setActividades(data);
    } catch (err) {
      console.error('Error cargando actividades:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActividades();
    setRefreshing(false);
  };

  const handleInscribirse = async (actividad: Actividad) => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesion');
      return;
    }

    try {
      await inscribirseActividad(actividad.id, user);
      Alert.alert('Exito', `Te has inscrito en ${TIPO_LABELS[actividad.tipo]}`);
      await loadActividades();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDesinscribirse = async (actividad: Actividad) => {
    if (!user) return;

    Alert.alert(
      'Confirmar',
      `¿Deseas cancelar tu inscripcion en ${TIPO_LABELS[actividad.tipo]}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Si, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await desinscribirseActividad(actividad.id, user.id);
              await loadActividades();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleArmarEquipos = async (actividad: Actividad) => {
    try {
      const equipos = await armarEquiposFutbol(actividad.id);
      Alert.alert(
        'Equipos Armados',
        `${equipos[0].nombre}: ${equipos[0].jugadores.join(', ')}\n\n${equipos[1].nombre}: ${equipos[1].jugadores.join(', ')}`
      );
      await loadActividades();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSolicitarAsadoNocturno = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesion');
      return;
    }

    Alert.alert(
      'Solicitar Asado Nocturno',
      '¿Deseas solicitar un asado nocturno para este viernes? Requiere aprobacion del administrador.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          onPress: async () => {
            try {
              await solicitarAsadoNocturno(proximoShabbat, user.id);
              Alert.alert(
                'Solicitud Enviada',
                'Tu solicitud ha sido enviada al administrador para aprobacion.'
              );
              await loadActividades();
            } catch (err: any) {
              Alert.alert('Error', err.message);
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
  const domingoFormateado = format(domingo, "EEEE d 'de' MMMM", { locale: es });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Actividades</Text>
        <Text style={styles.subtitle}>Domingo {format(domingo, 'd/M')}</Text>
      </View>

      {actividades
        .filter(a => a.tipo !== 'minyan')
        .map(actividad => (
          <Card key={actividad.id} style={styles.actividadCard}>
            <View style={styles.actividadHeader}>
              <Text style={styles.actividadIcon}>
                {TIPO_ICONS[actividad.tipo]}
              </Text>
              <View style={styles.actividadInfo}>
                <Text style={styles.actividadTitulo}>
                  {TIPO_LABELS[actividad.tipo]}
                </Text>
                <Text style={styles.actividadFecha}>
                  {format(actividad.fecha, "HH:mm 'hs'")}
                </Text>
              </View>
              {actividad.tipo === 'asado_noche' && !actividad.aprobada && (
                <View style={styles.pendienteBadge}>
                  <Text style={styles.pendienteText}>Pendiente</Text>
                </View>
              )}
            </View>

            <View style={styles.participantesContainer}>
              <Text style={styles.participantesLabel}>
                {actividad.participantes.length} inscrito
                {actividad.participantes.length !== 1 ? 's' : ''}
              </Text>

              {actividad.participantes.length > 0 && (
                <Text style={styles.participantesList}>
                  {actividad.participantes.map(p => p.nombre).join(', ')}
                </Text>
              )}
            </View>

            {/* Equipos de futbol */}
            {actividad.tipo === 'futbol' && actividad.equipos && (
              <View style={styles.equiposContainer}>
                {actividad.equipos.map((equipo, idx) => (
                  <View key={idx} style={styles.equipoCard}>
                    <Text style={styles.equipoNombre}>{equipo.nombre}</Text>
                    <Text style={styles.equipoJugadores}>
                      {equipo.jugadores.join(', ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Estimacion de carne */}
            {actividad.tipo === 'asado_domingo' && actividad.estimacionCarne && (
              <View style={styles.estimacionContainer}>
                <Text style={styles.estimacionLabel}>
                  Estimacion: {actividad.estimacionCarne} kg de carne
                </Text>
              </View>
            )}

            <View style={styles.actividadActions}>
              {isInscrito(actividad) ? (
                <Button
                  title="Cancelar Inscripcion"
                  variant="outline"
                  size="small"
                  onPress={() => handleDesinscribirse(actividad)}
                />
              ) : (
                <Button
                  title="Inscribirme"
                  size="small"
                  onPress={() => handleInscribirse(actividad)}
                  disabled={
                    actividad.tipo === 'asado_noche' && !actividad.aprobada
                  }
                />
              )}

              {actividad.tipo === 'futbol' &&
                user?.esAdmin &&
                actividad.participantes.length >= 4 && (
                  <Button
                    title="Armar Equipos"
                    variant="secondary"
                    size="small"
                    onPress={() => handleArmarEquipos(actividad)}
                    style={styles.secondaryButton}
                  />
                )}
            </View>
          </Card>
        ))}

      {/* Boton para solicitar asado nocturno */}
      <Card style={styles.solicitudCard}>
        <Text style={styles.solicitudTitulo}>🔥 Asado Nocturno</Text>
        <Text style={styles.solicitudDescripcion}>
          ¿Quieres organizar un asado el viernes por la noche? Requiere
          aprobacion del administrador.
        </Text>
        <Button
          title="Solicitar Asado Nocturno"
          variant="outline"
          onPress={handleSolicitarAsadoNocturno}
        />
      </Card>

      {/* Info adicional */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Informacion</Text>
        <Text style={styles.infoText}>
          • Las inscripciones cierran el miercoles{'\n'}
          • El asado del domingo se calcula 0.5 kg por persona{'\n'}
          • Los equipos de futbol se arman automaticamente
        </Text>
      </View>
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  actividadCard: {
    marginBottom: 16,
  },
  actividadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actividadIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  actividadInfo: {
    flex: 1,
  },
  actividadTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  actividadFecha: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  pendienteBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendienteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  participantesContainer: {
    marginBottom: 12,
  },
  participantesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  participantesList: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  equiposContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  equipoCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  equipoNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  equipoJugadores: {
    fontSize: 12,
    color: '#6B7280',
  },
  estimacionContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  estimacionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  actividadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    marginLeft: 8,
  },
  solicitudCard: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  solicitudTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  solicitudDescripcion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  infoSection: {
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
});
