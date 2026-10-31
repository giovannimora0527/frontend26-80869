import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CitaComponent } from './cita.component';
import { CitaService } from './service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { CitaResumen } from 'src/app/models/resumenes';

describe('CitaComponent', () => {
  let component: CitaComponent;
  let fixture: ComponentFixture<CitaComponent>;
  let citaService: jasmine.SpyObj<CitaService>;
  let mascotaService: jasmine.SpyObj<MascotaService>;

  const cita = (estado: string, fechaHora = '2020-01-01T10:00:00'): CitaResumen =>
    ({ id: 1, fechaHora, estado, mascotaNombre: 'Max', clienteNombre: 'Laura', medicoNombre: 'Andrea' });

  beforeEach(async () => {
    citaService = jasmine.createSpyObj('CitaService', ['listarPaginado', 'buscarPorId', 'guardarCita',
      'actualizarCita', 'cambiarEstado', 'reactivar']);
    citaService.listarPaginado.and.returnValue(of({ content: [cita('PROGRAMADA')], page: 0, size: 10, totalElements: 1, totalPages: 1 }));
    mascotaService = jasmine.createSpyObj('MascotaService', ['listarPorCliente']);
    const clienteService = jasmine.createSpyObj('ClienteService', ['listarClientesActivos']);
    clienteService.listarClientesActivos.and.returnValue(of([]));
    const medicoService = jasmine.createSpyObj('MedicoService', ['listar', 'listarMedicosDisponiblesPorFecha']);
    medicoService.listar.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CitaComponent],
      providers: [
        { provide: CitaService, useValue: citaService },
        { provide: ClienteService, useValue: clienteService },
        { provide: MascotaService, useValue: mascotaService },
        { provide: MedicoService, useValue: medicoService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga la primera página ordenada por fecha descendente', () => {
    const filtro = citaService.listarPaginado.calls.mostRecent().args[0];
    expect(filtro.sort).toBe('fecha');
    expect(filtro.dir).toBe('desc');
    expect(component.filas.length).toBe(1);
  });

  it('muestra un error claro si el backend no responde', () => {
    citaService.listarPaginado.and.returnValue(throwError(() => ({ status: 0 })));
    component.cargar();
    expect(component.errorCitas).toContain('No hay comunicación con el servidor');
  });

  it('alterna la dirección al ordenar dos veces la misma columna', () => {
    component.ordenarPor('mascota');
    expect(component.direccionOrden).toBe('asc');
    component.ordenarPor('mascota');
    expect(component.direccionOrden).toBe('desc');
  });

  it('solo permite editar citas activas y reactivar las canceladas', () => {
    expect(component.esActiva('PROGRAMADA')).toBeTrue();
    expect(component.esActiva('CANCELADA')).toBeFalse();
    expect(component.esActiva('ATENDIDA')).toBeFalse();
    expect(component.esCancelada('cancelada')).toBeTrue();
  });

  it('no deja atender una cita futura', () => {
    const futura = new Date(Date.now() + 86_400_000).toISOString();
    expect(component.puedeAtender(cita('PROGRAMADA', futura))).toBeFalse();
    expect(component.puedeAtender(cita('PROGRAMADA'))).toBeTrue();
  });

  it('al elegir cliente consulta únicamente sus mascotas', () => {
    mascotaService.listarPorCliente.and.returnValue(of([{ mascotaId: 5, nombreMascota: 'Luna' }]));
    component.nuevaCita();
    component.f['clienteId'].setValue(3);
    expect(mascotaService.listarPorCliente).toHaveBeenCalledWith(3);
    expect(component.mascotas.length).toBe(1);
    expect(component.f['mascotaId'].enabled).toBeTrue();
  });

  it('no envía el formulario si faltan campos obligatorios', () => {
    component.nuevaCita();
    component.guardarCita();
    expect(citaService.guardarCita).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });
});
