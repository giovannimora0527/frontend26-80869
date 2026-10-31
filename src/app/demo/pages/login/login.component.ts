import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AuthRS } from 'src/app/models/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);

  paso: 'credenciales' | 'otp' = 'credenciales';

  username = '';
  password = '';
  verClave = false;

  codigo = '';
  usuarioId?: number;
  emailEnmascarado = '';

  cargando = false;
  error = '';
  info = '';

  segundosReenvio = 0;
  private temporizador?: ReturnType<typeof setInterval>;

  ingresar(): void {
    this.error = '';
    if (!this.username.trim() || !this.password) {
      this.error = 'Escribe tu usuario y tu contraseña.';
      return;
    }
    this.cargando = true;
    this.auth.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: (rs) => {
        this.cargando = false;
        this.irAPasoOtp(rs);
      },
      error: (err) => {
        this.cargando = false;
        this.error = this.mensajeError(err);
      }
    });
  }

  verificar(): void {
    this.error = '';
    if (!/^\d{6}$/.test(this.codigo.trim())) {
      this.error = 'El código tiene 6 números.';
      return;
    }
    this.cargando = true;
    this.auth.validarOtp({ usuarioId: this.usuarioId as number, codigo: this.codigo.trim() }).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.cargando = false;
        this.error = this.mensajeError(err);
        this.codigo = '';
      }
    });
  }

  reenviar(): void {
    if (this.segundosReenvio > 0 || this.usuarioId == null) {
      return;
    }
    this.error = '';
    this.info = '';
    this.cargando = true;
    this.auth.reenviarOtp(this.usuarioId).subscribe({
      next: (rs) => {
        this.cargando = false;
        this.emailEnmascarado = rs.emailEnmascarado ?? this.emailEnmascarado;
        this.info = 'Te enviamos un código nuevo.';
        this.codigo = '';
        this.iniciarTemporizador();
      },
      error: (err) => {
        this.cargando = false;
        this.error = this.mensajeError(err);
      }
    });
  }

  volver(): void {
    this.paso = 'credenciales';
    this.codigo = '';
    this.password = '';
    this.error = '';
    this.info = '';
    this.detenerTemporizador();
  }

  soloNumeros(): void {
    this.codigo = this.codigo.replace(/\D/g, '').slice(0, 6);
  }

  ngOnDestroy(): void {
    this.detenerTemporizador();
  }

  private irAPasoOtp(rs: AuthRS): void {
    this.usuarioId = rs.usuarioId;
    this.emailEnmascarado = rs.emailEnmascarado ?? '';
    this.paso = 'otp';
    this.info = '';
    this.codigo = '';
    this.iniciarTemporizador();
  }

  private iniciarTemporizador(): void {
    this.detenerTemporizador();
    this.segundosReenvio = 30;
    this.temporizador = setInterval(() => {
      this.segundosReenvio--;
      if (this.segundosReenvio <= 0) {
        this.detenerTemporizador();
      }
    }, 1000);
  }

  private detenerTemporizador(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = undefined;
    }
    this.segundosReenvio = 0;
  }

  private mensajeError(err: any): string {
    if (err?.status === 0) {
      return 'No hay conexión con el servidor. Revisa que el backend esté encendido.';
    }
    return err?.error?.message || 'Ocurrió un error. Intenta de nuevo.';
  }
}
