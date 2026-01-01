// ============================================
// TIPOS PRINCIPALES PARA LA APP DE TORTUGUITAS
// ============================================

// Géneros disponibles
export type Genero = 'varon' | 'mujer';

// Niveles de prioridad para reservas
export type NivelPrioridad = 1 | 2 | 3; // 1: Socio, 2: Hijo de socio, 3: Nieto

// Sectores de la quinta
export type Sector = 'david' | 'mumi' | 'tuni' | 'quincho' | 'libre';

// Estados de reserva
export type EstadoReserva = 'pendiente' | 'confirmada' | 'mudada' | 'cancelada';

// Tipos de actividad
export type TipoActividad = 'futbol' | 'asado_domingo' | 'asado_noche' | 'minyan';

// Categorías de habitación para mudanzas (orden de prioridad)
export type CategoriaHabitacion = 'principal' | 'en_suite' | 'bano_externo' | 'quincho';

// ============================================
// MODELO DE USUARIO
// ============================================
export interface FamiliarDependiente {
  id: string;
  nombre: string;
  fechaNacimiento: Date;
  genero: Genero;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  genero: Genero;
  grupoFamiliar: Sector;
  prioridadNivel: NivelPrioridad;
  historialAsistencias: Date[]; // Fechas de Shabbat asistidos
  familia: FamiliarDependiente[]; // Hijos y dependientes
  esAdmin: boolean;
  telefono?: string;
  pushToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// MODELO DE HABITACIÓN
// ============================================
export interface CapacidadHabitacion {
  camas: number;
  camasMatrimoniales?: number;
  colchones: number;
  cunas: number;
  maxNinos: number;
}

export interface Habitacion {
  id: string;
  nombre: string;
  sector: Sector;
  categoria: CategoriaHabitacion;
  capacidad: CapacidadHabitacion;
  configuracion: string; // Descripción detallada
  tieneBanoPrivado: boolean;
  ultimoUsoGrupo?: string; // Para rotación de Abuela Luisa
  activa: boolean;
}

// ============================================
// MODELO DE RESERVA
// ============================================
export interface ParticipanteReserva {
  id: string;
  nombre: string;
  genero: Genero;
  edad: number;
  esInvitado: boolean;
  camaAsignada?: string;
}

export interface Invitado {
  id: string;
  nombre: string;
  genero: Genero;
  invitadoPorId?: string;
  invitadoPorNombre?: string;
  createdAt?: Date;
}

export interface Reserva {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  habitacionId: string;
  habitacionNombre: string;
  fechaShabbat: Date; // Fecha del Shabbat (viernes)
  participantes: ParticipanteReserva[];
  estado: EstadoReserva;
  prioridad: NivelPrioridad;
  fechaReserva: Date; // Cuando se hizo la reserva
  invitados: Invitado[];
  pagoId?: string;
  montoPago?: number;
  pagado: boolean;
  notas?: string;
  historialMudanzas?: MudanzaLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MudanzaLog {
  fecha: Date;
  habitacionAnterior: string;
  habitacionNueva: string;
  motivoUsuarioId: string;
  motivoUsuarioNombre: string;
}

// ============================================
// MODELO DE SEMANA
// ============================================
export interface Semana {
  id: string; // Formato: YYYY-MM-DD del viernes
  fechaShabbat: Date;
  reservasAbiertasDesde: Date; // Lunes 00:00
  reservasConfirmanHasta: Date; // Miércoles 23:59
  invitadosDesde: Date; // Miércoles 00:00
  reservas: string[]; // IDs de reservas
  minyanConfirmado: boolean;
  cantidadMinyan: number;
  estado: 'abierta' | 'confirmando' | 'cerrada';
}

// ============================================
// CONFIGURACIÓN ADMIN
// ============================================
export interface PreciosConfig {
  verdurasPorCama: number; // Precio por cama ocupada
  serviciosFijos: number; // Servicios fijos por reserva
}

export interface PersonalAsadoConfig {
  porCada: number; // Cada cuántas personas se requiere personal
  maxDisponible: number;
  costoPorPersonal: number;
}

export interface ConfigAdmin {
  id: string;
  precios: PreciosConfig;
  ipcUltimaActualizacion: Date;
  ipcPorcentaje: number;
  personalAsado: PersonalAsadoConfig;
  factorCarneKgPorPersona: number; // Para estimar carne de asado
  horaInicioReservas: string; // "00:00"
  horaFinConfirmacion: string; // "23:59"
  emailNotificaciones: string;
}

// ============================================
// MODELO DE ACTIVIDAD
// ============================================
export interface Actividad {
  id: string;
  tipo: TipoActividad;
  fechaShabbat: Date;
  fecha: Date; // Fecha exacta de la actividad
  participantes: ParticipanteActividad[];
  aprobada: boolean;
  estimacionCarne?: number; // kg para asado
  equipos?: EquipoFutbol[]; // Para fútbol
  notas?: string;
  createdAt: Date;
}

export interface ParticipanteActividad {
  usuarioId: string;
  nombre: string;
  confirmado: boolean;
}

export interface EquipoFutbol {
  nombre: string;
  jugadores: string[];
}

// ============================================
// MODELO DE PAGO (MERCADOPAGO)
// ============================================
export interface Pago {
  id: string;
  reservaId?: string;
  actividadId?: string;
  usuarioId: string;
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
  mercadoPagoId?: string;
  preferenceId?: string;
  fechaPago?: Date;
  concepto: string;
  createdAt: Date;
}

// ============================================
// MODELO DE NOTIFICACIÓN
// ============================================
export interface Notificacion {
  id: string;
  usuarioId: string;
  titulo: string;
  mensaje: string;
  tipo: 'reserva' | 'mudanza' | 'pago' | 'actividad' | 'admin' | 'recordatorio';
  leida: boolean;
  datos?: Record<string, any>;
  createdAt: Date;
}

// ============================================
// TIPOS PARA FORMULARIOS
// ============================================
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  genero: Genero;
  telefono?: string;
}

export interface ReservaFormData {
  habitacionId: string;
  fechaShabbat: Date;
  participantes: ParticipanteReserva[];
  invitados?: ParticipanteReserva[];
  notas?: string;
}

// ============================================
// TIPOS DE CONTEXTO / ESTADO GLOBAL
// ============================================
export interface AuthState {
  user: Usuario | null;
  loading: boolean;
  error: string | null;
}

export interface ReservasState {
  reservas: Reserva[];
  reservaActual: Reserva | null;
  loading: boolean;
  error: string | null;
}

export interface HabitacionesState {
  habitaciones: Habitacion[];
  loading: boolean;
  error: string | null;
}

// ============================================
// TIPOS PARA ALGORITMO DE MUDANZAS
// ============================================
export interface ConflictoReserva {
  reservaNueva: Reserva;
  reservaExistente: Reserva;
  habitacion: Habitacion;
}

export interface ResultadoMudanza {
  exitoso: boolean;
  mudanzas: MudanzaLog[];
  notificaciones: Notificacion[];
  error?: string;
}
