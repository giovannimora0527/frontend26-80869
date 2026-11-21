/** Modelos de los módulos del segundo parcial (inventario, servicios, facturación, despacho, reportes). */

export interface Producto {
  id: number; codigo: string; nombre: string; tipo: string; presentacion?: string; unidadMedida?: string;
  requiereInvima: boolean; registroInvima?: string; stockMinimo: number; precioVenta: number; aplicaIva: boolean;
  medicamentoId?: number; fechaProximoPedido?: string; activo: boolean; stock: number; reservado: number; proximoVencimiento?: string;
  estadoStock: 'AGOTADO' | 'STOCK_BAJO' | 'OK';
}
export interface Lote {
  id: number; productoId: number; numeroLote: string; fechaIngreso: string; fechaVencimiento?: string;
  cantidadInicial: number; cantidadDisponible: number; precioCompra: number; activo: boolean; vencido: boolean;
}
export interface Movimiento { id: number; tipo: string; cantidad: number; numeroLote?: string; referencia?: string; fecha: string; }
export interface ProductoDetalle { producto: Producto; lotes: Lote[]; movimientos: Movimiento[]; }
export interface Alerta {
  tipo: 'AGOTADO' | 'STOCK_BAJO' | 'POR_VENCER' | 'VENCIDO'; productoId: number; codigo: string; nombre: string;
  stock?: number; lote?: string; fechaVencimiento?: string; cantidad?: number; mensaje: string;
}
export interface ResumenInventario {
  totalProductos: number; agotados: number; stockBajo: number; porVencer: number; vencidos: number;
  valorCosto: number; valorVenta: number;
}
export interface FilaCarga {
  codigo: string; nombre: string; tipo: string; presentacion?: string; unidadMedida?: string; registroInvima?: string;
  lote: string; fechaVencimiento?: string; cantidad: number; stockMinimo?: number; precioCompra: number;
  precioVenta: number; aplicaIva?: boolean;
}
export interface FilaPrevia { fila: number; valida: boolean; errores: string[]; datos: FilaCarga; }
export interface PreviaCarga { nombreArchivo: string; totalLeidos: number; totalValidos: number; totalErrores: number; filas: FilaPrevia[]; }
export interface ResultadoCarga { logId: number; totalLeidos: number; totalCargados: number; totalErrores: number; estado: string; errores: string[]; mensaje: string; }
export interface CargaLog { id: number; nombreArchivo: string; fecha: string; usuario?: string; totalLeidos: number; totalCargados: number; totalErrores: number; estado: string; }

export interface Servicio {
  id: number; codigo: string; nombre: string; descripcion?: string; categoria: string; especializacionId?: number;
  especializacion?: string; requiereEspecializacion: boolean; precio: number; aplicaIva: boolean; activo: boolean;
}
export interface Tarifa { id: number; valorAnterior?: number; valorNuevo: number; motivo?: string; fecha: string; }

export interface ItemFormula {
  productoId: number | null; dosis: string; frecuencia: string; duracion: string; viaAdministracion: string;
  cantidad: number; indicaciones: string;
}
export interface ItemFormulaRs {
  id?: number; productoId?: number; codigo?: string; medicamento: string; presentacion?: string; dosis: string;
  frecuencia: string; duracion: string; viaAdministracion?: string; cantidad: number; cantidadDespachada: number; indicaciones?: string;
}
export interface FormulaMultiple {
  id: number; citaId: number; fechaEmision: string; activo: boolean; indicaciones?: string; cliente?: string;
  mascota?: string; veterinario?: string; estadoDespacho: string; items: ItemFormulaRs[];
}

export interface Linea { id?: number; tipo: string; codigo: string; descripcion: string; cantidad: number; precioUnitario: number; subtotal: number; aplicaIva: boolean; }
export interface Calculo {
  lineas: Linea[]; subtotal: number; descuento?: string; porcentajeDescuento: number; valorDescuento: number;
  baseGravable: number; ivaPorcentaje: number; valorIva: number; total: number;
}
export interface FacturaResumen {
  id: number; numero: string; fechaGeneracion: string; citaId: number; cliente: string; mascota: string; veterinario: string; especialidad?: string;
  subtotal: number; valorDescuento: number; valorIva: number; total: number; totalPagado: number; saldo: number; estado: string;
}
export interface Pago { id: number; fecha: string; valor: number; metodoPago: string; referencia?: string; }
export interface LogFactura { evento: string; detalle?: string; fecha: string; }
export interface FacturaDetalle {
  resumen: FacturaResumen; documentoCliente: string; descuento?: string; porcentajeDescuento: number; baseGravable: number;
  ivaPorcentaje: number; observaciones?: string; motivoAnulacion?: string; lineas: Linea[]; pagos: Pago[]; historial: LogFactura[];
}
export interface Descuento { id: number; nombre: string; porcentaje: number; descripcion?: string; }

export interface LoteDisponible { loteId: number; numeroLote: string; fechaVencimiento?: string; cantidadDisponible: number; vencido: boolean; porVencer: boolean; }
export interface EntregaHistorial { codigo?: string; producto: string; lote: string; cantidad: number; fecha: string; revertido: boolean; }
export interface DespachoHistorico {
  despachoId: number; formulaId: number; cliente: string; mascota: string; veterinario: string; usuarioDespacho?: string;
  fechaEntrega: string; estado: string; entregas: EntregaHistorial[];
}
export interface ItemDespacho {
  formulaDetalleId: number; productoId: number; codigo: string; medicamento: string; presentacion?: string; dosis: string;
  frecuencia: string; duracion: string; viaAdministracion?: string; indicaciones?: string; cantidadFormulada: number;
  cantidadDespachada: number; cantidadPendiente: number; stockDisponible: number; lotes: LoteDisponible[];
}
export interface Despacho {
  despachoId?: number; formulaId: number; fechaEmision: string; cliente: string; mascota: string; veterinario: string;
  estado: string; observaciones?: string; items: ItemDespacho[];
}
export interface ResultadoDespacho { estado: string; mensaje: string; advertencias: string[]; }
export interface HistorialDespacho { estadoAnterior?: string; estadoNuevo: string; detalle?: string; fecha: string; }

export interface Reporte {
  tipo: string; titulo: string; subtitulo?: string; columnas: string[]; filas: (string | number | null)[][];
  totales: (string | number | null)[];
}
