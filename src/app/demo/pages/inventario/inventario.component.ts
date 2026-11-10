import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import {
  InventarioService,
  Medicamento,
  CargaMasivaRs,
  MovimientoInventario,
  Lote
} from './service/inventario.service';

type Filtro = 'todos' | 'agotados' | 'stockBajo' | 'proximos' | 'vencidos';
type Pestana = 'inventario' | 'carga';

/**
 * Pantalla del modulo de inventario.
 *
 * Pestana Inventario: lista de medicamentos con existencia e indicadores de
 * estado, filtros rapidos y formulario para crear o editar.
 * Pestana Carga masiva: subida de archivo Excel/CSV, vista previa con el
 * informe de errores por fila y confirmacion de la importacion.
 */
@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class InventarioComponent implements OnInit {
  pestana: Pestana = 'inventario';

  medicamentos: Medicamento[] = [];
  filtro: Filtro = 'todos';
  cargando = false;

  modalAbierto = false;
  modoEdicion = false;
  guardando = false;
  medicamentoForm: FormGroup;

  // Carga masiva
  archivoSeleccionado?: File;
  resultadoCarga?: CargaMasivaRs;
  procesandoCarga = false;

  // Detalle (lotes + movimientos)
  modalDetalleAbierto = false;
  medicamentoDetalle?: Medicamento;
  movimientos: MovimientoInventario[] = [];
  cargandoMovimientos = false;

  // Agregar lote
  modalLoteAbierto = false;
  guardandoLote = false;
  loteForm: FormGroup;
  medicamentoLote?: Medicamento;

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService
  ) {
    this.medicamentoForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required]],
      codigo: [''],
      descripcion: [''],
      presentacion: [''],
      requiereInvima: [true],
      registroInvima: [''],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      fechaProximoPedido: [''],
      fechaCompra: [''],
      fechaVence: ['']
    });

    this.loteForm = this.fb.group({
      numeroLote: ['', [Validators.required]],
      cantidad: [0, [Validators.required, Validators.min(1)]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      fechaVencimiento: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cargarInventario();
  }

  cargarInventario(): void {
    this.cargando = true;
    this.inventarioService.listar().subscribe({
      next: (data) => {
        this.cargando = false;
        this.medicamentos = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.manejarError(err, 'No fue posible cargar el inventario');
      }
    });
  }

  get medicamentosFiltrados(): Medicamento[] {
    switch (this.filtro) {
      case 'agotados':
        return this.medicamentos.filter((m) => m.agotado);
      case 'stockBajo':
        return this.medicamentos.filter((m) => m.stockBajo);
      case 'proximos':
        return this.medicamentos.filter((m) => m.tieneProximosAVencer);
      case 'vencidos':
        return this.medicamentos.filter((m) => m.tieneVencidos);
      default:
        return this.medicamentos;
    }
  }

  // ---------- Crear / editar ----------

  abrirCrear(): void {
    this.modoEdicion = false;
    this.medicamentoForm.reset({
      requiereInvima: true,
      precioCompra: 0,
      precioVenta: 0,
      stockMinimo: 0
    });
    this.modalAbierto = true;
  }

  abrirEditar(med: Medicamento): void {
    this.modoEdicion = true;
    this.medicamentoForm.reset({
      id: med.id,
      nombre: med.nombre,
      codigo: med.codigo,
      descripcion: med.descripcion,
      presentacion: med.presentacion,
      requiereInvima: med.requiereInvima,
      registroInvima: med.registroInvima,
      precioCompra: med.precioCompra,
      precioVenta: med.precioVenta,
      stockMinimo: med.stockMinimo,
      fechaProximoPedido: med.fechaProximoPedido,
      fechaCompra: med.fechaCompra,
      fechaVence: med.fechaVence
    });
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardar(): void {
    if (this.medicamentoForm.invalid) {
      this.medicamentoForm.markAllAsTouched();
      return;
    }
    this.guardando = true;
    const valor = this.medicamentoForm.value as Medicamento;
    const peticion = this.modoEdicion
      ? this.inventarioService.actualizar(valor)
      : this.inventarioService.guardar(valor);

    peticion.subscribe({
      next: (resp) => {
        this.guardando = false;
        this.modalAbierto = false;
        Swal.fire({ icon: 'success', title: 'Listo', text: resp.message });
        this.cargarInventario();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.manejarError(err, 'No fue posible guardar el medicamento');
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.medicamentoForm.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  // ---------- Carga masiva ----------

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0];
    this.resultadoCarga = undefined;
  }

  previsualizar(): void {
    if (!this.archivoSeleccionado) {
      Swal.fire({ icon: 'warning', title: 'Atencion', text: 'Seleccione un archivo primero.' });
      return;
    }
    this.procesandoCarga = true;
    this.inventarioService.previsualizarCarga(this.archivoSeleccionado).subscribe({
      next: (data) => {
        this.procesandoCarga = false;
        this.resultadoCarga = data;
      },
      error: (err: HttpErrorResponse) => {
        this.procesandoCarga = false;
        this.manejarError(err, 'No fue posible procesar el archivo');
      }
    });
  }

  confirmarCarga(): void {
    if (!this.archivoSeleccionado) {
      return;
    }
    if (!this.resultadoCarga || this.resultadoCarga.registrosValidos === 0) {
      Swal.fire({ icon: 'warning', title: 'Atencion', text: 'No hay registros validos para importar.' });
      return;
    }
    this.procesandoCarga = true;
    this.inventarioService.confirmarCarga(this.archivoSeleccionado).subscribe({
      next: (data) => {
        this.procesandoCarga = false;
        this.resultadoCarga = data;
        Swal.fire({ icon: 'success', title: 'Importacion completada', text: data.mensaje });
        this.cargarInventario();
      },
      error: (err: HttpErrorResponse) => {
        this.procesandoCarga = false;
        this.manejarError(err, 'No fue posible confirmar la importacion');
      }
    });
  }

  // ---------- Detalle: lotes + movimientos ----------

  abrirDetalle(med: Medicamento): void {
    this.medicamentoDetalle = med;
    this.movimientos = [];
    this.modalDetalleAbierto = true;
    if (med.id != null) {
      this.cargandoMovimientos = true;
      this.inventarioService.movimientos(med.id).subscribe({
        next: (data) => {
          this.cargandoMovimientos = false;
          this.movimientos = data;
        },
        error: (err: HttpErrorResponse) => {
          this.cargandoMovimientos = false;
          this.manejarError(err, 'No fue posible cargar los movimientos');
        }
      });
    }
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto = false;
  }

  // ---------- Agregar lote (reabastecer) ----------

  abrirAgregarLote(med: Medicamento): void {
    this.medicamentoLote = med;
    this.loteForm.reset({ cantidad: 0, precioCompra: med.precioCompra ?? 0 });
    this.modalLoteAbierto = true;
  }

  cerrarLote(): void {
    this.modalLoteAbierto = false;
  }

  guardarLote(): void {
    if (this.loteForm.invalid || !this.medicamentoLote?.id) {
      this.loteForm.markAllAsTouched();
      return;
    }
    this.guardandoLote = true;
    this.inventarioService
      .agregarLote({
        medicamentoId: this.medicamentoLote.id,
        numeroLote: this.loteForm.value.numeroLote,
        cantidad: this.loteForm.value.cantidad,
        precioCompra: this.loteForm.value.precioCompra,
        fechaVencimiento: this.loteForm.value.fechaVencimiento
      })
      .subscribe({
        next: (resp) => {
          this.guardandoLote = false;
          this.modalLoteAbierto = false;
          Swal.fire({ icon: 'success', title: 'Listo', text: resp.message });
          this.cargarInventario();
        },
        error: (err: HttpErrorResponse) => {
          this.guardandoLote = false;
          this.manejarError(err, 'No fue posible agregar el lote');
        }
      });
  }

  campoInvalidoLote(campo: string): boolean {
    const control = this.loteForm.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || mensaje });
  }
}
