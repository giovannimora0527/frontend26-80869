/**
 * Medicamento del catálogo.
 */
export interface Medicamento {
  /** Identificador del medicamento. */
  id: number;
  /** Nombre del medicamento. */
  nombre: string;
  /** Presentación (jarabe, tabletas, etc.). */
  presentacion?: string;
  /** Fecha de vencimiento (yyyy-MM-dd). */
  fechaVence?: string;
}
