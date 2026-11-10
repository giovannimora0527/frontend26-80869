import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface CitaCalendario {
  id: number;
  fechaHora: string;
  fechaHoraFin: string;
  estado: string;
  motivo: string;
  mascotaId: number;
  mascotaNombre: string;
  clienteId: number;
  clienteNombre: string;
  clienteTelefono: string;
  medicoId: number;
  medicoNombre: string;
  especializacion: string;
}

export interface MiRespuestaRs {
  status: number;
  message: string;
}

/**
 * Servicio del modulo de calendario de citas.
 * Consume los endpoints del modulo /calendario del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarioService {
  private api = 'calendario';

  constructor(
    private backendService: BackendService,
    private http: HttpClient
  ) {}

  listarCitas(inicio: string, fin: string): Observable<CitaCalendario[]> {
    return this.backendService.get<CitaCalendario[]>(
      environment.apiUrlAuth,
      this.api,
      `citas?inicio=${inicio}&fin=${fin}`
    );
  }

  historialMascota(mascotaId: number): Observable<CitaCalendario[]> {
    return this.backendService.get<CitaCalendario[]>(
      environment.apiUrlAuth,
      this.api,
      `historial-mascota?mascotaId=${mascotaId}`
    );
  }

  cambiarEstado(citaId: number, estado: string): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(
      environment.apiUrlAuth,
      this.api,
      'cambiar-estado',
      { citaId, estado }
    );
  }

  reprogramar(citaId: number, nuevaFechaHora: string): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(
      environment.apiUrlAuth,
      this.api,
      'reprogramar',
      { citaId, nuevaFechaHora }
    );
  }

  /**
   * Descarga el reporte Excel de citas en un rango. Se usa HttpClient directo
   * para recibir el archivo como blob. El token se adjunta por el interceptor.
   */
  descargarReporte(medicoId: number | null, inicio: string, fin: string): Observable<Blob> {
    let params = new HttpParams().set('inicio', inicio).set('fin', fin);
    if (medicoId != null) {
      params = params.set('medicoId', String(medicoId));
    }
    return this.http.get(`${environment.apiUrlAuth}/${this.api}/reporte-excel`, {
      params,
      responseType: 'blob'
    });
  }
}
