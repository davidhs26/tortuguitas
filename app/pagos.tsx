import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Linking,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedCard,
  AnimatedButton,
  Badge,
  EmptyState,
  Skeleton,
  useToast,
} from '@/components/ui';
import { Theme } from '@/constants/Theme';
import { getUrlPagoMercadoPago } from '@/services/pagos';

type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'en_proceso';

interface Transaccion {
  id: string;
  reservaId: string;
  habitacionNombre: string;
  fechaShabbat: Date;
  monto: number;
  estado: EstadoPago;
  fechaPago?: Date;
  metodoPago?: string;
  referencia?: string;
}

const ESTADO_CONFIG: Record<EstadoPago, {
  label: string;
  color: string;
  bgColor: string;
  icon: keyof typeof FontAwesome.glyphMap;
}> = {
  pendiente: {
    label: 'Pendiente',
    color: '#D97706',
    bgColor: '#FEF3C7',
    icon: 'clock-o',
  },
  aprobado: {
    label: 'Aprobado',
    color: '#059669',
    bgColor: '#D1FAE5',
    icon: 'check-circle',
  },
  rechazado: {
    label: 'Rechazado',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: 'times-circle',
  },
  en_proceso: {
    label: 'En Proceso',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    icon: 'spinner',
  },
};

export default function PagosScreen() {
  const { user } = useAuth();
  const { misReservas } = useReservas();
  const { showToast } = useToast();

  const [refreshing, setRefreshing] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState<string | null>(null);

  // Generar transacciones desde reservas
  const transacciones = useMemo<Transaccion[]>(() => {
    return misReservas.map(reserva => ({
      id: `txn_${reserva.id}`,
      reservaId: reserva.id,
      habitacionNombre: reserva.habitacionNombre,
      fechaShabbat: new Date(reserva.fechaShabbat),
      monto: reserva.montoPago || 5000,
      estado: reserva.pagado ? 'aprobado' : 'pendiente',
      fechaPago: reserva.pagado ? new Date() : undefined,
      metodoPago: reserva.pagado ? 'MercadoPago' : undefined,
    }));
  }, [misReservas]);

  const stats = useMemo(() => {
    const pendientes = transacciones.filter(t => t.estado === 'pendiente');
    const aprobados = transacciones.filter(t => t.estado === 'aprobado');
    const totalPagado = aprobados.reduce((sum, t) => sum + t.monto, 0);
    const totalPendiente = pendientes.reduce((sum, t) => sum + t.monto, 0);

    return {
      pendientes: pendientes.length,
      aprobados: aprobados.length,
      totalPagado,
      totalPendiente,
    };
  }, [transacciones]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    showToast('Transacciones actualizadas', 'success');
  }, []);

  const handlePagar = useCallback(async (transaccion: Transaccion) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcesandoPago(transaccion.id);

    try {
      const url = await getUrlPagoMercadoPago(
        transaccion.reservaId,
        transaccion.monto,
        `Reserva ${transaccion.habitacionNombre} - ${format(transaccion.fechaShabbat, 'dd/MM/yyyy')}`
      );

      if (url) {
        await Linking.openURL(url);
        showToast('Redirigiendo a MercadoPago...', 'info');
      } else {
        showToast('Error al generar link de pago', 'error');
      }
    } catch (error) {
      showToast('Error al procesar pago', 'error');
    } finally {
      setProcesandoPago(null);
    }
  }, [user]);

  const handleVerRecibo = useCallback((transaccion: Transaccion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In a real app, this would open a receipt PDF or modal
    showToast('Recibo generado', 'success');
  }, []);

  const renderTransaccion = (transaccion: Transaccion, index: number) => {
    const config = ESTADO_CONFIG[transaccion.estado];
    const esPendiente = transaccion.estado === 'pendiente';

    return (
      <Animated.View
        key={transaccion.id}
        entering={FadeInRight.delay(index * 50).springify()}
      >
        <AnimatedCard style={styles.transaccionCard}>
          {/* Header */}
          <View style={styles.transaccionHeader}>
            <View style={styles.transaccionInfo}>
              <Text style={styles.habitacionNombre}>{transaccion.habitacionNombre}</Text>
              <Text style={styles.fechaShabbat}>
                Shabbat {format(transaccion.fechaShabbat, "d 'de' MMMM", { locale: es })}
              </Text>
            </View>
            <View style={[styles.estadoBadge, { backgroundColor: config.bgColor }]}>
              <FontAwesome name={config.icon} size={12} color={config.color} />
              <Text style={[styles.estadoText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>

          {/* Monto */}
          <View style={styles.montoContainer}>
            <Text style={styles.montoLabel}>Monto</Text>
            <Text style={styles.montoValue}>
              ${transaccion.monto.toLocaleString('es-AR')}
            </Text>
          </View>

          {/* Detalles adicionales */}
          {transaccion.fechaPago && (
            <View style={styles.detalleRow}>
              <FontAwesome name="calendar" size={12} color={Theme.colors.textSecondary} />
              <Text style={styles.detalleText}>
                Pagado el {format(transaccion.fechaPago, 'dd/MM/yyyy HH:mm')}
              </Text>
            </View>
          )}

          {transaccion.metodoPago && (
            <View style={styles.detalleRow}>
              <FontAwesome name="credit-card" size={12} color={Theme.colors.textSecondary} />
              <Text style={styles.detalleText}>{transaccion.metodoPago}</Text>
            </View>
          )}

          {/* Acciones */}
          <View style={styles.accionesContainer}>
            {esPendiente ? (
              <AnimatedButton
                title="Pagar con MercadoPago"
                variant="primary"
                icon="credit-card"
                onPress={() => handlePagar(transaccion)}
                loading={procesandoPago === transaccion.id}
                style={styles.pagarButton}
              />
            ) : (
              <View style={styles.accionesPagado}>
                <Pressable
                  style={styles.accionButton}
                  onPress={() => handleVerRecibo(transaccion)}
                >
                  <FontAwesome name="file-text-o" size={14} color={Theme.colors.primary} />
                  <Text style={styles.accionText}>Ver Recibo</Text>
                </Pressable>
                <Pressable
                  style={styles.accionButton}
                  onPress={() => router.push(`/reserva/${transaccion.reservaId}`)}
                >
                  <FontAwesome name="eye" size={14} color={Theme.colors.primary} />
                  <Text style={styles.accionText}>Ver Reserva</Text>
                </Pressable>
              </View>
            )}
          </View>
        </AnimatedCard>
      </Animated.View>
    );
  };

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
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ${stats.totalPagado.toLocaleString('es-AR')}
              </Text>
              <Text style={styles.statLabel}>Total Pagado</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ${stats.totalPendiente.toLocaleString('es-AR')}
              </Text>
              <Text style={styles.statLabel}>Pendiente</Text>
            </View>
          </View>

          <View style={styles.statsBottom}>
            <View style={styles.statBadge}>
              <FontAwesome name="check" size={10} color="#059669" />
              <Text style={styles.statBadgeText}>{stats.aprobados} pagos</Text>
            </View>
            <View style={styles.statBadge}>
              <FontAwesome name="clock-o" size={10} color="#D97706" />
              <Text style={styles.statBadgeText}>{stats.pendientes} pendientes</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* MercadoPago Info */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <AnimatedCard style={styles.infoCard}>
          <View style={styles.infoContent}>
            <View style={styles.mpLogo}>
              <FontAwesome name="credit-card-alt" size={20} color="#009EE3" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>MercadoPago</Text>
              <Text style={styles.infoSubtitle}>
                Pagá de forma segura con tarjeta, débito o dinero en cuenta
              </Text>
            </View>
          </View>
        </AnimatedCard>
      </Animated.View>

      {/* Lista de transacciones */}
      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <Text style={styles.sectionTitle}>Historial de Pagos</Text>
      </Animated.View>

      {transacciones.length === 0 ? (
        <EmptyState
          icon="credit-card"
          title="Sin transacciones"
          description="Tus pagos aparecerán aquí"
        />
      ) : (
        transacciones.map((txn, index) => renderTransaccion(txn, index))
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
  statsCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  statLabel: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Theme.spacing.md,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  statBadgeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  infoCard: {
    marginBottom: Theme.spacing.lg,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  mpLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5F6FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  infoSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  transaccionCard: {
    marginBottom: Theme.spacing.md,
  },
  transaccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  transaccionInfo: {
    flex: 1,
  },
  habitacionNombre: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  fechaShabbat: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  estadoText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
  },
  montoContainer: {
    backgroundColor: Theme.colors.backgroundSecondary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
  },
  montoLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  montoValue: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
    marginTop: 4,
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  detalleText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  accionesContainer: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  pagarButton: {
    backgroundColor: '#009EE3',
  },
  accionesPagado: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
  },
  accionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  accionText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  bottomSpacer: {
    height: 32,
  },
});
