import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { ClienteService } from './service/cliente.service';
import { Cliente } from 'src/app/models/cliente';

/**
 * Pantalla de gestion de clientes (propietarios de mascotas).
 * Permite listar, crear y editar clientes.
 */
@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent implements OnInit {
  clientes: Cliente[] = [];
  filtro = '';
  cargando = false;

  modalAbierto = false;
  modoEdicion = false;
  guardando = false;
  clienteForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService
  ) {
    this.clienteForm = this.fb.group({
      id: [null],
      tipoDocumento: ['CC', [Validators.required]],
      numeroDocumento: ['', [Validators.required]],
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      genero: ['M'],
      telefono: [''],
      direccion: [''],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.cargando = false;
        this.clientes = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.manejarError(err, 'No fue posible cargar los clientes');
      }
    });
  }

  get clientesFiltrados(): Cliente[] {
    const t = this.filtro.trim().toLowerCase();
    if (!t) {
      return this.clientes;
    }
    return this.clientes.filter(
      (c) =>
        (c.nombres + ' ' + c.apellidos).toLowerCase().includes(t) ||
        (c.numeroDocumento || '').toLowerCase().includes(t)
    );
  }

  abrirCrear(): void {
    this.modoEdicion = false;
    this.clienteForm.reset({ tipoDocumento: 'CC', genero: 'M', activo: true });
    this.modalAbierto = true;
  }

  abrirEditar(c: Cliente): void {
    this.modoEdicion = true;
    this.clienteForm.reset({
      id: c.id,
      tipoDocumento: c.tipoDocumento,
      numeroDocumento: c.numeroDocumento,
      nombres: c.nombres,
      apellidos: c.apellidos,
      fechaNacimiento: c.fechaNacimiento,
      genero: c.genero || 'M',
      telefono: c.telefono,
      direccion: c.direccion,
      activo: c.activo
    });
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardar(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }
    this.guardando = true;
    const valor = this.clienteForm.value as Cliente;
    const peticion = this.modoEdicion
      ? this.clienteService.actualizar(valor)
      : this.clienteService.guardar(valor);

    peticion.subscribe({
      next: (resp) => {
        this.guardando = false;
        this.modalAbierto = false;
        Swal.fire({ icon: 'success', title: 'Listo', text: resp.message });
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.manejarError(err, 'No fue posible guardar el cliente');
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.clienteForm.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || mensaje });
  }
}
