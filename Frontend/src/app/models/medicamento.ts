/**
 * Modelo que representa un medicamento del inventario de la clinica.
 */
export class Medicamento {
  /** Identificador unico del medicamento. */
  id?: number;
  /** Nombre comercial del medicamento. */
  nombre?: string;
  /** Descripcion del medicamento. */
  descripcion?: string;
  /** Presentacion (tabletas, solucion, etc.). */
  presentacion?: string;
}
