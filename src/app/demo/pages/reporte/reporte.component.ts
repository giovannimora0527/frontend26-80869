import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { ApiService } from 'src/app/services/api.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { fechaLocalISO } from 'src/app/utils/validadores';
import { Reporte } from 'src/app/models/clinica-extra';

interface TipoReporte { id: string; nombre: string; grupo: string; fechas: boolean; agrupa: boolean; estados?: string[]; producto?: boolean; roles: number[]; }

/** Catálogo de reportes. `roles` indica qué perfiles lo ven (el backend vuelve a validar el permiso). */
const TIPOS: TipoReporte[] = [
  { id: 'ingresos', grupo: 'Financieros', nombre: 'Ingresos por periodo (día, mes, año)', fechas: true, agrupa: true, roles: [1, 6] },
  { id: 'ingresos-concepto', grupo: 'Financieros', nombre: 'Ingresos por consultas y por venta de medicamentos', fechas: true, agrupa: false, roles: [1, 6] },
  { id: 'ingresos-especialidad', grupo: 'Financieros', nombre: 'Ingresos por especialidad', fechas: true, agrupa: false, roles: [1, 6] },
  { id: 'ingresos-veterinario', grupo: 'Financieros', nombre: 'Ingresos por veterinario', fechas: true, agrupa: false, roles: [1, 6] },
  { id: 'facturas-resumen', grupo: 'Financieros', nombre: 'Facturas generadas, pagadas, pendientes y con pago parcial (resumen)', fechas: true, agrupa: false, roles: [1, 6] },
  { id: 'facturas-estado', grupo: 'Financieros', nombre: 'Facturas por estado (detalle)', fechas: true, agrupa: false, estados: ['PENDIENTE_PAGO', 'PAGADA_PARCIAL', 'PAGADA', 'ANULADA'], roles: [1, 6] },
  { id: 'impuestos', grupo: 'Financieros', nombre: 'Impuestos (IVA) registrados', fechas: true, agrupa: true, roles: [1, 6] },
  { id: 'descuentos', grupo: 'Financieros', nombre: 'Descuentos aplicados', fechas: true, agrupa: false, roles: [1, 6] },
  { id: 'inventario-valorizado', grupo: 'Inventario', nombre: 'Existencias, valor a costo y valor potencial de venta', fechas: false, agrupa: false, roles: [1, 6, 7] },
  { id: 'inventario-alertas', grupo: 'Inventario', nombre: 'Agotados, stock mínimo, próximos a vencer y vencidos', fechas: false, agrupa: false, roles: [1, 6, 7] },
  { id: 'movimientos-inventario', grupo: 'Inventario', nombre: 'Entradas y salidas / historial de movimientos por medicamento', fechas: true, agrupa: false, producto: true, roles: [1, 6, 7] },
  { id: 'despachos', grupo: 'Inventario', nombre: 'Historial de despachos de fórmulas', fechas: true, agrupa: false, roles: [1, 7] },
  { id: 'formulas-pendientes', grupo: 'Inventario', nombre: 'Fórmulas pendientes de despacho', fechas: false, agrupa: false, roles: [1, 7] },
  { id: 'citas-resumen', grupo: 'Gestión médica', nombre: 'Número de citas por período (atendidas, pendientes, canceladas)', fechas: true, agrupa: true, roles: [1, 2, 3] },
  { id: 'citas', grupo: 'Gestión médica', nombre: 'Listado de citas', fechas: true, agrupa: false, estados: ['PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA'], roles: [1, 2, 3] },
  { id: 'consultas-veterinario', grupo: 'Gestión médica', nombre: 'Consultas realizadas por veterinario', fechas: true, agrupa: false, roles: [1] },
  { id: 'consultas-especialidad', grupo: 'Gestión médica', nombre: 'Consultas realizadas por especialidad', fechas: true, agrupa: false, roles: [1] },
  { id: 'mascotas-atendidas', grupo: 'Gestión médica', nombre: 'Mascotas atendidas por período', fechas: true, agrupa: false, roles: [1] },
  { id: 'medico-diario', grupo: 'Gestión médica', nombre: 'Informe de actividad del veterinario', fechas: true, agrupa: false, estados: ['ATENDIDA', 'CONFIRMADA', 'PROGRAMADA', 'CANCELADA'], roles: [1, 3] }
];

/** Pantalla de reportes: filtros, tabla con encabezados y descarga en Excel o PDF. */
@Component({
  selector: 'app-reporte',
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte.component.html'
})
export class ReporteComponent implements OnInit {
  private readonly api = inject(ApiService);
  productos: { id: number; codigo: string; nombre: string }[] = [];
  productoId: number | null = null;

  ngOnInit(): void {
    if (this.tipos.some((t) => t.producto)) {
      this.api.get<typeof this.productos>('inventario/producto/listar', {}).subscribe({ next: (p) => (this.productos = p), error: () => (this.productos = []) });
    }
  }

  private readonly rol: number = (() => {
    try { return JSON.parse(localStorage.getItem('usuario') || '{}').rol ?? 0; } catch { return 0; }
  })();
  readonly tipos = TIPOS.filter((t) => t.roles.includes(this.rol));

  tipo: TipoReporte | null = this.tipos.length ? this.tipos[0] : null;
  desde = fechaLocalISO(new Date(Date.now() - 30 * 86400000));
  hasta = fechaLocalISO();
  agrupacion = 'DIA';
  estado = '';
  reporte: Reporte | null = null;
  cargando = false;
  error = '';

  private params(formato: string): Record<string, unknown> {
    const t = this.tipo!;
    return { desde: t.fechas ? this.desde : '', hasta: t.fechas ? this.hasta : '', agrupacion: t.agrupa ? this.agrupacion : '', estado: this.estado, productoId: t.producto ? this.productoId : '', formato };
  }

  cambiarTipo(): void {
    this.reporte = null;
    this.estado = '';
    this.error = '';
  }

  consultar(): void {
    if (!this.tipo) { return; }
    if (this.tipo.fechas && this.desde > this.hasta) { this.error = 'La fecha inicial no puede ser posterior a la final.'; return; }
    this.cargando = true;
    this.error = '';
    this.api.get<Reporte>(`reporte/${this.tipo.id}`, this.params('json')).subscribe({
      next: (r) => { this.reporte = r; this.cargando = false; },
      error: (e) => { this.reporte = null; this.cargando = false; this.error = obtenerMensajeError(e, 'No fue posible generar el reporte.'); }
    });
  }

  descargar(formato: 'xlsx' | 'pdf'): void {
    if (!this.tipo) { return; }
    this.api.descargar(`reporte/${this.tipo.id}`, `reporte_${this.tipo.id}_${fechaLocalISO()}.${formato}`, this.params(formato))
      .catch((e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible descargar el archivo.'), 'error'));
  }

  esNumero(v: unknown): boolean {
    return typeof v === 'number';
  }
}
