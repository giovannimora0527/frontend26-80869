import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface MedicamentoDespacho {
  medicamentoId: number;
  medicamentoNombre: string;
  cantidadPrescrita: number;
  dosis: string;
  frecuencia: string;
  duracion: string;
  existenciaDisponible: number;
  suficiente: boolean;
}

export interface FormulaPendiente {
  formulaId: number;
  fechaGeneracion: string;
  medicoNombre: string;
  clienteNombre: string;
  mascotaNombre: string;
  estadoDespacho: string;
  medicamentos: MedicamentoDespacho[];
}

export interface DespachoDetalle {
  medicamentoNombre: string;
  loteId: number;
  numeroLote: string;
  cantidadSolicitada: number;
  cantidadEntregada: number;
}

export interface Despacho {
  id: number;
  formulaId: number;
  estado: string;
  fecha: string;
  usuarioResponsable: string;
  clienteNombre: string;
  mascotaNombre: string;
  medicoNombre: string;
  items: DespachoDetalle[];
}

export interface DespachoItemRq {
  medicamentoId: number;
  cantidadEntregada: number;
}

export interface DespachoRq {
  formulaId: number;
  observacion?: string;
  items: DespachoItemRq[];
}

export interface MiRespuestaRs {
  status: number;
  message: string;
}

/**
 * Servicio del modulo de despacho. Consume el modulo /despacho del backend
 * (solo DESPACHO_MEDICO y Administrador).
 */
@Injectable({
  providedIn: 'root'
})
export class DespachoService {
  private api = 'despacho';

  constructor(
    private backendService: BackendService,
    private http: HttpClient
  ) {}

  formulasPendientes(): Observable<FormulaPendiente[]> {
    return this.backendService.get<FormulaPendiente[]>(environment.apiUrlAuth, this.api, 'formulas-pendientes');
  }

  confirmar(data: DespachoRq): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'confirmar', data);
  }

  listar(): Observable<Despacho[]> {
    return this.backendService.get<Despacho[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  descargarComprobante(id: number): Observable<Blob> {
    const params = new HttpParams().set('id', String(id));
    return this.http.get(`${environment.apiUrlAuth}/${this.api}/comprobante`, { params, responseType: 'blob' });
  }
}
