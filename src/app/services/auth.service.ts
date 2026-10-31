import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BackendService } from './backend.service';
import { AuthRS, LoginRS, LoginRq, MenuRS, UsuarioSesion, ValidarOtpRq } from '../models/auth';
import { MiRespuesta } from '../models/mi-respuesta';
import { CambiarPasswordRq, OlvidePasswordRq, RestablecerPasswordRq } from '../models/password';

const KEY_TOKEN = 'token'; // BackendService lee esta llave para el header Authorization
const KEY_USUARIO = 'usuario';
const KEY_MENUS = 'menuList';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private backend = inject(BackendService);
  private router = inject(Router);

  private api = 'auth';

  /** Paso 1: usuario y contraseña. El backend envía el OTP al correo. */
  login(rq: LoginRq): Observable<AuthRS> {
    return this.backend.post<AuthRS>(environment.apiUrlAuth, this.api, 'login', rq);
  }

  /** Paso 2: código OTP. Si es correcto, guarda token, usuario y menús. */
  validarOtp(rq: ValidarOtpRq): Observable<LoginRS> {
    return this.backend.post<LoginRS>(environment.apiUrlAuth, this.api, 'validar-otp', rq).pipe(
      tap((rs) => this.guardarSesion(rs))
    );
  }

  reenviarOtp(usuarioId: number): Observable<AuthRS> {
    return this.backend.post<AuthRS>(environment.apiUrlAuth, this.api, 'reenviar-otp', { usuarioId });
  }

  /** Cambiar contraseña con sesión iniciada (pide la actual). */
  cambiarPassword(rq: CambiarPasswordRq): Observable<MiRespuesta> {
    return this.backend.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'cambiar-password', rq);
  }

  /** Olvidé mi contraseña, paso 1: envía un código al correo. */
  olvidePassword(rq: OlvidePasswordRq): Observable<MiRespuesta> {
    return this.backend.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'olvide-password', rq);
  }

  /** Olvidé mi contraseña, paso 2: código + contraseña nueva. */
  restablecerPassword(rq: RestablecerPasswordRq): Observable<MiRespuesta> {
    return this.backend.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'restablecer-password', rq);
  }

  private guardarSesion(rs: LoginRS): void {
    localStorage.setItem(KEY_TOKEN, rs.token);
    localStorage.setItem(KEY_USUARIO, JSON.stringify(rs.usuario));
    localStorage.setItem(KEY_MENUS, JSON.stringify(rs.menuList ?? []));
  }

  logout(irALogin = true): void {
    localStorage.removeItem(KEY_TOKEN);
    localStorage.removeItem(KEY_USUARIO);
    localStorage.removeItem(KEY_MENUS);
    if (irALogin) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(KEY_TOKEN);
  }

  getUsuario(): UsuarioSesion | null {
    return this.leerJson<UsuarioSesion>(KEY_USUARIO);
  }

  getMenus(): MenuRS[] {
    return this.leerJson<MenuRS[]>(KEY_MENUS) ?? [];
  }

  /** Hay token y todavía no ha vencido (se lee el "exp" del JWT). */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private leerJson<T>(key: string): T | null {
    try {
      const valor = localStorage.getItem(key);
      return valor ? (JSON.parse(valor) as T) : null;
    } catch {
      return null;
    }
  }
}
