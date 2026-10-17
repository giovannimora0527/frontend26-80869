import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de medicamentos (/medicamento).
 */
@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {
  /** Recurso base del backend. */
  private readonly api = 'medicamento';

  /**
   * @param backendService Servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) {}

  /**
   * @returns Medicamentos ordenados por nombre (para el combo de fórmulas).
   */
  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }
}
