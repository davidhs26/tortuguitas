import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
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
import { ConfigAdmin, Usuario, Reserva, Actividad } from '@/types';
import {
  getConfigPrecios,
  guardarConfigPrecios,
  actualizarPreciosIPC,
} from '@/services/pagos';
import { inicializarHabitaciones } from '@/services/habitaciones';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/services/firebase';

type AdminTab = 'dashboard' | 'reservas' | 'usuarios' | 'precios' | 'sistema';

const TABS: { key: AdminTab; label: string; icon: keyof typeof FontAwesome.glyphMap }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'reservas', label: 'Reservas', icon: 'calendar' },
  { key: 'usuarios', label: 'Usuarios', icon: 'users' },
  { key: 'precios', label: 'Precios', icon: 'money' },
  { key: 'sistema', label: 'Sistema', icon: 'cog' },
];

export default function AdminScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [config, setConfig] = useState<ConfigAdmin | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [precioVerduras, setPrecioVerduras] = useState('');
  const [precioServicios, setPrecioServicios] = useState('');
  const [ipcPorcentaje, setIpcPorcentaje] = useState('');

  useEffect(() => {
    if (!user?.esAdmin) {
      showToast('Acceso denegado', 'error');
      router.back();
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Load config
      const configData = await getConfigPrecios();
      if (configData) {
        setConfig(configData);
        setPrecioVerduras(configData.precios.verdurasPorCama.toString());
        setPrecioServicios(configData.precios.serviciosFijos.toString());
      }

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        fechaNacimiento: doc.data().fechaNacimiento?.toDate() || new Date(),
      })) as Usuario[];
      setUsuarios(usersData);

      // Load recent reservations
      const reservasSnapshot = await getDocs(
        query(collection(db, 'reservas'), orderBy('fechaReserva', 'desc'), limit(20))
      );
      const reservasData = reservasSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        fechaShabbat: doc.data().fechaShabbat?.toDate() || new Date(),
        fechaReserva: doc.data().fechaReserva?.toDate() || new Date(),
      })) as Reserva[];
      setReservas(reservasData);
    } catch (err) {
      console.error('Error cargando datos admin:', err);
      showToast('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setRefreshing(false);
    showToast('Datos actualizados', 'success');
  }, []);

  const handleGuardarPrecios = async () => {
    const verduras = parseFloat(precioVerduras);
    const servicios = parseFloat(precioServicios);

    if (isNaN(verduras) || isNaN(servicios)) {
      showToast('Ingresa valores válidos', 'error');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await guardarConfigPrecios({
        precios: {
          verdurasPorCama: verduras,
          serviciosFijos: servicios,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Precios actualizados', 'success');
      await loadData();
    } catch (err) {
      showToast('Error al guardar', 'error');
    }
  };

  const handleAplicarIPC = async () => {
    const porcentaje = parseFloat(ipcPorcentaje);

    if (isNaN(porcentaje) || porcentaje <= 0) {
      showToast('Porcentaje inválido', 'error');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Confirmar IPC',
      `¿Aplicar aumento del ${porcentaje}%?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: async () => {
            try {
              await actualizarPreciosIPC(porcentaje);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('IPC aplicado', 'success');
              setIpcPorcentaje('');
              await loadData();
            } catch (err) {
              showToast('Error al aplicar IPC', 'error');
            }
          },
        },
      ]
    );
  };

  const handleInicializarHabitaciones = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert(
      'Inicializar Habitaciones',
      '¿Crear/actualizar habitaciones en la BD?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Inicializar',
          onPress: async () => {
            try {
              await inicializarHabitaciones();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Habitaciones inicializadas', 'success');
            } catch (err) {
              showToast('Error', 'error');
            }
          },
        },
      ]
    );
  };

  // Stats
  const totalUsuarios = usuarios.length;
  const totalReservas = reservas.length;
  const reservasActivas = reservas.filter(r => r.estado === 'confirmada').length;
  const usuariosAdmin = usuarios.filter(u => u.esAdmin).length;

  if (!user?.esAdmin) return null;

  if (loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Skeleton width="60%" height={32} style={styles.skeletonTitle} />
        <Skeleton width="100%" height={120} />
        <Skeleton width="100%" height={200} />
      </ScrollView>
    );
  }

  const renderDashboard = () => (
    <>
      {/* Stats Grid */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsGrid}>
        <AnimatedCard style={styles.statCard}>
          <LinearGradient
            colors={[Theme.colors.primary, Theme.colors.primaryDark]}
            style={styles.statGradient}
          >
            <FontAwesome name="users" size={24} color={Theme.colors.white} />
            <Text style={styles.statValue}>{totalUsuarios}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </LinearGradient>
        </AnimatedCard>

        <AnimatedCard style={styles.statCard}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.statGradient}
          >
            <FontAwesome name="calendar-check-o" size={24} color={Theme.colors.white} />
            <Text style={styles.statValue}>{reservasActivas}</Text>
            <Text style={styles.statLabel}>Reservas Activas</Text>
          </LinearGradient>
        </AnimatedCard>

        <AnimatedCard style={styles.statCard}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.statGradient}
          >
            <FontAwesome name="calendar" size={24} color={Theme.colors.white} />
            <Text style={styles.statValue}>{totalReservas}</Text>
            <Text style={styles.statLabel}>Total Reservas</Text>
          </LinearGradient>
        </AnimatedCard>

        <AnimatedCard style={styles.statCard}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.statGradient}
          >
            <FontAwesome name="star" size={24} color={Theme.colors.white} />
            <Text style={styles.statValue}>{usuariosAdmin}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </LinearGradient>
        </AnimatedCard>
      </Animated.View>

      {/* Recent Reservations */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <AnimatedCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="history" size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Reservas Recientes</Text>
          </View>
          {reservas.slice(0, 5).map((reserva, idx) => (
            <View key={reserva.id} style={styles.reservaRow}>
              <Avatar name={reserva.usuarioNombre} size="small" />
              <View style={styles.reservaInfo}>
                <Text style={styles.reservaNombre}>{reserva.usuarioNombre}</Text>
                <Text style={styles.reservaDetalle}>
                  {reserva.habitacionNombre} • {format(reserva.fechaShabbat, 'dd/MM')}
                </Text>
              </View>
              <StatusBadge
                status={reserva.estado === 'confirmada' ? 'success' : reserva.estado === 'cancelada' ? 'error' : 'warning'}
                label={reserva.estado}
              />
            </View>
          ))}
        </AnimatedCard>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <AnimatedCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="bolt" size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          </View>
          <View style={styles.quickActions}>
            <AnimatedButton
              title="Ver Todas las Reservas"
              variant="outline"
              size="small"
              icon="calendar"
              onPress={() => setActiveTab('reservas')}
              style={styles.quickAction}
            />
            <AnimatedButton
              title="Gestionar Usuarios"
              variant="outline"
              size="small"
              icon="users"
              onPress={() => setActiveTab('usuarios')}
              style={styles.quickAction}
            />
          </View>
        </AnimatedCard>
      </Animated.View>
    </>
  );

  const renderReservas = () => (
    <Animated.View entering={FadeInRight.springify()}>
      <AnimatedCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="calendar" size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Todas las Reservas ({reservas.length})</Text>
        </View>
        {reservas.map((reserva, idx) => (
          <Pressable
            key={reserva.id}
            style={styles.reservaFullRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/reserva/${reserva.id}`);
            }}
          >
            <Avatar name={reserva.usuarioNombre} size="medium" />
            <View style={styles.reservaFullInfo}>
              <Text style={styles.reservaNombre}>{reserva.usuarioNombre}</Text>
              <Text style={styles.reservaDetalle}>
                {reserva.habitacionNombre}
              </Text>
              <Text style={styles.reservaFecha}>
                Shabbat {format(reserva.fechaShabbat, "d 'de' MMMM", { locale: es })}
              </Text>
            </View>
            <View style={styles.reservaRight}>
              <StatusBadge
                status={reserva.estado === 'confirmada' ? 'success' : reserva.estado === 'cancelada' ? 'error' : 'warning'}
                label={reserva.estado}
              />
              {reserva.pagado && (
                <Badge label="Pagado" variant="success" size="small" />
              )}
            </View>
          </Pressable>
        ))}
      </AnimatedCard>
    </Animated.View>
  );

  const renderUsuarios = () => (
    <Animated.View entering={FadeInRight.springify()}>
      <AnimatedCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="users" size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Usuarios ({usuarios.length})</Text>
        </View>
        {usuarios.map((usuario, idx) => (
          <View key={usuario.id} style={styles.usuarioRow}>
            <Avatar name={`${usuario.nombre} ${usuario.apellido}`} size="medium" />
            <View style={styles.usuarioInfo}>
              <Text style={styles.usuarioNombre}>
                {usuario.nombre} {usuario.apellido}
              </Text>
              <Text style={styles.usuarioEmail}>{usuario.email}</Text>
              <View style={styles.usuarioBadges}>
                <Badge label={usuario.grupoFamiliar} variant="primary" size="small" />
                <Badge label={`Nivel ${usuario.prioridadNivel}`} variant="default" size="small" />
              </View>
            </View>
            {usuario.esAdmin && (
              <View style={styles.adminIndicator}>
                <FontAwesome name="star" size={16} color={Theme.colors.warning} />
              </View>
            )}
          </View>
        ))}
      </AnimatedCard>
    </Animated.View>
  );

  const renderPrecios = () => (
    <Animated.View entering={FadeInRight.springify()}>
      {/* Current Config */}
      {config && (
        <AnimatedCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="info-circle" size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Configuración Actual</Text>
          </View>
          <View style={styles.configGrid}>
            <View style={styles.configItem}>
              <Text style={styles.configLabel}>Precio por cama</Text>
              <Text style={styles.configValue}>${config.precios.verdurasPorCama}</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={styles.configLabel}>Servicios fijos</Text>
              <Text style={styles.configValue}>${config.precios.serviciosFijos}</Text>
            </View>
            {config.ipcPorcentaje > 0 && (
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Último IPC</Text>
                <Text style={styles.configValue}>{config.ipcPorcentaje}%</Text>
              </View>
            )}
          </View>
        </AnimatedCard>
      )}

      {/* Update Prices */}
      <AnimatedCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="edit" size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Actualizar Precios</Text>
        </View>
        <Input
          label="Precio por cama"
          value={precioVerduras}
          onChangeText={setPrecioVerduras}
          keyboardType="numeric"
          placeholder="5000"
        />
        <Input
          label="Servicios fijos"
          value={precioServicios}
          onChangeText={setPrecioServicios}
          keyboardType="numeric"
          placeholder="2000"
        />
        <AnimatedButton
          title="Guardar Precios"
          variant="primary"
          icon="save"
          onPress={handleGuardarPrecios}
        />
      </AnimatedCard>

      {/* IPC */}
      <AnimatedCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="line-chart" size={18} color={Theme.colors.warning} />
          <Text style={styles.sectionTitle}>Ajuste por IPC</Text>
        </View>
        <Text style={styles.description}>
          Aplica un aumento porcentual a todos los precios.
        </Text>
        <Input
          label="Porcentaje (%)"
          value={ipcPorcentaje}
          onChangeText={setIpcPorcentaje}
          keyboardType="numeric"
          placeholder="5.5"
        />
        <AnimatedButton
          title="Aplicar IPC"
          variant="secondary"
          icon="percent"
          onPress={handleAplicarIPC}
        />
      </AnimatedCard>
    </Animated.View>
  );

  const renderSistema = () => (
    <Animated.View entering={FadeInRight.springify()}>
      <AnimatedCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="database" size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Base de Datos</Text>
        </View>
        <Text style={styles.description}>
          Inicializa o actualiza la estructura de habitaciones.
        </Text>
        <AnimatedButton
          title="Inicializar Habitaciones"
          variant="outline"
          icon="home"
          onPress={handleInicializarHabitaciones}
        />
      </AnimatedCard>

      <AnimatedCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="bell" size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Notificaciones</Text>
        </View>
        <Text style={styles.description}>
          Envía notificaciones push a todos los usuarios.
        </Text>
        <AnimatedButton
          title="Enviar Notificación"
          variant="outline"
          icon="send"
          onPress={() => showToast('Próximamente', 'info')}
        />
      </AnimatedCard>

      <AnimatedCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="shield" size={18} color={Theme.colors.error} />
          <Text style={styles.sectionTitle}>Zona de Peligro</Text>
        </View>
        <AnimatedButton
          title="Limpiar Cache"
          variant="danger"
          icon="trash"
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showToast('Cache limpiado', 'success');
          }}
        />
      </AnimatedCard>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="arrow-left" size={20} color={Theme.colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Panel Admin</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map(tab => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key);
              }}
            >
              <FontAwesome
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? Theme.colors.white : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'reservas' && renderReservas()}
        {activeTab === 'usuarios' && renderUsuarios()}
        {activeTab === 'precios' && renderPrecios()}
        {activeTab === 'sistema' && renderSistema()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: Theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    maxHeight: 50,
  },
  tabs: {
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: Theme.colors.primary,
  },
  tabText: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: Theme.colors.white,
    fontWeight: Theme.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Theme.spacing.md,
  },
  skeletonTitle: {
    marginBottom: Theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  statCard: {
    width: '48%',
    padding: 0,
    overflow: 'hidden',
  },
  statGradient: {
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
    marginTop: Theme.spacing.sm,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
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
  },
  description: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  reservaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  reservaInfo: {
    flex: 1,
  },
  reservaNombre: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  reservaDetalle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  reservaFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  reservaFullInfo: {
    flex: 1,
  },
  reservaFecha: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textTertiary,
    marginTop: 2,
  },
  reservaRight: {
    alignItems: 'flex-end',
    gap: Theme.spacing.xs,
  },
  usuarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  usuarioInfo: {
    flex: 1,
  },
  usuarioNombre: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  usuarioEmail: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  usuarioBadges: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.xs,
  },
  adminIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  configItem: {
    backgroundColor: Theme.colors.backgroundSecondary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    minWidth: '45%',
  },
  configLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  configValue: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
  },
  quickActions: {
    gap: Theme.spacing.sm,
  },
  quickAction: {
    marginBottom: 0,
  },
  bottomSpacer: {
    height: 32,
  },
});
