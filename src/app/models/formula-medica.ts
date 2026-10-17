import { FiltroPagina } from './page-response';

/**
 * Fila resumida del listado de fórmulas (sin dosis ni indicaciones).
 */
export interface FormulaResumen {
  /** Identificador de la fórmula. */
  id: number;
  /** Fecha de emisión (yyyy-MM-dd). */
  fechaEmision: string;
  /** Nombre de la mascota. */
  mascotaNombre: string;
  /** Nombre del cliente. */
  clienteNombre: string;
  /** Nombre del veterinario. */
  medicoNombre: string;
  /** Nombre del medicamento. */
  medicamentoNombre: string;
  /** Frecuencia de administración. */
  frecuencia: string;
  /** Duración del tratamiento en días. */
  duracionDias: number;
  /** Si la fórmula está activa. */
  activo: boolean;
}

/**
 * Detalle completo de una fórmula médica.
 */
export interface FormulaDetalle {
  /** Identificador de la fórmula. */
  id: number;
  /** Id de la cita asociada. */
  citaId: number;
  /** Fecha y hora de la cita asociada. */
  citaFechaHora: string;
  /** Id de la historia asociada (opcional). */
  historiaId?: number | null;
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
  /** Id del medicamento. */
  medicamentoId: number;
  /** Nombre del medicamento. */
  medicamentoNombre: string;
  /** Presentación del medicamento. */
  medicamentoPresentacion?: string;
  /** Fecha de emisión (yyyy-MM-dd). */
  fechaEmision: string;
  /** Dosis. */
  dosis: string;
  /** Frecuencia. */
  frecuencia: string;
  /** Duración en días. */
  duracionDias: number;
  /** Indicaciones. */
  indicaciones: string;
  /** Si la fórmula está activa. */
  activo: boolean;
  /** Fecha de creación del registro. */
  fechaCreacionRegistro: string;
  /** Fecha de la última actualización. */
  fechaActualizacionRegistro?: string | null;
}

/**
 * Datos para crear o editar una fórmula. Al editar solo se envían los campos editables.
 */
export interface FormulaRq {
  /** Cita o consulta asociada (solo al crear). */
  citaId?: number;
  /** Mascota (solo al crear; debe ser la de la cita). */
  mascotaId?: number;
  /** Veterinario que emite (solo al crear). */
  medicoId?: number;
  /** Medicamento recetado. */
  medicamentoId: number;
  /** Fecha de emisión (no anterior a la consulta). */
  fechaEmision: string;
  /** Dosis. */
  dosis: string;
  /** Frecuencia. */
  frecuencia: string;
  /** Duración en días (1 a 365). */
  duracionDias: number;
  /** Indicaciones. */
  indicaciones: string;
}

/**
 * Filtros del listado de fórmulas.
 */
export interface FormulaFiltro extends FiltroPagina {
  /** Id de la mascota. */
  mascotaId?: number;
  /** Id del cliente. */
  clienteId?: number;
  /** Id del veterinario. */
  medicoId?: number;
  /** Id del medicamento. */
  medicamentoId?: number;
  /** Activa (true) o inactiva (false). */
  activo?: boolean;
  /** Fecha de emisión inicial (yyyy-MM-dd). */
  fechaDesde?: string;
  /** Fecha de emisión final (yyyy-MM-dd). */
  fechaHasta?: string;
  /** Texto libre: medicamento o mascota. */
  texto?: string;
}
