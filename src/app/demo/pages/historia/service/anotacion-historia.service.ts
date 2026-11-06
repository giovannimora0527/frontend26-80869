import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { AnotacionHistoriaRq } from 'src/app/models/anotacion-historia-rq';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnotacionHistoriaService {
  private api = 'anotacion-historia';

  constructor(private readonly backendService: BackendService) { }

  listar(): Observable<AnotacionHistoria[]> {
    return this.backendService.get<AnotacionHistoria[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  crearAnotacionHistoria(anotacion: AnotacionHistoriaRq): Observable<AnotacionHistoria> {
    return this.backendService.post<AnotacionHistoria>(environment.apiUrlAuth, this.api, 'crear', anotacion);
  }

  actualizarAnotacionHistoria(anotacion: AnotacionHistoriaRq & { id: number }): Observable<AnotacionHistoria> {
    return this.backendService.put<AnotacionHistoria>(environment.apiUrlAuth, this.api, 'actualizar', anotacion);
  }
}
