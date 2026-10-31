import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { Usuario } from 'src/app/models/usuario';
import { UsuarioRq } from 'src/app/models/usuario-rq';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio que consume los endpoints de usuarios del backend (`/usuario`).
 */
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  /** Segmento de la URL del backend para este módulo. */
  private api = `usuario`;

  constructor(private backendService: BackendService) { }

  /** Lista todos los usuarios (activos e inactivos). */
  getUsuarios(): Observable<Usuario[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  /** Consulta un usuario por su identificador. */
  buscarPorId(id: number): Observable<Usuario> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /** Crea un usuario nuevo. */
  crearUsuario(usuario: UsuarioRq): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "crear", usuario);
  }

  /** Edita un usuario existente (la contraseña es opcional). */
  actualizarUsuario(id: number, usuario: UsuarioRq): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `${id}`, usuario);
  }

  /** Activa o desactiva un usuario (nunca se borra). */
  cambiarEstado(id: number, activo: boolean): Observable<MiRespuesta> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { activo });
  }
}
