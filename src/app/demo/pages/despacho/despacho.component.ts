import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import {
  DespachoService,
  FormulaPendiente,
  Despacho,
  DespachoItemRq
} from './service/despacho.service';

type Pestana = 'pendientes' | 'historial';

interface EntregaEditable {
  medicamentoId: number;
  medicamentoNombre: string;
  cantidadPrescrita: number;
  existenciaDisponible: number;
  cantidadEntregada: number;
}

/**
 * Pantalla del modulo de despacho.
 *
 * Pestana Pendientes: formulas pendientes de dispensacion; al seleccionar una
 * se ven sus medicamentos con la existencia disponible y se confirma la entrega
 * (cantidades), lo que descuenta el inventario por lotes (FEFO).
 * Pestana Historial: despachos realizados, con comprobante en PDF.
 */
@Component({
  selector: 'app-despacho',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './despacho.component.html',
  styleUrl: './despacho.component.scss'
})
export class DespachoComponent implements OnInit {
  pestana: Pestana = 'pendientes';

  pendientes: FormulaPendiente[] = [];
  despachos: Despacho[] = [];
  cargando = false;

  // Modal de preparacion de despacho
  modalAbierto = false;
  guardando = false;
  formulaSeleccionada?: FormulaPendiente;
  entregas: EntregaEditable[] = [];
  observacion = '';

  constructor(private despachoService: DespachoService) {}

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cambiarPestana(p: Pestana): void {
    this.pestana = p;
    if (p === 'pendientes') {
      this.cargarPendientes();
    } else {
      this.cargarHistorial();
    }
  }

  cargarPendientes(): void {
    this.cargando = true;
    this.despachoService.formulasPendientes().subscribe({
      next: (data) => {
        this.cargando = false;
        this.pendientes = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.manejarError(err, 'No fue posible cargar las formulas pendientes');
      }
    });
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.despachoService.listar().subscribe({
      next: (data) => {
        this.cargando = false;
        this.despachos = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.manejarError(err, 'No fue posible cargar el historial de despachos');
      }
    });
  }

  abrirPreparar(f: FormulaPendiente): void {
    this.formulaSeleccionada = f;
    this.observacion = '';
    this.entregas = f.medicamentos.map((m) => ({
      medicamentoId: m.medicamentoId,
      medicamentoNombre: m.medicamentoNombre,
      cantidadPrescrita: m.cantidadPrescrita,
      existenciaDisponible: m.existenciaDisponible,
      // Por defecto entrega lo prescrito, limitado por lo disponible.
      cantidadEntregada: Math.min(m.cantidadPrescrita, m.existenciaDisponible)
    }));
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  confirmar(): void {
    if (!this.formulaSeleccionada) {
      return;
    }
    // Validacion: no entregar mas que lo disponible.
    for (const e of this.entregas) {
      if (e.cantidadEntregada > e.existenciaDisponible) {
        Swal.fire({
          icon: 'warning',
          title: 'Atencion',
          text: `No puede entregar mas de ${e.existenciaDisponible} de ${e.medicamentoNombre}.`
        });
        return;
      }
      if (e.cantidadEntregada < 0) {
        e.cantidadEntregada = 0;
      }
    }
    const items: DespachoItemRq[] = this.entregas.map((e) => ({
      medicamentoId: e.medicamentoId,
      cantidadEntregada: e.cantidadEntregada
    }));

    this.guardando = true;
    this.despachoService
      .confirmar({ formulaId: this.formulaSeleccionada.formulaId, observacion: this.observacion, items })
      .subscribe({
        next: (resp) => {
          this.guardando = false;
          this.modalAbierto = false;
          Swal.fire({ icon: 'success', title: 'Listo', text: resp.message });
          this.cargarPendientes();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando = false;
          this.manejarError(err, 'No fue posible confirmar el despacho');
        }
      });
  }

  descargarComprobante(d: Despacho): void {
    this.despachoService.descargarComprobante(d.id).subscribe({
      next: (blob) => window.open(window.URL.createObjectURL(blob), '_blank'),
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No fue posible generar el comprobante' })
    });
  }

  badgeEstado(estado: string): string {
    switch (estado) {
      case 'DESPACHADO': return 'bg-success';
      case 'DESPACHO_PARCIAL': return 'bg-warning text-dark';
      case 'CANCELADO': return 'bg-danger';
      case 'EN_PREPARACION': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || mensaje });
  }
}
