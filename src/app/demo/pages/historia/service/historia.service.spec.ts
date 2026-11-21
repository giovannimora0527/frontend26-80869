import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Historia } from 'src/app/models/historia';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

import { HistoriaService } from './historia.service';

describe('HistoriaService', () => {
  let service: HistoriaService;
  let backendService: jasmine.SpyObj<BackendService>;
  const historia: Historia = {
    id: 1,
    fechaCreacion: '2026-01-01T00:00:00',
    mascota: { mascotaId: 1, nombreMascota: 'Max' }
  };

  beforeEach(() => {
    backendService = jasmine.createSpyObj<BackendService>('BackendService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [{ provide: BackendService, useValue: backendService }]
    });
    service = TestBed.inject(HistoriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list histories with their annotations', () => {
    const respuesta: HistoriaMedica[] = [{ historia, anotaciones: [] }];
    backendService.get.and.returnValue(of(respuesta));

    service.listar().subscribe(resultado => expect(resultado).toEqual(respuesta));

    expect(backendService.get).toHaveBeenCalledOnceWith(environment.apiUrlAuth, 'historia-clinica', 'listar');
  });

  it('should create a history sending only the pet id', () => {
    backendService.post.and.returnValue(of(historia));
    const solicitud = { mascotaId: 1 };

    service.crearHistoria(solicitud).subscribe(resultado => expect(resultado).toEqual(historia));

    expect(backendService.post).toHaveBeenCalledOnceWith(environment.apiUrlAuth, 'historia-clinica', 'guardar', solicitud);
  });

  it('should update a history using PUT', () => {
    backendService.put.and.returnValue(of(historia));
    const solicitud = { id: 1, mascotaId: 1 };

    service.actualizarHistoria(solicitud).subscribe(resultado => expect(resultado).toEqual(historia));

    expect(backendService.put).toHaveBeenCalledOnceWith(environment.apiUrlAuth, 'historia-clinica', 'actualizar', solicitud);
  });

  it('should propagate backend errors', () => {
    const error = new Error('Error al listar historias');
    backendService.get.and.returnValue(throwError(() => error));

    service.listar().subscribe({
      next: () => fail('Expected a backend error'),
      error: recibido => expect(recibido).toBe(error)
    });
  });
});
