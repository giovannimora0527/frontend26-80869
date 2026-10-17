/**
 * Modelo que representa una anotacion de historia clinica retornada por el
 * backend.
 */
export class Anotacion {
  /** Identificador unico de la anotacion. */
  id?: number;
  /** Identificador de la historia clinica a la que pertenece. */
  historiaId?: number;
  /** Identificador del medico que registro la anotacion. */
  medicoId?: number;
  /** Nombre del veterinario (resuelto por el backend). */
  medicoNombre?: string;
  /** Fecha y hora de la anotacion. */
  fecha?: string;
  /** Descripcion de la anotacion. */
  descripcion?: string;
  /** Observacion adicional. */
  observacion?: string;
  /** Diagnostico o evolucion. */
  diagnostico?: string;
}

/**
 * Objeto de peticion (request) para crear una anotacion.
 */
export class AnotacionRequest {
  /** Identificador de la mascota (opcional si se envia historiaId). */
  mascotaId?: number;
  /** Identificador de la historia clinica (opcional si se envia mascotaId). */
  historiaId?: number;
  /** Identificador del medico. */
  medicoId?: number;
  /** Descripcion de la anotacion. */
  descripcion?: string;
  /** Observacion adicional. */
  observacion?: string;
  /** Diagnostico o evolucion. */
  diagnostico?: string;
}
