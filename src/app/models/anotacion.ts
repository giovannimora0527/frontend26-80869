import { FiltroPagina } from './page-response';

/**
 * Anotación de seguimiento dentro de una historia clínica (`AnotacionRs`).
 * Las anotaciones son inmutables: solo se agregan, no se editan.
 */
export interface Anotacion {
  /** Identificador de la anotación. */
  id: number;
  /** Historia a la que pertenece. */
  historiaId: number;
  /** Id del veterinario. */
  medicoId: number;
  /** Nombre del veterinario. */
  medicoNombre: string;
  /** Fecha y hora de la anotación (ISO). */
  fecha: string;
  /** Descripción de lo ocurrido. */
  descripcion: string;
  /** Observación del veterinario. */
  observacion?: string | null;
  /** Diagnóstico o evolución del paciente. */
  diagnosticoEvolucion?: string | null;
}

/**
 * Datos para agregar una anotación a una historia existente (`AnotacionHistoriaRq`).
 * Los cinco campos son obligatorios.
 */
export interface AnotacionRq {
  /** Historia destino (debe estar ACTIVA). */
  historiaId: number;
  /** Veterinario que escribe. */
  medicoId: number;
  /** Descripción. */
  descripcion: string;
  /** Observación. */
  observacion: string;
  /** Diagnóstico o evolución. */
  diagnosticoEvolucion: string;
}

/**
 * Filtros del histórico de anotaciones de una historia (`AnotacionFiltroRq`).
 * La historia va en la URL (`/anotaciones/historia/{id}`), no como parámetro.
 * Alias de orden válidos: id, fecha, medico.
 */
export interface AnotacionFiltro extends FiltroPagina {
  /** Id del veterinario autor. */
  medicoId?: number;
  /** Fecha inicial (yyyy-MM-dd). */
  fechaDesde?: string;
  /** Fecha final (yyyy-MM-dd). */
  fechaHasta?: string;
  /** Texto libre en descripción, observación o diagnóstico. */
  texto?: string;
}
