import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface UsuarioRs {
  id: number;
  username: string;
  rol: string;
  email: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface PerfilRs {
  perfilId: number;
  nombre: string;
  activo: boolean;
}

export interface UsuarioRq {
  id?: number;
  username: string;
  password?: string;
  email: string;
  activo: boolean;
  perfilId: number;
  rol?: string;
}

export interface MiRespuestaRs {
  status: number;
  message: string;
}

/**
 * Servicio de gestion de usuarios.
 * Consume los endpoints del modulo /usuario del backend, disponibles
 * unicamente para el rol Administrador.
 */
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private api = 'usuario';

  constructor(private backendService: BackendService) {}

  listarUsuarios(): Observable<UsuarioRs[]> {
    return this.backendService.get<UsuarioRs[]>(
      environment.apiUrlAuth,
      this.api,
      'listar-ordenado'
    );
  }

  listarPerfiles(): Observable<PerfilRs[]> {
    return this.backendService.get<PerfilRs[]>(
      environment.apiUrlAuth,
      this.api,
      'listar-perfiles'
    );
  }

  crearUsuario(data: UsuarioRq): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(
      environment.apiUrlAuth,
      this.api,
      'guardar',
      data
    );
  }

  actualizarUsuario(data: UsuarioRq): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(
      environment.apiUrlAuth,
      this.api,
      'actualizar',
      data
    );
  }
}
