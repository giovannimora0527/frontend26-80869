import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from 'src/app/models/cliente';
import { ClienteRq } from 'src/app/models/cliente-rq';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio que consume los endpoints de clientes del backend (`/cliente`).
 */
@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  /** Segmento de la URL del backend para este módulo. */
  private api = `cliente`;

  constructor(private backendService: BackendService) {

  }

  /** Lista todos los clientes (activos e inactivos). */
  listarClientes(): Observable<Cliente[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  /** Lista solo los clientes activos (útil para combos en otros módulos). */
  listarClientesActivos(): Observable<Cliente[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar-activos");
  }

  /** Consulta un cliente por su identificador. */
  buscarPorId(id: number): Observable<Cliente> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /** Crea un cliente nuevo. */
  crearCliente(cliente: ClienteRq): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "crear", cliente);
  }

  /** Edita los datos de un cliente existente. */
  actualizarCliente(id: number, cliente: ClienteRq): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `${id}`, cliente);
  }

  /** Activa o desactiva un cliente (nunca se borra). */
  cambiarEstado(id: number, activo: boolean): Observable<MiRespuesta> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { activo });
  }
}
