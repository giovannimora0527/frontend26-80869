/**
 * Modelo que representa una formula medica (receta) retornada por el backend.
 */
export class Formula {
  /** Identificador unico de la formula. */
  id?: number;
  /** Identificador de la cita (consulta) asociada. */
  citaId?: number;
  /** Identificador del medicamento recetado. */
  medicamentoId?: number;
  /** Nombre del medicamento (resuelto por el backend). */
  medicamentoNombre?: string;
  /** Nombre de la mascota asociada a la cita (resuelto por el backend). */
  mascotaNombre?: string;
  /** Dosis indicada. */
  dosis?: string;
  /** Frecuencia de administracion. */
  frecuencia?: string;
  /** Duracion del tratamiento. */
  duracion?: string;
  /** Indicaciones del tratamiento. */
  indicaciones?: string;
  /** Indica si la formula esta activa. */
  activo?: boolean;
  /** Fecha de emision / creacion del registro. */
  fechaCreacionRegistro?: string;
  /** Fecha de la ultima actualizacion. */
  fechaActualizacionRegistro?: string;
}

/**
 * Objeto de peticion (request) para crear o actualizar una formula medica.
 */
export class FormulaRequest {
  /** Identificador de la formula (solo requerido al actualizar). */
  id?: number;
  /** Identificador de la cita asociada. */
  citaId?: number;
  /** Identificador del medicamento. */
  medicamentoId?: number;
  /** Dosis indicada. */
  dosis?: string;
  /** Frecuencia de administracion. */
  frecuencia?: string;
  /** Duracion del tratamiento. */
  duracion?: string;
  /** Indicaciones del tratamiento. */
  indicaciones?: string;
  /** Fecha de emision en formato ISO. */
  fechaEmision?: string;
}
