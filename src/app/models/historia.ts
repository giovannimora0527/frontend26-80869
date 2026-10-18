import { FiltroPagina } from './page-response';

/** Estados de una historia clínica (igual que `EstadoHistoria` del backend y la columna `estado` de la BD). */
export type EstadoHistoria = 'ACTIVA' | 'CERRADA';

/**
 * Fila del listado de historias clínicas (`HistoriaResumenRs`).
 */
export interface HistoriaResumen {
  /** Identificador de la historia. */
  id: number;
  /** Fecha y hora de la consulta (ISO). */
  fechaHora: string;
  /** Id de la mascota. */
  mascotaId: number;
  /** Nombre de la mascota. */
  mascotaNombre: string;
  /** Id del cliente. */
  clienteId: number;
  /** Nombre del cliente. */
  clienteNombre: string;
  /** Id del veterinario. */
  medicoId: number;
  /** Nombre del veterinario. */
  medicoNombre: string;
  /** Motivo de consulta. */
  motivoConsulta: string;
  /** Estado de la historia. */
  estado: EstadoHistoria;
  /** Id de la cita que originó la historia. */
  citaId: number;
}

/**
 * Detalle completo de una historia clínica (`HistoriaDetalleRs`).
 */
export interface HistoriaDetalle extends HistoriaResumen {
  /** Diagnóstico emitido. */
  diagnostico: string;
  /** Observaciones o recomendaciones. */
  observaciones?: string | null;
  /** Fecha de creación del registro clínico (ISO). */
  fechaCreacion?: string;
  /** Cantidad de anotaciones registradas. */
  totalAnotaciones: number;
}

/**
 * Datos para registrar una historia clínica (`HistoriaMedicaRq`).
 */
export interface HistoriaRq {
  /** Cliente (el backend valida que sea el dueño de la mascota). */
  clienteId: number;
  /** Mascota atendida. */
  mascotaId: number;
  /** Cita atendida que origina la historia (debe estar ATENDIDA y no tener historia). */
  citaId: number;
  /** Veterinario que atendió. */
  medicoId: number;
  /** Fecha y hora de la consulta en ISO local (no puede ser futura). */
  fechaHora: string;
  /** Motivo de consulta. */
  motivoConsulta: string;
  /** Diagnóstico. */
  diagnostico: string;
  /** Observaciones (opcional). */
  observaciones?: string;
}

/**
 * Filtros del listado de historias clínicas (`HistoriaFiltroRq`).
 * Alias de orden válidos: id, fechaHora, fecha, mascota, cliente, medico, motivoConsulta, estado.
 */
export interface HistoriaFiltro extends FiltroPagina {
  /** Id de la mascota. */
  mascotaId?: number;
  /** Id del cliente. */
  clienteId?: number;
  /** Id del veterinario. */
  medicoId?: number;
  /** Estado (ACTIVA o CERRADA). */
  estado?: string;
  /** Fecha inicial (yyyy-MM-dd). */
  fechaDesde?: string;
  /** Fecha final (yyyy-MM-dd). */
  fechaHasta?: string;
  /** Texto libre: motivo, mascota o cliente. */
  texto?: string;
}
