import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FormulaMedicaService {

    private api = 'formula-medica';

    constructor(private backendService: BackendService) {}

    listarFormulas(): Observable<any[]> {
    return this.backendService.get<any[]>(
    environment.apiUrlAuth,
    this.api,

    'listar'
    );
    }
}

