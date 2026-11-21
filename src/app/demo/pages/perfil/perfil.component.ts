import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { PerfilRS, PerfilRq } from 'src/app/models/cuenta';
import { AuthService } from 'src/app/services/auth.service';
import { CuentaService } from 'src/app/services/cuenta.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';

/**
 * "Mi perfil": muestra los datos de la cuenta de quien tiene la sesión abierta y deja
 * cambiar correo, nombres, apellidos, teléfono y dirección (la dirección solo aplica a clientes).
 * El usuario, el documento y el perfil de acceso solo los cambia un administrador.
 * La contraseña se cambia desde el menú del usuario (arriba a la derecha).
 */
@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cuenta = inject(CuentaService);
  private readonly auth = inject(AuthService);

  /** Perfil devuelto por el backend (vacío mientras carga). */
  perfil: PerfilRS | null = null;
  /** `true` mientras se consulta el perfil. */
  cargando = true;
  /** `true` mientras se guardan los cambios. */
  guardando = false;
  /** Error al cargar o al guardar. */
  error = '';

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/), Validators.maxLength(255)]],
    nombres: [''],
    apellidos: [''],
    telefono: [''],
    direccion: ['']
  });

  /** `true` si el usuario está asociado a un cliente o a un médico. */
  get tienePersona(): boolean {
    return !!this.perfil?.tipoPersona;
  }

  /** `true` si la persona asociada es un cliente (solo ellos tienen dirección). */
  get esCliente(): boolean {
    return this.perfil?.tipoPersona === 'CLIENTE';
  }

  ngOnInit(): void {
    this.cargar();
  }

  /** Consulta el perfil y llena el formulario. */
  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.cuenta.obtenerPerfil().subscribe({
      next: (perfil) => {
        this.perfil = perfil;
        this.prepararFormulario(perfil);
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = obtenerMensajeError(err, 'No fue posible cargar tu perfil. Intenta de nuevo.');
      }
    });
  }

  /** `true` si el campo fue tocado y no es válido. */
  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.touched && control.invalid;
  }

  /** Guarda los cambios del perfil. */
  guardar(): void {
    if (this.guardando) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error = 'Revisa los campos marcados en rojo.';
      return;
    }
    const v = this.form.getRawValue();
    const rq: PerfilRq = { email: v.email.trim().toLowerCase() };
    if (this.tienePersona) {
      rq.nombres = v.nombres.trim();
      rq.apellidos = v.apellidos.trim();
      rq.telefono = v.telefono.trim() || undefined;
      if (this.esCliente) {
        rq.direccion = v.direccion.trim() || undefined;
      }
    }
    this.guardando = true;
    this.error = '';
    this.cuenta.actualizarPerfil(rq).subscribe({
      next: (rs) => {
        this.guardando = false;
        // Se actualiza el correo guardado en la sesión para que el menú no muestre el anterior.
        this.auth.actualizarSesion({ email: rq.email.toLowerCase() });
        void Swal.fire('Perfil actualizado', rs.message, 'success');
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.error = obtenerMensajeError(err, 'No fue posible guardar los cambios. Intenta de nuevo.');
      }
    });
  }

  /** Pone los datos del backend en el formulario y activa las reglas según el tipo de persona. */
  private prepararFormulario(perfil: PerfilRS): void {
    const nombres = this.form.controls.nombres;
    const apellidos = this.form.controls.apellidos;
    const telefono = this.form.controls.telefono;
    const direccion = this.form.controls.direccion;

    if (perfil.tipoPersona) {
      nombres.setValidators([Validators.required, Validators.maxLength(100)]);
      apellidos.setValidators([Validators.required, Validators.maxLength(100)]);
      telefono.setValidators([Validators.pattern(/^[0-9+\-\s]{7,20}$/)]);
      direccion.setValidators([Validators.maxLength(500)]);
    } else {
      [nombres, apellidos, telefono, direccion].forEach((c) => c.clearValidators());
    }
    [nombres, apellidos, telefono, direccion].forEach((c) => c.updateValueAndValidity());

    this.form.reset({
      email: perfil.email ?? '',
      nombres: perfil.nombres ?? '',
      apellidos: perfil.apellidos ?? '',
      telefono: perfil.telefono ?? '',
      direccion: perfil.direccion ?? ''
    });
  }
}
