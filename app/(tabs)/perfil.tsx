import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedButton,
  AnimatedCard,
  Input,
  Avatar,
  Badge,
  StatusBadge,
  useToast,
  Skeleton,
} from '@/components/ui';
import { Theme } from '@/constants/Theme';
import { updateUsuario } from '@/services/auth';
import { FamiliarDependiente, Genero } from '@/types';

const SECTOR_COLORS: Record<string, string[]> = {
  david: ['#3B82F6', '#1D4ED8'],
  mumi: ['#10B981', '#059669'],
  tuni: ['#F59E0B', '#D97706'],
  quincho: ['#8B5CF6', '#7C3AED'],
  libre: ['#6B7280', '#4B5563'],
};

const SECTOR_NAMES: Record<string, string> = {
  david: 'Sector David',
  mumi: 'Sector Mumi',
  tuni: 'Sector Tuni',
  quincho: 'Quincho',
  libre: 'Sin asignar',
};

const PRIORIDAD_NAMES: Record<number, string> = {
  1: 'Socio',
  2: 'Hijo de socio',
  3: 'Nieto',
};

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  const { misReservas } = useReservas();
  const { showToast } = useToast();

  const [editando, setEditando] = useState(false);
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [showFamiliaForm, setShowFamiliaForm] = useState(false);
  const [nuevoFamiliar, setNuevoFamiliar] = useState({
    nombre: '',
    fechaNacimiento: '',
    genero: 'varon' as Genero,
  });

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleGuardarTelefono = async () => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await updateUsuario(user.id, { telefono });
      setEditando(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Teléfono actualizado', 'success');
    } catch (err) {
      showToast('Error al actualizar teléfono', 'error');
    }
  };

  const handleAgregarFamiliar = async () => {
    if (!user) return;

    if (!nuevoFamiliar.nombre.trim()) {
      showToast('Ingresa el nombre', 'warning');
      return;
    }

    if (!nuevoFamiliar.fechaNacimiento) {
      showToast('Ingresa la fecha de nacimiento', 'warning');
      return;
    }

    const fechaRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = nuevoFamiliar.fechaNacimiento.match(fechaRegex);
    if (!match) {
      showToast('Formato: DD/MM/AAAA', 'error');
      return;
    }

    const [, dia, mes, anio] = match;
    const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));

    const familiar: FamiliarDependiente = {
      id: Date.now().toString(),
      nombre: nuevoFamiliar.nombre.trim(),
      fechaNacimiento: fecha,
      genero: nuevoFamiliar.genero,
    };

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await updateUsuario(user.id, {
        familia: [...(user.familia || []), familiar],
      });
      setShowFamiliaForm(false);
      setNuevoFamiliar({ nombre: '', fechaNacimiento: '', genero: 'varon' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Familiar agregado', 'success');
    } catch (err) {
      showToast('Error al agregar familiar', 'error');
    }
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

  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.loadingContainer}>
          <Skeleton width={100} height={100} style={styles.avatarSkeleton} />
          <Skeleton width={200} height={24} />
          <Skeleton width={150} height={16} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header con gradiente */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient
          colors={SECTOR_COLORS[user.grupoFamiliar] || SECTOR_COLORS.libre}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Avatar
                name={`${user.nombre} ${user.apellido}`}
                size="large"
                style={styles.avatar}
              />
              {user.esAdmin && (
                <View style={styles.adminBadgeSmall}>
                  <FontAwesome name="star" size={12} color={Theme.colors.warning} />
                </View>
              )}
            </View>
            <Text style={styles.userName}>
              {user.nombre} {user.apellido}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={styles.badgesRow}>
              <View style={styles.headerBadge}>
                <FontAwesome name="home" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.headerBadgeText}>
                  {SECTOR_NAMES[user.grupoFamiliar]}
                </Text>
              </View>
              <View style={styles.headerBadge}>
                <FontAwesome name="user" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.headerBadgeText}>
                  {PRIORIDAD_NAMES[user.prioridadNivel]}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Estadísticas */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <View style={styles.statsContainer}>
          <AnimatedCard style={styles.statCard}>
            <Text style={styles.statNumber}>{misReservas.length}</Text>
            <Text style={styles.statLabel}>Reservas</Text>
          </AnimatedCard>
          <AnimatedCard style={styles.statCard}>
            <Text style={styles.statNumber}>
              {user.historialAsistencias?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Shabbatot</Text>
          </AnimatedCard>
          <AnimatedCard style={styles.statCard}>
            <Text style={styles.statNumber}>
              {user.familia?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Familia</Text>
          </AnimatedCard>
        </View>
      </Animated.View>

      {/* Información personal */}
      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <AnimatedCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FontAwesome name="user-circle" size={18} color={Theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Información Personal</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
              <Text style={styles.infoValue}>
                {format(user.fechaNacimiento, "d 'de' MMMM, yyyy", { locale: es })}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>
                {calcularEdad(user.fechaNacimiento)} años
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Género</Text>
              <Text style={styles.infoValue}>
                {user.genero === 'varon' ? 'Varón' : 'Mujer'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              {editando ? (
                <View style={styles.editRow}>
                  <Input
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="+54 11 1234-5678"
                    keyboardType="phone-pad"
                    style={styles.editInput}
                  />
                  <AnimatedButton
                    title="Guardar"
                    variant="primary"
                    size="small"
                    onPress={handleGuardarTelefono}
                  />
                </View>
              ) : (
                <Pressable
                  style={styles.editableRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditando(true);
                  }}
                >
                  <Text style={styles.infoValue}>
                    {user.telefono || 'No registrado'}
                  </Text>
                  <View style={styles.editIcon}>
                    <FontAwesome name="pencil" size={12} color={Theme.colors.primary} />
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </AnimatedCard>
      </Animated.View>

      {/* Mi Familia */}
      <Animated.View entering={FadeInDown.delay(400).springify()}>
        <AnimatedCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FontAwesome name="users" size={16} color={Theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Mi Familia</Text>
            <AnimatedButton
              title={showFamiliaForm ? 'Cancelar' : 'Agregar'}
              variant={showFamiliaForm ? 'ghost' : 'outline'}
              size="small"
              icon={showFamiliaForm ? 'times' : 'plus'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFamiliaForm(!showFamiliaForm);
              }}
            />
          </View>

          {showFamiliaForm && (
            <Animated.View entering={FadeInUp.springify()} style={styles.familiaForm}>
              <Input
                label="Nombre completo"
                value={nuevoFamiliar.nombre}
                onChangeText={text =>
                  setNuevoFamiliar({ ...nuevoFamiliar, nombre: text })
                }
                placeholder="Nombre del familiar"
              />
              <Input
                label="Fecha de nacimiento"
                value={nuevoFamiliar.fechaNacimiento}
                onChangeText={text =>
                  setNuevoFamiliar({ ...nuevoFamiliar, fechaNacimiento: text })
                }
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
              />
              <View style={styles.genderButtons}>
                <Pressable
                  style={[
                    styles.genderButton,
                    nuevoFamiliar.genero === 'varon' && styles.genderButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNuevoFamiliar({ ...nuevoFamiliar, genero: 'varon' });
                  }}
                >
                  <FontAwesome
                    name="male"
                    size={18}
                    color={nuevoFamiliar.genero === 'varon' ? Theme.colors.primary : Theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      nuevoFamiliar.genero === 'varon' && styles.genderTextActive,
                    ]}
                  >
                    Varón
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.genderButton,
                    nuevoFamiliar.genero === 'mujer' && styles.genderButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNuevoFamiliar({ ...nuevoFamiliar, genero: 'mujer' });
                  }}
                >
                  <FontAwesome
                    name="female"
                    size={18}
                    color={nuevoFamiliar.genero === 'mujer' ? Theme.colors.primary : Theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      nuevoFamiliar.genero === 'mujer' && styles.genderTextActive,
                    ]}
                  >
                    Mujer
                  </Text>
                </Pressable>
              </View>
              <AnimatedButton
                title="Agregar Familiar"
                variant="primary"
                icon="plus"
                onPress={handleAgregarFamiliar}
              />
            </Animated.View>
          )}

          {user.familia && user.familia.length > 0 ? (
            <View style={styles.familiaList}>
              {user.familia.map((familiar, idx) => (
                <View key={familiar.id || idx} style={styles.familiarRow}>
                  <Avatar name={familiar.nombre} size="small" />
                  <View style={styles.familiarInfo}>
                    <Text style={styles.familiarNombre}>{familiar.nombre}</Text>
                    <Text style={styles.familiarDetails}>
                      {familiar.genero === 'varon' ? 'Varón' : 'Mujer'} •{' '}
                      {calcularEdad(new Date(familiar.fechaNacimiento))} años
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            !showFamiliaForm && (
              <View style={styles.emptyFamily}>
                <FontAwesome name="users" size={32} color={Theme.colors.textTertiary} />
                <Text style={styles.emptyText}>No hay familiares registrados</Text>
                <Text style={styles.emptySubtext}>
                  Agrega familiares para incluirlos en tus reservas
                </Text>
              </View>
            )
          )}
        </AnimatedCard>
      </Animated.View>

      {/* Accesos Rápidos */}
      <Animated.View entering={FadeInDown.delay(500).springify()}>
        <AnimatedCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FontAwesome name="th-large" size={16} color={Theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
          </View>

          <Pressable
            style={styles.quickAccessRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/historial');
            }}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#DBEAFE' }]}>
              <FontAwesome name="history" size={16} color="#2563EB" />
            </View>
            <View style={styles.quickAccessInfo}>
              <Text style={styles.quickAccessTitle}>Historial de Reservas</Text>
              <Text style={styles.quickAccessSubtitle}>Ver todas tus reservas</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Theme.colors.textTertiary} />
          </Pressable>

          <View style={styles.quickAccessDivider} />

          <Pressable
            style={styles.quickAccessRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/pagos');
            }}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#D1FAE5' }]}>
              <FontAwesome name="credit-card" size={16} color="#059669" />
            </View>
            <View style={styles.quickAccessInfo}>
              <Text style={styles.quickAccessTitle}>Mis Pagos</Text>
              <Text style={styles.quickAccessSubtitle}>Historial y pagos pendientes</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Theme.colors.textTertiary} />
          </Pressable>

          <View style={styles.quickAccessDivider} />

          <Pressable
            style={styles.quickAccessRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/estadisticas');
            }}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome name="bar-chart" size={16} color="#D97706" />
            </View>
            <View style={styles.quickAccessInfo}>
              <Text style={styles.quickAccessTitle}>Estadísticas</Text>
              <Text style={styles.quickAccessSubtitle}>Tu actividad en la quinta</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Theme.colors.textTertiary} />
          </Pressable>

          <View style={styles.quickAccessDivider} />

          <Pressable
            style={styles.quickAccessRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notificaciones');
            }}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#FCE7F3' }]}>
              <FontAwesome name="bell" size={16} color="#DB2777" />
            </View>
            <View style={styles.quickAccessInfo}>
              <Text style={styles.quickAccessTitle}>Notificaciones</Text>
              <Text style={styles.quickAccessSubtitle}>Centro de notificaciones</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Theme.colors.textTertiary} />
          </Pressable>

          <View style={styles.quickAccessDivider} />

          <Pressable
            style={styles.quickAccessRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/configuracion');
            }}
          >
            <View style={[styles.quickAccessIcon, { backgroundColor: '#F3E8FF' }]}>
              <FontAwesome name="cog" size={16} color="#7C3AED" />
            </View>
            <View style={styles.quickAccessInfo}>
              <Text style={styles.quickAccessTitle}>Configuración</Text>
              <Text style={styles.quickAccessSubtitle}>Notificaciones y preferencias</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={Theme.colors.textTertiary} />
          </Pressable>
        </AnimatedCard>
      </Animated.View>

      {/* Admin */}
      {user.esAdmin && (
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <AnimatedCard
            style={styles.adminCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/admin');
            }}
          >
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={styles.adminGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.adminContent}>
                <View style={styles.adminIconContainer}>
                  <FontAwesome name="cog" size={24} color="#D97706" />
                </View>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminTitle}>Panel de Administración</Text>
                  <Text style={styles.adminSubtitle}>
                    Gestionar reservas y usuarios
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#D97706" />
              </View>
            </LinearGradient>
          </AnimatedCard>
        </Animated.View>
      )}

      {/* Cerrar sesión */}
      <Animated.View entering={FadeInDown.delay(700).springify()}>
        <AnimatedButton
          title="Cerrar Sesión"
          variant="danger"
          icon="sign-out"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </Animated.View>

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
    paddingBottom: Theme.spacing.xxxl,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Theme.spacing.xxl,
    gap: Theme.spacing.md,
  },
  avatarSkeleton: {
    borderRadius: 50,
  },
  headerGradient: {
    paddingTop: Theme.spacing.xxl,
    paddingBottom: Theme.spacing.xxl,
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Theme.spacing.md,
  },
  avatar: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  adminBadgeSmall: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  userName: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  userEmail: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Theme.spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  headerBadgeText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.white,
    fontWeight: Theme.fontWeight.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  statNumber: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.primary,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  sectionCard: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    flex: 1,
  },
  infoGrid: {
    gap: Theme.spacing.md,
  },
  infoItem: {},
  infoLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
    fontWeight: Theme.fontWeight.medium,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  editInput: {
    flex: 1,
    marginBottom: 0,
  },
  editableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  editIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familiaForm: {
    backgroundColor: Theme.colors.backgroundSecondary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  genderButtonActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryLight,
  },
  genderText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
  },
  genderTextActive: {
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
  familiaList: {
    gap: Theme.spacing.sm,
  },
  familiarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  familiarInfo: {
    flex: 1,
  },
  familiarNombre: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  familiarDetails: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyFamily: {
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
    textAlign: 'center',
  },
  adminCard: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  adminGradient: {
    padding: Theme.spacing.lg,
  },
  adminContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  adminInfo: {
    flex: 1,
  },
  adminTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: '#92400E',
  },
  adminSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: '#B45309',
    marginTop: 2,
  },
  signOutButton: {
    marginHorizontal: Theme.spacing.md,
  },
  bottomSpacer: {
    height: 32,
  },
  // Quick Access styles
  quickAccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  quickAccessIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  quickAccessInfo: {
    flex: 1,
  },
  quickAccessTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  quickAccessSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  quickAccessDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: Theme.spacing.sm,
  },
});
