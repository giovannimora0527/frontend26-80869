import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BackendService } from './backend.service';
import { AsociarPersonaRq, PerfilRS, PerfilRq, RegistroRq } from '../models/cuenta';
import { MiRespuesta } from '../models/mi-respuesta';

/**
 * Servicio que consume los endpoints de la cuenta de usuario del backend (`/cuenta`):
 * registro, perfil y asociación de un usuario con una persona.
 * Recuperar y cambiar la contraseña están en {@link AuthService}.
 */
@Injectable({
  providedIn: 'root'
})
export class CuentaService {
  private readonly backend = inject(BackendService);

  /** Segmento de la URL del backend para este módulo. */
  private readonly api = 'cuenta';

  /** Registro público: crea el cliente y su usuario (no necesita sesión). */
  registrar(rq: RegistroRq): Observable<MiRespuesta> {
    return this.backend.post<MiRespuesta>(environment.apiUrlAuth, this.api, 'registro', rq);
  }

  /** Consulta el perfil de quien tiene la sesión abierta. */
  obtenerPerfil(): Observable<PerfilRS> {
    return this.backend.get<PerfilRS>(environment.apiUrlAuth, this.api, 'perfil');
  }

  /** Actualiza los datos de perfil de quien tiene la sesión abierta. */
  actualizarPerfil(rq: PerfilRq): Observable<MiRespuesta> {
    return this.backend.put<MiRespuesta>(environment.apiUrlAuth, this.api, 'perfil', rq);
  }

  /** Vincula un usuario con un cliente o un médico (solo administrador). */
  asociarPersona(rq: AsociarPersonaRq): Observable<MiRespuesta> {
    return this.backend.put<MiRespuesta>(environment.apiUrlAuth, this.api, 'asociar-persona', rq);
  }
}
