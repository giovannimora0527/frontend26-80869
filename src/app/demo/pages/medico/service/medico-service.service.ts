import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medico } from 'src/app/models/medico';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de veterinarios (/medico).
 */
@Injectable({
  providedIn: 'root'
})
export class MedicoServiceService {
  /** Recurso base del backend. */
  private readonly api = 'medico';

  /**
   * @param backendService Servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) {}

  /**
   * @returns Veterinarios ordenados por apellido (para los combos).
   */
  listarMedicos(): Observable<Medico[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }
}
