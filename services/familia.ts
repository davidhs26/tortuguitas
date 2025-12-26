import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Usuario, Sector, NivelPrioridad } from '@/types';
import { TODA_LA_FAMILIA, MiembroFamilia, buscarMiembro } from '@/data/familia';

// Buscar información familiar por nombre
export function buscarInfoFamiliar(nombre: string, apellido?: string): MiembroFamilia | null {
  const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;

  // Buscar coincidencia exacta primero
  let miembro = TODA_LA_FAMILIA.find(
    m => m.nombre.toLowerCase() === nombreCompleto.toLowerCase()
  );

  if (miembro) return miembro;

  // Buscar por nombre solo
  miembro = TODA_LA_FAMILIA.find(
    m => m.nombre.toLowerCase().includes(nombre.toLowerCase())
  );

  return miembro || null;
}

// Determinar sector y prioridad basado en nombre
export function determinarSectorYPrioridad(nombre: string): {
  sector: Sector;
  nivel: NivelPrioridad;
} {
  const miembro = buscarInfoFamiliar(nombre);

  if (miembro) {
    return {
      sector: miembro.sector,
      nivel: miembro.nivel,
    };
  }

  // Por defecto, asignar como invitado/nuevo (nivel 3, libre)
  return {
    sector: 'libre',
    nivel: 3,
  };
}

// Validar si un usuario puede reservar en un sector
export function puedeReservarEnSector(
  usuarioSector: Sector,
  habitacionSector: Sector
): boolean {
  // Todos pueden reservar en quincho y libre
  if (habitacionSector === 'quincho' || habitacionSector === 'libre') {
    return true;
  }

  // Solo miembros del sector pueden reservar en su sector
  return usuarioSector === habitacionSector;
}

// Obtener familia extendida de un miembro (para agregar a reservas)
export function getFamiliaExtendida(nombreMiembro: string): MiembroFamilia[] {
  const miembro = buscarInfoFamiliar(nombreMiembro);
  if (!miembro) return [];

  const familia: MiembroFamilia[] = [miembro];

  // Agregar cónyuge si existe
  if (miembro.conyuge) {
    const conyuge = buscarInfoFamiliar(miembro.conyuge);
    if (conyuge) familia.push(conyuge);
  }

  // Agregar hijos
  const hijos = TODA_LA_FAMILIA.filter(m => m.padre === miembro.nombre);
  familia.push(...hijos);

  return familia;
}

// Sugerir miembros de la familia para autocompletado
export function sugerirMiembros(
  query: string,
  sector?: Sector,
  limit: number = 10
): MiembroFamilia[] {
  let resultados = TODA_LA_FAMILIA.filter(m =>
    m.nombre.toLowerCase().includes(query.toLowerCase())
  );

  if (sector) {
    resultados = resultados.filter(m => m.sector === sector);
  }

  return resultados.slice(0, limit);
}

// Actualizar sector y prioridad de usuario basado en datos familiares
export async function sincronizarDatosFamiliares(
  usuarioId: string,
  nombre: string
): Promise<{ sector: Sector; nivel: NivelPrioridad } | null> {
  const info = determinarSectorYPrioridad(nombre);

  if (info.sector !== 'libre') {
    // Actualizar en Firestore
    await setDoc(
      doc(db, 'users', usuarioId),
      {
        grupoFamiliar: info.sector,
        prioridadNivel: info.nivel,
      },
      { merge: true }
    );

    return info;
  }

  return null;
}

// Crear datos iniciales de administradores (socios)
export async function crearAdministradoresIniciales(): Promise<void> {
  const socios = TODA_LA_FAMILIA.filter(m => m.nivel === 1);

  console.log(`Creando ${socios.length} administradores (socios)...`);

  // Nota: Los usuarios deben registrarse manualmente, pero podemos
  // configurar una lista de emails de administradores para reconocerlos
  const adminsConfig = {
    socios: socios.map(s => s.nombre),
    emailsAdmin: [
      // Agregar emails de administradores aquí
      // 'admin@tortuguitas.com'
    ],
  };

  await setDoc(doc(db, 'config', 'admins'), adminsConfig);
}

// Verificar si un email corresponde a un administrador
export async function esEmailAdmin(email: string): Promise<boolean> {
  try {
    const configDoc = await getDocs(
      query(collection(db, 'config'), where('emailsAdmin', 'array-contains', email))
    );
    return !configDoc.empty;
  } catch {
    return false;
  }
}

// Generar reporte de la familia
export function generarReporteFamilia(): string {
  const stats = {
    david: TODA_LA_FAMILIA.filter(m => m.sector === 'david'),
    mumi: TODA_LA_FAMILIA.filter(m => m.sector === 'mumi'),
    tuni: TODA_LA_FAMILIA.filter(m => m.sector === 'tuni'),
  };

  let reporte = '=== REPORTE FAMILIAR TORTUGUITAS ===\n\n';

  for (const [sector, miembros] of Object.entries(stats)) {
    const socios = miembros.filter(m => m.nivel === 1);
    const hijos = miembros.filter(m => m.nivel === 2);
    const nietos = miembros.filter(m => m.nivel === 3);
    const varones = miembros.filter(m => m.genero === 'varon');

    reporte += `SECTOR ${sector.toUpperCase()}\n`;
    reporte += `  Total: ${miembros.length} miembros\n`;
    reporte += `  Socios: ${socios.length}\n`;
    reporte += `  Hijos: ${hijos.length}\n`;
    reporte += `  Nietos+: ${nietos.length}\n`;
    reporte += `  Varones (para minyan): ${varones.length}\n\n`;
  }

  const totalVarones = TODA_LA_FAMILIA.filter(m => m.genero === 'varon').length;
  reporte += `TOTAL GENERAL: ${TODA_LA_FAMILIA.length} miembros\n`;
  reporte += `TOTAL VARONES: ${totalVarones}\n`;

  return reporte;
}
