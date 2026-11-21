import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { ApiService } from 'src/app/services/api.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { fechaLocalISO } from 'src/app/utils/validadores';
import { Despacho, DespachoHistorico, HistorialDespacho, ItemDespacho, ResultadoDespacho } from 'src/app/models/clinica-extra';

type Vista = 'pendientes' | 'historial';

/**
 * Despacho de fórmulas (perfil DESPACHO_MEDICO). Muestra la fórmula en solo lectura (dosis e indicaciones no se
 * pueden cambiar), deja elegir los lotes de los que se entrega (sugiere el que vence primero y bloquea los vencidos),
 * confirma la entrega descontando el inventario y permite consultar el historial de despachos.
 * El administrador solo consulta y autoriza reversiones.
 */
@Component({
  selector: 'app-despacho',
  imports: [CommonModule, FormsModule],
  templateUrl: './despacho.component.html'
})
export class DespachoComponent implements OnInit {
  private readonly api = inject(ApiService);

  private readonly rol: number = (() => {
    try { return JSON.parse(localStorage.getItem('usuario') || '{}').rol ?? 0; } catch { return 0; }
  })();
  readonly puedeOperar = this.rol === 5;
  readonly esAdmin = this.rol === 1;

  readonly estados = ['PENDIENTE', 'EN_PREPARACION', 'DESPACHO_PARCIAL', 'PENDIENTE_DISPONIBILIDAD', 'CANCELADO', 'DESPACHADO'];
  vista: Vista = 'pendientes';

  lista: Despacho[] = [];
  estado = '';
  texto = '';
  desde = '';
  hasta = '';
  cargando = false;
  error = '';

  actual: Despacho | null = null;
  /** detalleId -> (loteId -> cantidad elegida) */
  seleccion: Record<number, Record<number, number>> = {};
  observaciones = '';
  historial: HistorialDespacho[] = [];
  errorDetalle = '';
  procesando = false;

  // historial general
  hDesde = fechaLocalISO(new Date(Date.now() - 30 * 86400000));
  hHasta = fechaLocalISO();
  hTexto = '';
  historico: DespachoHistorico[] = [];

  ngOnInit(): void {
    this.cargar();
  }

  cambiarVista(v: Vista): void {
    this.vista = v;
    if (v === 'historial') { this.cargarHistorico(); } else { this.cargar(); }
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.api.get<Despacho[]>('despacho/listar', { estado: this.estado, q: this.texto, desde: this.desde, hasta: this.hasta }).subscribe({
      next: (l) => { this.lista = l; this.cargando = false; },
      error: (e) => { this.error = obtenerMensajeError(e, 'No fue posible cargar las fórmulas.'); this.cargando = false; }
    });
  }

  cargarHistorico(): void {
    this.cargando = true;
    this.error = '';
    this.api.get<DespachoHistorico[]>('despacho/historial', { desde: this.hDesde, hasta: this.hHasta, q: this.hTexto }).subscribe({
      next: (l) => { this.historico = l; this.cargando = false; },
      error: (e) => { this.error = obtenerMensajeError(e, 'No fue posible cargar el historial.'); this.cargando = false; }
    });
  }

  pendientes(d: Despacho): number {
    return d.items.reduce((s, i) => s + i.cantidadPendiente, 0);
  }

  claseEstado(e: string): string {
    return e === 'DESPACHADO' ? 'bg-success' : e === 'CANCELADO' ? 'bg-secondary' : e === 'PENDIENTE_DISPONIBILIDAD' ? 'bg-danger'
      : e === 'DESPACHO_PARCIAL' ? 'bg-info' : e === 'EN_PREPARACION' ? 'bg-primary' : 'bg-warning text-dark';
  }

  // ====================================================================== detalle y selección de lotes

  abrir(d: Despacho): void {
    this.errorDetalle = '';
    this.api.get<Despacho>(`despacho/formula/${d.formulaId}`).subscribe({
      next: (x) => { this.fijar(x); this.cargarHistorial(); },
      error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible cargar la fórmula.'), 'error')
    });
  }

  private fijar(x: Despacho): void {
    this.actual = x;
    this.observaciones = x.observaciones ?? '';
    this.seleccion = {};
    x.items.forEach((i) => this.sugerir(i));
  }

  /** Reparte lo pendiente entre los lotes vigentes que vencen primero (FEFO). */
  sugerir(i: ItemDespacho): void {
    const mapa: Record<number, number> = {};
    let restante = i.cantidadPendiente;
    for (const l of i.lotes) {
      if (l.vencido || restante <= 0) { continue; }
      const tomar = Math.min(restante, l.cantidadDisponible);
      if (tomar > 0) { mapa[l.loteId] = tomar; restante -= tomar; }
    }
    this.seleccion[i.formulaDetalleId] = mapa;
  }

