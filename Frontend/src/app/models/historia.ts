/**
 * Modelo que representa una historia clinica retornada por el backend.
 * Registra la consulta principal y mantiene relacion 1:N con las anotaciones.
 */
export class Historia {
  /** Identificador unico de la historia clinica. */
  id?: number;
  /** Identificador de la mascota (paciente) dueña de la historia. */
  pacienteId?: number;
  /** Nombre de la mascota (resuelto por el backend). */
  mascotaNombre?: string;
  /** Nombre del cliente dueño de la mascota (resuelto por el backend). */
  clienteNombre?: string;
  /** Identificador de la cita asociada. */
  citaId?: number;
  /** Identificador del veterinario. */
  medicoId?: number;
  /** Nombre del veterinario (resuelto por el backend). */
  medicoNombre?: string;
  /** Motivo de la consulta. */
  motivo?: string;
  /** Diagnostico registrado. */
  diagnostico?: string;
  /** Observaciones adicionales. */
  observaciones?: string;
  /** Estado de la historia / consulta. */
  estado?: string;
  /** Numero de anotaciones registradas. */
  totalAnotaciones?: number;
  /** Fecha de creacion de la historia. */
  fechaCreacion?: string;
}

/**
 * Objeto de peticion (request) para crear o actualizar una historia clinica.
 * Incluye los campos del punto 3.2 del enunciado.
 */
export class HistoriaRequest {
  /** Identificador de la historia (solo requerido al actualizar). */
  id?: number;
  /** Identificador del cliente (para validar pertenencia). */
  clienteId?: number;
  /** Identificador de la mascota (paciente). */
  pacienteId?: number;
  /** Identificador de la cita asociada. */
  citaId?: number;
  /** Identificador del veterinario. */
  medicoId?: number;
  /** Motivo de la consulta. */
  motivo?: string;
  /** Diagnostico registrado. */
  diagnostico?: string;
  /** Observaciones adicionales. */
  observaciones?: string;
  /** Estado de la historia / consulta. */
  estado?: string;
}
