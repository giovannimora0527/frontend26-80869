import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { FacturacionService, Factura, FacturaItemRq } from './service/facturacion.service';
import { CitaService } from '../cita/service/cita.service';
import { ServicioService, Servicio } from '../servicio/service/servicio.service';
import { InventarioService, Medicamento } from '../inventario/service/inventario.service';
import { Cita } from 'src/app/models/cita';

interface ItemEditable {
  tipo: 'SERVICIO' | 'MEDICAMENTO';
  referenciaId: number | null;
  cantidad: number;
}

/**
 * Pantalla del modulo de facturacion.
 *
 * Permite listar las facturas, generar una factura a partir de una cita con sus
 * servicios y medicamentos, registrar pagos (que actualizan el estado), anular
 * una factura (sin eliminar registros) y descargar la factura en PDF.
 */
@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.component.html',
  styleUrl: './facturacion.component.scss'
})
export class FacturacionComponent implements OnInit {
  facturas: Factura[] = [];
  citas: Cita[] = [];
  servicios: Servicio[] = [];
  medicamentos: Medicamento[] = [];
  cargando = false;

  modalAbierto = false;
  guardando = false;

  // Formulario de generacion
  citaId: number | null = null;
  descuento = 0;
  observacion = '';
  items: ItemEditable[] = [];

  constructor(
    private facturacionService: FacturacionService,
    private citaService: CitaService,
    private servicioService: ServicioService,
    private inventarioService: InventarioService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarCitas();
    this.cargarServicios();
    this.cargarMedicamentos();
  }

  cargar(): void {
    this.cargando = true;
    this.facturacionService.listar().subscribe({
      next: (data) => {
        this.cargando = false;
        this.facturas = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.manejarError(err, 'No fue posible cargar las facturas');
      }
    });
  }

  cargarCitas(): void {
    this.citaService.listarCitas().subscribe({ next: (d) => (this.citas = d), error: () => (this.citas = []) });
  }

  cargarServicios(): void {
    this.servicioService.listar().subscribe({
      next: (d) => (this.servicios = d.filter((s) => s.activo)),
      error: () => (this.servicios = [])
    });
  }

  cargarMedicamentos(): void {
    this.inventarioService.listar().subscribe({ next: (d) => (this.medicamentos = d), error: () => (this.medicamentos = []) });
  }

  abrirGenerar(): void {
    this.citaId = null;
    this.descuento = 0;
    this.observacion = '';
    this.items = [{ tipo: 'SERVICIO', referenciaId: null, cantidad: 1 }];
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  agregarItem(): void {
    this.items.push({ tipo: 'SERVICIO', referenciaId: null, cantidad: 1 });
  }

  quitarItem(indice: number): void {
    this.items.splice(indice, 1);
    if (this.items.length === 0) {
      this.agregarItem();
    }
  }

  generar(): void {
    if (this.citaId == null) {
      Swal.fire({ icon: 'warning', title: 'Atencion', text: 'Seleccione una cita.' });
      return;
    }
    const itemsValidos: FacturaItemRq[] = this.items
      .filter((i) => i.referenciaId != null)
      .map((i) => ({ tipo: i.tipo, referenciaId: i.referenciaId as number, cantidad: i.cantidad || 1 }));
    if (itemsValidos.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Atencion', text: 'Agregue al menos un item.' });
      return;
    }
    this.guardando = true;
    this.facturacionService
      .generar({ citaId: this.citaId, descuento: this.descuento, observacion: this.observacion, items: itemsValidos })
      .subscribe({
        next: (resp) => {
          this.guardando = false;
          this.modalAbierto = false;
          Swal.fire({ icon: 'success', title: 'Listo', text: resp.message });
          this.cargar();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando = false;
          this.manejarError(err, 'No fue posible generar la factura');
        }
      });
  }

  registrarPago(f: Factura): void {
    Swal.fire({
      title: 'Registrar pago',
      html:
        `<p class="mb-2">Saldo pendiente: <b>${f.saldoPendiente}</b></p>`,
      input: 'number',
      inputLabel: 'Monto a pagar',
      inputValue: f.saldoPendiente,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (!res.isConfirmed || !res.value) {
        return;
      }
      this.facturacionService.registrarPago(f.id, Number(res.value), 'EFECTIVO').subscribe({
        next: (r) => {
          Swal.fire({ icon: 'success', title: 'Listo', text: r.message });
          this.cargar();
        },
        error: (err: HttpErrorResponse) => this.manejarError(err, 'No fue posible registrar el pago')
      });
    });
  }

  anular(f: Factura): void {
    Swal.fire({
      title: 'Anular factura',
      text: 'La factura se marcara como anulada (no se elimina). Continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, anular',
      cancelButtonText: 'No'
    }).then((res) => {
      if (!res.isConfirmed) {
        return;
      }
      this.facturacionService.anular(f.id).subscribe({
        next: (r) => {
          Swal.fire({ icon: 'success', title: 'Listo', text: r.message });
          this.cargar();
        },
        error: (err: HttpErrorResponse) => this.manejarError(err, 'No fue posible anular la factura')
      });
    });
  }

  descargarPdf(f: Factura): void {
    this.facturacionService.descargarPdf(f.id).subscribe({
      next: (blob) => window.open(window.URL.createObjectURL(blob), '_blank'),
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No fue posible generar el PDF' })
    });
  }

  badgeEstado(estado: string): string {
    switch (estado) {
      case 'PAGADA': return 'bg-success';
      case 'PAGO_PARCIAL': return 'bg-info';
      case 'ANULADA': return 'bg-secondary';
      default: return 'bg-warning text-dark';
    }
  }

  etiquetaCita(c: Cita): string {
    const mascota = c.mascota?.nombreMascota ?? c.mascota?.nombre ?? 'Mascota';
    return `#${c.id} - ${mascota}`;
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || mensaje });
  }
}
