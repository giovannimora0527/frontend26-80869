import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from 'src/app/models/cliente';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private api = `cliente`;

  constructor(private backendService: BackendService) {

  }

  listarClientes(): Observable<Cliente[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  /**
   * Consulta un cliente por su id.
   *
   * @param id Id del cliente.
   * @returns Cliente encontrado (el backend responde 404 si no existe).
   */
  consultarCliente(id: number): Observable<Cliente> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }
}
