import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { Formula } from 'src/app/models/formula';
import { NgbConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HistoriaComponent } from './historia.component';
import { HistoriaService } from './service/historia.service';
import { AnotacionHistoriaService } from './service/anotacion-historia.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { CitaService } from '../cita/service/cita.service';
import { Medico } from 'src/app/models/medico';
import Swal from 'sweetalert2';

describe('HistoriaComponent', () => {
  let component: HistoriaComponent;
  let fixture: ComponentFixture<HistoriaComponent>;
  let historiaService: jasmine.SpyObj<HistoriaService>;
  let anotacionService: jasmine.SpyObj<AnotacionHistoriaService>;
  let mascotaService: jasmine.SpyObj<MascotaService>;
  let citaService: jasmine.SpyObj<CitaService>;

  function crearHistoria(id: number, nombre = `Mascota ${id}`): HistoriaMedica {
    return {
      historia: {
        id,
        fechaCreacion: `2026-01-${String(id).padStart(2, '0')}T10:00:00`,
        mascota: {
          mascotaId: id,
          nombreMascota: nombre,
          cliente: { nombres: 'Juan', apellidos: 'Pérez López' }
        }
      },
      anotaciones: []
    };
  }

  function crearAnotacion(historia: HistoriaMedica, fecha: string, descripcion: string): AnotacionHistoria {
    return {
      id: 1,
      historia: historia.historia,
      fecha,
      descripcion,
      cita: {
        id: 1,
        fechaHora: '2025-10-16T21:30:00',
        motivo: 'Consulta general',
        estado: 'PROGRAMADA'
      },
      medico: {
        id: 1,
        nombres: 'María',
        apellidos: 'Gómez',
        tipoDocumento: 'CC',
        numeroDocumento: '123',
        telefono: '3001112233',
        registroProfesional: 'RP-1001'
      }
    };
  }

  beforeEach(async () => {
    historiaService = jasmine.createSpyObj<HistoriaService>('HistoriaService', ['listar', 'crearHistoria']);
    historiaService.listar.and.returnValue(of([crearHistoria(1, 'Max')]));
    historiaService.crearHistoria.and.returnValue(of(crearHistoria(9).historia));
    anotacionService = jasmine.createSpyObj<AnotacionHistoriaService>('AnotacionHistoriaService', ['crearAnotacionHistoria']);
    anotacionService.crearAnotacionHistoria.and.returnValue(of({} as AnotacionHistoria));
    mascotaService = jasmine.createSpyObj<MascotaService>('MascotaService', ['listarMascotas']);
    mascotaService.listarMascotas.and.returnValue(of([
      { mascotaId: 1, nombreMascota: 'Max', activo: true },
      { mascotaId: 2, nombreMascota: 'Luna', activo: true, cliente: { nombres: 'Ana', apellidos: 'Ruiz' } },
      { mascotaId: 3, nombreMascota: 'Toby', activo: false }
    ]));
    citaService = jasmine.createSpyObj<CitaService>('CitaService', ['listarCitasPorMascota']);
    citaService.listarCitasPorMascota.and.returnValue(of([
      { id: 1, fechaHora: '2026-02-01T10:00:00', estado: 'PROGRAMADA', motivo: 'Usada',
        medico: { id: 4, nombres: 'Inés', apellidos: 'Mora' } as Medico },
      { id: 2, fechaHora: '2026-02-02T10:00:00', estado: 'PROGRAMADA', motivo: 'Vacuna',
        medico: { id: 3, nombres: 'Carlos', apellidos: 'Martínez', especializacion: { id: 3, nombre: 'Pediatría' } } as Medico },
      { id: 5, fechaHora: '2026-02-03T10:00:00', estado: 'PROGRAMADA', motivo: 'Sin médico' }
    ]));
    spyOn(Swal, 'fire');
    await TestBed.configureTestingModule({
      imports: [HistoriaComponent],
      providers: [
        { provide: HistoriaService, useValue: historiaService },
        { provide: AnotacionHistoriaService, useValue: anotacionService },
        { provide: MascotaService, useValue: mascotaService },
        { provide: CitaService, useValue: citaService }
      ]
    })
    .compileComponents();

    TestBed.inject(NgbConfig).animation = false;
    fixture = TestBed.createComponent(HistoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(historiaService.listar).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    TestBed.inject(NgbModal).dismissAll();
  });

  it('should display each prescription under its annotation with treatment and medication dates', async () => {
    const historia = crearHistoria(1);
    const anotacion = crearAnotacion(historia, '2026-01-02T10:00:00', 'Control');
    const formula: Formula = {
      id: 4,
      cita: { id: 1, fechaHora: '2025-10-16T21:30:00', motivo: 'Consulta general', estado: 'PROGRAMADA' },
      dosis: 'Una pastilla cada 12 horas.',
      frecuencia: 'Cada 4 horas',
      duracion: 'El tratamiento dura por 3 semanas',
      indicaciones: 'Indicaciones del tratamiento',
      fechaCreacionRegistro: '2025-10-30T21:09:02',
      fechaActualizacionRegistro: '2026-10-10T11:46:55',
      medicamento: {
        id: 5, nombre: 'Paracetamol Inyectable', descripcion: 'Analgésico y antipirético',
        presentacion: 'Tabletas 1200mg', fechaCompra: '2024-06-01', fechaVence: '2026-06-01',
        fechaCreacionRegistro: '2025-09-13T10:58:40', fechaModificacionRegistro: '2025-09-13T12:49:23'
      }
    };
    anotacion.formulasMedicas = [
      formula,
      { ...formula, id: 1, dosis: '800 mg cada 12 horas', indicaciones: null, fechaActualizacionRegistro: null }
    ];
    const sinFormulas = crearAnotacion(historia, '2026-02-02T10:00:00', 'Sin tratamiento');
    sinFormulas.formulasMedicas = [];
    const formulasNulas = crearAnotacion(historia, '2026-03-02T10:00:00', 'Control posterior');
    formulasNulas.formulasMedicas = null;
    historia.anotaciones = [anotacion, sinFormulas, formulasNulas];
    component.listHistorias = [historia];
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('tbody button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const modal = document.querySelector('ngb-modal-window');
    const secciones = modal?.querySelectorAll('section');
    expect(secciones?.[0].querySelectorAll('.formula-medica').length).toBe(2);
    expect(secciones?.[1].querySelectorAll('.formula-medica').length).toBe(0);
    expect(secciones?.[2].textContent).toContain('No hay fórmulas médicas asociadas a esta anotación.');
    const formulas = modal?.querySelectorAll('.formula-medica');
    expect(formulas?.[0].querySelector('h6')?.textContent?.trim()).toBe('Fórmula médica 1');
    expect(formulas?.[1].querySelector('h6')?.textContent?.trim()).toBe('Fórmula médica 2');
    for (const dato of [
      'Paracetamol Inyectable', 'Analgésico y antipirético', 'Tabletas 1200mg', formula.dosis,
      formula.frecuencia, formula.duracion, 'Indicaciones del tratamiento', '2025-10-30 21:09',
      '2026-10-10 11:46', '2024-06-01', '2026-06-01', '2025-09-13 10:58', '2025-09-13 12:49'
    ]) {
      expect(formulas?.[0].textContent).withContext(dato).toContain(dato);
    }
    expect(formulas?.[1].textContent).toContain('800 mg cada 12 horas');
    expect(formulas?.[1].textContent).toContain('No informado');
  });

  it('should open the selected history with client, pet, veterinarian and all consultation details', async () => {
    const historia = crearHistoria(1, 'Max');
    historia.historia.mascota = {
      ...historia.historia.mascota,
      edad: 3,
      activo: true,
      raza: { nombre: 'Gato', especie: 'Felino' },
      fechaRegistro: '2026-08-01T08:15:00',
      fechaModificacion: '2026-08-15T10:20:00',
      cliente: {
        id: 1, nombres: 'Juan', apellidos: 'Pérez López', tipoDocumento: 'CC', numeroDocumento: '100000001',
        telefono: '3002223344', direccion: 'Calle 10 #12-34', fechaNacimiento: '1990-05-12',
        genero: 'M', activo: true, usuarioId: 1
      }
    };
    historia.anotaciones = [
      crearAnotacion(historia, '2026-01-02T10:00:00', 'Problemas urinarios'),
      crearAnotacion(historia, '2026-02-02T10:00:00', 'Evolución favorable')
    ];
    component.listHistorias = [historia];
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('tbody button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const modal = document.querySelector<HTMLElement>('ngb-modal-window');
    expect(modal).not.toBeNull();
    expect(modal?.getAttribute('aria-labelledby')).toBe('detalleHistoriaTitulo');
    for (const dato of [
      'Datos del cliente', 'Datos de la mascota', 'Datos del veterinario', 'Datos de la cita',
      'Calle 10 #12-34', '3002223344', '100000001', '1990-05-12', 'Felino', 'Gato',
      '2026-08-15 10:20', 'RP-1001', 'Problemas urinarios', 'Evolución favorable',
      '2025-10-16 21:30', 'PROGRAMADA', 'Consulta general'
    ]) {
      expect(modal?.textContent).withContext(dato).toContain(dato);
    }
    expect(component.historiaDetalle).toBe(historia);
    modal?.querySelector<HTMLButtonElement>('.modal-footer button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('ngb-modal-window')).toBeNull();
    expect(component.historiaDetalle).toBeNull();
  });

  it('should open the correct history after filtering and pagination and support missing details', async () => {
    component.listHistorias = Array.from({ length: 6 }, (_, indice) => crearHistoria(indice + 1));
    component.terminoBusqueda = 'Mascota';
    component.cambiarPagina(2);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('tbody button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.historiaDetalle).toBe(component.listHistorias[0]);
    const modal = document.querySelector<HTMLElement>('ngb-modal-window');
    expect(modal?.textContent).toContain('Esta historia no tiene anotaciones registradas.');
    modal?.querySelector<HTMLButtonElement>('.btn-close')?.click();
    await fixture.whenStable();
    expect(component.historiaDetalle).toBeNull();
    expect(component.paginaActual).toBe(2);
    expect(component.terminoBusqueda).toBe('Mascota');
  });

  it('should render annotations without appointments and a pet without a client', async () => {
    const historia = crearHistoria(1);
    historia.historia.mascota.cliente = undefined;
    const anotacion = crearAnotacion(historia, '2026-01-02T10:00:00', 'Control');
    anotacion.cita = null;
    historia.anotaciones = [anotacion];
    component.listHistorias = [historia];
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('tbody button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const modal = document.querySelector('ngb-modal-window');
    expect(modal?.textContent).toContain('No hay datos del cliente registrados.');
    expect(modal?.textContent).toContain('No hay una cita asociada a esta anotación.');
    expect(modal?.textContent).toContain('No hay fórmulas médicas asociadas a esta anotación.');
    expect(modal?.textContent).toContain('RP-1001');
    fixture.destroy();
    await fixture.whenStable();
    expect(document.querySelector('ngb-modal-window')).toBeNull();
  });

  it('should render the eight data columns, actions and the creation date', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(Array.from(element.querySelectorAll('th')).map(th => th.textContent?.trim())).toEqual([
      'Fecha de creación', 'Mascota', 'Cliente', 'Veterinario', 'Motivo de consulta', 'Diagnóstico', 'Observaciones', 'Estado', 'Acciones'
    ]);
    const celdas = Array.from(element.querySelectorAll('tbody td')).map(td => td.textContent?.replace(/\s+/g, ' ').trim());
    expect(celdas).toEqual(['2026-01-01', 'Max', 'Juan Pérez López', 'No informado', 'No informado', 'No informado', 'No informado', 'No informado', 'Ver Crear anotación']);
  });

  it('should create a history only for active pets without a history', async () => {
    const element: HTMLElement = fixture.nativeElement;
    (element.querySelector('.card-header button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mascotaService.listarMascotas).toHaveBeenCalledTimes(1);
    expect(component.mascotasDisponibles.map(m => m.mascotaId)).toEqual([2]);
    expect(document.querySelector('#historia-mascota')?.textContent).toContain('Luna - Ana Ruiz');

    component.guardarHistoria();
    expect(historiaService.crearHistoria).not.toHaveBeenCalled();
    expect(component.respuestaError).toContain('mascota');

    component.formHistoria.controls.mascotaId.setValue(2);
    component.guardarHistoria();
    expect(historiaService.crearHistoria).toHaveBeenCalledOnceWith({ mascotaId: 2 });
    expect(historiaService.listar).toHaveBeenCalledTimes(2);
    expect(Swal.fire).toHaveBeenCalled();
    await fixture.whenStable();
    expect(document.querySelector('ngb-modal-window')).toBeNull();
  });

  it('should create an annotation with related ids and all clinical fields trimmed', async () => {
    const historia = crearHistoria(1, 'Max');
    historia.anotaciones = [crearAnotacion(historia, '2026-01-02T10:00:00', 'Primera')];
    historiaService.listar.and.returnValue(of([historia]));
    component.listarHistorias();
    fixture.detectChanges();
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody button');
    (botones[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(citaService.listarCitasPorMascota).toHaveBeenCalledOnceWith(1);
    expect(component.citasDisponibles.map(c => c.id)).toEqual([1, 2, 5]);
    const opciones = Array.from(document.querySelectorAll<HTMLOptionElement>('#anotacion-cita-0 option:not([disabled])'))
      .map(opcion => opcion.textContent?.replace(/\s+/g, ' ').trim());
    expect(opciones).toEqual([
      '2026-02-01 10:00 - Usada (PROGRAMADA) - ya tiene anotación',
      '2026-02-02 10:00 - Vacuna (PROGRAMADA)',
      '2026-02-03 10:00 - Sin médico (PROGRAMADA)'
    ]);
    expect(document.querySelector('#anotacion-cita-0')?.textContent).not.toContain('Sin cita asociada');
    const medicosVisibles = () => Array.from(document.querySelectorAll<HTMLOptionElement>('#anotacion-medico-0 option:not([disabled])'))
      .map(opcion => opcion.textContent?.replace(/\s+/g, ' ').trim());
    expect(medicosVisibles()).toEqual([]);

    component.anotacionesForm.at(0).controls.descripcion.setValue('Control');
    component.anotacionesForm.at(0).patchValue({
      diagnostico: '  Paciente sano  ', observaciones: '  Próximo control anual  '
    });
    component.guardarAnotacion();
    expect(anotacionService.crearAnotacionHistoria).not.toHaveBeenCalled();
    expect(component.anotacionesForm.at(0).controls.citaId.hasError('required')).toBeTrue();

    component.anotacionesForm.at(0).controls.citaId.setValue(1);
    fixture.detectChanges();
    expect(medicosVisibles()).toEqual(['Inés Mora']);
    expect(component.anotacionesForm.at(0).controls.medicoId.value).toBe(4);

    component.anotacionesForm.at(0).controls.citaId.setValue(5);
    fixture.detectChanges();
    expect(medicosVisibles()).toEqual([]);
    expect(component.anotacionesForm.at(0).controls.medicoId.value).toBeNull();
    component.guardarAnotacion();
    expect(anotacionService.crearAnotacionHistoria).not.toHaveBeenCalled();

    component.anotacionesForm.at(0).controls.citaId.setValue(2);
    fixture.detectChanges();
    expect(medicosVisibles()).toEqual(['Carlos Martínez - Pediatría']);
    expect(component.anotacionesForm.at(0).controls.medicoId.value).toBe(3);

    component.anotacionesForm.at(0).controls.medicoId.setValue(4);
    component.guardarAnotacion();
    expect(anotacionService.crearAnotacionHistoria).not.toHaveBeenCalled();
    expect(component.respuestaError).toContain('veterinario asignado');
    component.anotacionesForm.at(0).controls.medicoId.setValue(3);

    component.anotacionesForm.at(0).controls.descripcion.setValue('   ');
    component.guardarAnotacion();
    expect(anotacionService.crearAnotacionHistoria).not.toHaveBeenCalled();

    component.anotacionesForm.at(0).controls.descripcion.setValue('  Control de vacunas  ');
    component.guardarAnotacion();
    expect(anotacionService.crearAnotacionHistoria).toHaveBeenCalledOnceWith({
      historiaId: 1, medicoId: 3, citaId: 2, descripcion: 'Control de vacunas',
      diagnostico: 'Paciente sano', observaciones: 'Próximo control anual'
    });
    expect(historiaService.listar).toHaveBeenCalledTimes(3);
  });

  it('should keep the form open with an error and block duplicate submissions while saving', async () => {
    const respuesta = new Subject<AnotacionHistoria>();
    anotacionService.crearAnotacionHistoria.and.returnValue(respuesta);
    ((fixture.nativeElement as HTMLElement).querySelectorAll('tbody button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    component.anotacionesForm.at(0).setValue({
      medicoId: 3, citaId: 2, descripcion: 'Control', diagnostico: 'Paciente sano', observaciones: 'Control anual'
    });
    component.guardarAnotacion();
    component.guardarAnotacion();
    component.cerrarFormulario();
    expect(anotacionService.crearAnotacionHistoria).toHaveBeenCalledTimes(1);
    expect(component.guardando).toBeTrue();
    respuesta.error({ error: { message: 'Error del servidor' } });
    expect(component.guardando).toBeFalse();
    expect(component.respuestaError).toBe('Error del servidor');
    expect(component.anotacionesForm.at(0).controls.descripcion.value).toBe('Control');
    expect(component.anotacionesForm.at(0).controls.diagnostico.value).toBe('Paciente sano');
    expect(component.anotacionesForm.at(0).controls.observaciones.value).toBe('Control anual');
    await fixture.whenStable();
    expect(document.querySelector('ngb-modal-window')).not.toBeNull();
  });

  it('should create several annotations in order from the same modal', async () => {
    ((fixture.nativeElement as HTMLElement).querySelectorAll('tbody button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const agregar = Array.from(document.querySelectorAll<HTMLButtonElement>('ngb-modal-window button'))
      .find(boton => boton.textContent?.includes('Agregar otra anotación'));
    agregar?.click();
    fixture.detectChanges();

    expect(component.anotacionesForm.length).toBe(2);
    expect(document.querySelector('#anotacion-cita-1')).not.toBeNull();
    expect(document.querySelector('#anotacion-diagnostico-1')).not.toBeNull();
    expect(document.querySelector('#anotacion-observaciones-1')).not.toBeNull();
    component.anotacionesForm.at(0).setValue({
      medicoId: 4, citaId: 1, descripcion: 'Primera', diagnostico: 'Gastritis', observaciones: 'Dieta blanda'
    });
    component.anotacionesForm.at(1).setValue({
      medicoId: 3, citaId: 2, descripcion: ' Segunda ', diagnostico: ' Paciente sano ', observaciones: ' Control anual '
    });
    component.guardarAnotacion();

    expect(anotacionService.crearAnotacionHistoria.calls.allArgs()).toEqual([
      [{ historiaId: 1, medicoId: 4, citaId: 1, descripcion: 'Primera', diagnostico: 'Gastritis', observaciones: 'Dieta blanda' }],
      [{ historiaId: 1, medicoId: 3, citaId: 2, descripcion: 'Segunda', diagnostico: 'Paciente sano', observaciones: 'Control anual' }]
    ]);
    expect(Swal.fire).toHaveBeenCalledWith('Operación exitosa', 'Se crearon 2 anotaciones correctamente.', 'success');
    await fixture.whenStable();
    expect(document.querySelector('ngb-modal-window')).toBeNull();
  });

  it('should not save any annotation when one row is invalid and keep at least one row', async () => {
    ((fixture.nativeElement as HTMLElement).querySelectorAll('tbody button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    component.quitarAnotacion(0);
    expect(component.anotacionesForm.length).toBe(1);

    component.agregarAnotacion();
    component.anotacionesForm.at(0).setValue({
      medicoId: 3, citaId: 2, descripcion: 'Completa', diagnostico: 'Paciente sano', observaciones: 'Control anual'
    });
    component.guardarAnotacion();
    expect(anotacionService.crearAnotacionHistoria).not.toHaveBeenCalled();
    expect(component.respuestaError).toContain('todas las anotaciones');

    component.quitarAnotacion(1);
    expect(component.anotacionesForm.length).toBe(1);
    expect(component.anotacionesForm.at(0).controls.descripcion.value).toBe('Completa');
  });

  it('should remove saved rows and report a partial failure', async () => {
    anotacionService.crearAnotacionHistoria.and.returnValues(
      of({} as AnotacionHistoria),
      throwError(() => ({ error: { message: 'Error del servidor' } }))
    );
    ((fixture.nativeElement as HTMLElement).querySelectorAll('tbody button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    component.agregarAnotacion();
    component.anotacionesForm.at(0).setValue({
      medicoId: 4, citaId: 1, descripcion: 'Primera', diagnostico: 'Gastritis', observaciones: 'Dieta blanda'
    });
    component.anotacionesForm.at(1).setValue({
      medicoId: 3, citaId: 2, descripcion: 'Segunda', diagnostico: 'Paciente sano', observaciones: 'Control anual'
    });
    const llamadasListar = historiaService.listar.calls.count();
    component.guardarAnotacion();

    expect(anotacionService.crearAnotacionHistoria).toHaveBeenCalledTimes(2);
    expect(component.anotacionesForm.length).toBe(1);
    expect(component.anotacionesForm.at(0).controls.descripcion.value).toBe('Segunda');
    expect(component.anotacionesForm.at(0).controls.diagnostico.value).toBe('Paciente sano');
    expect(component.anotacionesForm.at(0).controls.observaciones.value).toBe('Control anual');
    expect(component.respuestaError).toContain('Se guardaron 1');
    expect(component.respuestaError).toContain('Error del servidor');
    expect(historiaService.listar.calls.count()).toBe(llamadasListar + 1);
    await fixture.whenStable();
    expect(document.querySelector('ngb-modal-window')).not.toBeNull();
  });

  it('should require diagnosis and observations in every annotation and show validation errors', async () => {
    ((fixture.nativeElement as HTMLElement).querySelectorAll('tbody button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    component.agregarAnotacion();
    component.anotacionesForm.at(0).patchValue({
      citaId: 1, descripcion: 'Primera', diagnostico: 'Paciente sano', observaciones: 'Control anual'
    });
    const fila = component.anotacionesForm.at(1);
    fila.patchValue({ citaId: 2, descripcion: 'Segunda' });

    for (const campo of ['diagnostico', 'observaciones'] as const) {
      const otroCampo = campo === 'diagnostico' ? 'observaciones' : 'diagnostico';
      fila.controls[otroCampo].setValue('Texto válido');
      for (const valor of ['', ' \n\t ']) {
        fila.controls[campo].setValue(valor);
        component.guardarAnotacion();
        fixture.detectChanges();
        expect(fila.controls[campo].invalid).withContext(campo).toBeTrue();
        expect(document.querySelector(`#anotacion-${campo}-1`)?.classList.contains('is-invalid')).toBeTrue();
        expect(document.querySelector(`#error-anotacion-${campo}-1`)?.textContent).toContain('solo espacios');
        expect(component.respuestaError).toContain('todas las anotaciones');
        expect(anotacionService.crearAnotacionHistoria).not.toHaveBeenCalled();
      }
      fila.controls[campo].setValue('Texto válido');
    }
  });

  it('should show the latest clinical fields in the table and all clinical fields in the detail', async () => {
    const historia = crearHistoria(1);
    const reciente = crearAnotacion(historia, '2026-03-01T12:00:00', 'Control');
    reciente.diagnostico = 'Infección urinaria';
    reciente.observaciones = 'Control en una semana';
    const antigua = crearAnotacion(historia, '2026-02-01T12:00:00', 'Primera consulta');
    antigua.diagnostico = 'Gastritis';
    antigua.observaciones = 'Dieta blanda';
    const sinCampos = crearAnotacion(historia, '2026-01-01T12:00:00', 'Registro anterior');
    historia.anotaciones = [reciente, antigua, sinCampos];
    component.listHistorias = [historia];
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tbody')?.textContent).toContain('Infección urinaria');
    expect(element.querySelector('tbody')?.textContent).toContain('Control en una semana');
    expect(element.querySelector('tbody')?.textContent).not.toContain('Gastritis');
    element.querySelector<HTMLButtonElement>('tbody button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const secciones = document.querySelectorAll('ngb-modal-window section');
    expect(secciones[0].textContent).toContain('Infección urinaria');
    expect(secciones[0].textContent).toContain('Control en una semana');
    expect(secciones[1].textContent).toContain('Gastritis');
    expect(secciones[1].textContent).toContain('Dieta blanda');
    expect(secciones[2].textContent).toMatch(/Diagnóstico\s*No informado\s*Observaciones\s*No informado/);
    expect(historia.anotaciones).toEqual([reciente, antigua, sinCampos]);
  });

  it('should filter clinical fields in all annotations ignoring accents, case and surrounding spaces', () => {
    const historia = crearHistoria(1, 'Max');
    const antigua = crearAnotacion(historia, '2026-02-01T12:00:00', 'Primera');
    antigua.diagnostico = 'Infección urinaria';
    antigua.observaciones = 'Revisión en una semana';
    const reciente = crearAnotacion(historia, '2026-03-01T12:00:00', 'Control');
    reciente.diagnostico = 'Paciente sano';
    reciente.observaciones = 'Vacunación anual';
    historia.anotaciones = [antigua, reciente];
    component.listHistorias = [historia, crearHistoria(2, 'Luna')];
    for (const termino of [' INFECCION ', 'revision', 'PACIENTE SANO', 'vacunacion']) {
      component.terminoBusqueda = termino;
      expect(component.historiasFiltradas.map(fila => fila.mascota)).withContext(termino).toEqual(['Max']);
    }
    reciente.diagnostico = null;
    reciente.observaciones = '   ';
    component.terminoBusqueda = '';
    const fila = component.historiasFiltradas.find(item => item.mascota === 'Max');
    expect(fila?.diagnostico).toBe('No informado');
    expect(fila?.observaciones).toBe('No informado');
  });

  it('should sort both clinical columns in both directions and reset pagination', () => {
    const historiaA = crearHistoria(1);
    const historiaB = crearHistoria(2);
    const anotacionA = crearAnotacion(historiaA, '2026-02-01T12:00:00', 'A');
    const anotacionB = crearAnotacion(historiaB, '2026-02-01T12:00:00', 'B');
    anotacionA.diagnostico = 'Gastritis';
    anotacionA.observaciones = 'Reposo';
    anotacionB.diagnostico = 'Alergia';
    anotacionB.observaciones = 'Control';
    historiaA.anotaciones = [anotacionA];
    historiaB.anotaciones = [anotacionB];
    component.listHistorias = [historiaA, historiaB];
    for (const columna of ['diagnostico', 'observaciones'] as const) {
      component.paginaActual = 2;
      component.ordenarPor(columna);
      expect(component.paginaActual).toBe(1);
      expect(component.historiasFiltradas.map(fila => fila.detalle.historia.id)).toEqual([2, 1]);
      component.ordenarPor(columna);
      expect(component.historiasFiltradas.map(fila => fila.detalle.historia.id)).toEqual([1, 2]);
    }
  });

  it('should use the latest annotation without changing the original annotation order', () => {
    const historia = crearHistoria(1);
    const reciente = crearAnotacion(historia, '2026-03-01T12:00:00', 'Control urinario');
    const antigua = crearAnotacion(historia, '2026-02-01T12:00:00', 'Primera consulta');
    historia.anotaciones = [reciente, antigua];
    component.listHistorias = [historia];
    fixture.detectChanges();

    expect(component.historiasFiltradas[0].veterinario).toBe('María Gómez');
    expect(component.historiasFiltradas[0].motivo).toBe('Consulta general');
    expect(component.historiasFiltradas[0].estado).toBe('No informado');
    expect(historia.anotaciones).toEqual([reciente, antigua]);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('María Gómez');
    expect(element.textContent).toContain('Consulta general');
    expect(element.textContent).toContain('No informado');
    expect(element.textContent).not.toContain('Control urinario');
  });

  it('should filter all displayed fields ignoring accents, case and surrounding spaces', () => {
    const historia = crearHistoria(1, 'Max');
    historia.anotaciones = [crearAnotacion(historia, '2026-01-02T10:00:00', 'Revisión urinaria')];
    component.listHistorias = [historia, crearHistoria(2, 'Luna')];
    for (const termino of ['2026-01-01', ' MAX ', 'perez', 'MARIA', 'consulta general', 'no informado']) {
      component.terminoBusqueda = termino;
      expect(component.historiasFiltradas.some(fila => fila.mascota === 'Max')).withContext(termino).toBeTrue();
    }
    component.terminoBusqueda = 'consulta general';
    expect(component.historiasFiltradas.length).toBe(1);
    component.terminoBusqueda = 'inexistente';
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('No se encontraron historias médicas');
  });

  it('should use the latest annotation appointment even when appointments have a different date order', () => {
    const historia = crearHistoria(1);
    const antigua = crearAnotacion(historia, '2026-02-01T12:00:00', 'Anotacion antigua');
    antigua.cita = { fechaHora: '2026-12-01T10:00:00', motivo: 'Vacunación', estado: 'CANCELADA' };
    const reciente = crearAnotacion(historia, '2026-03-01T12:00:00', 'Anotacion reciente');
    historia.anotaciones = [antigua, reciente];
    component.listHistorias = [historia];

    expect(component.historiasFiltradas[0].motivo).toBe('Consulta general');
    expect(component.historiasFiltradas[0].estado).toBe('No informado');
    expect(component.historiasFiltradas[0].fecha).toBe('2026-01-01');
  });

  it('should show missing appointment data without substituting the annotation description or an older appointment', () => {
    const historia = crearHistoria(1);
    const antigua = crearAnotacion(historia, '2026-02-01T12:00:00', 'Control antiguo');
    const reciente = crearAnotacion(historia, '2026-03-01T12:00:00', 'Problemas urinarios');
    historia.anotaciones = [antigua, reciente];
    component.listHistorias = [historia];
    for (const cita of [undefined, null, { fechaHora: '2026-03-01T12:00:00', motivo: null, estado: ' ' }]) {
      reciente.cita = cita;
      expect(component.historiasFiltradas[0].motivo).toBe('No informado');
      expect(component.historiasFiltradas[0].estado).toBe('No informado');
      expect(component.historiasFiltradas[0].veterinario).toBe('María Gómez');
    }
  });

  it('should sort by appointment reason and pet activity status', () => {
    const historiaA = crearHistoria(1);
    const historiaB = crearHistoria(2);
    historiaA.historia.mascota.activo = true;
    historiaB.historia.mascota.activo = false;
    const anotacionA = crearAnotacion(historiaA, '2026-01-02T10:00:00', 'A');
    const anotacionB = crearAnotacion(historiaB, '2026-01-03T10:00:00', 'B');
    anotacionB.cita = { fechaHora: '2026-01-03T10:00:00', motivo: 'Vacunación', estado: 'CANCELADA' };
    historiaA.anotaciones = [anotacionA];
    historiaB.anotaciones = [anotacionB];
    component.listHistorias = [historiaA, historiaB];

    component.ordenarPor('motivo');
    expect(component.historiasFiltradas.map(fila => fila.motivo)).toEqual(['Consulta general', 'Vacunación']);
    component.ordenarPor('motivo');
    expect(component.historiasFiltradas.map(fila => fila.motivo)).toEqual(['Vacunación', 'Consulta general']);
    component.ordenarPor('estado');
    expect(component.historiasFiltradas.map(fila => fila.estado)).toEqual(['Activo', 'Inactivo']);
    component.ordenarPor('estado');
    expect(component.historiasFiltradas.map(fila => fila.estado)).toEqual(['Inactivo', 'Activo']);
  });

  it('should display and filter the pet activity status independently from the appointment status', () => {
    const historia = crearHistoria(1);
    historia.anotaciones = [crearAnotacion(historia, '2026-01-02T10:00:00', 'Control')];
    component.listHistorias = [historia];
    const element: HTMLElement = fixture.nativeElement;
    for (const activo of [true, false]) {
      historia.historia.mascota.activo = activo;
      component.terminoBusqueda = activo ? 'activo' : 'inactivo';
      fixture.detectChanges();
      expect(component.historiasFiltradas[0].estado).toBe(activo ? 'Activo' : 'Inactivo');
      expect(element.querySelector('tbody .badge')?.textContent).toBe(activo ? 'Activo' : 'Inactivo');
      expect(element.querySelector('tbody .badge')?.classList.contains('bg-success')).toBe(activo);
      expect(element.querySelector('tbody .badge')?.classList.contains('bg-secondary')).toBe(!activo);
    }
  });

  it('should paginate five records and reset the page when searching', () => {
    component.listHistorias = Array.from({ length: 11 }, (_, indice) => crearHistoria(indice + 1));
    expect(component.totalPaginas).toBe(3);
    expect(component.historiasPaginadas.length).toBe(5);
    component.cambiarPagina(3);
    expect(component.historiasPaginadas.length).toBe(1);
    component.cambiarPagina(4);
    expect(component.paginaActual).toBe(3);
    component.cambiarPagina(0);
    expect(component.paginaActual).toBe(3);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const input = element.querySelector('input');
    if (!input) {
      fail('Search input was not rendered');
      return;
    }
    input.value = 'Mascota 11';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.paginaActual).toBe(1);
    expect(component.historiasPaginadas.length).toBe(1);
    expect(element.querySelector('nav')).toBeNull();
  });

  it('should sort chronologically and toggle text sorting without changing the source list', () => {
    const historias = [crearHistoria(1, 'Zeta'), crearHistoria(2, 'Alfa')];
    component.listHistorias = historias;
    expect(component.historiasFiltradas.map(fila => fila.mascota)).toEqual(['Alfa', 'Zeta']);
    component.ordenarPor('fecha');
    expect(component.historiasFiltradas.map(fila => fila.mascota)).toEqual(['Zeta', 'Alfa']);
    component.paginaActual = 2;
    component.ordenarPor('mascota');
    expect(component.paginaActual).toBe(1);
    expect(component.historiasFiltradas.map(fila => fila.mascota)).toEqual(['Alfa', 'Zeta']);
    component.ordenarPor('mascota');
    expect(component.historiasFiltradas.map(fila => fila.mascota)).toEqual(['Zeta', 'Alfa']);
    expect(component.listHistorias).toEqual(historias);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('th')[1].getAttribute('aria-sort')).toBe('descending');
  });

  it('should display loading and empty states separately', () => {
    const respuesta = new Subject<HistoriaMedica[]>();
    historiaService.listar.and.returnValue(respuesta);
    component.listarHistorias();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Cargando historias médicas');
    expect(element.textContent).not.toContain('No hay historias médicas registradas');
    respuesta.next([]);
    respuesta.complete();
    fixture.detectChanges();
    expect(element.textContent).toContain('No hay historias médicas registradas');
    expect(component.cargandoHistorias).toBeFalse();
  });

  it('should display request errors and allow retrying', () => {
    const error = new Error('Fallo del servidor');
    const log = spyOn(console, 'error');
    historiaService.listar.and.returnValue(throwError(() => error));
    component.listarHistorias();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('No fue posible cargar las historias médicas.');
    expect(log).toHaveBeenCalledWith('Error al listar historias médicas:', error);
    expect(component.cargandoHistorias).toBeFalse();
    historiaService.listar.and.returnValue(of([]));
    element.querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
    fixture.detectChanges();
    expect(component.errorHistorias).toBe('');
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('should clamp the current page after reloading a smaller list', () => {
    component.listHistorias = Array.from({ length: 11 }, (_, indice) => crearHistoria(indice + 1));
    component.cambiarPagina(3);
    historiaService.listar.and.returnValue(of([crearHistoria(1)]));
    component.listarHistorias();
    expect(component.paginaActual).toBe(1);
  });
});
