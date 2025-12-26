import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth, useReservas } from '@/context';
import { Button, Card, Input } from '@/components/ui';
import { updateUsuario } from '@/services/auth';
import { FamiliarDependiente, Genero } from '@/types';

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  const { misReservas } = useReservas();

  const [editando, setEditando] = useState(false);
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [showFamiliaForm, setShowFamiliaForm] = useState(false);
  const [nuevoFamiliar, setNuevoFamiliar] = useState({
    nombre: '',
    fechaNacimiento: '',
    genero: 'varon' as Genero,
  });

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesion', '¿Estas seguro que deseas cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesion',
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

    try {
      await updateUsuario(user.id, { telefono });
      setEditando(false);
      Alert.alert('Exito', 'Telefono actualizado');
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar el telefono');
    }
  };

  const handleAgregarFamiliar = async () => {
    if (!user) return;

    if (!nuevoFamiliar.nombre.trim()) {
      Alert.alert('Error', 'Ingresa el nombre');
      return;
    }

    if (!nuevoFamiliar.fechaNacimiento) {
      Alert.alert('Error', 'Ingresa la fecha de nacimiento');
      return;
    }

    // Validar formato de fecha
    const fechaRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = nuevoFamiliar.fechaNacimiento.match(fechaRegex);
    if (!match) {
      Alert.alert('Error', 'Formato de fecha invalido. Usa DD/MM/AAAA');
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

    try {
      await updateUsuario(user.id, {
        familia: [...(user.familia || []), familiar],
      });
      setShowFamiliaForm(false);
      setNuevoFamiliar({ nombre: '', fechaNacimiento: '', genero: 'varon' });
      Alert.alert('Exito', 'Familiar agregado');
    } catch (err) {
      Alert.alert('Error', 'No se pudo agregar el familiar');
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

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header del perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.nombre.charAt(0)}
            {user.apellido.charAt(0)}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user.nombre} {user.apellido}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>

        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {SECTOR_NAMES[user.grupoFamiliar]}
            </Text>
          </View>
          <View style={[styles.badge, styles.prioridadBadge]}>
            <Text style={styles.badgeText}>
              {PRIORIDAD_NAMES[user.prioridadNivel]}
            </Text>
          </View>
          {user.esAdmin && (
            <View style={[styles.badge, styles.adminBadge]}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
        </View>
      </View>

      {/* Informacion personal */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Informacion Personal</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
          <Text style={styles.infoValue}>
            {format(user.fechaNacimiento, "d 'de' MMMM, yyyy", { locale: es })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Edad</Text>
          <Text style={styles.infoValue}>
            {calcularEdad(user.fechaNacimiento)} años
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Genero</Text>
          <Text style={styles.infoValue}>
            {user.genero === 'varon' ? 'Varon' : 'Mujer'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Telefono</Text>
          {editando ? (
            <View style={styles.editRow}>
              <Input
                value={telefono}
                onChangeText={setTelefono}
                placeholder="+54 11 1234-5678"
                keyboardType="phone-pad"
                style={styles.editInput}
              />
              <Button
                title="Guardar"
                size="small"
                onPress={handleGuardarTelefono}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.editableRow}
              onPress={() => setEditando(true)}
            >
              <Text style={styles.infoValue}>
                {user.telefono || 'No registrado'}
              </Text>
              <FontAwesome name="pencil" size={14} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* Mi Familia */}
      <Card style={styles.infoCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mi Familia</Text>
          <Button
            title="Agregar"
            size="small"
            variant="outline"
            onPress={() => setShowFamiliaForm(!showFamiliaForm)}
          />
        </View>

        {showFamiliaForm && (
          <View style={styles.familiaForm}>
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
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  nuevoFamiliar.genero === 'varon' && styles.genderButtonActive,
                ]}
                onPress={() =>
                  setNuevoFamiliar({ ...nuevoFamiliar, genero: 'varon' })
                }
              >
                <Text
                  style={[
                    styles.genderText,
                    nuevoFamiliar.genero === 'varon' && styles.genderTextActive,
                  ]}
                >
                  Varon
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  nuevoFamiliar.genero === 'mujer' && styles.genderButtonActive,
                ]}
                onPress={() =>
                  setNuevoFamiliar({ ...nuevoFamiliar, genero: 'mujer' })
                }
              >
                <Text
                  style={[
                    styles.genderText,
                    nuevoFamiliar.genero === 'mujer' && styles.genderTextActive,
                  ]}
                >
                  Mujer
                </Text>
              </TouchableOpacity>
            </View>
            <Button title="Agregar Familiar" onPress={handleAgregarFamiliar} />
          </View>
        )}

        {user.familia && user.familia.length > 0 ? (
          user.familia.map((familiar, idx) => (
            <View key={familiar.id || idx} style={styles.familiarRow}>
              <View>
                <Text style={styles.familiarNombre}>{familiar.nombre}</Text>
                <Text style={styles.familiarInfo}>
                  {familiar.genero === 'varon' ? 'Varon' : 'Mujer'} -{' '}
                  {calcularEdad(new Date(familiar.fechaNacimiento))} años
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay familiares registrados</Text>
        )}
      </Card>

      {/* Estadisticas */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Estadisticas</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{misReservas.length}</Text>
            <Text style={styles.statLabel}>Reservas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {user.historialAsistencias?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Shabbatot</Text>
          </View>
        </View>
      </Card>

      {/* Admin */}
      {user.esAdmin && (
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Administracion</Text>
          <Button
            title="Panel de Admin"
            onPress={() => router.push('/admin')}
            style={styles.adminButton}
          />
        </Card>
      )}

      {/* Cerrar sesion */}
      <Button
        title="Cerrar Sesion"
        variant="danger"
        onPress={handleSignOut}
        style={styles.signOutButton}
      />
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prioridadBadge: {
    backgroundColor: '#DBEAFE',
  },
  adminBadge: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    marginBottom: 0,
  },
  editableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  familiaForm: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  genderText: {
    fontSize: 16,
    color: '#6B7280',
  },
  genderTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  familiarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  familiarNombre: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  familiarInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  adminButton: {
    marginTop: 8,
  },
  signOutButton: {
    marginTop: 8,
  },
});
