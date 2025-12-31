import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context';
import {
  AnimatedButton,
  AnimatedCard,
  Input,
  Avatar,
  AvatarGroup,
  Badge,
  StatusBadge,
  Skeleton,
  useToast,
} from '@/components/ui';
import { Theme } from '@/constants/Theme';
import { Reserva, Invitado, Genero } from '@/types';
import { getReserva, cancelarReserva, agregarInvitado, quitarInvitado } from '@/services/reservas';
import { crearPagoReserva, crearPreferenciaMercadoPago, getUrlPagoMercadoPago } from '@/services/pagos';
import * as Linking from 'expo-linking';

const ESTADO_CONFIG = {
  confirmada: { color: '#10B981', bg: '#D1FAE5', icon: 'check-circle' },
  mudada: { color: '#F59E0B', bg: '#FEF3C7', icon: 'exchange' },
  cancelada: { color: '#EF4444', bg: '#FEE2E2', icon: 'times-circle' },
  pendiente: { color: '#6B7280', bg: '#E5E7EB', icon: 'clock-o' },
};

export default function ReservaDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [showInvitadoModal, setShowInvitadoModal] = useState(false);
  const [nuevoInvitado, setNuevoInvitado] = useState({
    nombre: '',
    genero: 'varon' as Genero,
  });

  useEffect(() => {
    loadReserva();
  }, [id]);

  const loadReserva = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      console.log('Loading reserva with id:', id);
      const data = await getReserva(id);
      console.log('Reserva data:', data);
      if (!data) {
        showToast('Reserva no encontrada', 'error');
      }
      setReserva(data);
    } catch (err: any) {
      console.error('Error loading reserva:', err);
      showToast('Error cargando reserva', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro que deseas cancelar esta reserva? Esta acción no se puede deshacer.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setProcesando(true);
            try {
              await cancelarReserva(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Reserva cancelada', 'success');
              router.back();
            } catch (err: any) {
              showToast(err.message, 'error');
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcesando(true);

    try {
      const pago = await crearPagoReserva(reserva);

      // Create MercadoPago preference
      const preferenceId = await crearPreferenciaMercadoPago(pago);
      const paymentUrl = await getUrlPagoMercadoPago(preferenceId);

      // Open payment URL
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
        showToast('Redirigiendo a MercadoPago...', 'info');
      } else {
        Alert.alert(
          'Pago Generado',
          `Monto a pagar: $${pago.monto}\n\nNo se pudo abrir el navegador. Por favor, copia el link de pago.`,
          [{ text: 'OK' }]
        );
      }

      await loadReserva();
    } catch (err: any) {
      showToast(err.message || 'Error al generar pago', 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleAgregarInvitado = async () => {
    if (!reserva || !nuevoInvitado.nombre.trim()) {
      showToast('Ingresa el nombre del invitado', 'warning');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcesando(true);

    try {
      const invitado: Invitado = {
        id: Date.now().toString(),
        nombre: nuevoInvitado.nombre.trim(),
        genero: nuevoInvitado.genero,
        invitadoPorId: user!.id,
        invitadoPorNombre: `${user!.nombre} ${user!.apellido}`,
      };

      await agregarInvitado(reserva.id, invitado);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Invitado agregado', 'success');
      setShowInvitadoModal(false);
      setNuevoInvitado({ nombre: '', genero: 'varon' });
      await loadReserva();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleQuitarInvitado = (invitado: Invitado) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Quitar Invitado',
      `¿Quitar a ${invitado.nombre} de la reserva?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await quitarInvitado(reserva!.id, invitado.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Invitado removido', 'success');
              await loadReserva();
            } catch (err: any) {
              showToast(err.message, 'error');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando reserva...</Text>
        </View>
      </View>
    );
  }

  if (!reserva) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={64} color={Theme.colors.textTertiary} />
          <Text style={styles.errorText}>Reserva no encontrada</Text>
          <Text style={styles.errorSubtext}>
            La reserva que buscas no existe o fue eliminada
          </Text>
          <AnimatedButton
            title="Volver"
            variant="outline"
            icon="arrow-left"
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  const esMiReserva = user?.id === reserva.usuarioId;
  const puedeCancelar = esMiReserva && reserva.estado !== 'cancelada' && !reserva.pagado;
  const puedePagar = esMiReserva && reserva.estado === 'confirmada' && !reserva.pagado && !reserva.pagoId;
  const puedeAgregarInvitados = esMiReserva && reserva.estado === 'confirmada';
  const estadoConfig = ESTADO_CONFIG[reserva.estado] || ESTADO_CONFIG.pendiente;

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backBtn}
          >
            <FontAwesome name="arrow-left" size={20} color={Theme.colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Detalle de Reserva</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Estado y fecha */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <AnimatedCard style={styles.mainCard}>
            <View style={styles.estadoRow}>
              <View style={[styles.estadoBadge, { backgroundColor: estadoConfig.bg }]}>
                <FontAwesome name={estadoConfig.icon as any} size={16} color={estadoConfig.color} />
                <Text style={[styles.estadoText, { color: estadoConfig.color }]}>
                  {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                </Text>
              </View>
              {reserva.pagado && (
                <Badge label="Pagado" variant="success" size="small" />
              )}
            </View>

            <Text style={styles.habitacionNombre}>{reserva.habitacionNombre}</Text>
            <View style={styles.fechaRow}>
              <FontAwesome name="calendar" size={16} color={Theme.colors.textSecondary} />
              <Text style={styles.fechaText}>
                Shabbat {format(new Date(reserva.fechaShabbat), "d 'de' MMMM, yyyy", { locale: es })}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reserva.participantes.length}</Text>
                <Text style={styles.statLabel}>Familia</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reserva.invitados?.length || 0}</Text>
                <Text style={styles.statLabel}>Invitados</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {reserva.participantes.length + (reserva.invitados?.length || 0)}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </AnimatedCard>
        </Animated.View>

        {/* Historial de Mudanzas */}
        {reserva.historialMudanzas && reserva.historialMudanzas.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <AnimatedCard style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <FontAwesome name="exchange" size={16} color={Theme.colors.warning} />
                <Text style={styles.sectionTitle}>Historial de Mudanzas</Text>
              </View>
              {reserva.historialMudanzas.map((mudanza, idx) => (
                <View key={idx} style={styles.mudanzaItem}>
                  <View style={styles.mudanzaIcon}>
                    <FontAwesome name="arrow-right" size={12} color={Theme.colors.warning} />
                  </View>
                  <View style={styles.mudanzaInfo}>
                    <Text style={styles.mudanzaTexto}>
                      De <Text style={styles.bold}>{mudanza.habitacionAnterior}</Text> a{' '}
                      <Text style={styles.bold}>{mudanza.habitacionNueva}</Text>
                    </Text>
                    <Text style={styles.mudanzaMotivo}>
                      Por reserva de {mudanza.motivoUsuarioNombre}
                    </Text>
                    <Text style={styles.mudanzaFecha}>
                      {format(new Date(mudanza.fecha), "d/M/yyyy HH:mm")}
                    </Text>
                  </View>
                </View>
              ))}
            </AnimatedCard>
          </Animated.View>
        )}

        {/* Participantes */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <AnimatedCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FontAwesome name="users" size={16} color={Theme.colors.primary} />
              <Text style={styles.sectionTitle}>
                Participantes ({reserva.participantes.length})
              </Text>
            </View>
            {reserva.participantes.map((p, idx) => (
              <View key={idx} style={styles.participanteRow}>
                <Avatar name={p.nombre} size="small" />
                <View style={styles.participanteInfo}>
                  <Text style={styles.participanteNombre}>{p.nombre}</Text>
                  <Text style={styles.participanteDetalle}>
                    {p.genero === 'varon' ? 'Varón' : 'Mujer'}
                    {p.edad ? ` • ${p.edad} años` : ''}
                    {p.esInvitado && ' • Invitado'}
                  </Text>
                </View>
                <FontAwesome
                  name={p.genero === 'varon' ? 'male' : 'female'}
                  size={18}
                  color={p.genero === 'varon' ? '#3B82F6' : '#EC4899'}
                />
              </View>
            ))}
          </AnimatedCard>
        </Animated.View>

        {/* Invitados */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <AnimatedCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FontAwesome name="user-plus" size={16} color={Theme.colors.success} />
              <Text style={styles.sectionTitle}>
                Invitados ({reserva.invitados?.length || 0})
              </Text>
              {puedeAgregarInvitados && (
                <AnimatedButton
                  title="Agregar"
                  variant="outline"
                  size="small"
                  icon="plus"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowInvitadoModal(true);
                  }}
                />
              )}
            </View>

            {reserva.invitados && reserva.invitados.length > 0 ? (
              reserva.invitados.map((inv, idx) => (
                <View key={idx} style={styles.invitadoRow}>
                  <Avatar name={inv.nombre} size="small" />
                  <View style={styles.invitadoInfo}>
                    <Text style={styles.invitadoNombre}>{inv.nombre}</Text>
                    <Text style={styles.invitadoDetalle}>
                      {inv.genero === 'varon' ? 'Varón' : 'Mujer'}
                      {inv.invitadoPorNombre && ` • Invitado por ${inv.invitadoPorNombre}`}
                    </Text>
                  </View>
                  {esMiReserva && (
                    <Pressable
                      onPress={() => handleQuitarInvitado(inv)}
                      style={styles.removeBtn}
                    >
                      <FontAwesome name="times" size={16} color={Theme.colors.error} />
                    </Pressable>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyInvitados}>
                <FontAwesome name="user-plus" size={32} color={Theme.colors.textTertiary} />
                <Text style={styles.emptyText}>No hay invitados</Text>
                {puedeAgregarInvitados && (
                  <Text style={styles.emptySubtext}>
                    Agrega invitados a tu reserva
                  </Text>
                )}
              </View>
            )}
          </AnimatedCard>
        </Animated.View>

        {/* Información de Pago */}
        {(reserva.montoPago || reserva.pagoId) && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <AnimatedCard style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <FontAwesome name="credit-card" size={16} color={Theme.colors.primary} />
                <Text style={styles.sectionTitle}>Pago</Text>
              </View>
              <View style={styles.pagoGrid}>
                <View style={styles.pagoItem}>
                  <Text style={styles.pagoLabel}>Monto</Text>
                  <Text style={styles.pagoMonto}>${reserva.montoPago || 0}</Text>
                </View>
                <View style={styles.pagoItem}>
                  <Text style={styles.pagoLabel}>Estado</Text>
                  <StatusBadge
                    status={reserva.pagado ? 'success' : 'error'}
                    label={reserva.pagado ? 'Pagado' : 'Pendiente'}
                  />
                </View>
              </View>
            </AnimatedCard>
          </Animated.View>
        )}

        {/* Notas */}
        {reserva.notas && (
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <AnimatedCard style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <FontAwesome name="sticky-note" size={16} color={Theme.colors.textSecondary} />
                <Text style={styles.sectionTitle}>Notas</Text>
              </View>
              <Text style={styles.notasTexto}>{reserva.notas}</Text>
            </AnimatedCard>
          </Animated.View>
        )}

        {/* Acciones */}
        {esMiReserva && reserva.estado !== 'cancelada' && (
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.acciones}>
            {puedePagar && (
              <AnimatedButton
                title="Pagar con MercadoPago"
                variant="success"
                icon="credit-card"
                onPress={handlePagar}
                loading={procesando}
              />
            )}
            {puedeCancelar && (
              <AnimatedButton
                title="Cancelar Reserva"
                variant="danger"
                icon="times"
                onPress={handleCancelar}
                loading={procesando}
              />
            )}
          </Animated.View>
        )}

        {/* Info de creación */}
        <Text style={styles.infoCreacion}>
          Reserva creada el{' '}
          {format(new Date(reserva.fechaReserva), "d/M/yyyy 'a las' HH:mm")}
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal para agregar invitado */}
      <Modal
        visible={showInvitadoModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInvitadoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.springify()} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Invitado</Text>
              <Pressable
                onPress={() => setShowInvitadoModal(false)}
                style={styles.modalClose}
              >
                <FontAwesome name="times" size={20} color={Theme.colors.textSecondary} />
              </Pressable>
            </View>

            <Input
              label="Nombre completo"
              value={nuevoInvitado.nombre}
              onChangeText={(text) => setNuevoInvitado({ ...nuevoInvitado, nombre: text })}
              placeholder="Nombre del invitado"
            />

            <Text style={styles.modalLabel}>Género</Text>
            <View style={styles.genderButtons}>
              <Pressable
                style={[
                  styles.genderButton,
                  nuevoInvitado.genero === 'varon' && styles.genderButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNuevoInvitado({ ...nuevoInvitado, genero: 'varon' });
                }}
              >
                <FontAwesome
                  name="male"
                  size={24}
                  color={nuevoInvitado.genero === 'varon' ? Theme.colors.primary : Theme.colors.textSecondary}
                />
                <Text style={[
                  styles.genderText,
                  nuevoInvitado.genero === 'varon' && styles.genderTextActive
                ]}>
                  Varón
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.genderButton,
                  nuevoInvitado.genero === 'mujer' && styles.genderButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNuevoInvitado({ ...nuevoInvitado, genero: 'mujer' });
                }}
              >
                <FontAwesome
                  name="female"
                  size={24}
                  color={nuevoInvitado.genero === 'mujer' ? Theme.colors.primary : Theme.colors.textSecondary}
                />
                <Text style={[
                  styles.genderText,
                  nuevoInvitado.genero === 'mujer' && styles.genderTextActive
                ]}>
                  Mujer
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <AnimatedButton
                title="Cancelar"
                variant="ghost"
                onPress={() => setShowInvitadoModal(false)}
                style={styles.modalButton}
              />
              <AnimatedButton
                title="Agregar"
                variant="primary"
                icon="plus"
                onPress={handleAgregarInvitado}
                loading={procesando}
                style={styles.modalButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.md,
  },
  loadingText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
  },
  header: {
    paddingBottom: Theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Theme.spacing.md,
  },
  skeleton: {
    marginBottom: Theme.spacing.md,
    borderRadius: Theme.borderRadius.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
    gap: Theme.spacing.lg,
  },
  errorText: {
    fontSize: Theme.fontSize.lg,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeight.semibold,
  },
  errorSubtext: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
  },
  mainCard: {
    marginBottom: Theme.spacing.md,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  estadoText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
  },
  habitacionNombre: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  fechaText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.primary,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Theme.colors.border,
  },
  sectionCard: {
    marginBottom: Theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    flex: 1,
  },
  mudanzaItem: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    backgroundColor: '#FEF3C7',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
  },
  mudanzaIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mudanzaInfo: {
    flex: 1,
  },
  mudanzaTexto: {
    fontSize: Theme.fontSize.sm,
    color: '#92400E',
  },
  bold: {
    fontWeight: Theme.fontWeight.semibold,
  },
  mudanzaMotivo: {
    fontSize: Theme.fontSize.xs,
    color: '#B45309',
    marginTop: 2,
  },
  mudanzaFecha: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textTertiary,
    marginTop: 2,
  },
  participanteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  participanteInfo: {
    flex: 1,
  },
  participanteNombre: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  participanteDetalle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  invitadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  invitadoInfo: {
    flex: 1,
  },
  invitadoNombre: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  invitadoDetalle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyInvitados: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
  },
  emptySubtext: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textTertiary,
    marginTop: Theme.spacing.xs,
  },
  pagoGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
  },
  pagoItem: {
    flex: 1,
  },
  pagoLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
    textTransform: 'uppercase',
  },
  pagoMonto: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.success,
  },
  notasTexto: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
  },
  acciones: {
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  infoCreacion: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: Theme.spacing.xl,
  },
  bottomSpacer: {
    height: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: Theme.borderRadius.xxl,
    borderTopRightRadius: Theme.borderRadius.xxl,
    padding: Theme.spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
  },
  modalTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
  },
  modalClose: {
    padding: Theme.spacing.sm,
  },
  modalLabel: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  genderButtonActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryLight,
  },
  genderText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textSecondary,
  },
  genderTextActive: {
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
