import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio encargado de consumir el endpoint de medicamentos del backend.
 * Se usa para alimentar el combo de seleccion en el modulo de formulas.
 */
@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {

  /** Nombre base del endpoint de medicamentos. */
  private api = 'medicamento';

  constructor(private readonly backendService: BackendService) {}

  /**
   * Lista los medicamentos disponibles ordenados por nombre.
   *
   * @returns Observable con el listado de medicamentos.
   */
  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }
}
