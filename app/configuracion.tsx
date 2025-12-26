import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context';
import {
  AnimatedCard,
  AnimatedButton,
  useToast,
} from '@/components/ui';
import { Theme } from '@/constants/Theme';
import { updateUsuario } from '@/services/auth';
import { registrarParaPush } from '@/services/notificaciones';

type NotificationSettings = {
  reservas: boolean;
  pagos: boolean;
  actividades: boolean;
  recordatorios: boolean;
  mudanzas: boolean;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  reservas: true,
  pagos: true,
  actividades: true,
  recordatorios: true,
  mudanzas: true,
};

export default function ConfiguracionScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
    loadNotificationSettings();
  }, []);

  const checkNotificationStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPushEnabled(status === 'granted');
  };

  const loadNotificationSettings = async () => {
    if (user?.notificationSettings) {
      setNotificationSettings({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...user.notificationSettings,
      });
    }
  };

  const handleTogglePush = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!pushEnabled) {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        setPushEnabled(true);
        if (user) {
          await registrarParaPush(user.id);
        }
        showToast('Notificaciones activadas', 'success');
      } else {
        Alert.alert(
          'Permisos Requeridos',
          'Para recibir notificaciones, debes habilitarlas en la configuración del dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Ir a Configuración',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    } else {
      Alert.alert(
        'Desactivar Notificaciones',
        'Para desactivar las notificaciones, debes hacerlo desde la configuración del dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ir a Configuración',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }
  }, [pushEnabled, user]);

  const handleToggleNotification = useCallback(
    async (key: keyof NotificationSettings) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newSettings = {
        ...notificationSettings,
        [key]: !notificationSettings[key],
      };
      setNotificationSettings(newSettings);

      if (user) {
        try {
          await updateUsuario(user.id, { notificationSettings: newSettings });
          showToast('Preferencias actualizadas', 'success');
        } catch (error) {
          setNotificationSettings(notificationSettings);
          showToast('Error al actualizar', 'error');
        }
      }
    },
    [notificationSettings, user]
  );

  const handleClearCache = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Limpiar Caché',
      '¿Estás seguro de que deseas limpiar la caché de la aplicación? Esto no eliminará tus datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: async () => {
            setLoading(true);
            // Simulate cache clearing
            await new Promise(resolve => setTimeout(resolve, 1000));
            setLoading(false);
            showToast('Caché limpiada', 'success');
          },
        },
      ]
    );
  }, []);

  const appVersion = useMemo(() => {
    return Application.nativeApplicationVersion || '1.0.0';
  }, []);

  const NotificationToggle = ({
    title,
    description,
    value,
    onToggle,
    icon,
  }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
    icon: keyof typeof FontAwesome.glyphMap;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIconContainer}>
        <FontAwesome name={icon} size={16} color={Theme.colors.primary} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Theme.colors.border, true: Theme.colors.primaryLight }}
        thumbColor={value ? Theme.colors.primary : '#f4f3f4'}
        disabled={!pushEnabled}
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Notificaciones Push */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <AnimatedCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FontAwesome name="bell" size={18} color={Theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Notificaciones Push</Text>
          </View>

          <Pressable style={styles.mainToggle} onPress={handleTogglePush}>
            <LinearGradient
              colors={
                pushEnabled
                  ? [Theme.colors.success, '#059669']
                  : [Theme.colors.textTertiary, '#9CA3AF']
              }
              style={styles.mainToggleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.mainToggleContent}>
                <View style={styles.mainToggleIcon}>
                  <FontAwesome
                    name={pushEnabled ? 'bell' : 'bell-slash'}
                    size={24}
                    color={Theme.colors.white}
                  />
                </View>
                <View style={styles.mainToggleText}>
                  <Text style={styles.mainToggleTitle}>
                    {pushEnabled ? 'Activadas' : 'Desactivadas'}
                  </Text>
                  <Text style={styles.mainToggleSubtitle}>
                    {pushEnabled
                      ? 'Recibirás notificaciones de la app'
                      : 'No recibirás notificaciones'}
                  </Text>
                </View>
                <FontAwesome
                  name="chevron-right"
                  size={16}
                  color="rgba(255,255,255,0.6)"
                />
              </View>
            </LinearGradient>
          </Pressable>
        </AnimatedCard>
      </Animated.View>

      {/* Tipos de Notificaciones */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <AnimatedCard style={[styles.sectionCard, !pushEnabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FontAwesome name="sliders" size={18} color={Theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Tipos de Notificaciones</Text>
          </View>

          {!pushEnabled && (
            <View style={styles.disabledOverlay}>
              <FontAwesome name="lock" size={20} color={Theme.colors.textTertiary} />
              <Text style={styles.disabledText}>
                Activa las notificaciones para personalizar
              </Text>
            </View>
          )}

          <NotificationToggle
            title="Reservas"
            description="Confirmaciones y cambios en reservas"
            value={notificationSettings.reservas}
            onToggle={() => handleToggleNotification('reservas')}
            icon="calendar-check-o"
          />

          <View style={styles.divider} />

          <NotificationToggle
            title="Pagos"
            description="Pagos pendientes y confirmados"
            value={notificationSettings.pagos}
            onToggle={() => handleToggleNotification('pagos')}
            icon="credit-card"
          />

          <View style={styles.divider} />

          <NotificationToggle
            title="Actividades"
            description="Asados, eventos y recordatorios"
            value={notificationSettings.actividades}
            onToggle={() => handleToggleNotification('actividades')}
            icon="cutlery"
          />

          <View style={styles.divider} />

          <NotificationToggle
            title="Recordatorios"
            description="Recordatorios de Shabbat y eventos"
            value={notificationSettings.recordatorios}
            onToggle={() => handleToggleNotification('recordatorios')}
            icon="clock-o"
          />

          <View style={styles.divider} />

          <NotificationToggle
            title="Mudanzas"
            description="Cuando te mudan de habitación"
            value={notificationSettings.mudanzas}
            onToggle={() => handleToggleNotification('mudanzas')}
            icon="exchange"
          />
        </AnimatedCard>
      </Animated.View>

      {/* Almacenamiento */}
      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <AnimatedCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FontAwesome name="database" size={18} color={Theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Almacenamiento</Text>
          </View>

          <AnimatedButton
            title="Limpiar Caché"
            variant="outline"
            icon="trash"
            onPress={handleClearCache}
            loading={loading}
          />
        </AnimatedCard>
      </Animated.View>

      {/* Información */}
      <Animated.View entering={FadeInDown.delay(400).springify()}>
        <AnimatedCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FontAwesome name="info-circle" size={18} color={Theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Información</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión de la App</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plataforma</Text>
            <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={styles.linkRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast('Próximamente...', 'info');
            }}
          >
            <Text style={styles.linkText}>Términos y Condiciones</Text>
            <FontAwesome name="external-link" size={14} color={Theme.colors.primary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.linkRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast('Próximamente...', 'info');
            }}
          >
            <Text style={styles.linkText}>Política de Privacidad</Text>
            <FontAwesome name="external-link" size={14} color={Theme.colors.primary} />
          </Pressable>
        </AnimatedCard>
      </Animated.View>

      {/* Footer */}
      <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.footer}>
        <Text style={styles.footerText}>Tortuguitas Quinta Familiar</Text>
        <Text style={styles.footerSubtext}>Hecho con ❤️ para la familia</Text>
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
    padding: Theme.spacing.md,
  },
  sectionCard: {
    marginBottom: Theme.spacing.md,
  },
  sectionDisabled: {
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    flex: 1,
  },
  mainToggle: {
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  mainToggleGradient: {
    padding: Theme.spacing.lg,
  },
  mainToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainToggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  mainToggleText: {
    flex: 1,
  },
  mainToggleTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.white,
  },
  mainToggleSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  disabledOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.backgroundSecondary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
  },
  disabledText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textTertiary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  toggleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  toggleContent: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  toggleTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  toggleDescription: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: Theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  infoLabel: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  linkText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  footerText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  footerSubtext: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  bottomSpacer: {
    height: 32,
  },
});
