/**
 * Veterinario (en la base de datos se llama médico).
 */
export interface Medico {
  /** Identificador del veterinario. */
  id: number;
  /** Nombres. */
  nombres: string;
  /** Apellidos. */
  apellidos: string;
  /** Registro profesional. */
  registroProfesional?: string;
}
