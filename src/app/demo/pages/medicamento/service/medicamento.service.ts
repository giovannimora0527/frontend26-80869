import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { MedicamentoRq } from 'src/app/models/medicamento-rq';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio que consume los endpoints de medicamentos del backend (`/medicamento`).
 */
@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {

  /** Segmento de la URL del backend para este módulo. */
  private api = `medicamento`;

  constructor(private backendService: BackendService) {

  }

  /** Lista todos los medicamentos (activos e inactivos). */
  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  /** Lista solo los medicamentos activos (los que se pueden recetar). */
  listarMedicamentosActivos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar-activos");
  }

  /** Consulta un medicamento por su identificador. */
  buscarPorId(id: number): Observable<Medicamento> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /** Crea un medicamento nuevo. */
  crearMedicamento(medicamento: MedicamentoRq): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "crear", medicamento);
  }

  /** Edita los datos de un medicamento existente. */
  actualizarMedicamento(id: number, medicamento: MedicamentoRq): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `${id}`, medicamento);
  }

  /** Activa o desactiva un medicamento (nunca se borra). */
  cambiarEstado(id: number, activo: boolean): Observable<MiRespuesta> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { activo });
  }
}
