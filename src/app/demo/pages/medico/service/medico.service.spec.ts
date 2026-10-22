import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MedicoService } from './medico.service';
import { environment } from 'src/environments/environment';

describe('MedicoService', () => {
  let service: MedicoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MedicoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('creates and updates doctors with the confirmed endpoints and request bodies', () => {
    const datos = {
      nombres: 'Carlos', apellidos: 'Martinez', tipoDocumento: 'CC', numeroDocumento: '123',
      telefono: '3001112233', registroProfesional: 'RP-1003', especializacionId: 3
    };
    service.crearMedico(datos).subscribe();
    const crear = http.expectOne(`${environment.apiUrlAuth}/medico/crear`);
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual(datos);
    crear.flush({ mensaje: 'Creado' });
    service.actualizarMedico({ ...datos, id: 3 }).subscribe();
    const actualizar = http.expectOne(`${environment.apiUrlAuth}/medico/actualizar`);
    expect(actualizar.request.method).toBe('PUT');
    expect(actualizar.request.body).toEqual({ ...datos, id: 3 });
    actualizar.flush({ mensaje: 'Actualizado' });
  });

  it('requests availability with local date-time query parameters and JSON content type', () => {
    let recibidos: unknown;
    service.listarMedicosDisponiblesPorFecha(
      new Date(2026, 9, 15, 10, 30),
      new Date(2026, 9, 15, 10, 45)
    ).subscribe((medicos) => recibidos = medicos);

    const solicitud = http.expectOne((req) =>
      req.url === `${environment.apiUrlAuth}/medico/listar-disponibles`
    );
    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.get('fechaInicio')).toBe('2026-10-15T10:30:00');
    expect(solicitud.request.params.get('fechaFin')).toBe('2026-10-15T10:45:00');
    expect(solicitud.request.headers.get('Content-Type')).toBe('application/json');
    expect(solicitud.request.body).toBeNull();
    solicitud.flush([]);
    expect(recibidos).toEqual([]);
  });

  it('preserves the local date when the appointment crosses midnight', () => {
    service.listarMedicosDisponiblesPorFecha(
      new Date(2026, 11, 31, 23, 50),
      new Date(2027, 0, 1, 0, 5)
    ).subscribe();
    const solicitud = http.expectOne((req) =>
      req.url === `${environment.apiUrlAuth}/medico/listar-disponibles`
    );
    expect(solicitud.request.params.get('fechaInicio')).toBe('2026-12-31T23:50:00');
    expect(solicitud.request.params.get('fechaFin')).toBe('2027-01-01T00:05:00');
    solicitud.flush([]);
  });

  it('propagates HTTP errors to the caller', () => {
    const error = jasmine.createSpy('error');
    service.listarMedicosDisponiblesPorFecha(
      new Date(2026, 9, 15, 10, 30),
      new Date(2026, 9, 15, 10, 45)
    ).subscribe({ error });
    const solicitud = http.expectOne((req) =>
      req.url === `${environment.apiUrlAuth}/medico/listar-disponibles`
    );
    solicitud.flush({ mensaje: 'Fecha no valida' }, { status: 400, statusText: 'Bad Request' });
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining({ status: 400 }));
  });
});
