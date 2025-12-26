import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth, useReservas } from '@/context';
import { Button, Card } from '@/components/ui';
import { Reserva } from '@/types';
import { getReserva, cancelarReserva } from '@/services/reservas';
import { crearPagoReserva, getPago } from '@/services/pagos';

export default function ReservaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    loadReserva();
  }, [id]);

  const loadReserva = async () => {
    if (!id) return;

    try {
      const data = await getReserva(id);
      setReserva(data);
    } catch (err) {
      console.error('Error cargando reserva:', err);
      Alert.alert('Error', 'No se pudo cargar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estas seguro que deseas cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Si, cancelar',
          style: 'destructive',
          onPress: async () => {
            setProcesando(true);
            try {
              await cancelarReserva(id);
              Alert.alert('Reserva Cancelada', 'Tu reserva ha sido cancelada');
              router.back();
            } catch (err) {
              Alert.alert('Error', 'No se pudo cancelar la reserva');
            } finally {
              setProcesando(false);
            }
          },
        },
      ]
    );
  };

  const handlePagar = async () => {
    if (!reserva) return;

    setProcesando(true);
    try {
      const pago = await crearPagoReserva(reserva);
      Alert.alert(
        'Pago Generado',
        `Monto a pagar: $${pago.monto}\n\nEl pago sera procesado a traves de MercadoPago.`
      );
      await loadReserva();
    } catch (err) {
      Alert.alert('Error', 'No se pudo generar el pago');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!reserva) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Reserva no encontrada</Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  const esMiReserva = user?.id === reserva.usuarioId;
  const puedeCancelar =
    esMiReserva && reserva.estado !== 'cancelada' && !reserva.pagado;
  const puedePagar =
    esMiReserva &&
    reserva.estado === 'confirmada' &&
    !reserva.pagado &&
    !reserva.pagoId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Estado */}
      <View style={styles.header}>
        <View
          style={[
            styles.estadoBadge,
            reserva.estado === 'confirmada'
              ? styles.estadoConfirmada
              : reserva.estado === 'mudada'
              ? styles.estadoMudada
              : reserva.estado === 'cancelada'
              ? styles.estadoCancelada
              : styles.estadoPendiente,
          ]}
        >
          <Text style={styles.estadoText}>
            {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
          </Text>
        </View>
        {reserva.pagado && (
          <View style={styles.pagadoBadge}>
            <Text style={styles.pagadoText}>Pagado</Text>
          </View>
        )}
      </View>

      {/* Habitacion */}
      <Card style={styles.card}>
        <Text style={styles.habitacionNombre}>{reserva.habitacionNombre}</Text>
        <Text style={styles.fechaShabbat}>
          Shabbat{' '}
          {format(new Date(reserva.fechaShabbat), "d 'de' MMMM, yyyy", {
            locale: es,
          })}
        </Text>
      </Card>

      {/* Historial de Mudanzas */}
      {reserva.historialMudanzas && reserva.historialMudanzas.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Historial de Mudanzas</Text>
          {reserva.historialMudanzas.map((mudanza, idx) => (
            <View key={idx} style={styles.mudanzaItem}>
              <Text style={styles.mudanzaTexto}>
                De {mudanza.habitacionAnterior} a {mudanza.habitacionNueva}
              </Text>
              <Text style={styles.mudanzaMotivo}>
                Por reserva de: {mudanza.motivoUsuarioNombre}
              </Text>
              <Text style={styles.mudanzaFecha}>
                {format(new Date(mudanza.fecha), "d/M/yyyy HH:mm")}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Participantes */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>
          Participantes ({reserva.participantes.length})
        </Text>
        {reserva.participantes.map((p, idx) => (
          <View key={idx} style={styles.participanteRow}>
            <Text style={styles.participanteNombre}>{p.nombre}</Text>
            <Text style={styles.participanteInfo}>
              {p.genero === 'varon' ? 'Varon' : 'Mujer'}
              {p.edad ? ` - ${p.edad} años` : ''}
            </Text>
          </View>
        ))}
      </Card>

      {/* Invitados */}
      {reserva.invitados.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>
            Invitados ({reserva.invitados.length})
          </Text>
          {reserva.invitados.map((inv, idx) => (
            <View key={idx} style={styles.participanteRow}>
              <Text style={styles.participanteNombre}>{inv.nombre}</Text>
              <Text style={styles.participanteInfo}>
                {inv.genero === 'varon' ? 'Varon' : 'Mujer'}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Informacion de Pago */}
      {reserva.montoPago && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Pago</Text>
          <View style={styles.pagoRow}>
            <Text style={styles.pagoLabel}>Monto:</Text>
            <Text style={styles.pagoMonto}>${reserva.montoPago}</Text>
          </View>
          <View style={styles.pagoRow}>
            <Text style={styles.pagoLabel}>Estado:</Text>
            <Text
              style={[
                styles.pagoEstado,
                reserva.pagado ? styles.pagadoColor : styles.pendienteColor,
              ]}
            >
              {reserva.pagado ? 'Pagado' : 'Pendiente'}
            </Text>
          </View>
        </Card>
      )}

      {/* Notas */}
      {reserva.notas && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <Text style={styles.notasTexto}>{reserva.notas}</Text>
        </Card>
      )}

      {/* Acciones */}
      {esMiReserva && reserva.estado !== 'cancelada' && (
        <View style={styles.acciones}>
          {puedePagar && (
            <Button
              title="Generar Pago"
              onPress={handlePagar}
              loading={procesando}
              style={styles.botonPagar}
            />
          )}
          {puedeCancelar && (
            <Button
              title="Cancelar Reserva"
              variant="danger"
              onPress={handleCancelar}
              loading={procesando}
            />
          )}
        </View>
      )}

      {/* Info de creacion */}
      <Text style={styles.infoCreacion}>
        Reserva creada el{' '}
        {format(new Date(reserva.fechaReserva), "d/M/yyyy 'a las' HH:mm")}
      </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  estadoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  estadoConfirmada: {
    backgroundColor: '#D1FAE5',
  },
  estadoMudada: {
    backgroundColor: '#FEF3C7',
  },
  estadoCancelada: {
    backgroundColor: '#FEE2E2',
  },
  estadoPendiente: {
    backgroundColor: '#E5E7EB',
  },
  estadoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  pagadoBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pagadoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  card: {
    marginBottom: 16,
  },
  habitacionNombre: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  fechaShabbat: {
    fontSize: 16,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  mudanzaItem: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  mudanzaTexto: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  mudanzaMotivo: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
  },
  mudanzaFecha: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  participanteRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  participanteNombre: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  participanteInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  pagoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pagoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pagoMonto: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  pagoEstado: {
    fontSize: 14,
    fontWeight: '600',
  },
  pagadoColor: {
    color: '#059669',
  },
  pendienteColor: {
    color: '#DC2626',
  },
  notasTexto: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  acciones: {
    gap: 12,
    marginTop: 8,
  },
  botonPagar: {
    marginBottom: 0,
  },
  infoCreacion: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
});
