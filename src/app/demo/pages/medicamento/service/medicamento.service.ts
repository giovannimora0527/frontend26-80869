import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de medicamentos (`/medicamento` en el backend).
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
   * @returns Catálogo de medicamentos (para el combo de fórmulas).
   */
  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * @param id Id del medicamento.
   * @returns Medicamento encontrado (404 si no existe).
   */
  consultarMedicamento(id: number): Observable<Medicamento> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `buscar/${id}`);
  }
}
