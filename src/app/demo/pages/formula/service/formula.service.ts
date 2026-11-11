import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface FormulaDetalle {
  id?: number;
  medicamentoId: number | null;
  medicamentoNombre?: string;
  dosis: string;
  frecuencia?: string;
  duracion?: string;
  cantidad: number;
  viaAdministracion?: string;
  indicaciones?: string;
}

export interface Formula {
  id?: number;
  citaId: number | null;
  medicoId?: number | null;
  indicaciones?: string;
  fechaCreacion?: string;
  mascotaNombre?: string;
  clienteNombre?: string;
  medicoNombre?: string;
  medicamentos: FormulaDetalle[];
}

export interface MiRespuestaRs {
  status: number;
  message: string;
}

/**
 * Servicio de formulas medicas con varios medicamentos.
 * Consume el modulo /formula del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class FormulaService {
  private api = 'formula';

  constructor(
    private backendService: BackendService,
    private http: HttpClient
  ) {}

  listar(): Observable<Formula[]> {
    return this.backendService.get<Formula[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  guardar(data: Formula): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'guardar', data);
  }

  /** Abre/descarga el PDF de la formula como blob. */
  descargarPdf(id: number): Observable<Blob> {
    const params = new HttpParams().set('id', String(id));
    return this.http.get(`${environment.apiUrlAuth}/${this.api}/pdf`, {
      params,
      responseType: 'blob'
    });
  }
}
