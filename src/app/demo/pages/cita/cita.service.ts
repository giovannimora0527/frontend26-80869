
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CitaService {

    private api = 'cita';

    constructor(
    private backendService: BackendService
    ) {}

    listarCitas(): Observable<any[]> {
    return this.backendService.get<any[]>(
        environment.apiUrlAuth,
        this.api,
        'listar'
    );
    }

    listarCitasRango(
    fechaInicio: string,
    fechaFin: string
    ): Observable<any[]> {

    const params = new HttpParams()
        .set('fechaInicio', fechaInicio)
        .set('fechaFin', fechaFin);

    return this.backendService.get<any[]>(
        environment.apiUrlAuth,
        this.api,
        'listar-rango',
        params
    );
    }

    crearCita(cita: any): Observable<any> {
    return this.backendService.post<any>(
        environment.apiUrlAuth,
        this.api,
        'crear',
        cita
    );
    }

    actualizarCita(cita: any): Observable<any> {
    return this.backendService.post<any>(
        environment.apiUrlAuth,
        this.api,
        'actualizar',
    cita
    );
    }
}
