/**
 * Modelo que representa un medico (veterinario) junto con los datos de su
 * especializacion, tal como lo retorna el endpoint
 * /medico/listar-especializaciones del backend.
 */
export class Medico {
  /** Identificador unico del medico. */
  id?: number;
  /** Nombres del medico. */
  nombres?: string;
  /** Apellidos del medico. */
  apellidos?: string;
  /** Numero de documento del medico. */
  numeroDocumento?: string;
  /** Registro profesional del medico. */
  registroProfesional?: string;
  /** Nombre de la especializacion del medico. */
  especializacionNombre?: string;
  /** Codigo de la especializacion del medico. */
  especializacionCodigo?: string;
}
