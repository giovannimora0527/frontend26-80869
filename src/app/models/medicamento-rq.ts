/**
 * Datos que se envían al backend para crear o editar un medicamento.
 * El identificador no va aquí: en la edición viaja en la URL.
 */
export interface MedicamentoRq {
  /** Nombre del medicamento (único, sin importar mayúsculas). */
  nombre: string;
  /** Descripción o uso general; `null` si no se informa. */
  descripcion: string | null;
  /** Presentación comercial; `null` si no se informa. */
  presentacion: string | null;
  /** Fecha de compra (`AAAA-MM-DD`). */
  fechaCompra: string;
  /** Fecha de vencimiento (`AAAA-MM-DD`), posterior a la de compra. */
  fechaVence: string;
}
