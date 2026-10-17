import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medico } from 'src/app/models/medico';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio encargado de consumir los endpoints de medicos (veterinarios)
 * del backend. Se reutiliza en los modulos de citas y anotaciones.
 */
@Injectable({
  providedIn: 'root'
})
export class MedicoService {

  /** Nombre base del endpoint de medicos. */
  private api = 'medico';

  constructor(private readonly backendService: BackendService) {}

  /**
   * Lista los medicos registrados junto con los datos de su especializacion.
   *
   * @returns Observable con el listado de medicos.
   */
  listarMedicos(): Observable<Medico[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-especializaciones');
  }
}
