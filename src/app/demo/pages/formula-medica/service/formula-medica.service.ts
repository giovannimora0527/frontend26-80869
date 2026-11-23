
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface MedicamentoParaFormula {
  id: number;
  nombre: string;
  tipoProducto: string;
  cantidadDisponible: number;
}

export interface FormulaMedicaRequest {
  cantidadPrescrita?: number | null;
  viaAdministracion?: string | null;
citaId: number;
medicamentoId: number;
dosis: string;
indicaciones: string;
fechaEmision: string;
frecuencia: string;
duracionTratamiento: string;
}

@Injectable({
providedIn: 'root'
})
export class FormulaMedicaService {

private api = 'formula-medica';

constructor(
    private backendService: BackendService
) {}

listarInventarioParaFormula(): Observable<MedicamentoParaFormula[]> {
    return this.backendService.get<MedicamentoParaFormula[]>(
      environment.apiUrlAuth, 'medicamento', 'inventario'
    );
}

listarFormulas(): Observable<any[]> {
    return this.backendService.get<any[]>(
    environment.apiUrlAuth,
        this.api,
    'listar'
    );
}

crearFormula(
    formula: FormulaMedicaRequest
): Observable<any> {
    return this.backendService.post<any>(
    environment.apiUrlAuth,
this.api,
    'crear',
    formula
    );
}

actualizarFormula(
    id: number,
    formula: FormulaMedicaRequest
): Observable<any> {
    return this.backendService.put<any>(
    environment.apiUrlAuth,
    this.api,
    `actualizar/${id}`,
    formula
    );
}
    }
