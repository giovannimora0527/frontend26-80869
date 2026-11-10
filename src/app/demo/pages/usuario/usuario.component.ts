import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { UsuarioService, UsuarioRs, PerfilRs } from './service/usuario.service';

/**
 * Pantalla de gestion de usuarios (solo rol Administrador).
 *
 * Permite listar los usuarios del sistema y crear o editar usuarios,
 * asignando su perfil (rol) y su estado (activo/inactivo). La contrasena solo
 * es obligatoria al crear; al editar se conserva si se deja vacia.
 */
@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit {
  usuarios: UsuarioRs[] = [];
  perfiles: PerfilRs[] = [];

  cargando = false;
  guardando = false;

  modalAbierto = false;
  modoEdicion = false;
  mostrarPassword = false;

  usuarioForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {
    this.usuarioForm = this.fb.group({
      id: [null],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      perfilId: [null, [Validators.required]],
      activo: [true, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cargarPerfiles();
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.cargando = false;
        this.usuarios = data;
      },
      error: (err: HttpErrorResponse) =>
        this.manejarError(err, 'No fue posible cargar los usuarios')
    });
  }

  cargarPerfiles(): void {
    this.usuarioService.listarPerfiles().subscribe({
      next: (data) => (this.perfiles = data),
      error: (err: HttpErrorResponse) =>
        this.manejarError(err, 'No fue posible cargar los perfiles')
    });
  }

  abrirCrear(): void {
    this.modoEdicion = false;
    this.mostrarPassword = false;
    this.usuarioForm.reset({ id: null, activo: true, perfilId: null });
    this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.modalAbierto = true;
  }

  abrirEditar(usuario: UsuarioRs): void {
    this.modoEdicion = true;
    this.mostrarPassword = false;
    const perfil = this.perfiles.find((p) => p.nombre === usuario.rol);
    this.usuarioForm.reset({
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      password: '',
      perfilId: perfil ? perfil.perfilId : null,
      activo: usuario.activo
    });
    // Al editar la contrasena es opcional.
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardar(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }
    this.guardando = true;
    const valor = this.usuarioForm.value;
    const peticion = this.modoEdicion
      ? this.usuarioService.actualizarUsuario(valor)
      : this.usuarioService.crearUsuario(valor);

    peticion.subscribe({
      next: (resp) => {
        this.guardando = false;
        this.modalAbierto = false;
        Swal.fire({ icon: 'success', title: 'Listo', text: resp.message });
        this.cargarUsuarios();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.manejarError(err, 'No fue posible guardar el usuario');
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.usuarioForm.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    this.cargando = false;
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err?.error?.message || mensaje
    });
  }
}
