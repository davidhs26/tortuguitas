import { Sector, NivelPrioridad, Genero } from '@/types';

// Estructura del árbol familiar para Tortuguitas
// Nivel 1: Socios (Abuelos/Fundadores)
// Nivel 2: Hijos de socios
// Nivel 3: Nietos (hijos de nivel 2)
// Nivel 4+: Bisnietos y siguientes (mismo nivel 3 para reservas)

export interface MiembroFamilia {
  nombre: string;
  genero: Genero;
  sector: Sector;
  nivel: NivelPrioridad;
  padre?: string; // Nombre del padre/madre para referencia
  conyuge?: string;
  hijos?: string[];
}

// ============================================
// SECTOR DAVID (Abuelo David y Berta)
// ============================================

export const FAMILIA_DAVID: MiembroFamilia[] = [
  // Nivel 1 - Socios fundadores
  { nombre: 'David (Abuelo)', genero: 'varon', sector: 'david', nivel: 1, conyuge: 'Berta (Abuela)' },
  { nombre: 'Berta (Abuela)', genero: 'mujer', sector: 'david', nivel: 1, conyuge: 'David (Abuelo)' },

  // Nivel 2 - Hijos de David y Berta
  { nombre: 'Shaul', genero: 'varon', sector: 'david', nivel: 2, padre: 'David (Abuelo)', conyuge: 'Denise' },
  { nombre: 'Denise', genero: 'mujer', sector: 'david', nivel: 2, conyuge: 'Shaul' },
  { nombre: 'Ariel', genero: 'varon', sector: 'david', nivel: 2, padre: 'David (Abuelo)', conyuge: 'Miriam' },
  { nombre: 'Miriam', genero: 'mujer', sector: 'david', nivel: 2, conyuge: 'Ariel' },
  { nombre: 'Ale', genero: 'varon', sector: 'david', nivel: 2, padre: 'David (Abuelo)', conyuge: 'Mijal' },
  { nombre: 'Mijal', genero: 'mujer', sector: 'david', nivel: 2, conyuge: 'Ale' },
  { nombre: 'Aurora', genero: 'mujer', sector: 'david', nivel: 2, padre: 'David (Abuelo)', conyuge: 'Ramon' },
  { nombre: 'Ramon (Aurora)', genero: 'varon', sector: 'david', nivel: 2, conyuge: 'Aurora' },
  { nombre: 'Josi', genero: 'varon', sector: 'david', nivel: 2, padre: 'David (Abuelo)', conyuge: 'Eliana' },
  { nombre: 'Eliana', genero: 'mujer', sector: 'david', nivel: 2, conyuge: 'Josi' },

  // Nivel 3 - Nietos (Hijos de Shaul y Denise)
  { nombre: 'David (hijo Shaul)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Shaul', conyuge: 'Shirly' },
  { nombre: 'Shirly', genero: 'mujer', sector: 'david', nivel: 3, conyuge: 'David (hijo Shaul)' },
  { nombre: 'Ioni', genero: 'varon', sector: 'david', nivel: 3, padre: 'Shaul', conyuge: 'Tami' },
  { nombre: 'Tami', genero: 'mujer', sector: 'david', nivel: 3, conyuge: 'Ioni' },
  { nombre: 'Iosef (hijo Shaul)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Shaul', conyuge: 'Lara' },
  { nombre: 'Lara', genero: 'mujer', sector: 'david', nivel: 3, conyuge: 'Iosef (hijo Shaul)' },
  { nombre: 'Natan', genero: 'varon', sector: 'david', nivel: 3, padre: 'Shaul', conyuge: 'Berta (Natan)' },
  { nombre: 'Berta (Natan)', genero: 'mujer', sector: 'david', nivel: 3, conyuge: 'Natan' },
  { nombre: 'Rut', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Shaul', conyuge: 'Echu' },
  { nombre: 'Echu', genero: 'varon', sector: 'david', nivel: 3, conyuge: 'Rut' },

  // Nivel 3 - Nietos (Hijos de Ariel y Miriam)
  { nombre: 'Berta (hija Ariel)', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Ariel', conyuge: 'Abru' },
  { nombre: 'Abru', genero: 'varon', sector: 'david', nivel: 3, conyuge: 'Berta (hija Ariel)' },
  { nombre: 'Rami', genero: 'varon', sector: 'david', nivel: 3, padre: 'Ariel', conyuge: 'Gueu' },
  { nombre: 'Gueu', genero: 'mujer', sector: 'david', nivel: 3, conyuge: 'Rami' },
  { nombre: 'David el Colo', genero: 'varon', sector: 'david', nivel: 3, padre: 'Ariel', conyuge: 'Sheindel' },
  { nombre: 'Sheindel', genero: 'mujer', sector: 'david', nivel: 3, conyuge: 'David el Colo' },
  { nombre: 'Debo', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Ariel', conyuge: 'Moshe (Debo)' },
  { nombre: 'Moshe (Debo)', genero: 'varon', sector: 'david', nivel: 3, conyuge: 'Debo' },
  { nombre: 'Gabru', genero: 'varon', sector: 'david', nivel: 3, padre: 'Ariel' },
  { nombre: 'Itzjak', genero: 'varon', sector: 'david', nivel: 3, padre: 'Ariel' },
  { nombre: 'Shaul (hijo Ariel)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Ariel' },
  { nombre: 'Tehila', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Ariel' },

  // Nivel 3 - Nietos (Hijos de Ale y Mijal)
  { nombre: 'David (hijo Ale)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Ale' },
  { nombre: 'Iosef (hijo Ale)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Ale' },
  { nombre: 'Berta (hija Ale)', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Ale' },
  { nombre: 'Shulamit', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Ale' },
  { nombre: 'Shaul Menajem', genero: 'varon', sector: 'david', nivel: 3, padre: 'Ale' },

  // Nivel 3 - Nietos (Hijos de Aurora y Ramon)
  { nombre: 'Rafi', genero: 'varon', sector: 'david', nivel: 3, padre: 'Aurora', conyuge: 'Sara (Rafi)' },
  { nombre: 'Sara (Rafi)', genero: 'mujer', sector: 'david', nivel: 3, conyuge: 'Rafi' },
  { nombre: 'David Eliahu', genero: 'varon', sector: 'david', nivel: 3, padre: 'Aurora' },
  { nombre: 'Gabriel', genero: 'varon', sector: 'david', nivel: 3, padre: 'Aurora', conyuge: 'Sara (Gabriel)' },
  { nombre: 'Sara (Gabriel)', genero: 'mujer', sector: 'david', nivel: 3, conyuge: 'Gabriel' },
  { nombre: 'Berta Bitia', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Aurora' },
  { nombre: 'Shaul (hijo Aurora)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Aurora' },
  { nombre: 'Nisim (hijo Aurora)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Aurora' },

  // Nivel 3 - Nietos (Hijos de Josi y Eliana)
  { nombre: 'Berta Simja', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Josi' },
  { nombre: 'Sara Luisa', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Josi' },
  { nombre: 'David Israel', genero: 'varon', sector: 'david', nivel: 3, padre: 'Josi' },
  { nombre: 'Ribka Iehudit', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Josi' },
  { nombre: 'Moshe Jaim', genero: 'varon', sector: 'david', nivel: 3, padre: 'Josi' },

  // Bisnietos (se registran como nivel 3 para simplicidad del sistema de reservas)
  // Hijos de David y Shirly
  { nombre: 'Denise Hodaia', genero: 'mujer', sector: 'david', nivel: 3, padre: 'David (hijo Shaul)' },
  { nombre: 'Shaul Moshe', genero: 'varon', sector: 'david', nivel: 3, padre: 'David (hijo Shaul)' },
  { nombre: 'Nisim (bisnieto)', genero: 'varon', sector: 'david', nivel: 3, padre: 'David (hijo Shaul)' },
  { nombre: 'Iosef Jaim', genero: 'varon', sector: 'david', nivel: 3, padre: 'David (hijo Shaul)' },
  // Hijo de Ioni y Tami
  { nombre: 'Shaul (hijo Ioni)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Ioni' },
  // Hijo de Natan y Berta
  { nombre: 'Ramon (hijo Natan)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Natan' },
  // Hija de Rut y Echu
  { nombre: 'Sara Denise', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Rut' },
  // Hijos de Berta y Abru
  { nombre: 'Esther (hija Berta)', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Berta (hija Ariel)' },
  { nombre: 'Isaac Alejandro', genero: 'varon', sector: 'david', nivel: 3, padre: 'Berta (hija Ariel)' },
  { nombre: 'Miriam (hija Berta)', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Berta (hija Ariel)' },
  { nombre: 'Ariel Vidal', genero: 'varon', sector: 'david', nivel: 3, padre: 'Berta (hija Ariel)' },
  // Hijos de Rami y Gueu
  { nombre: 'Abraham (hijo Rami)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Rami' },
  { nombre: 'Ariel (hijo Rami)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Rami' },
  { nombre: 'David Hillel', genero: 'varon', sector: 'david', nivel: 3, padre: 'Rami' },
  // Hijo de David el Colo
  { nombre: 'Ariel (hijo Colo)', genero: 'varon', sector: 'david', nivel: 3, padre: 'David el Colo' },
  // Hijos de Debo y Moshe
  { nombre: 'Lusita', genero: 'mujer', sector: 'david', nivel: 3, padre: 'Debo' },
  { nombre: 'Ariel (hijo Debo)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Debo' },
  // Hijo de Rafi
  { nombre: 'Ramon (hijo Rafi)', genero: 'varon', sector: 'david', nivel: 3, padre: 'Rafi' },
];

// ============================================
// SECTOR MUMI (Mumi y Flori)
// ============================================

export const FAMILIA_MUMI: MiembroFamilia[] = [
  // Nivel 1 - Socios fundadores
  { nombre: 'Mumi', genero: 'varon', sector: 'mumi', nivel: 1, conyuge: 'Flori' },
  { nombre: 'Flori', genero: 'mujer', sector: 'mumi', nivel: 1, conyuge: 'Mumi' },

  // Nivel 2 - Hijos de Mumi y Flori
  { nombre: 'Lisa', genero: 'mujer', sector: 'mumi', nivel: 2, padre: 'Mumi', conyuge: 'Ariel (Lisa)' },
  { nombre: 'Ariel (Lisa)', genero: 'varon', sector: 'mumi', nivel: 2, conyuge: 'Lisa' },
  { nombre: 'Saul (hijo Mumi)', genero: 'varon', sector: 'mumi', nivel: 2, padre: 'Mumi', conyuge: 'Ariela' },
  { nombre: 'Ariela', genero: 'mujer', sector: 'mumi', nivel: 2, conyuge: 'Saul (hijo Mumi)' },
  { nombre: 'Ramon (hijo Mumi)', genero: 'varon', sector: 'mumi', nivel: 2, padre: 'Mumi', conyuge: 'Deborah' },
  { nombre: 'Deborah', genero: 'mujer', sector: 'mumi', nivel: 2, conyuge: 'Ramon (hijo Mumi)' },
  { nombre: 'Hillel (hijo Mumi)', genero: 'varon', sector: 'mumi', nivel: 2, padre: 'Mumi', conyuge: 'Silvana' },
  { nombre: 'Silvana', genero: 'mujer', sector: 'mumi', nivel: 2, conyuge: 'Hillel (hijo Mumi)' },
  { nombre: 'Ezequiel', genero: 'varon', sector: 'mumi', nivel: 2, padre: 'Mumi', conyuge: 'Karina' },
  { nombre: 'Karina', genero: 'mujer', sector: 'mumi', nivel: 2, conyuge: 'Ezequiel' },

  // Nivel 3 - Nietos (Hijos de Saul y Ariela)
  { nombre: 'Isru (hijo Saul)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Saul (hijo Mumi)', conyuge: 'Magui' },
  { nombre: 'Magui', genero: 'mujer', sector: 'mumi', nivel: 3, conyuge: 'Isru (hijo Saul)' },
  { nombre: 'Flor (hija Saul)', genero: 'mujer', sector: 'mumi', nivel: 3, padre: 'Saul (hijo Mumi)' },
  { nombre: 'Lea (hija Saul)', genero: 'mujer', sector: 'mumi', nivel: 3, padre: 'Saul (hijo Mumi)' },
  { nombre: 'Iosef (hijo Saul)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Saul (hijo Mumi)' },
  { nombre: 'David (hijo Saul Mumi)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Saul (hijo Mumi)' },

  // Nivel 3 - Nietos (Hijos de Ramon y Deborah)
  { nombre: 'Moshe (hijo Ramon)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Ramon (hijo Mumi)' },
  { nombre: 'Israel', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Ramon (hijo Mumi)' },
  { nombre: 'Flor Shira', genero: 'mujer', sector: 'mumi', nivel: 3, padre: 'Ramon (hijo Mumi)' },
  { nombre: 'Talia', genero: 'mujer', sector: 'mumi', nivel: 3, padre: 'Ramon (hijo Mumi)' },
  { nombre: 'David (hijo Ramon)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Ramon (hijo Mumi)' },
  { nombre: 'Natan (hijo Ramon)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Ramon (hijo Mumi)' },
  { nombre: 'Tamar', genero: 'mujer', sector: 'mumi', nivel: 3, padre: 'Ramon (hijo Mumi)' },

  // Nivel 3 - Nietos (Hijos de Hillel y Silvana)
  { nombre: 'Jaim (hijo Hillel)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Hillel (hijo Mumi)' },
  { nombre: 'Lea (hija Hillel)', genero: 'mujer', sector: 'mumi', nivel: 3, padre: 'Hillel (hijo Mumi)' },
  { nombre: 'Isru (hijo Hillel)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Hillel (hijo Mumi)' },
  { nombre: 'Abraham (hijo Hillel)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Hillel (hijo Mumi)' },
  { nombre: 'Flor Sara', genero: 'mujer', sector: 'mumi', nivel: 3, padre: 'Hillel (hijo Mumi)' },

  // Nivel 3 - Nietos (Hijos de Ezequiel y Karina)
  { nombre: 'Sari', genero: 'mujer', sector: 'mumi', nivel: 3, padre: 'Ezequiel', conyuge: 'Iair (Sari)' },
  { nombre: 'Iair (Sari)', genero: 'varon', sector: 'mumi', nivel: 3, conyuge: 'Sari' },
  { nombre: 'David (hijo Ezequiel)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Ezequiel' },
  { nombre: 'Isru (hijo Ezequiel)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Ezequiel' },
  { nombre: 'Iosef (hijo Ezequiel)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Ezequiel' },
  { nombre: 'Iair (hijo Ezequiel)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Ezequiel' },
  { nombre: 'Nisim (hijo Ezequiel)', genero: 'varon', sector: 'mumi', nivel: 3, padre: 'Ezequiel' },
];

// ============================================
// SECTOR TUNI
// ============================================

export const FAMILIA_TUNI: MiembroFamilia[] = [
  // Nivel 1 - Socio fundador
  { nombre: 'Tuni', genero: 'mujer', sector: 'tuni', nivel: 1 },

  // Nivel 2 - Hijos de Tuni
  { nombre: 'Esther (hija Tuni)', genero: 'mujer', sector: 'tuni', nivel: 2, padre: 'Tuni', conyuge: 'Alejandro' },
  { nombre: 'Alejandro', genero: 'varon', sector: 'tuni', nivel: 2, conyuge: 'Esther (hija Tuni)' },
  { nombre: 'Luisa', genero: 'mujer', sector: 'tuni', nivel: 2, padre: 'Tuni', conyuge: 'Jimmy' },
  { nombre: 'Jimmy', genero: 'varon', sector: 'tuni', nivel: 2, conyuge: 'Luisa' },
  { nombre: 'Saul Elias', genero: 'varon', sector: 'tuni', nivel: 2, padre: 'Tuni' },

  // Nivel 3 - Nietos (Hijos de Esther y Alejandro)
  { nombre: 'Aliza', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Esther (hija Tuni)', conyuge: 'Ezequiel (Aliza)' },
  { nombre: 'Ezequiel (Aliza)', genero: 'varon', sector: 'tuni', nivel: 3, conyuge: 'Aliza' },
  { nombre: 'David Sacca', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Esther (hija Tuni)' },
  { nombre: 'Shelo (hijo Esther)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Esther (hija Tuni)', conyuge: 'Michelle' },
  { nombre: 'Michelle', genero: 'mujer', sector: 'tuni', nivel: 3, conyuge: 'Shelo (hijo Esther)' },
  { nombre: 'Hillel (hijo Esther)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Esther (hija Tuni)', conyuge: 'Tati' },
  { nombre: 'Tati', genero: 'mujer', sector: 'tuni', nivel: 3, conyuge: 'Hillel (hijo Esther)' },

  // Nivel 3 - Nietos (Hijos de Luisa y Jimmy)
  { nombre: 'Nisim (hijo Luisa)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Luisa', conyuge: 'Yael' },
  { nombre: 'Yael', genero: 'mujer', sector: 'tuni', nivel: 3, conyuge: 'Nisim (hijo Luisa)' },
  { nombre: 'Shelo (hijo Luisa)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Luisa', conyuge: 'Nati' },
  { nombre: 'Nati', genero: 'mujer', sector: 'tuni', nivel: 3, conyuge: 'Shelo (hijo Luisa)' },
  { nombre: 'Esther (hija Luisa)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Luisa', conyuge: 'Edu' },
  { nombre: 'Edu', genero: 'varon', sector: 'tuni', nivel: 3, conyuge: 'Esther (hija Luisa)' },
  { nombre: 'David (hijo Luisa)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Luisa' },
  { nombre: 'Fortu (hija Luisa)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Luisa' },

  // Nivel 3 - Nietos (Hijos de Saul Elias)
  { nombre: 'Salo', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Saul Elias', conyuge: 'Juli' },
  { nombre: 'Juli', genero: 'mujer', sector: 'tuni', nivel: 3, conyuge: 'Salo' },
  { nombre: 'David (hijo Saul Elias)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Saul Elias' },
  { nombre: 'Fortu (hija Saul Elias)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Saul Elias' },

  // Bisnietos (Hijos de Aliza y Ezequiel)
  { nombre: 'David (hijo Aliza)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Aliza' },
  { nombre: 'Elena', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Aliza' },
  { nombre: 'Esther (hija Aliza)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Aliza' },
  { nombre: 'Fortu (hija Aliza)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Aliza' },
  { nombre: 'Sara (hija Aliza)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Aliza' },
  { nombre: 'Miriam (hija Aliza)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Aliza' },
  { nombre: 'Isaac (hijo Aliza)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Aliza' },
  { nombre: 'Yael (hija Aliza)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Aliza' },

  // Bisnietos (Hijos de David Sacca)
  { nombre: 'Rafaela', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'David Sacca' },
  { nombre: 'Rebeca', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'David Sacca' },

  // Bisnietos (Hijos de Shelo y Michelle)
  { nombre: 'Esther (hija Shelo)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Shelo (hijo Esther)' },
  { nombre: 'Isaac (hijo Shelo)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Shelo (hijo Esther)' },
  { nombre: 'Moshe (hijo Shelo)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Shelo (hijo Esther)' },
  { nombre: 'Shaul Mena', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Shelo (hijo Esther)' },
  { nombre: 'Abraham (hijo Shelo)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Shelo (hijo Esther)' },
  { nombre: 'Roxana', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Shelo (hijo Esther)' },

  // Bisnietos (Hijos de Hillel y Tati)
  { nombre: 'Isaac (hijo Hillel Tuni)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Hillel (hijo Esther)' },
  { nombre: 'Esther (hija Hillel)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Hillel (hijo Esther)' },
  { nombre: 'Horacio', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Hillel (hijo Esther)' },

  // Bisnietos (Hijos de Nisim y Yael)
  { nombre: 'Jaim (hijo Nisim)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Nisim (hijo Luisa)' },
  { nombre: 'Luisa (hija Nisim)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Nisim (hijo Luisa)' },
  { nombre: 'Iair (hijo Nisim)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Nisim (hijo Luisa)' },

  // Bisnietos (Hijos de Shelo y Nati - Luisa)
  { nombre: 'Jaim (hijo Shelo Luisa)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Shelo (hijo Luisa)' },
  { nombre: 'Iakov', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Shelo (hijo Luisa)' },
  { nombre: 'Sara (hija Shelo Luisa)', genero: 'mujer', sector: 'tuni', nivel: 3, padre: 'Shelo (hijo Luisa)' },

  // Bisnietos (Hijos de Esther y Edu)
  { nombre: 'Rajamim', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Esther (hija Luisa)' },
  { nombre: 'Jaim (hijo Esther Luisa)', genero: 'varon', sector: 'tuni', nivel: 3, padre: 'Esther (hija Luisa)' },
];

// ============================================
// TODA LA FAMILIA COMBINADA
// ============================================

export const TODA_LA_FAMILIA: MiembroFamilia[] = [
  ...FAMILIA_DAVID,
  ...FAMILIA_MUMI,
  ...FAMILIA_TUNI,
];

// ============================================
// HELPERS
// ============================================

// Obtener todos los miembros de un sector
export function getMiembrosPorSector(sector: Sector): MiembroFamilia[] {
  return TODA_LA_FAMILIA.filter(m => m.sector === sector);
}

// Obtener todos los socios (nivel 1)
export function getSocios(): MiembroFamilia[] {
  return TODA_LA_FAMILIA.filter(m => m.nivel === 1);
}

// Obtener hijos de un miembro
export function getHijos(nombrePadre: string): MiembroFamilia[] {
  return TODA_LA_FAMILIA.filter(m => m.padre === nombrePadre);
}

// Contar varones mayores para minyan (solo nombres, sin fechas de nacimiento aquí)
export function getVaronesPorSector(sector: Sector): MiembroFamilia[] {
  return TODA_LA_FAMILIA.filter(m => m.sector === sector && m.genero === 'varon');
}

// Buscar miembro por nombre
export function buscarMiembro(nombre: string): MiembroFamilia | undefined {
  return TODA_LA_FAMILIA.find(
    m => m.nombre.toLowerCase().includes(nombre.toLowerCase())
  );
}

// Obtener estadísticas de la familia
export function getEstadisticasFamilia(): {
  total: number;
  porSector: Record<Sector, number>;
  porNivel: Record<number, number>;
  varones: number;
  mujeres: number;
} {
  const porSector: Record<string, number> = { david: 0, mumi: 0, tuni: 0, quincho: 0, libre: 0 };
  const porNivel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  let varones = 0;
  let mujeres = 0;

  for (const m of TODA_LA_FAMILIA) {
    porSector[m.sector]++;
    porNivel[m.nivel]++;
    if (m.genero === 'varon') varones++;
    else mujeres++;
  }

  return {
    total: TODA_LA_FAMILIA.length,
    porSector: porSector as Record<Sector, number>,
    porNivel,
    varones,
    mujeres,
  };
}

// Descripción de niveles de prioridad
export const NIVEL_DESCRIPCION: Record<NivelPrioridad, string> = {
  1: 'Socio Fundador',
  2: 'Hijo/a de Socio',
  3: 'Nieto/a o posterior',
};

// Colores por sector
export const SECTOR_COLORES: Record<Sector, string> = {
  david: '#3B82F6', // Azul
  mumi: '#10B981',  // Verde
  tuni: '#F59E0B',  // Naranja
  quincho: '#8B5CF6', // Violeta
  libre: '#EC4899',  // Rosa
};

console.log('Estadísticas de la familia:', getEstadisticasFamilia());
