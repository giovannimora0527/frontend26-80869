import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface PerfilRs {
  id: number;
  username: string;
  rol: string;
  email: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface EditarPerfilRq {
  usuarioId: number;
  username: string;
  email: string;
}

export interface CambiarPasswordRq {
  usuarioId: number;
  passwordActual: string;
  passwordNueva: string;
}

export interface MiRespuestaRs {
  status: number;
  message: string;
}

/**
 * Servicio para la gestion del perfil del usuario autenticado.
 * Consume los endpoints del modulo /perfil del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private api = 'perfil';

  constructor(private backendService: BackendService) {}

  obtenerPerfil(usuarioId: number): Observable<PerfilRs> {
    return this.backendService.get<PerfilRs>(
      environment.apiUrlAuth,
      this.api,
      `obtener?usuarioId=${usuarioId}`
    );
  }

  editarPerfil(data: EditarPerfilRq): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(
      environment.apiUrlAuth,
      this.api,
      'editar',
      data
    );
  }

  cambiarPassword(data: CambiarPasswordRq): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(
      environment.apiUrlAuth,
      this.api,
      'cambiar-password',
      data
    );
  }
}
