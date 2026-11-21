import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

import { ApiService } from 'src/app/services/api.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { fechaLocalISO } from 'src/app/utils/validadores';
import { Calculo, Descuento, FacturaDetalle, FacturaResumen, Servicio } from 'src/app/models/clinica-extra';

interface CitaLista {
  id: number; fechaHora: string; estado: string; motivo?: string;
  cliente?: { nombres: string; apellidos: string }; mascota?: { nombreMascota: string }; medico?: { nombres: string; apellidos: string };
}

/**
 * Facturación: genera la prefactura de una cita (servicios + medicamentos de sus fórmulas), calcula el IVA
 * y los descuentos en el backend, registra pagos parciales o totales y permite anular con motivo.
 */
@Component({
  selector: 'app-facturacion',
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.component.html'
})
export class FacturacionComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ruta = inject(ActivatedRoute);

  readonly estados = ['PENDIENTE_PAGO', 'PAGADA_PARCIAL', 'PAGADA', 'ANULADA'];
  readonly metodos = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

  desde = fechaLocalISO(new Date(Date.now() - 30 * 86400000));
  hasta = fechaLocalISO();
  estado = '';
  texto = '';
  facturas: FacturaResumen[] = [];
  cargando = false;
  error = '';

  // ---- nueva prefactura
  mostrarNueva = false;
  citas: CitaLista[] = [];
  servicios: Servicio[] = [];
  descuentos: Descuento[] = [];
  citaId: number | null = null;
  cantidades: Record<number, number> = {};
  descuentoId: number | null = null;
  observaciones = '';
  incluirFormulas = true;
  calculo: Calculo | null = null;
  errorNueva = '';
  enviando = false;
  filtroServicio = '';

  // ---- detalle
  detalle: FacturaDetalle | null = null;
  pago = { valor: null as number | null, metodoPago: 'EFECTIVO', referencia: '' };
  errorPago = '';

  ngOnInit(): void {
    this.cargar();
    const citaParam = Number(this.ruta.snapshot.queryParamMap.get('citaId'));
    if (citaParam) {
      this.abrirNueva(citaParam);
    }
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.api.get<FacturaResumen[]>('factura/listar', { desde: this.desde, hasta: this.hasta, estado: this.estado, q: this.texto }).subscribe({
      next: (f) => { this.facturas = f; this.cargando = false; },
      error: (e) => { this.error = obtenerMensajeError(e, 'No fue posible cargar las facturas.'); this.cargando = false; }
    });
  }

  get totalListado(): number {
    return this.facturas.filter((f) => f.estado !== 'ANULADA').reduce((s, f) => s + f.total, 0);
  }

  claseEstado(e: string): string {
    return e === 'PAGADA' ? 'bg-success' : e === 'PAGADA_PARCIAL' ? 'bg-info' : e === 'ANULADA' ? 'bg-secondary' : 'bg-warning text-dark';
  }

  // ====================================================================== nueva prefactura

  abrirNueva(citaPreseleccionada?: number): void {
    this.mostrarNueva = true;
    this.calculo = null;
    this.errorNueva = '';
    this.cantidades = {};
    this.descuentoId = null;
    this.observaciones = '';
    this.incluirFormulas = true;
    this.citaId = citaPreseleccionada ?? null;
    const ini = new Date(Date.now() - 60 * 86400000);
    const fin = new Date(Date.now() + 2 * 86400000);
    this.api.get<CitaLista[]>('cita/listar-rango', { fechaInicio: `${fechaLocalISO(ini)}T00:00:00`, fechaFin: `${fechaLocalISO(fin)}T23:59:59` }).subscribe({
      next: (c) => (this.citas = c.filter((x) => x.estado === 'ATENDIDA').sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1))),
      error: (e) => (this.errorNueva = obtenerMensajeError(e, 'No fue posible cargar las citas.'))
    });
    this.api.get<Servicio[]>('servicio/listar', { soloActivos: true }).subscribe({ next: (s) => (this.servicios = s) });
    this.api.get<Descuento[]>('factura/descuentos').subscribe({ next: (d) => (this.descuentos = d) });
  }

  get serviciosFiltrados(): Servicio[] {
    const q = this.filtroServicio.trim().toLowerCase();
    return this.servicios.filter((s) => !q || `${s.codigo} ${s.nombre} ${s.categoria}`.toLowerCase().includes(q));
  }

  cambiarCantidad(id: number, valor: number): void {
    if (!valor || valor <= 0) { delete this.cantidades[id]; } else { this.cantidades[id] = Math.min(99, Math.floor(valor)); }
    this.calculo = null;
  }

  private cuerpo() {
    return {
      citaId: this.citaId,
      servicios: Object.entries(this.cantidades).map(([id, cantidad]) => ({ servicioId: Number(id), cantidad })),
      incluirFormulas: this.incluirFormulas, descuentoId: this.descuentoId, observaciones: this.observaciones
    };
  }

  calcular(): void {
    if (!this.citaId) { this.errorNueva = 'Selecciona la cita.'; return; }
    this.errorNueva = '';
    this.api.post<Calculo>('factura/calcular', this.cuerpo()).subscribe({
      next: (c) => (this.calculo = c),
      error: (e) => { this.calculo = null; this.errorNueva = obtenerMensajeError(e, 'No fue posible calcular la prefactura.'); }
    });
  }

  generar(): void {
    if (this.enviando) { return; }
    if (!this.citaId) { this.errorNueva = 'Selecciona la cita.'; return; }
    this.enviando = true;
    this.errorNueva = '';
    this.api.post<FacturaDetalle>('factura/crear', this.cuerpo()).subscribe({
      next: (f) => { this.enviando = false; this.mostrarNueva = false; this.cargar(); this.detalle = f; },
      error: (e) => { this.enviando = false; this.errorNueva = obtenerMensajeError(e, 'No fue posible generar la prefactura.'); }
    });
  }

  nombreCita(c: CitaLista): string {
    return `#${c.id} · ${c.fechaHora.replace('T', ' ').substring(0, 16)} · ${c.mascota?.nombreMascota ?? ''} (${c.cliente?.nombres ?? ''} ${c.cliente?.apellidos ?? ''}) · ${c.estado}`;
  }

  // ====================================================================== detalle, pagos, anulación

  ver(f: FacturaResumen): void {
    this.api.get<FacturaDetalle>(`factura/${f.id}`).subscribe({
      next: (d) => { this.detalle = d; this.pago = { valor: null, metodoPago: 'EFECTIVO', referencia: '' }; this.errorPago = ''; },
      error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible cargar la factura.'), 'error')
    });
  }

  pagar(): void {
    if (!this.detalle) { return; }
    if (!this.pago.valor || this.pago.valor <= 0) { this.errorPago = 'Indica un valor mayor a cero.'; return; }
    this.api.post<FacturaDetalle>(`factura/${this.detalle.resumen.id}/pago`, this.pago).subscribe({
      next: (d) => { this.detalle = d; this.pago = { valor: null, metodoPago: 'EFECTIVO', referencia: '' }; this.errorPago = ''; this.cargar(); },
      error: (e) => (this.errorPago = obtenerMensajeError(e, 'No fue posible registrar el pago.'))
    });
  }

  pagarSaldo(): void {
    if (this.detalle) { this.pago.valor = this.detalle.resumen.saldo; }
  }

  anular(): void {
    if (!this.detalle) { return; }
    const id = this.detalle.resumen.id;
    Swal.fire({
      icon: 'warning', title: 'Anular la factura', input: 'text', inputPlaceholder: 'Motivo (mínimo 10 caracteres)',
      showCancelButton: true, confirmButtonText: 'Anular', cancelButtonText: 'Cancelar'
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.api.post<{ message: string }>(`factura/${id}/anular`, { motivo: r.value }).subscribe({
        next: (rs) => { Swal.fire({ icon: 'success', title: rs.message, timer: 1800, showConfirmButton: false }); this.detalle = null; this.cargar(); },
        error: (e) => Swal.fire('No se pudo anular', obtenerMensajeError(e, 'No fue posible anular la factura.'), 'error')
      });
    });
  }

  pdf(id: number): void {
    this.api.abrirPdf(`factura/${id}/pdf`).catch((e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible generar el PDF.'), 'error'));
  }
}
