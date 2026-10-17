import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Formula, FormulaRequest } from 'src/app/models/formula';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio encargado de consumir los endpoints de formulas medicas del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class FormulaService {

  /** Nombre base del endpoint de formulas medicas. */
  private api = 'formula-medica';

  constructor(private readonly backendService: BackendService) {}

  /**
   * Lista todas las formulas ordenadas por fecha de creacion descendente.
   *
   * @returns Observable con el listado de formulas.
   */
  listarFormulas(): Observable<Formula[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Obtiene el detalle de una formula por su identificador.
   *
   * @param id identificador de la formula.
   * @returns Observable con el detalle de la formula.
   */
  obtenerFormula(id: number): Observable<Formula> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `obtener/${id}`);
  }

  /**
   * Crea una nueva formula medica.
   *
   * @param formula datos de la formula.
   * @returns Observable con la formula creada.
   */
  crearFormula(formula: FormulaRequest): Observable<Formula> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', formula);
  }

  /**
   * Actualiza una formula medica existente.
   *
   * @param formula datos de la formula.
   * @returns Observable con la formula actualizada.
   */
  actualizarFormula(formula: FormulaRequest): Observable<Formula> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', formula);
  }
}
