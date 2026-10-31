import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HistoriaComponent } from './historia.component';
import { HistoriaService } from './service/historia.service';
import { AnotacionHistoriaService } from './service/anotacion-historia.service';
import { CitaService } from '../cita/service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';

describe('HistoriaComponent', () => {
  let component: HistoriaComponent;
  let fixture: ComponentFixture<HistoriaComponent>;
  let historiaService: jasmine.SpyObj<HistoriaService>;
  let anotacionService: jasmine.SpyObj<AnotacionHistoriaService>;
  let mascotaService: jasmine.SpyObj<MascotaService>;

  beforeEach(async () => {
    historiaService = jasmine.createSpyObj('HistoriaService', ['listarPaginado', 'buscarPorId', 'crearHistoria', 'actualizarHistoria']);
    historiaService.listarPaginado.and.returnValue(of({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 }));
    anotacionService = jasmine.createSpyObj('AnotacionHistoriaService', ['crearAnotacion', 'listarPorHistoria', 'buscarPorId']);
    mascotaService = jasmine.createSpyObj('MascotaService', ['listarPorCliente']);
    const clienteService = jasmine.createSpyObj('ClienteService', ['listarClientesActivos']);
    clienteService.listarClientesActivos.and.returnValue(of([]));
    const medicoService = jasmine.createSpyObj('MedicoService', ['listar']);
    medicoService.listar.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HistoriaComponent],
      providers: [
        { provide: HistoriaService, useValue: historiaService },
        { provide: AnotacionHistoriaService, useValue: anotacionService },
        { provide: ClienteService, useValue: clienteService },
        { provide: MascotaService, useValue: mascotaService },
        { provide: MedicoService, useValue: medicoService },
        { provide: CitaService, useValue: jasmine.createSpyObj('CitaService', ['listarCitasPorMascota']) }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(HistoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga las historias por fecha de consulta descendente', () => {
    const filtro = historiaService.listarPaginado.calls.mostRecent().args[0];
    expect(filtro.sort).toBe('fecha');
    expect(filtro.dir).toBe('desc');
  });

  it('el histórico de anotaciones arranca de la más reciente a la más antigua', () => {
    expect(component.anotacionesColumna).toBe('fecha');
    expect(component.anotacionesDir).toBe('desc');
  });

  it('al elegir cliente consulta únicamente sus mascotas', () => {
    mascotaService.listarPorCliente.and.returnValue(of([{ mascotaId: 9, nombreMascota: 'Mía' }]));
    component.nuevaHistoria();
    component.f['clienteId'].setValue(2);
    expect(mascotaService.listarPorCliente).toHaveBeenCalledWith(2);
    expect(component.f['mascotaId'].enabled).toBeTrue();
  });

  it('no permite elegir cita sin haber elegido mascota', () => {
    component.nuevaHistoria();
    expect(component.f['citaId'].disabled).toBeTrue();
  });

  it('no guarda una anotación incompleta', () => {
    component.guardarAnotacion();
    expect(anotacionService.crearAnotacion).not.toHaveBeenCalled();
  });
});
