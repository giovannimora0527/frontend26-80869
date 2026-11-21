import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medico } from 'src/app/models/medico';
import { MedicoRq } from 'src/app/models/medico-rq';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { HttpParams } from '@angular/common/http';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class MedicoService {

  private api = `medico`;

  constructor(private readonly backendService: BackendService) { }


  listar(): Observable<Medico[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  crearMedico(medico: MedicoRq): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', medico);
  }

  actualizarMedico(medico: MedicoRq & { id: number }): Observable<unknown> {
    return this.backendService.put(environment.apiUrlAuth, this.api, 'actualizar', medico);
  }

  listarMedicosDisponiblesPorFecha(fechaInicio: Date, fechaFin: Date): Observable<Medico[]> {
    const params: HttpParams = new HttpParams()
      .set('fechaInicio', formatDate(fechaInicio, "yyyy-MM-dd'T'HH:mm:ss", 'en-US'))
      .set('fechaFin', formatDate(fechaFin, "yyyy-MM-dd'T'HH:mm:ss", 'en-US'));
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar-disponibles", params);
  }
}
