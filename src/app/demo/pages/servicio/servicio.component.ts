import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { ServicioService, Servicio, LogTarifa } from './service/servicio.service';
import { EspecializacionService } from '../especializacion/service/especializacion.service';
import { Especializacion } from 'src/app/models/especializacion';

/**
 * Pantalla de gestion de servicios y tarifas.
 *
 * Permite crear y editar servicios con su precio e IVA, asociarlos
 * opcionalmente a una especializacion, activarlos o inactivarlos, y consultar
 * el historial de cambios de tarifa de cada servicio.
 */
@Component({
  selector: 'app-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './servicio.component.html',
  styleUrl: './servicio.component.scss'
})
export class ServicioComponent implements OnInit {
  servicios: Servicio[] = [];
  especializaciones: Especializacion[] = [];
  filtro = '';
  cargando = false;

  modalAbierto = false;
  modoEdicion = false;
  guardando = false;
  servicioForm: FormGroup;

  // Historial de tarifas
  modalHistorialAbierto = false;
  historial: LogTarifa[] = [];
  servicioHistorialNombre = '';
  cargandoHistorial = false;

  constructor(
    private fb: FormBuilder,
    private servicioService: ServicioService,
    private especializacionService: EspecializacionService
  ) {
    this.servicioForm = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required]],
      descripcion: [''],
      especializacionId: [null],
      precio: [0, [Validators.required, Validators.min(0)]],
      ivaPorcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarEspecializaciones();
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.servicioService.listar().subscribe({
      next: (data) => {
        this.cargando = false;
        this.servicios = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.manejarError(err, 'No fue posible cargar los servicios');
      }
    });
  }

  cargarEspecializaciones(): void {
    this.especializacionService.listar().subscribe({
      next: (data) => (this.especializaciones = data),
      error: () => (this.especializaciones = [])
    });
  }

  get serviciosFiltrados(): Servicio[] {
    const t = this.filtro.trim().toLowerCase();
    if (!t) {
      return this.servicios;
    }
    return this.servicios.filter((s) => s.nombre.toLowerCase().includes(t));
  }

  abrirCrear(): void {
    this.modoEdicion = false;
    this.servicioForm.reset({ especializacionId: null, precio: 0, ivaPorcentaje: 19, activo: true });
    this.modalAbierto = true;
  }

  abrirEditar(s: Servicio): void {
    this.modoEdicion = true;
    this.servicioForm.reset({
      id: s.id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      especializacionId: s.especializacionId ?? null,
      precio: s.precio,
      ivaPorcentaje: s.ivaPorcentaje,
      activo: s.activo
    });
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardar(): void {
    if (this.servicioForm.invalid) {
      this.servicioForm.markAllAsTouched();
      return;
    }
    this.guardando = true;
    const valor = this.servicioForm.value as Servicio;
    const peticion = this.modoEdicion
      ? this.servicioService.actualizar(valor)
      : this.servicioService.guardar(valor);

    peticion.subscribe({
      next: (resp) => {
        this.guardando = false;
        this.modalAbierto = false;
        Swal.fire({ icon: 'success', title: 'Listo', text: resp.message });
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.manejarError(err, 'No fue posible guardar el servicio');
      }
    });
  }

  verHistorial(s: Servicio): void {
    if (s.id == null) {
      return;
    }
    this.servicioHistorialNombre = s.nombre;
    this.historial = [];
    this.modalHistorialAbierto = true;
    this.cargandoHistorial = true;
    this.servicioService.historialTarifas(s.id).subscribe({
      next: (data) => {
        this.cargandoHistorial = false;
        this.historial = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoHistorial = false;
        this.manejarError(err, 'No fue posible cargar el historial');
      }
    });
  }

  cerrarHistorial(): void {
    this.modalHistorialAbierto = false;
  }

  campoInvalido(campo: string): boolean {
    const control = this.servicioForm.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || mensaje });
  }
}
