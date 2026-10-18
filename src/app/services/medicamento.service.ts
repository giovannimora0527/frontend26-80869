import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from './backend.service';
import { Medicamento } from '../models/medicamento';
import { environment } from '../../environments/environment';

/** Consulta de medicamentos para el combo de las fórmulas. */
@Injectable({ providedIn: 'root' })
export class MedicamentoService {
  private api = 'medicamento';

  constructor(private backendService: BackendService) { }

  /** `GET /medicamento/listar`: medicamentos ordenados por nombre. */
  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }
}
