import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface Servicio {
  id?: number;
  nombre: string;
  descripcion?: string;
  especializacionId?: number | null;
  especializacionNombre?: string;
  precio: number;
  ivaPorcentaje: number;
  precioConIva?: number;
  activo?: boolean;
}

export interface LogTarifa {
  id: number;
  servicioId: number;
  precioAnterior: number;
  precioNuevo: number;
  ivaAnterior: number;
  ivaNuevo: number;
  fecha: string;
  usuarioResponsable: string;
}

export interface MiRespuestaRs {
  status: number;
  message: string;
}

/**
 * Servicio del modulo de servicios y tarifas.
 * Consume los endpoints del modulo /servicio del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private api = 'servicio';

  constructor(private backendService: BackendService) {}

  listar(): Observable<Servicio[]> {
    return this.backendService.get<Servicio[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  guardar(data: Servicio): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'guardar', data);
  }

  actualizar(data: Servicio): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'actualizar', data);
  }

  historialTarifas(servicioId: number): Observable<LogTarifa[]> {
    return this.backendService.get<LogTarifa[]>(
      environment.apiUrlAuth,
      this.api,
      `historial-tarifas?servicioId=${servicioId}`
    );
  }
}
