import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from './backend.service';
import { Medico } from '../models/medico';
import { environment } from '../../environments/environment';

/** Consulta de veterinarios. */
@Injectable({ providedIn: 'root' })
export class MedicoService {
  private api = 'medico';

  constructor(private backendService: BackendService) { }

  /** `GET /medico/listar`: todos los veterinarios. */
  listarMedicos(): Observable<Medico[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** `GET /medico/consultar/{id}`: un veterinario. */
  consultarMedico(id: number): Observable<Medico> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `consultar/${id}`);
  }
}
