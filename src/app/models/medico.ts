/** Veterinario que atiende citas, escribe anotaciones y emite fórmulas. */
export interface Medico {
  id: number;
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  registroProfesional?: string;
}
