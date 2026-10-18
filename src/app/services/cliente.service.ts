import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from './backend.service';
import { Cliente } from '../models/cliente';
import { environment } from '../../environments/environment';

/** Consulta de clientes para los combos de los módulos de citas, historias y fórmulas. */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private api = 'cliente';

  constructor(private backendService: BackendService) { }

  /** `GET /cliente/listar`: todos los clientes. */
  listarClientes(): Observable<Cliente[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** `GET /cliente/consultar/{id}`: un cliente. */
  consultarCliente(id: number): Observable<Cliente> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `consultar/${id}`);
  }
}