  total(i: ItemDespacho): number {
    return Object.values(this.seleccion[i.formulaDetalleId] ?? {}).reduce((s, v) => s + (Number(v) || 0), 0);
  }

  cambiarLote(i: ItemDespacho, loteId: number, valor: number): void {
    const mapa = this.seleccion[i.formulaDetalleId] ?? (this.seleccion[i.formulaDetalleId] = {});
    if (!valor || valor <= 0) { delete mapa[loteId]; } else { mapa[loteId] = Math.floor(valor); }
  }

  private cargarHistorial(): void {
    if (!this.actual) { return; }
    this.api.get<HistorialDespacho[]>(`despacho/formula/${this.actual.formulaId}/historial`).subscribe({ next: (h) => (this.historial = h), error: () => (this.historial = []) });
  }

  get puedeEntregar(): boolean {
    return this.puedeOperar && !!this.actual && this.actual.estado !== 'DESPACHADO' && this.actual.estado !== 'CANCELADO';
  }

  get hayEntregas(): boolean {
    return !!this.actual && this.actual.items.some((i) => i.cantidadDespachada > 0);
  }

  preparar(): void {
    if (!this.actual) { return; }
    this.api.post<Despacho>(`despacho/formula/${this.actual.formulaId}/preparar`).subscribe({
      next: (x) => { this.fijar(x); this.cargarHistorial(); this.cargar(); },
      error: (e) => (this.errorDetalle = obtenerMensajeError(e, 'No fue posible preparar la fórmula.'))
    });
  }

  confirmar(): void {
    if (!this.actual || this.procesando) { return; }
    const items = this.actual.items
      .filter((i) => this.total(i) > 0)
      .map((i) => ({
        formulaDetalleId: i.formulaDetalleId, cantidad: this.total(i),
        lotes: Object.entries(this.seleccion[i.formulaDetalleId]).filter(([, c]) => Number(c) > 0).map(([id, c]) => ({ loteId: Number(id), cantidad: Number(c) }))
      }));
    if (items.length === 0) { this.errorDetalle = 'Selecciona al menos una unidad de algún lote para entregar.'; return; }
    for (const i of this.actual.items) {
      if (this.total(i) > i.cantidadPendiente) { this.errorDetalle = `De ${i.medicamento} solo faltan ${i.cantidadPendiente} unidades por entregar.`; return; }
    }
    this.procesando = true;
    this.errorDetalle = '';
    const id = this.actual.formulaId;
    this.api.post<ResultadoDespacho>(`despacho/formula/${id}/confirmar`, { items, observaciones: this.observaciones }).subscribe({
      next: (r) => {
        this.procesando = false;
        Swal.fire({ icon: r.advertencias.length ? 'warning' : 'success', title: r.mensaje, html: r.advertencias.join('<br>') });
        this.abrir({ formulaId: id } as Despacho);
        this.cargar();
      },
      error: (e) => { this.procesando = false; this.errorDetalle = obtenerMensajeError(e, 'No fue posible registrar la entrega.'); }
    });
  }

  cancelar(): void {
    if (!this.actual) { return; }
    const id = this.actual.formulaId;
    Swal.fire({ icon: 'warning', title: 'Cancelar el despacho', input: 'text', inputPlaceholder: 'Motivo (mínimo 5 caracteres)', showCancelButton: true, confirmButtonText: 'Cancelar despacho', cancelButtonText: 'Volver' }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.api.post<ResultadoDespacho>(`despacho/formula/${id}/cancelar`, { motivo: r.value }).subscribe({
        next: () => { this.abrir({ formulaId: id } as Despacho); this.cargar(); },
        error: (e) => (this.errorDetalle = obtenerMensajeError(e, 'No fue posible cancelar el despacho.'))
      });
    });
  }

  /** Reversión autorizada: solo administrador; devuelve el stock a sus lotes y deja trazabilidad. */
  reversar(): void {
    if (!this.actual) { return; }
    const id = this.actual.formulaId;
    Swal.fire({ icon: 'warning', title: 'Reversión autorizada', text: 'El stock volverá a sus lotes y la fórmula quedará pendiente de despacho.', input: 'text', inputPlaceholder: 'Motivo (mínimo 10 caracteres)', showCancelButton: true, confirmButtonText: 'Autorizar reversión', cancelButtonText: 'Volver' }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.api.post<ResultadoDespacho>(`despacho/formula/${id}/reversar`, { motivo: r.value }).subscribe({
        next: (rs) => { Swal.fire({ icon: 'success', title: rs.mensaje }); this.abrir({ formulaId: id } as Despacho); this.cargar(); },
        error: (e) => (this.errorDetalle = obtenerMensajeError(e, 'No fue posible revertir el despacho.'))
      });
    });
  }

  comprobante(): void {
    if (!this.actual) { return; }
    this.api.abrirPdf(`despacho/formula/${this.actual.formulaId}/comprobante`).catch((e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible generar el comprobante.'), 'error'));
  }
}
