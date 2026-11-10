import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { PerfilService, PerfilRs } from './service/perfil.service';
import { getJwtUsuarioId } from 'src/app/utils/jwt.util';

/**
 * Pantalla de gestion del perfil del usuario autenticado.
 *
 * Permite editar los datos basicos de la cuenta (nombre de usuario y correo)
 * y cambiar la contrasena. Los datos personales de contacto no se gestionan
 * aqui, ya que residen en las entidades Cliente o Medico segun el rol.
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit {
  usuarioId: number | null = null;
  perfil?: PerfilRs;

  cargando = false;
  guardandoPerfil = false;
  cambiandoPassword = false;

  mostrarPasswordActual = false;
  mostrarPasswordNueva = false;
  mostrarPasswordConfirmar = false;

  perfilForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private perfilService: PerfilService
  ) {
    this.perfilForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group(
      {
        passwordActual: ['', [Validators.required]],
        passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
        passwordConfirmar: ['', [Validators.required]]
      },
      { validators: [this.passwordsCoincidenValidator] }
    );
  }

  ngOnInit(): void {
    this.usuarioId = getJwtUsuarioId();
    if (this.usuarioId === null) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No fue posible identificar al usuario autenticado.'
      });
      return;
    }
    this.cargarPerfil(this.usuarioId);
  }

  private cargarPerfil(usuarioId: number): void {
    this.cargando = true;
    this.perfilService.obtenerPerfil(usuarioId).subscribe({
      next: (data) => {
        this.cargando = false;
        this.perfil = data;
        this.perfilForm.patchValue({
          username: data.username,
          email: data.email
        });
      },
      error: (err: HttpErrorResponse) =>
        this.manejarError(err, 'No fue posible cargar la informacion del perfil')
    });
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid || this.usuarioId === null) {
      this.perfilForm.markAllAsTouched();
      return;
    }
    this.guardandoPerfil = true;
    this.perfilService
      .editarPerfil({
        usuarioId: this.usuarioId,
        username: this.perfilForm.value.username,
        email: this.perfilForm.value.email
      })
      .subscribe({
        next: (resp) => {
          this.guardandoPerfil = false;
          Swal.fire({ icon: 'success', title: 'Perfil actualizado', text: resp.message });
        },
        error: (err: HttpErrorResponse) =>
          this.manejarError(err, 'No fue posible actualizar el perfil', 'guardandoPerfil')
      });
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid || this.usuarioId === null) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.cambiandoPassword = true;
    this.perfilService
      .cambiarPassword({
        usuarioId: this.usuarioId,
        passwordActual: this.passwordForm.value.passwordActual,
        passwordNueva: this.passwordForm.value.passwordNueva
      })
      .subscribe({
        next: (resp) => {
          this.cambiandoPassword = false;
          this.passwordForm.reset();
          Swal.fire({ icon: 'success', title: 'Contrasena actualizada', text: resp.message });
        },
        error: (err: HttpErrorResponse) =>
          this.manejarError(err, 'No fue posible cambiar la contrasena', 'cambiandoPassword')
      });
  }

  campoInvalido(form: FormGroup, campo: string): boolean {
    const control = form.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get passwordsNoCoinciden(): boolean {
    return (
      this.passwordForm.hasError('passwordsNoCoinciden') &&
      !!this.passwordForm.get('passwordConfirmar')?.touched
    );
  }

  private passwordsCoincidenValidator(form: FormGroup) {
    const nueva = form.get('passwordNueva')?.value;
    const confirmar = form.get('passwordConfirmar')?.value;
    if (nueva && confirmar && nueva !== confirmar) {
      return { passwordsNoCoinciden: true };
    }
    return null;
  }

  private manejarError(
    err: HttpErrorResponse,
    mensaje: string,
    bandera?: 'guardandoPerfil' | 'cambiandoPassword'
  ): void {
    this.cargando = false;
    if (bandera === 'guardandoPerfil') {
      this.guardandoPerfil = false;
    } else if (bandera === 'cambiandoPassword') {
      this.cambiandoPassword = false;
    }
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err?.error?.message || mensaje
    });
  }
}
