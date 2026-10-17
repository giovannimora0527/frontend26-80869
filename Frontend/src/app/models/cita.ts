/**
 * Modelo que representa una cita medica tal como la retorna el backend
 * (identificadores planos de cliente, mascota y medico).
 */
export class Cita {
  /** Identificador unico de la cita. */
  id?: number;
  /** Identificador del cliente dueño de la mascota. */
  clienteId?: number;
  /** Identificador de la mascota citada. */
  mascotaId?: number;
  /** Identificador del medico asignado. */
  medicoId?: number;
  /** Fecha y hora de la cita. */
  fechaHora?: string;
  /** Estado de la cita (PROGRAMADA, ATENDIDA, etc.). */
  estado?: string;
  /** Motivo de la consulta. */
  motivo?: string;
}

/**
 * Objeto de peticion (request) para crear o actualizar una cita.
 */
export class CitaRequest {
  /** Identificador de la cita (solo requerido al actualizar). */
  id?: number;
  /** Identificador del cliente dueño de la mascota (para validar pertenencia). */
  clienteId?: number;
  /** Identificador de la mascota seleccionada. */
  mascotaId?: number;
  /** Identificador del medico seleccionado. */
  medicoId?: number;
  /** Fecha y hora en formato ISO (yyyy-MM-ddTHH:mm:ss). */
  fechaHora?: string;
  /** Motivo de la consulta. */
  motivo?: string;
  /** Estado de la cita. */
  estado?: string;
}
