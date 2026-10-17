
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface HistoriaMedicaRequest {
  mascotaId: number;
}

export interface AnotacionHistoriaRequest {
  mascotaId: number;
  historiaId: number;
  medicoId: number;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistoriaMedicaService {

  private apiHistoria = 'historia-medica';
  private apiAnotacion = 'anotacion-historia';

  constructor(
    private backendService: BackendService
  ) {}

  listarHistorias(): Observable<any[]> {
    return this.backendService.get<any[]>(
      environment.apiUrlAuth,
      this.apiHistoria,
      'listar'
    );
  }

  crearHistoria(
    historia: HistoriaMedicaRequest
  ): Observable<any> {
    return this.backendService.post<any>(
      environment.apiUrlAuth,
      this.apiHistoria,
      'crear',
      historia
    );
  }

  listarAnotaciones(historiaId: number): Observable<any[]> {
    return this.backendService.get<any[]>(
      environment.apiUrlAuth,
      this.apiAnotacion,
      `por-historia/${historiaId}`
    );
  }

  crearAnotacion(
    anotacion: AnotacionHistoriaRequest
  ): Observable<any> {
    return this.backendService.post<any>(
      environment.apiUrlAuth,
      this.apiAnotacion,
      'crear',
      anotacion
    );
  }
}
