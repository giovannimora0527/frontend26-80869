// angular import
import { Component, TemplateRef, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';

// bootstrap import
import { NgbDropdownConfig, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from 'src/app/services/auth.service';
import { mensajeError } from 'src/app/utils/http-utils';

/** Regla del backend: 8 a 64 caracteres, con al menos una letra y un número. */
function validarFormatoPassword(control: AbstractControl): ValidationErrors | null {
  const valor: string = control.value ?? '';
  if (!valor) {
    return null;
  }
  const valida = valor.length >= 8 && valor.length <= 64 && /[A-Za-z]/.test(valor) && /\d/.test(valor);
  return valida ? null : { formatoPassword: true };
}

/** La confirmación debe ser igual a la contraseña nueva. */
function confirmacionIgual(grupo: AbstractControl): ValidationErrors | null {
  const nueva = grupo.get('nuevaPassword')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoincide: true } : null;
}

/**
 * Parte derecha de la barra superior: menú desplegable del usuario con
 * cambiar contraseña, olvidé mi contraseña y cerrar sesión.
 */
@Component({
  selector: 'app-nav-right',
  imports: [SharedModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  providers: [NgbDropdownConfig]
})
export class NavRightComponent {
  private auth = inject(AuthService);
  private modales = inject(NgbModal);
  private fb = inject(FormBuilder);

  usuario = this.auth.getUsuario();

  /** Modal abierto actualmente. */
  private modalActual?: NgbModalRef;

  enviando = false;
  error = '';
  verClaves = false;

  /** Paso del flujo "olvidé mi contraseña": 1 pide el usuario, 2 pide código y clave nueva. */
  pasoOlvide: 1 | 2 = 1;

  formCambiar = this.fb.group({
    passwordActual: ['', Validators.required],
    nuevaPassword: ['', [Validators.required, validarFormatoPassword]],
    confirmar: ['', Validators.required]
  }, { validators: confirmacionIgual });

  formOlvide = this.fb.group({
    username: [this.usuario?.username ?? '', Validators.required]
  });

  formRestablecer = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    nuevaPassword: ['', [Validators.required, validarFormatoPassword]],
    confirmar: ['', Validators.required]
  }, { validators: confirmacionIgual });

  constructor() {
    const config = inject(NgbDropdownConfig);
    config.placement = 'bottom-right';
  }

  /** Abre el modal de cambiar contraseña. */
  abrirCambiar(contenido: TemplateRef<unknown>): void {
    this.formCambiar.reset();
    this.error = '';
    this.verClaves = false;
    this.modalActual = this.modales.open(contenido, { centered: true, backdrop: 'static' });
  }

  /** Abre el modal de "olvidé mi contraseña" en el primer paso. */
  abrirOlvide(contenido: TemplateRef<unknown>): void {
    this.pasoOlvide = 1;
    this.formOlvide.reset({ username: this.usuario?.username ?? '' });
    this.formRestablecer.reset();
    this.error = '';
    this.verClaves = false;
    this.modalActual = this.modales.open(contenido, { centered: true, backdrop: 'static' });
  }

  cerrarModal(): void {
    this.modalActual?.close();
  }

  /** Cambia la contraseña de la sesión actual. */
  cambiarPassword(): void {
    if (this.formCambiar.invalid || this.enviando || !this.usuario) {
      this.formCambiar.markAllAsTouched();
      return;
    }
    const v = this.formCambiar.getRawValue();
    this.enviando = true;
    this.error = '';
    this.auth.cambiarPassword({
      username: this.usuario.username,
      passwordActual: v.passwordActual as string,
      nuevaPassword: v.nuevaPassword as string
    }).subscribe({
      next: (rs) => {
        this.enviando = false;
        this.cerrarModal();
        Swal.fire('Contraseña actualizada', rs?.message ?? 'Tu contraseña se cambió correctamente.', 'success');
      },
      error: (err) => {
        this.enviando = false;
        this.error = mensajeError(err, 'No fue posible cambiar la contraseña.');
      }
    });
  }

  /** Paso 1: envía el código de recuperación al correo. */
  enviarCodigo(): void {
    if (this.formOlvide.invalid || this.enviando) {
      this.formOlvide.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.error = '';
    this.auth.olvidePassword({ username: (this.formOlvide.value.username as string).trim() }).subscribe({
      next: () => {
        this.enviando = false;
        this.pasoOlvide = 2;
      },
      error: (err) => {
        this.enviando = false;
        this.error = mensajeError(err, 'No fue posible enviar el código.');
      }
    });
  }

  /** Paso 2: valida el código y guarda la contraseña nueva. */
  restablecer(): void {
    if (this.formRestablecer.invalid || this.enviando) {
      this.formRestablecer.markAllAsTouched();
      return;
    }
    const v = this.formRestablecer.getRawValue();
    this.enviando = true;
    this.error = '';
    this.auth.restablecerPassword({
      username: (this.formOlvide.value.username as string).trim(),
      codigo: (v.codigo as string).trim(),
      nuevaPassword: v.nuevaPassword as string
    }).subscribe({
      next: (rs) => {
        this.enviando = false;
        this.cerrarModal();
        Swal.fire('Contraseña restablecida', rs?.message ?? 'Ya puedes usar tu contraseña nueva.', 'success');
      },
      error: (err) => {
        this.enviando = false;
        this.error = mensajeError(err, 'No fue posible restablecer la contraseña.');
      }
    });
  }

  soloNumeros(): void {
    const control = this.formRestablecer.controls.codigo;
    control.setValue((control.value ?? '').replace(/\D/g, '').slice(0, 6));
  }

  cerrarSesion(): void {
    this.auth.logout();
  }
}
