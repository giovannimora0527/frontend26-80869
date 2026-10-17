import { FiltroPagina } from './page-response';

/**
 * Historia clínica (una consulta ligada a una cita atendida).
 */
export interface Historia {
  /** Identificador de la historia. */
  id: number;
  /** Id de la cita asociada (null en historias antiguas). */
  citaId?: number | null;
  /** Fecha y hora de la consulta. */
  fechaConsulta: string;
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
  motivo: string;
  /** Diagnóstico. */
  diagnostico?: string;
  /** Observaciones. */
  observaciones?: string;
  /** Estado: ABIERTA o CERRADA. */
  estado: 'ABIERTA' | 'CERRADA';
}

/**
 * Datos para registrar una historia clínica.
 */
export interface HistoriaRq {
  /** Cliente (se valida contra el dueño de la mascota). */
  clienteId: number;
  /** Mascota atendida. */
  mascotaId: number;
  /** Cita atendida que origina la historia. */
  citaId: number;
  /** Veterinario que atendió. */
  medicoId: number;
  /** Motivo de consulta. */
  motivo: string;
  /** Diagnóstico. */
  diagnostico: string;
  /** Observaciones (opcional). */
  observaciones?: string;
}

/**
 * Filtros del listado de historias clínicas.
 */
export interface HistoriaFiltro extends FiltroPagina {
  /** Id de la mascota. */
  mascotaId?: number;
  /** Id del cliente. */
  clienteId?: number;
  /** Id del veterinario. */
  medicoId?: number;
  /** Estado (ABIERTA o CERRADA). */
  estado?: string;
  /** Fecha inicial (yyyy-MM-dd). */
  fechaDesde?: string;
  /** Fecha final (yyyy-MM-dd). */
  fechaHasta?: string;
  /** Texto libre: motivo, mascota o cliente. */
  texto?: string;
}
