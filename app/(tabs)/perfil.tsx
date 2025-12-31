import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth, useReservas } from '@/context';
import {
  AnimatedButton,
  AnimatedCard,
  Input,
  Avatar,
  ScalePress,
  FadeView,
  ProgressBar,
  useToast,
  Skeleton,
} from '@/components/ui';
import { Theme, SectorConfig, Gradients } from '@/constants/Theme';
import { updateUsuario } from '@/services/auth';
import { FamiliarDependiente, Genero } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;
const HEADER_COLLAPSED_HEIGHT = 120;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRIORIDAD_INFO: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Socio', icon: 'star', color: '#FFD700' },
  2: { name: 'Hijo de socio', icon: 'user', color: '#C0C0C0' },
  3: { name: 'Nieto', icon: 'users', color: '#CD7F32' },
};

interface QuickAccessItemProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: number;
}

function QuickAccessItem({ icon, iconColor, bgColor, title, subtitle, onPress, badge }: QuickAccessItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.97, Theme.animation.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Theme.animation.spring.default);
      }}
      style={[styles.quickAccessItem, animatedStyle]}
    >
      <View style={[styles.quickAccessIcon, { backgroundColor: bgColor }]}>
        <FontAwesome name={icon as any} size={18} color={iconColor} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.quickAccessBadge}>
            <Text style={styles.quickAccessBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.quickAccessInfo}>
        <Text style={styles.quickAccessTitle}>{title}</Text>
        <Text style={styles.quickAccessSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.quickAccessArrow}>
        <FontAwesome name="chevron-right" size={12} color={Theme.colors.textTertiary} />
      </View>
    </AnimatedPressable>
  );
}

interface FamiliarCardProps {
  familiar: FamiliarDependiente;
  onDelete?: () => void;
  calcularEdad: (fecha: Date) => number;
}

