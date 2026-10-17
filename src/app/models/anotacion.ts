import { FiltroPagina } from './page-response';

/**
 * Anotación de seguimiento dentro de una historia clínica.
 */
export interface Anotacion {
  /** Identificador de la anotación. */
  id: number;
  /** Historia a la que pertenece. */
  historiaId: number;
  /** Fecha y hora de la anotación. */
  fecha: string;
  /** Id del veterinario. */
  medicoId: number;
  /** Nombre del veterinario. */
  medicoNombre: string;
  /** Descripción. */
  descripcion: string;
  /** Observación. */
  observacion?: string;
  /** Diagnóstico o evolución. */
  diagnosticoEvolucion?: string;
}

/**
 * Datos para agregar una anotación a una historia existente.
 */
export interface AnotacionRq {
  /** Historia destino (debe estar ABIERTA). */
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
 * Filtros del histórico de anotaciones (requiere historiaId o mascotaId).
 */
export interface AnotacionFiltro extends FiltroPagina {
  /** Historia de la que se consultan las anotaciones. */
  historiaId?: number;
  /** Mascota de la que se consulta todo el histórico. */
  mascotaId?: number;
  /** Fecha inicial (yyyy-MM-dd). */
  fechaDesde?: string;
  /** Fecha final (yyyy-MM-dd). */
  fechaHasta?: string;
  /** Texto libre en descripción, observación o diagnóstico. */
  texto?: string;
}
