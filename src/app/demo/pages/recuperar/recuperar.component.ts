import { Component, inject } from '@angular/core';

import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from 'src/app/services/auth.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { confirmacionIgual, formatoPassword } from 'src/app/utils/validadores';

/**
 * Pantalla pública "Olvidé mi contraseña", en dos pasos:
 * 1) la persona escribe su usuario o correo y recibe un código por correo;
 * 2) escribe el código y la contraseña nueva.
 *
 * El backend responde igual exista o no la cuenta, por eso el paso 2 se muestra siempre.
 */
@Component({
  selector: 'app-recuperar',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar.component.html',
  styleUrls: ['../cuenta-publica.scss']
})
export class RecuperarComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Paso actual: pedir el código o poner la contraseña nueva. */
  paso: 'solicitar' | 'restablecer' = 'solicitar';
  /** `true` mientras se espera la respuesta del backend. */
  enviando = false;
  /** Error mostrado al usuario. */
  error = '';
  /** Mensaje informativo (por ejemplo, "te enviamos un código"). */
  info = '';
  /** `true` para mostrar las contraseñas en texto plano. */
  verClaves = false;

  /** Paso 1: usuario o correo de la cuenta. */
  readonly formSolicitar = this.fb.nonNullable.group({
    identificador: ['', [Validators.required, Validators.maxLength(255)]]
  });

  /** Paso 2: código recibido y contraseña nueva. */
  readonly formRestablecer = this.fb.nonNullable.group(
    {
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      nuevaPassword: ['', [Validators.required, formatoPassword]],
      confirmar: ['', Validators.required]
    },
    { validators: confirmacionIgual('nuevaPassword', 'confirmar') }
  );

  /** `true` si el control del formulario fue tocado y no es válido. */
  invalido(form: 'solicitar' | 'restablecer', campo: string): boolean {
    const grupo: AbstractControl = form === 'solicitar' ? this.formSolicitar : this.formRestablecer;
    const control = grupo.get(campo);
    if (!control || !control.touched) {
      return false;
    }
    return control.invalid || (campo === 'confirmar' && grupo.hasError('noCoincide'));
  }

  /** Paso 1: pide al backend que envíe el código al correo de la cuenta. */
  solicitarCodigo(): void {
    if (this.enviando) {
      return;
    }
    this.formSolicitar.markAllAsTouched();
    if (this.formSolicitar.invalid) {
      this.error = 'Escribe tu usuario o tu correo electrónico.';
      return;
    }
    this.enviando = true;
    this.error = '';
    this.auth.olvidePassword({ username: this.formSolicitar.getRawValue().identificador.trim() }).subscribe({
      next: (rs) => {
        this.enviando = false;
        this.info = rs.message;
        this.paso = 'restablecer';
      },
      error: (err) => {
        this.enviando = false;
        this.error = obtenerMensajeError(err, 'No fue posible enviar el código. Intenta de nuevo.');
      }
    });
  }

  /** Paso 2: envía el código y la contraseña nueva. */
  restablecer(): void {
    if (this.enviando) {
      return;
    }
    this.formRestablecer.markAllAsTouched();
    if (this.formRestablecer.invalid) {
      this.error = 'Revisa los campos marcados en rojo.';
      return;
    }
    const v = this.formRestablecer.getRawValue();
    this.enviando = true;
    this.error = '';
    this.auth
      .restablecerPassword({
        username: this.formSolicitar.getRawValue().identificador.trim(),
        codigo: v.codigo.trim(),
        nuevaPassword: v.nuevaPassword
      })
      .subscribe({
        next: (rs) => {
          this.enviando = false;
          void Swal.fire('Listo', rs.message, 'success').then(() => this.router.navigate(['/login']));
        },
        error: (err) => {
          this.enviando = false;
          this.error = obtenerMensajeError(err, 'No fue posible cambiar la contraseña. Intenta de nuevo.');
        }
      });
  }

  /** Vuelve al paso 1 para pedir un código nuevo (por ejemplo, si el anterior venció). */
  pedirOtroCodigo(): void {
    this.paso = 'solicitar';
    this.error = '';
    this.info = '';
    this.formRestablecer.reset();
  }
}
