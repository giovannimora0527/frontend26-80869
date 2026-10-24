import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthRs } from 'src/app/models/auth-rs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ValidateTokenRequest {
  username: string;
  token: string;
}

export interface JwtResponse {
  token?: string;
  jwt?: string;
  accessToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = 'auth';
  static readonly TOKEN_KEY = 'token';

  constructor(private backendService: BackendService) { }

  login(data: LoginRequest): Observable<AuthRs> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'login', data);
  }

  validateToken(data: ValidateTokenRequest): Observable<JwtResponse> {
    return this.backendService
      .post<JwtResponse>(environment.apiUrlAuth, this.api, 'validate-token', data)
      .pipe(tap((resp) => this.guardarToken(resp)));
  }

  recuperarPassword(email: string): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'recover-password', { email });
  }

  guardarToken(resp: JwtResponse): void {
    const jwt = resp?.token || resp?.jwt || resp?.accessToken;
    if (!jwt) {
      throw new Error('La respuesta no contiene un token JWT');
    }
    sessionStorage.setItem(AuthService.TOKEN_KEY, jwt);
  }

  getToken(): string | null {
    return sessionStorage.getItem(AuthService.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.removeItem(AuthService.TOKEN_KEY);
  }
}
