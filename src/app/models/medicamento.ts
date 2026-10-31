/**
 * Medicamento de la clínica, tal como lo devuelve el backend.
 */
export class Medicamento {
	/** Identificador único. */
	id!: number;
	/** Nombre del medicamento (único). */
	nombre!: string;
	/** Descripción o uso general (opcional). */
	descripcion?: string | null;
	/** Presentación comercial (opcional). */
	presentacion?: string | null;
	/** Fecha de compra del lote (`AAAA-MM-DD`). */
	fechaCompra?: Date | string;
	/** Fecha de vencimiento del lote (`AAAA-MM-DD`). */
	fechaVence?: Date | string;
	/** Fecha en que se registró en el sistema. */
	fechaCreacionRegistro?: Date | string;
	/** Fecha de la última modificación. */
	fechaModificacionRegistro?: Date | string | null;
	/** `true` si se puede recetar; los inactivos no aparecen al emitir fórmulas. */
	activo?: boolean;
	/** Nombres antiguos en formato snake_case; se conservan para no romper pantallas existentes. */
	fecha_compra?: Date;
	fecha_vence?: Date;
	fecha_creacion_registro?: Date;
	fecha_modificacion_registro?: Date | null;
}