function FamiliarCard({ familiar, onDelete, calcularEdad }: FamiliarCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const edad = calcularEdad(new Date(familiar.fechaNacimiento));
  const isChild = edad < 18;

  return (
    <AnimatedPressable
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDelete?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, Theme.animation.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Theme.animation.spring.default);
      }}
      style={[styles.familiarCard, animatedStyle]}
    >
      <View style={styles.familiarAvatarContainer}>
        <Avatar name={familiar.nombre} size="medium" />
        <View style={[
          styles.familiarGenderBadge,
          { backgroundColor: familiar.genero === 'varon' ? '#DBEAFE' : '#FCE7F3' }
        ]}>
          <FontAwesome
            name={familiar.genero === 'varon' ? 'male' : 'female'}
            size={10}
            color={familiar.genero === 'varon' ? '#2563EB' : '#DB2777'}
          />
        </View>
      </View>
      <View style={styles.familiarInfo}>
        <Text style={styles.familiarName}>{familiar.nombre}</Text>
        <View style={styles.familiarMeta}>
          <Text style={styles.familiarAge}>{edad} años</Text>
          {isChild && (
            <View style={styles.childBadge}>
              <FontAwesome name="child" size={10} color={Theme.colors.primary} />
              <Text style={styles.childBadgeText}>Menor</Text>
            </View>
          )}
        </View>
      </View>
      <FontAwesome name="ellipsis-v" size={14} color={Theme.colors.textTertiary} />
    </AnimatedPressable>
  );
}

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { misReservas } = useReservas();
  const { showToast } = useToast();

  const scrollY = useSharedValue(0);
  const [editando, setEditando] = useState(false);
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [showFamiliaForm, setShowFamiliaForm] = useState(false);
  const [nuevoFamiliar, setNuevoFamiliar] = useState({
    nombre: '',
    fechaNacimiento: '',
    genero: 'varon' as Genero,
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [HEADER_HEIGHT, HEADER_COLLAPSED_HEIGHT],
      Extrapolation.CLAMP
    );
    return { height };
  });

  const avatarAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.6],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, 20],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 60],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
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

  const calcularEdad = useCallback((fechaNacimiento: Date): number => {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const m = hoy.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  }, []);

  const sectorConfig = user?.grupoFamiliar ? SectorConfig[user.grupoFamiliar] : null;
  const prioridadInfo = user?.prioridadNivel ? PRIORIDAD_INFO[user.prioridadNivel] : null;

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Skeleton width={100} height={100} style={styles.avatarSkeleton} />
          <Skeleton width={200} height={24} />
          <Skeleton width={150} height={16} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={sectorConfig?.gradient || Gradients.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={[styles.headerContent, { paddingTop: insets.top + 20 }]}>
          <Animated.View style={[styles.avatarSection, avatarAnimatedStyle]}>
            <View style={styles.avatarWrapper}>
              <Avatar
                name={`${user.nombre} ${user.apellido}`}
                size="xlarge"
                style={styles.avatar}
              />
              {user.esAdmin && (
                <View style={styles.adminBadge}>
                  <FontAwesome name="shield" size={14} color="#D97706" />
                </View>
              )}
            </View>
          </Animated.View>

          <Animated.View style={[styles.headerText, textAnimatedStyle]}>
            <Text style={styles.userName}>
              {user.nombre} {user.apellido}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={styles.badgesRow}>
              {sectorConfig && (
                <View style={styles.headerBadge}>
                  <FontAwesome name={sectorConfig.icon as any} size={11} color="rgba(255,255,255,0.95)" />
                  <Text style={styles.headerBadgeText}>{sectorConfig.name}</Text>
                </View>
              )}
              {prioridadInfo && (
                <View style={styles.headerBadge}>
                  <FontAwesome name={prioridadInfo.icon as any} size={11} color={prioridadInfo.color} />
                  <Text style={styles.headerBadgeText}>{prioridadInfo.name}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT - 40 }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Stats Cards */}
        <FadeView delay={100}>
          <View style={styles.statsContainer}>
            <ScalePress style={styles.statCard}>
              <LinearGradient
                colors={['#FF385C', '#FF5A7E']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{misReservas.length}</Text>
                <Text style={styles.statLabel}>Reservas</Text>
              </View>
            </ScalePress>

            <ScalePress style={styles.statCard}>
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>
                  {user.historialAsistencias?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Shabbatot</Text>
              </View>
            </ScalePress>

            <ScalePress style={styles.statCard}>
              <LinearGradient
                colors={['#8B5CF6', '#A78BFA']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>
                  {user.familia?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Familia</Text>
              </View>
            </ScalePress>
          </View>
        </FadeView>

        {/* Personal Info Card */}
        <FadeView delay={200}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={Gradients.primary}
                style={styles.sectionIconGradient}
              >
                <FontAwesome name="user" size={14} color={Theme.colors.white} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Información Personal</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Nacimiento</Text>
                  <Text style={styles.infoValue}>
                    {format(user.fechaNacimiento, "d MMM yyyy", { locale: es })}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Edad</Text>
                  <Text style={styles.infoValue}>
                    {calcularEdad(user.fechaNacimiento)} años
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Género</Text>
                  <Text style={styles.infoValue}>
                    {user.genero === 'varon' ? 'Varón' : 'Mujer'}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  {editando ? (
                    <View style={styles.editContainer}>
                      <Input
                        value={telefono}
                        onChangeText={setTelefono}
                        placeholder="+54 11 1234-5678"
                        keyboardType="phone-pad"
                        style={styles.editInput}
                      />
                      <View style={styles.editButtons}>
                        <Pressable
                          onPress={() => setEditando(false)}
                          style={styles.cancelButton}
                        >
                          <FontAwesome name="times" size={14} color={Theme.colors.textSecondary} />
                        </Pressable>
                        <Pressable
                          onPress={handleGuardarTelefono}
                          style={styles.saveButton}
                        >
                          <FontAwesome name="check" size={14} color={Theme.colors.white} />
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.editableValue}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditando(true);
                      }}
                    >
                      <Text style={styles.infoValue}>
                        {user.telefono || 'Agregar'}
                      </Text>
                      <View style={styles.editBadge}>
                        <FontAwesome name="pencil" size={10} color={Theme.colors.primary} />
                      </View>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>
        </FadeView>

        {/* Family Section */}
        <FadeView delay={300}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={Gradients.purple}
                style={styles.sectionIconGradient}
              >
                <FontAwesome name="users" size={14} color={Theme.colors.white} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Mi Familia</Text>
              <Pressable
                style={[
                  styles.addFamilyButton,
                  showFamiliaForm && styles.addFamilyButtonActive
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFamiliaForm(!showFamiliaForm);
                }}
              >
                <FontAwesome
                  name={showFamiliaForm ? 'times' : 'plus'}
                  size={12}
                  color={showFamiliaForm ? Theme.colors.textSecondary : Theme.colors.primary}
                />
              </Pressable>
            </View>

            {showFamiliaForm && (
              <Animated.View entering={FadeInUp.springify()} style={styles.familiaForm}>
                <Text style={styles.formTitle}>Nuevo Familiar</Text>
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

                <Text style={styles.genderLabel}>Género</Text>
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
                      color={nuevoFamiliar.genero === 'varon' ? '#2563EB' : Theme.colors.textSecondary}
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
                      color={nuevoFamiliar.genero === 'mujer' ? '#DB2777' : Theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        nuevoFamiliar.genero === 'mujer' && styles.genderTextMujerActive,
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
                  style={styles.addFamiliarButton}
                />
              </Animated.View>
            )}

            {user.familia && user.familia.length > 0 ? (
              <View style={styles.familiaList}>
                {user.familia.map((familiar, idx) => (
                  <FamiliarCard
                    key={familiar.id || idx}
                    familiar={familiar}
                    calcularEdad={calcularEdad}
                  />
                ))}
              </View>
            ) : (
              !showFamiliaForm && (
                <View style={styles.emptyFamily}>
                  <View style={styles.emptyFamilyIcon}>
                    <FontAwesome name="users" size={28} color={Theme.colors.textTertiary} />
                  </View>
                  <Text style={styles.emptyText}>Sin familiares registrados</Text>
                  <Text style={styles.emptySubtext}>
                    Toca + para agregar familiares a tus reservas
                  </Text>
                </View>
              )
            )}
          </View>
        </FadeView>

        {/* Quick Access */}
        <FadeView delay={400}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={Gradients.blue}
                style={styles.sectionIconGradient}
              >
                <FontAwesome name="th-large" size={14} color={Theme.colors.white} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
            </View>

            <View style={styles.quickAccessGrid}>
              <QuickAccessItem
                icon="history"
                iconColor="#2563EB"
                bgColor="#DBEAFE"
                title="Historial"
                subtitle="Tus reservas anteriores"
                onPress={() => router.push('/historial')}
              />
              <QuickAccessItem
                icon="credit-card"
                iconColor="#059669"
                bgColor="#D1FAE5"
                title="Mis Pagos"
                subtitle="Historial y pendientes"
                onPress={() => router.push('/pagos')}
              />
              <QuickAccessItem
                icon="bar-chart"
                iconColor="#D97706"
                bgColor="#FEF3C7"
                title="Estadísticas"
                subtitle="Tu actividad"
                onPress={() => router.push('/estadisticas')}
              />
              <QuickAccessItem
                icon="bell"
                iconColor="#DB2777"
                bgColor="#FCE7F3"
                title="Notificaciones"
                subtitle="Centro de alertas"
                onPress={() => router.push('/notificaciones')}
                badge={3}
              />
              <QuickAccessItem
                icon="cog"
                iconColor="#7C3AED"
                bgColor="#F3E8FF"
                title="Configuración"
                subtitle="Preferencias"
                onPress={() => router.push('/configuracion')}
              />
            </View>
          </View>
        </FadeView>

        {/* Admin Panel */}
        {user.esAdmin && (
          <FadeView delay={500}>
            <ScalePress
              onPress={() => router.push('/admin')}
              style={styles.adminCard}
            >
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A', '#FCD34D']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.adminContent}>
                <View style={styles.adminIconContainer}>
                  <FontAwesome name="shield" size={24} color="#D97706" />
                </View>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminTitle}>Panel de Administración</Text>
                  <Text style={styles.adminSubtitle}>Gestionar reservas y usuarios</Text>
                </View>
                <View style={styles.adminArrow}>
                  <FontAwesome name="arrow-right" size={16} color="#D97706" />
                </View>
              </View>
            </ScalePress>
          </FadeView>
        )}

        {/* Sign Out */}
        <FadeView delay={600}>
          <ScalePress
            onPress={handleSignOut}
            style={styles.signOutButton}
          >
            <FontAwesome name="sign-out" size={18} color={Theme.colors.error} />
            <Text style={styles.signOutText}>Cerrar Sesión</Text>
          </ScalePress>
        </FadeView>

        {/* Version Info */}
        <FadeView delay={700}>
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Tortuguitas v1.0.0</Text>
            <Text style={styles.versionSubtext}>Hecho con ❤️ para la familia</Text>
          </View>
        </FadeView>

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
  loadingContainer: {
    alignItems: 'center',
    padding: Theme.spacing.xxl,
    gap: Theme.spacing.md,
  },
  avatarSkeleton: {
    borderRadius: 50,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  adminBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.md,
  },
  headerText: {
    alignItems: 'center',
    marginTop: Theme.spacing.md,
  },
  userName: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userEmail: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.85)',
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
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
  },
  headerBadgeText: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.white,
    fontWeight: Theme.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    ...Theme.shadows.md,
  },
  statContent: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: Theme.fontWeight.medium,
  },
  sectionCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  sectionIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 10,
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
  infoRow: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: Theme.fontWeight.medium,
  },
  infoValue: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.text,
    fontWeight: Theme.fontWeight.medium,
  },
  editableValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  editBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editContainer: {
    gap: Theme.spacing.sm,
  },
  editInput: {
    marginBottom: 0,
  },
  editButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFamilyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFamilyButtonActive: {
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  familiaForm: {
    backgroundColor: Theme.colors.backgroundSecondary,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
  },
  formTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  genderLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: Theme.colors.surface,
  },
  genderButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  genderText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeight.medium,
  },
  genderTextActive: {
    color: '#2563EB',
    fontWeight: Theme.fontWeight.semibold,
  },
  genderTextMujerActive: {
    color: '#DB2777',
    fontWeight: Theme.fontWeight.semibold,
  },
  addFamiliarButton: {
    marginTop: Theme.spacing.sm,
  },
  familiaList: {
    gap: Theme.spacing.sm,
  },
  familiarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.backgroundSecondary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    gap: Theme.spacing.md,
  },
  familiarAvatarContainer: {
    position: 'relative',
  },
  familiarGenderBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.backgroundSecondary,
  },
  familiarInfo: {
    flex: 1,
  },
  familiarName: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  familiarMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: 4,
  },
  familiarAge: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  childBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
  },
  childBadgeText: {
    fontSize: 10,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
  emptyFamily: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyFamilyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeight.medium,
  },
  emptySubtext: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  quickAccessGrid: {
    gap: Theme.spacing.sm,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.backgroundSecondary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    gap: Theme.spacing.md,
  },
  quickAccessIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  quickAccessBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickAccessBadgeText: {
    fontSize: 10,
    color: Theme.colors.white,
    fontWeight: Theme.fontWeight.bold,
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
  quickAccessArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminCard: {
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.md,
  },
  adminContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  adminIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  adminInfo: {
    flex: 1,
  },
  adminTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: '#92400E',
  },
  adminSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: '#B45309',
    marginTop: 2,
  },
  adminArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.errorLight,
  },
  signOutText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  versionText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textTertiary,
    fontWeight: Theme.fontWeight.medium,
  },
  versionSubtext: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textTertiary,
    marginTop: 4,
  },
});
