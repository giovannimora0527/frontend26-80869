import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { ApiService } from 'src/app/services/api.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import {
  Alerta, CargaLog, FilaCarga, PreviaCarga, Producto, ProductoDetalle, ResultadoCarga, ResumenInventario
} from 'src/app/models/clinica-extra';

type Pestana = 'productos' | 'alertas' | 'carga' | 'logs';

/** Tipos de producto y si exigen registro INVIMA (el backend aplica la misma regla). */
const TIPOS: { valor: string; texto: string; invima: boolean }[] = [
  { valor: 'MEDICAMENTO', texto: 'Medicamento', invima: true },
  { valor: 'BIOLOGICO', texto: 'Biológico (vacunas)', invima: true },
  { valor: 'INSUMO_MEDICO', texto: 'Insumo médico', invima: true },
  { valor: 'INSUMO_GENERAL', texto: 'Insumo general', invima: false },
  { valor: 'HIGIENE', texto: 'Higiene y baño', invima: false },
  { valor: 'ALIMENTO', texto: 'Alimento', invima: false },
  { valor: 'ACCESORIO', texto: 'Accesorio', invima: false }
];

/**
 * Inventario: productos (medicamentos e insumos), lotes con su precio de compra y vencimiento,
 * kárdex, alertas de stock/vencimiento y carga masiva desde CSV o Excel con vista previa.
 */
