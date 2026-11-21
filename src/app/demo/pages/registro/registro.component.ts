import { Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { RegistroRq } from 'src/app/models/cuenta';
import { CuentaService } from 'src/app/services/cuenta.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { confirmacionIgual, fechaLocalISO, fechaNoFutura, formatoPassword } from 'src/app/utils/validadores';

/**
 * Pantalla pública para registrarse. El backend crea la ficha de cliente y el usuario
 * (con perfil Cliente) en un solo paso. Las reglas viven en el backend; aquí solo se
 * reflejan para avisar antes de enviar.
 */
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrls: ['../cuenta-publica.scss']
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cuenta = inject(CuentaService);
  private readonly router = inject(Router);

  /** Fecha de hoy (`AAAA-MM-DD`): tope del campo de nacimiento. */
  readonly hoy = fechaLocalISO();

  /** Tipos de documento aceptados por el backend. */
  readonly tiposDocumento = ['CC', 'CE', 'TI', 'PA'] as const;

  /** `true` mientras se envía el registro (evita doble envío). */
  enviando = false;
  /** Error general del formulario (incluye los que envía el backend). */
  error = '';
  /** `true` para mostrar las contraseñas en texto plano. */
  verClaves = false;

  readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._-]{4,30}$/)]],
      email: ['', [Validators.required, Validators.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/), Validators.maxLength(255)]],
      password: ['', [Validators.required, formatoPassword]],
      confirmar: ['', Validators.required],
      tipoDocumento: ['CC', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,20}$/)]],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      fechaNacimiento: ['', [Validators.required, fechaNoFutura]],
      genero: [''],
      telefono: ['', Validators.pattern(/^[0-9+\-\s]{7,20}$/)],
      direccion: ['', Validators.maxLength(500)]
    },
    { validators: confirmacionIgual('password', 'confirmar') }
  );

  /** Mensajes por campo y tipo de validación. */
  private readonly mensajes: Record<string, Record<string, string>> = {
    username: {
      required: 'El usuario es obligatorio.',
      pattern: 'De 4 a 30 caracteres: letras, números, punto, guion o guion bajo.'
    },
    email: {
      required: 'El correo es obligatorio.',
      pattern: 'Escribe un correo válido (ejemplo: nombre@dominio.com).',
      maxlength: 'Máximo 255 caracteres.'
    },
    password: {
      required: 'La contraseña es obligatoria.',
      formatoPassword: 'De 8 a 100 caracteres, con al menos una letra y un número.'
    },
    confirmar: { required: 'Confirma la contraseña.', noCoincide: 'Las contraseñas no coinciden.' },
    numeroDocumento: {
      required: 'El número de documento es obligatorio.',
      pattern: 'De 5 a 20 letras o números, sin espacios ni símbolos.'
    },
    nombres: { required: 'Los nombres son obligatorios.', maxlength: 'Máximo 100 caracteres.' },
    apellidos: { required: 'Los apellidos son obligatorios.', maxlength: 'Máximo 100 caracteres.' },
    fechaNacimiento: {
      required: 'La fecha de nacimiento es obligatoria.',
      fechaFutura: 'La fecha de nacimiento no puede ser futura.'
    },
    telefono: { pattern: 'De 7 a 20 caracteres (números, +, - o espacios).' },
    direccion: { maxlength: 'Máximo 500 caracteres.' }
  };

  /** `true` si el campo fue tocado y no es válido (para marcarlo en rojo). */
  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    if (!control || !control.touched) {
      return false;
    }
    return control.invalid || (campo === 'confirmar' && this.form.hasError('noCoincide'));
  }

  /** Mensaje de error del campo, o texto vacío si no hay error. */
  mensajeError(campo: string): string {
    if (!this.invalido(campo)) {
      return '';
    }
    const errores = this.form.get(campo)?.errors ?? (campo === 'confirmar' ? { noCoincide: true } : null);
    return errores ? (this.mensajes[campo]?.[Object.keys(errores)[0]] ?? 'El dato no es válido.') : '';
  }

  /** Valida el formulario y envía el registro al backend. */
  registrar(): void {
    if (this.enviando) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error = 'Revisa los campos marcados en rojo.';
      return;
    }
    const v = this.form.getRawValue();
    const rq: RegistroRq = {
      username: v.username.trim().toLowerCase(),
      password: v.password,
      email: v.email.trim().toLowerCase(),
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento.trim(),
      nombres: v.nombres.trim(),
      apellidos: v.apellidos.trim(),
      fechaNacimiento: v.fechaNacimiento,
      genero: v.genero || undefined,
      telefono: v.telefono.trim() || undefined,
      direccion: v.direccion.trim() || undefined
    };
    this.enviando = true;
    this.error = '';
    this.cuenta.registrar(rq).subscribe({
      next: (rs) => {
        this.enviando = false;
        void Swal.fire('Registro exitoso', rs.message, 'success').then(() => this.router.navigate(['/login']));
      },
      error: (err) => {
        this.enviando = false;
        this.error = obtenerMensajeError(err, 'No fue posible completar el registro. Intenta de nuevo.');
      }
    });
  }
}
