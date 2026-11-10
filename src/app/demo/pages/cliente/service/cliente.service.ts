import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from 'src/app/models/cliente';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface MiRespuestaRs {
  status: number;
  message: string;
}

/**
 * Servicio de gestion de clientes (propietarios de mascotas).
 * Consume los endpoints del modulo /cliente del backend.
 *
 * Mantiene el metodo listarClientes() usado por otros modulos (p. ej.
 * mascotas) y agrega guardar y actualizar para el CRUD de clientes.
 */
@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private api = 'cliente';

  constructor(private backendService: BackendService) {}

  listarClientes(): Observable<Cliente[]> {
    return this.backendService.get<Cliente[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  guardar(data: Cliente): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'guardar', data);
  }

  actualizar(data: Cliente): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'actualizar', data);
  }
}
