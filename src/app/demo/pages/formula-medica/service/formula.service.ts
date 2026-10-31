import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Formula } from 'src/app/models/formula';
import { Cita } from 'src/app/models/cita';
import { Medicamento } from 'src/app/models/medicamento';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { FiltroPaginado, Pagina } from 'src/app/models/pagina';
import { FormulaRq, FormulaResumen } from 'src/app/models/resumenes';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/http-utils';
import { environment } from 'src/environments/environment';

/** Consumo de la API de fórmulas médicas (`/formula-medica`). */
@Injectable({
  providedIn: 'root'
})
export class FormulaService {

  private api = `formula-medica`;

  constructor(private readonly backendService: BackendService) { }

  /** Lista todas las fórmulas sin paginar. */
  listar(): Observable<Formula[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** Listado paginado (información resumida) con filtros y orden. */
  listarPaginado(filtro: FiltroPaginado): Observable<Pagina<FormulaResumen>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'paginado', construirParams(filtro));
  }

  /** Detalle completo de una fórmula. */
  buscarPorId(id: number): Observable<Formula> {
    return this.backendService.get(environment.apiUrlAuth, this.api, String(id));
  }

  listarCitas(): Observable<Cita[]> {
    return this.backendService.get(environment.apiUrlAuth, 'cita', 'listar');
  }

  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, 'medicamento', 'listar-activos');
  }

  /** Crea una fórmula (POST). */
  crearFormula(formula: FormulaRq): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', formula);
  }

  /** Edita una fórmula activa (PUT). */
  actualizarFormula(id: number, formula: FormulaRq): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, String(id), formula);
  }

  /** Activa o inactiva una fórmula (PATCH); no existe borrado físico. */
  cambiarEstado(id: number, activo: boolean): Observable<MiRespuesta> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { activo });
  }
}
