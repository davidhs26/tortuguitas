import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth, useReservas } from '@/context';
import { Button, Card } from '@/components/ui';
import { calcularMinyan } from '@/services/actividades';

export default function HomeScreen() {
  const { user } = useAuth();
  const {
    misReservas,
    proximoShabbat,
    puedeReservar,
    cargarMisReservas,
    cargarDisponibilidad,
    loading,
  } = useReservas();

  const [minyanInfo, setMinyanInfo] = useState<{
    cantidad: number;
    completo: boolean;
    faltantes: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    await cargarMisReservas();
    await cargarDisponibilidad(proximoShabbat);

    try {
      const minyan = await calcularMinyan(proximoShabbat);
      setMinyanInfo(minyan);
    } catch (err) {
      console.error('Error calculando minyan:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const proximaReserva = misReservas.find(
    r => r.estado !== 'cancelada' && new Date(r.fechaShabbat) >= new Date()
  );

  const fechaShabbatFormateada = format(proximoShabbat, "EEEE d 'de' MMMM", {
    locale: es,
  });

  const shabbatDate = format(addDays(proximoShabbat, 1), "d 'de' MMMM", {
    locale: es,
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Saludo */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Hola, {user?.nombre || 'Familia'}!
        </Text>
        <Text style={styles.subGreeting}>
          {puedeReservar
            ? 'Las reservas estan abiertas'
            : 'Proximamente abriran las reservas'}
        </Text>
      </View>

      {/* Proximo Shabbat */}
      <Card style={styles.shabbatCard} variant="elevated">
        <Text style={styles.cardTitle}>Proximo Shabbat</Text>
        <Text style={styles.shabbatDate}>{shabbatDate}</Text>
        <Text style={styles.shabbatArrival}>
          Llegada: {fechaShabbatFormateada}
        </Text>

        {puedeReservar && !proximaReserva && (
          <Button
            title="Hacer Reserva"
            onPress={() => router.push('/(tabs)/reservas')}
            style={styles.reserveButton}
          />
        )}
      </Card>

      {/* Mi Reserva */}
      {proximaReserva && (
        <Card style={styles.reservaCard} variant="elevated">
          <View style={styles.reservaHeader}>
            <Text style={styles.cardTitleDark}>Tu Reserva</Text>
            <View
              style={[
                styles.estadoBadge,
                proximaReserva.estado === 'confirmada'
                  ? styles.estadoConfirmada
                  : proximaReserva.estado === 'mudada'
                  ? styles.estadoMudada
                  : styles.estadoPendiente,
              ]}
            >
              <Text style={styles.estadoText}>
                {proximaReserva.estado.charAt(0).toUpperCase() +
                  proximaReserva.estado.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={styles.habitacionNombre}>
            {proximaReserva.habitacionNombre}
          </Text>

          <Text style={styles.participantesLabel}>
            Participantes: {proximaReserva.participantes.length}
          </Text>

          {proximaReserva.invitados.length > 0 && (
            <Text style={styles.invitadosLabel}>
              Invitados: {proximaReserva.invitados.length}
            </Text>
          )}

          <Button
            title="Ver Detalles"
            variant="outline"
            onPress={() => router.push(`/reserva/${proximaReserva.id}`)}
            style={styles.detailsButton}
          />
        </Card>
      )}

      {/* Estado del Minyan */}
      {minyanInfo && (
        <Card style={styles.minyanCard}>
          <Text style={styles.cardTitleDark}>Minyan</Text>
          <View style={styles.minyanContent}>
            <Text style={styles.minyanCount}>{minyanInfo.cantidad}/10</Text>
            {minyanInfo.completo ? (
              <Text style={styles.minyanComplete}>Completo</Text>
            ) : (
              <Text style={styles.minyanIncomplete}>
                Faltan {minyanInfo.faltantes}
              </Text>
            )}
          </View>
        </Card>
      )}

      {/* Accesos Rapidos */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Accesos Rapidos</Text>

        <View style={styles.actionsGrid}>
          <Card
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/reservas')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Ver Habitaciones</Text>
          </Card>

          <Card
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/actividades')}
          >
            <Text style={styles.actionIcon}>⚽</Text>
            <Text style={styles.actionText}>Futbol Domingo</Text>
          </Card>

          <Card
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/actividades')}
          >
            <Text style={styles.actionIcon}>🥩</Text>
            <Text style={styles.actionText}>Asado Domingo</Text>
          </Card>

          <Card
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/perfil')}
          >
            <Text style={styles.actionIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.actionText}>Mi Familia</Text>
          </Card>
        </View>
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
  greeting: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subGreeting: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  shabbatCard: {
    backgroundColor: '#2563EB',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  cardTitleDark: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  shabbatDate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  shabbatArrival: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  reserveButton: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
  },
  reservaCard: {
    marginBottom: 16,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoConfirmada: {
    backgroundColor: '#D1FAE5',
  },
  estadoMudada: {
    backgroundColor: '#FEF3C7',
  },
  estadoPendiente: {
    backgroundColor: '#E5E7EB',
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  habitacionNombre: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  participantesLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  invitadosLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  detailsButton: {
    marginTop: 16,
  },
  minyanCard: {
    marginBottom: 16,
  },
  minyanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  minyanCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  minyanComplete: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  minyanIncomplete: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  quickActions: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
});
