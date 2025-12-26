import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context';
import { Button, Card, Input } from '@/components/ui';
import { ConfigAdmin, Usuario } from '@/types';
import {
  getConfigPrecios,
  guardarConfigPrecios,
  actualizarPreciosIPC,
} from '@/services/pagos';
import { inicializarHabitaciones } from '@/services/habitaciones';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';

export default function AdminScreen() {
  const { user } = useAuth();

  const [config, setConfig] = useState<ConfigAdmin | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [precioVerduras, setPrecioVerduras] = useState('');
  const [precioServicios, setPrecioServicios] = useState('');
  const [ipcPorcentaje, setIpcPorcentaje] = useState('');

  useEffect(() => {
    if (!user?.esAdmin) {
      Alert.alert('Acceso Denegado', 'No tienes permisos de administrador');
      router.back();
      return;
    }

    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Cargar configuracion
      const configData = await getConfigPrecios();
      if (configData) {
        setConfig(configData);
        setPrecioVerduras(configData.precios.verdurasPorCama.toString());
        setPrecioServicios(configData.precios.serviciosFijos.toString());
      }

      // Cargar usuarios
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Usuario[];
      setUsuarios(usersData);
    } catch (err) {
      console.error('Error cargando datos admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleGuardarPrecios = async () => {
    const verduras = parseFloat(precioVerduras);
    const servicios = parseFloat(precioServicios);

    if (isNaN(verduras) || isNaN(servicios)) {
      Alert.alert('Error', 'Ingresa valores numericos validos');
      return;
    }

    try {
      await guardarConfigPrecios({
        precios: {
          verdurasPorCama: verduras,
          serviciosFijos: servicios,
        },
      });
      Alert.alert('Exito', 'Precios actualizados');
      await loadData();
    } catch (err) {
      Alert.alert('Error', 'No se pudieron guardar los precios');
    }
  };

  const handleAplicarIPC = async () => {
    const porcentaje = parseFloat(ipcPorcentaje);

    if (isNaN(porcentaje) || porcentaje <= 0) {
      Alert.alert('Error', 'Ingresa un porcentaje valido');
      return;
    }

    Alert.alert(
      'Confirmar Actualizacion IPC',
      `¿Aplicar aumento del ${porcentaje}% a todos los precios?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: async () => {
            try {
              await actualizarPreciosIPC(porcentaje);
              Alert.alert('Exito', 'Precios actualizados con IPC');
              setIpcPorcentaje('');
              await loadData();
            } catch (err) {
              Alert.alert('Error', 'No se pudo aplicar el IPC');
            }
          },
        },
      ]
    );
  };

  const handleInicializarHabitaciones = async () => {
    Alert.alert(
      'Inicializar Habitaciones',
      'Esto creara/actualizara todas las habitaciones en la base de datos. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Inicializar',
          onPress: async () => {
            try {
              await inicializarHabitaciones();
              Alert.alert('Exito', 'Habitaciones inicializadas');
            } catch (err) {
              Alert.alert('Error', 'No se pudieron inicializar las habitaciones');
            }
          },
        },
      ]
    );
  };

  if (!user?.esAdmin) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Panel de Administracion</Text>

      {/* Configuracion de Precios */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Configuracion de Precios</Text>

        <Input
          label="Precio por cama (verduras/servicios)"
          value={precioVerduras}
          onChangeText={setPrecioVerduras}
          keyboardType="numeric"
          placeholder="5000"
        />

        <Input
          label="Servicios fijos por reserva"
          value={precioServicios}
          onChangeText={setPrecioServicios}
          keyboardType="numeric"
          placeholder="2000"
        />

        <Button title="Guardar Precios" onPress={handleGuardarPrecios} />
      </Card>

      {/* Actualizacion IPC */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Actualizacion por IPC</Text>
        <Text style={styles.description}>
          Aplica un aumento porcentual a todos los precios configurados.
        </Text>

        <Input
          label="Porcentaje de aumento (%)"
          value={ipcPorcentaje}
          onChangeText={setIpcPorcentaje}
          keyboardType="numeric"
          placeholder="5.5"
        />

        <Button
          title="Aplicar IPC"
          variant="secondary"
          onPress={handleAplicarIPC}
        />
      </Card>

      {/* Gestion de Habitaciones */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Gestion de Habitaciones</Text>
        <Text style={styles.description}>
          Inicializa o actualiza la configuracion de habitaciones en la base de
          datos.
        </Text>

        <Button
          title="Inicializar Habitaciones"
          variant="outline"
          onPress={handleInicializarHabitaciones}
        />
      </Card>

      {/* Lista de Usuarios */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>
          Usuarios Registrados ({usuarios.length})
        </Text>

        {usuarios.map(usuario => (
          <View key={usuario.id} style={styles.usuarioRow}>
            <View>
              <Text style={styles.usuarioNombre}>
                {usuario.nombre} {usuario.apellido}
              </Text>
              <Text style={styles.usuarioInfo}>
                {usuario.email} | {usuario.grupoFamiliar} | Nivel{' '}
                {usuario.prioridadNivel}
              </Text>
            </View>
            {usuario.esAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
        ))}
      </Card>

      {/* Info de configuracion actual */}
      {config && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Configuracion Actual</Text>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Precio por cama:</Text>
            <Text style={styles.configValue}>
              ${config.precios.verdurasPorCama}
            </Text>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Servicios fijos:</Text>
            <Text style={styles.configValue}>
              ${config.precios.serviciosFijos}
            </Text>
          </View>

          {config.ipcPorcentaje > 0 && (
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Ultimo IPC aplicado:</Text>
              <Text style={styles.configValue}>{config.ipcPorcentaje}%</Text>
            </View>
          )}
        </Card>
      )}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  usuarioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  usuarioNombre: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  usuarioInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  configLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  configValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});