@Component({
  selector: 'app-inventario',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html'
})
export class InventarioComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly tipos = TIPOS;
  pestana: Pestana = 'productos';

  /** El perfil DESPACHO_MEDICO (5) solo consulta el inventario: no crea, edita ni ajusta nada. */
  readonly soloConsulta: boolean = (() => {
    try { return JSON.parse(localStorage.getItem('usuario') || '{}').rol === 5; } catch { return false; }
  })();
  filtroStock: '' | 'disponibles' | 'agotados' | 'bajo' = '';

  // ---- productos
  productos: Producto[] = [];
  filtroTexto = '';
  filtroTipo = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'activos';
  cargando = false;
  error = '';
  pagina = 1;
  readonly tamPagina = 12;

  // ---- formulario de producto
  mostrarForm = false;
  editandoId: number | null = null;
  enviando = false;
  errorForm = '';
  form = this.formVacio();

  // ---- detalle
  detalle: ProductoDetalle | null = null;
  loteNuevo = { numeroLote: '', fechaCompra: '', fechaVencimiento: '', cantidad: null as number | null, precioCompra: null as number | null };
  errorLote = '';

  // ---- alertas
  alertas: Alerta[] = [];
  resumen: ResumenInventario | null = null;

  // ---- carga masiva
  archivo: File | null = null;
  previa: PreviaCarga | null = null;
  resultado: ResultadoCarga | null = null;
  procesando = false;
  errorCarga = '';
  soloErrores = false;

  // ---- historial de cargas
  logs: CargaLog[] = [];

  ngOnInit(): void {
    this.cargar();
  }

  // ====================================================================== productos

  cargar(): void {
    this.cargando = true;
    this.error = '';
    const activo = this.filtroEstado === 'todos' ? '' : String(this.filtroEstado === 'activos');
    this.api.get<Producto[]>('inventario/producto/listar', { q: this.filtroTexto, tipo: this.filtroTipo, activo }).subscribe({
      next: (r) => {
        this.productos = r.filter((p) => !this.filtroStock || (this.filtroStock === 'disponibles' ? p.stock > 0 : this.filtroStock === 'agotados' ? p.stock <= 0 : p.estadoStock === 'STOCK_BAJO'));
        this.pagina = 1; this.cargando = false;
      },
      error: (e) => { this.error = obtenerMensajeError(e, 'No fue posible cargar el inventario.'); this.cargando = false; }
    });
  }

  get paginaProductos(): Producto[] {
    return this.productos.slice((this.pagina - 1) * this.tamPagina, this.pagina * this.tamPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.productos.length / this.tamPagina));
  }

  get requiereInvima(): boolean {
    return TIPOS.find((t) => t.valor === this.form.tipo)?.invima ?? false;
  }

  private formVacio() {
    return {
      codigo: '', nombre: '', tipo: 'MEDICAMENTO', presentacion: '', unidadMedida: '', registroInvima: '',
      stockMinimo: 5 as number | null, precioVenta: null as number | null, aplicaIva: true, fechaProximoPedido: '',
      numeroLote: '', fechaCompra: '', fechaVencimiento: '', cantidad: null as number | null, precioCompra: null as number | null
    };
  }

  nuevo(): void {
    this.editandoId = null;
    this.form = this.formVacio();
    this.errorForm = '';
    this.mostrarForm = true;
  }

  editar(p: Producto): void {
    this.editandoId = p.id;
    this.form = {
      ...this.formVacio(), codigo: p.codigo, nombre: p.nombre, tipo: p.tipo, presentacion: p.presentacion ?? '',
      unidadMedida: p.unidadMedida ?? '', registroInvima: p.registroInvima ?? '', stockMinimo: p.stockMinimo,
      precioVenta: p.precioVenta, aplicaIva: p.aplicaIva, fechaProximoPedido: p.fechaProximoPedido ?? ''
    };
    this.errorForm = '';
    this.mostrarForm = true;
  }

  guardar(): void {
    if (this.enviando) { return; }
    const f = this.form;
    if (!f.codigo.trim() || !f.nombre.trim() || f.precioVenta === null || f.stockMinimo === null) {
      this.errorForm = 'Completa código, nombre, stock mínimo y precio de venta.';
      return;
    }
    if (this.editandoId === null && !/^[A-Za-z0-9]{8}$/.test(f.codigo.trim())) {
      this.errorForm = 'El código debe tener exactamente 8 caracteres alfanuméricos (ej.: MED00001).';
      return;
    }
    if (this.requiereInvima && !f.registroInvima.trim()) {
      this.errorForm = 'Los medicamentos, biológicos e insumos médicos exigen registro INVIMA.';
      return;
    }
    if (this.editandoId === null && (!f.numeroLote.trim() || !f.cantidad || f.precioCompra === null)) {
      this.errorForm = 'Para registrar el producto indica su lote inicial: lote, cantidad y precio de compra.';
      return;
    }
    this.enviando = true;
    this.errorForm = '';
    const cuerpo: Record<string, unknown> = {
      codigo: f.codigo, nombre: f.nombre, tipo: f.tipo, presentacion: f.presentacion, unidadMedida: f.unidadMedida,
      registroInvima: this.requiereInvima ? f.registroInvima : null, stockMinimo: f.stockMinimo,
      precioVenta: f.precioVenta, aplicaIva: f.aplicaIva, fechaProximoPedido: f.fechaProximoPedido || null
    };
    if (this.editandoId === null) {
      cuerpo['lote'] = {
        numeroLote: f.numeroLote, fechaCompra: f.fechaCompra || null, fechaVencimiento: f.fechaVencimiento || null,
        cantidad: f.cantidad, precioCompra: f.precioCompra
      };
    }
    const peticion = this.editandoId === null
      ? this.api.post<{ message: string }>('inventario/producto/crear', cuerpo)
      : this.api.put<{ message: string }>(`inventario/producto/${this.editandoId}`, cuerpo);
    peticion.subscribe({
      next: (r) => {
        this.enviando = false;
        this.mostrarForm = false;
        Swal.fire({ icon: 'success', title: r.message, timer: 1800, showConfirmButton: false });
        this.cargar();
      },
      error: (e) => { this.enviando = false; this.errorForm = obtenerMensajeError(e, 'No fue posible guardar el producto.'); }
    });
  }

  alternarEstado(p: Producto): void {
    const activar = !p.activo;
    Swal.fire({
      icon: 'question', title: activar ? '¿Activar el producto?' : '¿Desactivar el producto?',
      text: 'Los productos no se borran: al desactivarlos dejan de poder formularse.', showCancelButton: true,
      confirmButtonText: 'Sí', cancelButtonText: 'Cancelar'
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.api.patch(`inventario/producto/${p.id}/estado`, { activo: activar }).subscribe({
        next: () => this.cargar(),
        error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible cambiar el estado.'), 'error')
      });
    });
  }

  // ====================================================================== detalle y lotes

  verDetalle(p: Producto): void {
    this.api.get<ProductoDetalle>(`inventario/producto/${p.id}`).subscribe({
      next: (d) => { this.detalle = d; this.loteNuevo = { numeroLote: '', fechaCompra: '', fechaVencimiento: '', cantidad: null, precioCompra: null }; this.errorLote = ''; },
      error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible cargar el detalle.'), 'error')
    });
  }

  registrarLote(): void {
    if (!this.detalle) { return; }
    const l = this.loteNuevo;
    if (!l.numeroLote.trim() || !l.cantidad || l.precioCompra === null) {
      this.errorLote = 'Indica lote, cantidad y precio de compra.';
      return;
    }
    this.api.post<{ message: string }>(`inventario/producto/${this.detalle.producto.id}/lote`, {
      numeroLote: l.numeroLote, fechaCompra: l.fechaCompra || null, fechaVencimiento: l.fechaVencimiento || null,
      cantidad: l.cantidad, precioCompra: l.precioCompra
    }).subscribe({
      next: () => { this.verDetalle(this.detalle!.producto); this.cargar(); },
      error: (e) => { this.errorLote = obtenerMensajeError(e, 'No fue posible registrar el lote.'); }
    });
  }

  ajustarLote(loteId: number, actual: number): void {
    Swal.fire({
      title: 'Ajustar existencias del lote', html:
        `<input id="aj-cant" type="number" min="0" class="swal2-input" placeholder="Nueva cantidad" value="${actual}">` +
        '<input id="aj-mot" class="swal2-input" placeholder="Motivo (mínimo 5 caracteres)">',
      showCancelButton: true, confirmButtonText: 'Ajustar', cancelButtonText: 'Cancelar',
      preConfirm: () => ({
        cantidad: Number((document.getElementById('aj-cant') as HTMLInputElement).value),
        motivo: (document.getElementById('aj-mot') as HTMLInputElement).value
      })
    }).then((r) => {
      if (!r.isConfirmed || !this.detalle) { return; }
      this.api.patch(`inventario/lote/${loteId}/ajuste`, { nuevaCantidad: r.value.cantidad, motivo: r.value.motivo }).subscribe({
        next: () => { this.verDetalle(this.detalle!.producto); this.cargar(); },
        error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible ajustar el lote.'), 'error')
      });
    });
  }

  // ====================================================================== alertas

  cargarAlertas(): void {
    this.api.get<Alerta[]>('inventario/alertas').subscribe({ next: (a) => (this.alertas = a), error: () => (this.alertas = []) });
    this.api.get<ResumenInventario>('inventario/resumen').subscribe({ next: (r) => (this.resumen = r) });
  }

  notificar(): void {
    this.api.post<{ message: string }>('inventario/alertas/notificar').subscribe({
      next: (r) => Swal.fire({ icon: 'info', title: r.message }),
      error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible enviar el aviso.'), 'error')
    });
  }

  // ====================================================================== carga masiva

  elegirArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.archivo = input.files && input.files.length > 0 ? input.files[0] : null;
    this.previa = null;
    this.resultado = null;
    this.errorCarga = '';
  }

  previsualizar(): void {
    if (!this.archivo) { this.errorCarga = 'Selecciona un archivo .csv o .xlsx.'; return; }
    this.procesando = true;
    this.errorCarga = '';
    this.resultado = null;
    this.api.subir<PreviaCarga>('inventario/carga/previsualizar', 'archivo', this.archivo).subscribe({
      next: (p) => { this.previa = p; this.procesando = false; },
      error: (e) => { this.previa = null; this.procesando = false; this.errorCarga = obtenerMensajeError(e, 'No fue posible leer el archivo.'); }
    });
  }

  get filasMostradas() {
    if (!this.previa) { return []; }
    return this.soloErrores ? this.previa.filas.filter((f) => !f.valida) : this.previa.filas;
  }

  confirmar(): void {
    if (!this.previa || this.previa.totalValidos === 0) { return; }
    const validas: FilaCarga[] = this.previa.filas.filter((f) => f.valida).map((f) => f.datos);
    const erroresPrevios = this.previa.filas.filter((f) => !f.valida).map((f) => `Fila ${f.fila} (${f.datos.codigo ?? '-'}): ${f.errores.join(' | ')}`);
    Swal.fire({
      icon: 'question', title: `Cargar ${validas.length} de ${this.previa.totalLeidos} registros`,
      text: this.previa.totalErrores > 0 ? `${this.previa.totalErrores} filas con error NO se cargarán; quedarán en el informe de errores.` : 'Todas las filas son válidas.',
      showCancelButton: true, confirmButtonText: 'Cargar', cancelButtonText: 'Cancelar'
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.procesando = true;
      this.api.post<ResultadoCarga>('inventario/carga/confirmar', {
        nombreArchivo: this.previa!.nombreArchivo, filas: validas, totalLeidos: this.previa!.totalLeidos, erroresPrevios
      }).subscribe({
        next: (res) => { this.resultado = res; this.procesando = false; this.previa = null; this.archivo = null; this.cargar(); },
        error: (e) => { this.procesando = false; this.errorCarga = obtenerMensajeError(e, 'No fue posible cargar el inventario.'); }
      });
    });
  }

  /** Descarga en CSV las filas con error de la vista previa (con su número de fila). */
  descargarErrores(): void {
    if (!this.previa) { return; }
    const lineas = ['\uFEFFfila,codigo,nombre,errores'];
    this.previa.filas.filter((f) => !f.valida).forEach((f) =>
      lineas.push([f.fila, f.datos.codigo ?? '', f.datos.nombre ?? '', f.errores.join(' | ')].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')));
    this.api.guardar(new Blob([lineas.join('\n')], { type: 'text/csv;charset=utf-8' }), `errores_${this.previa.nombreArchivo}.csv`);
  }

  descargarPlantilla(): void {
    const enc = 'codigo,nombre,tipo,presentacion,unidad_medida,registro_invima,lote,fecha_vencimiento,cantidad,stock_minimo,precio_compra,precio_venta,aplica_iva';
    const ej = 'MED-900,Medicamento de ejemplo,MEDICAMENTO,Tabletas 10 mg,TAB,INVIMA 2022M-0000001-R1,L-2701,2028-12-31,50,10,3000,5500,0';
    this.api.guardar(new Blob(['\uFEFF' + enc + '\n' + ej + '\n'], { type: 'text/csv;charset=utf-8' }), 'plantilla_carga_inventario.csv');
  }

  // ====================================================================== historial

  cargarLogs(): void {
    this.api.get<CargaLog[]>('inventario/carga/logs').subscribe({ next: (l) => (this.logs = l), error: () => (this.logs = []) });
  }

  informeLog(id: number): void {
    this.api.descargar(`inventario/carga/${id}/errores`, `errores_carga_${id}.csv`).catch((e) =>
      Swal.fire('Error', obtenerMensajeError(e, 'No fue posible descargar el informe.'), 'error'));
  }

  cambiarPestana(p: Pestana): void {
    this.pestana = p;
    if (p === 'alertas') { this.cargarAlertas(); }
    if (p === 'logs') { this.cargarLogs(); }
  }

  claseEstado(p: Producto): string {
    return p.estadoStock === 'AGOTADO' ? 'bg-danger' : p.estadoStock === 'STOCK_BAJO' ? 'bg-warning text-dark' : 'bg-success';
  }

  claseAlerta(t: string): string {
    return t === 'AGOTADO' || t === 'VENCIDO' ? 'danger' : t === 'STOCK_BAJO' ? 'warning' : 'info';
  }
}
