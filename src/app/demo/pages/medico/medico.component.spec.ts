import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { MedicoService } from './service/medico.service';
import { EspecializacionService } from '../especializacion/service/especializacion.service';
import { Medico } from 'src/app/models/medico';

import { MedicoComponent } from './medico.component';

describe('MedicoComponent', () => {
  let component: MedicoComponent;
  let fixture: ComponentFixture<MedicoComponent>;
  let medicoService: jasmine.SpyObj<MedicoService>;
  const medico: Medico = {
    id: 3, nombres: 'Carlos', apellidos: 'Martinez', tipoDocumento: 'CC',
    numeroDocumento: '12345', telefono: '3001112233', registroProfesional: 'RP-1003',
    especializacion: { id: 3, nombre: 'Cirugia' }
  };

  beforeEach(async () => {
    medicoService = jasmine.createSpyObj<MedicoService>('MedicoService', ['listar', 'crearMedico', 'actualizarMedico']);
    medicoService.listar.and.returnValue(of([medico]));
    medicoService.crearMedico.and.returnValue(of({}));
    medicoService.actualizarMedico.and.returnValue(of({}));
    spyOn(Swal, 'fire');
    await TestBed.configureTestingModule({
      imports: [MedicoComponent],
      providers: [
        { provide: MedicoService, useValue: medicoService },
        { provide: EspecializacionService, useValue: { listar: () => of([{ id: 3, nombre: 'Cirugia' }]) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function completarFormulario(): void {
    component.form.setValue({
      nombres: ' Carlos ', apellidos: ' Martinez ', tipoDocumento: 'CC',
      numeroDocumento: '12345', telefono: '3001112233', registroProfesional: 'RP-1003',
      especializacionId: 3
    });
  }

  it('should filter doctors by active and inactive status', () => {
    component.listMedicos = [
      { ...medico, id: 1, estado: true },
      { ...medico, id: 2, estado: false },
      { ...medico, id: 3, estado: undefined }
    ];
    component.terminoBusqueda = 'Activo';
    expect(component.medicoFiltrados.map(m => m.id)).toEqual([1]);
    component.terminoBusqueda = 'true';
    expect(component.medicoFiltrados.map(m => m.id)).toEqual([1]);
    component.terminoBusqueda = 'inactivo';
    expect(component.medicoFiltrados.map(m => m.id)).toEqual([2]);
    component.terminoBusqueda = 'false';
    expect(component.medicoFiltrados.map(m => m.id)).toEqual([2]);
    component.terminoBusqueda = 'no informado';
    expect(component.medicoFiltrados.map(m => m.id)).toEqual([3]);
  });

  it('should render a green badge for active and gray badge for inactive doctors', () => {
    component.listMedicos = [{ ...medico, id: 1, estado: true }, { ...medico, id: 2, estado: false }];
    fixture.detectChanges();
    const badges = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody .badge');
    expect(badges[0].textContent?.trim()).toBe('Activo');
    expect(badges[0].classList).toContain('bg-success');
    expect(badges[1].textContent?.trim()).toBe('Inactivo');
    expect(badges[1].classList).toContain('bg-secondary');
  });

  it('should only offer CC and PA document types', () => {
    fixture.detectChanges();
    const opciones = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLOptionElement>('#medico-tipoDocumento option:not([disabled])')
    ).map(opcion => [opcion.value, opcion.textContent?.trim()]);
    expect(opciones).toEqual([['CC', 'CC - Cédula de Ciudadanía'], ['PA', 'PA - Pasaporte']]);
  });

  it('should reject document types outside the list', () => {
    completarFormulario();
    component.form.controls.tipoDocumento.setValue('TI');
    component.guardarMedico();
    expect(medicoService.crearMedico).not.toHaveBeenCalled();
    expect(component.form.controls.tipoDocumento.invalid).toBeTrue();
  });

  it('should require a new selection when editing an unsupported document type', () => {
    spyOn(component, 'openModal');
    component.abrirEdicion({ ...medico, tipoDocumento: 'TI' });
    expect(component.form.controls.tipoDocumento.value).toBe('');
    component.abrirEdicion({ ...medico, tipoDocumento: 'PA' });
    expect(component.form.controls.tipoDocumento.value).toBe('PA');
  });

  it('should reject empty and whitespace-only fields', () => {
    component.guardarMedico();
    expect(component.form.controls.nombres.touched).toBeTrue();
    expect(medicoService.crearMedico).not.toHaveBeenCalled();
    completarFormulario();
    component.form.controls.nombres.setValue('   ');
    component.guardarMedico();
    expect(medicoService.crearMedico).not.toHaveBeenCalled();
    expect(component.respuestaError).toContain('obligatorios');
  });

  it('should submit trimmed creation data and refresh the list', () => {
    completarFormulario();
    component.modoFormulario = 'C';
    component.guardarMedico();
    expect(medicoService.crearMedico).toHaveBeenCalledOnceWith({
      nombres: 'Carlos', apellidos: 'Martinez', tipoDocumento: 'CC', numeroDocumento: '12345',
      telefono: '3001112233', registroProfesional: 'RP-1003', especializacionId: 3
    });
    expect(medicoService.actualizarMedico).not.toHaveBeenCalled();
    expect(medicoService.listar).toHaveBeenCalledTimes(2);
    expect(component.enviando).toBeFalse();
  });

  it('should prefill editing data and submit the doctor id and specialization id', () => {
    spyOn(component, 'openModal');
    component.abrirEdicion(medico);
    expect(component.form.controls.especializacionId.value).toBe(3);
    expect(component.form.controls.telefono.value).toBe(medico.telefono);
    component.form.controls.nombres.setValue('Actualizado');
    component.guardarMedico();
    expect(medicoService.actualizarMedico).toHaveBeenCalledOnceWith({
      id: 3, nombres: 'Actualizado', apellidos: 'Martinez', tipoDocumento: 'CC', numeroDocumento: '12345',
      telefono: '3001112233', registroProfesional: 'RP-1003', especializacionId: 3
    });
    expect(medico.nombres).toBe('Carlos');
    expect(medicoService.crearMedico).not.toHaveBeenCalled();
  });

  it('should reset edit data when starting a new doctor', () => {
    spyOn(component, 'openModal');
    component.abrirEdicion({ ...medico, especializacionId: 3, especializacion: undefined });
    expect(component.form.controls.especializacionId.value).toBe(3);
    component.respuestaError = 'Error previo';
    component.nuevoMedico('C');
    expect(component.medicoSelected).toBeNull();
    expect(component.form.controls.nombres.value).toBe('');
    expect(component.form.controls.especializacionId.value).toBeNull();
    expect(component.respuestaError).toBe('');
  });

  it('should prevent duplicate submissions and closing while saving', () => {
    const respuesta = new Subject<unknown>();
    medicoService.crearMedico.and.returnValue(respuesta);
    completarFormulario();
    component.guardarMedico();
    component.guardarMedico();
    component.closeModal();
    expect(component.enviando).toBeTrue();
    expect(medicoService.crearMedico).toHaveBeenCalledTimes(1);
    respuesta.next({});
    respuesta.complete();
    expect(component.enviando).toBeFalse();
  });

  it('should retain entered data and show an error after a failed save', () => {
    const error = new Error('Error del servidor');
    spyOn(console, 'error');
    medicoService.crearMedico.and.returnValue(throwError(() => error));
    completarFormulario();
    component.guardarMedico();
    expect(component.respuestaError).toContain('No fue posible guardar');
    expect(component.form.controls.nombres.value).toBe(' Carlos ');
    expect(component.enviando).toBeFalse();
    expect(medicoService.listar).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('No fue posible guardar');
  });

  it('should block unavailable specializations and editing without an identifier', () => {
    completarFormulario();
    component.form.controls.especializacionId.setValue(99);
    component.guardarMedico();
    expect(component.respuestaError).toContain('especialización disponible');
    completarFormulario();
    component.modoFormulario = 'E';
    component.guardarMedico();
    expect(component.respuestaError).toContain('sin identificador');
    expect(medicoService.crearMedico).not.toHaveBeenCalled();
    expect(medicoService.actualizarMedico).not.toHaveBeenCalled();
  });
});
