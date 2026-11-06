import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { CitaComponent } from './cita.component';
import { CitaService } from './service/cita.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { Cita } from 'src/app/models/cita';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';

describe('CitaComponent', () => {
  let component: CitaComponent;
  let fixture: ComponentFixture<CitaComponent>;
  let citaService: jasmine.SpyObj<CitaService>;
  let mascotaService: jasmine.SpyObj<MascotaService>;
  let medicoService: jasmine.SpyObj<MedicoService>;
  const mascota: Mascota = { mascotaId: 7, nombreMascota: 'Luna' };
  const medico: Medico = {
    id: 3, nombres: 'Andres', apellidos: 'Perez', tipoDocumento: 'CC',
    numeroDocumento: '123', telefono: '1234567', registroProfesional: 'RP123',
    especializacion: {}
  };
  const cita: Cita = {
    id: 1, mascota, medico, fechaHora: new Date(2026, 9, 15, 10, 30),
    motivo: 'Control general', estado: 'Pendiente'
  };

  function completarFormulario(): void {
    component.form.setValue({
      fechaHora: '2026-10-15T10:30', mascota, medico, motivo: 'Control general', estado: 'Pendiente'
    });
  }

  beforeEach(async () => {
    citaService = jasmine.createSpyObj<CitaService>('CitaService', ['listarCitas', 'guardarCita', 'actualizarCita']);
    mascotaService = jasmine.createSpyObj<MascotaService>('MascotaService', ['listarMascotas']);
    medicoService = jasmine.createSpyObj<MedicoService>('MedicoService', ['listar', 'listarMedicosDisponiblesPorFecha']);
    citaService.listarCitas.and.returnValue(of([cita]));
    citaService.guardarCita.and.returnValue(of(cita));
    citaService.actualizarCita.and.returnValue(of(cita));
    mascotaService.listarMascotas.and.returnValue(of([mascota]));
    medicoService.listar.and.returnValue(of([medico]));
    medicoService.listarMedicosDisponiblesPorFecha.and.returnValue(of([medico]));
    await TestBed.configureTestingModule({
      imports: [CitaComponent],
      providers: [
        { provide: CitaService, useValue: citaService },
        { provide: MascotaService, useValue: mascotaService },
        { provide: MedicoService, useValue: medicoService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Luna');
    expect(component.listMascotas).toEqual([mascota]);
    expect(component.listMedicos).toEqual([]);
    expect(medicoService.listar).not.toHaveBeenCalled();
  });

  it('colors each status independently of casing and surrounding spaces', () => {
    const casos = [
      [' Programada ', 'rgb(255, 193, 7)'],
      ['CANCELADA', 'rgb(220, 53, 69)'],
      ['pendiente', 'rgb(253, 126, 20)'],
      ['Confirmada', 'rgb(25, 135, 84)'],
      ['atendida', 'rgb(25, 135, 84)'],
      ['Otro', 'rgb(233, 236, 239)']
    ];
    for (const [estado, color] of casos) {
      component.listEspecializaciones = [{ ...cita, estado }];
      fixture.detectChanges();
      const distintivo: HTMLElement = fixture.nativeElement.querySelector('.estado-cita');
      expect(distintivo.textContent?.trim()).toBe(estado.trim().toUpperCase());
      expect(getComputedStyle(distintivo).backgroundColor).withContext(estado).toBe(color);
    }
  });

  it('filters by pet, doctor, date, reason and status, ignoring accents', () => {
    for (const termino of ['lúna', 'andrés perez', '2026-10-15 10:30', 'control', 'pendiente']) {
      const buscador: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]');
      buscador.value = termino;
      buscador.dispatchEvent(new Event('input'));
      expect(component.citasFiltradas).withContext(termino).toEqual([cita]);
      expect(component.paginaActual).toBe(1);
    }
  });

  it('shows five rows per page and wires page navigation', () => {
    component.listEspecializaciones = Array.from({ length: 6 }, (_, index) => ({ ...cita, id: index + 1 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(5);
    const botones: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.page-link'));
    botones.find((boton) => boton.textContent?.trim() === 'Siguiente')?.click();
    fixture.detectChanges();
    expect(component.paginaActual).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    component.cambiarPagina(3);
    expect(component.paginaActual).toBe(2);
  });

  it('sorts by pet name in both directions', () => {
    const otra: Cita = { ...cita, id: 2, mascota: { mascotaId: 8, nombreMascota: 'Beto' } };
    component.listEspecializaciones = [cita, otra];
    expect(component.citasFiltradas).toEqual([otra, cita]);
    component.ordenarPor('mascota');
    expect(component.citasFiltradas).toEqual([cita, otra]);
  });

  it('shows the empty and no-results messages', () => {
    component.terminoBusqueda = 'inexistente';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('No se encontraron citas');
    component.listEspecializaciones = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('No hay citas registradas');
  });

  it('wires the create and edit buttons', () => {
    const abrir = spyOn(component, 'openModal');
    fixture.nativeElement.querySelector('.btn-outline-primary').click();
    expect(abrir).toHaveBeenCalledWith('C');
    fixture.nativeElement.querySelector('.btn-outline-info').click();
    expect(abrir).toHaveBeenCalledWith('E');
    expect(component.form.value.fechaHora).toBe('2026-10-15T10:30');
    expect(component.citaSelected).toBe(cita);
  });

  it('preselects pet and doctor by identifier when editing', () => {
    spyOn(component, 'openModal');
    component.abrirEdicion({ ...cita, mascota: { ...mascota }, medico: { ...medico } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#citaMascota').selectedIndex).toBe(1);
    expect(fixture.nativeElement.querySelector('#citaMedico').selectedIndex).toBe(1);
  });

  it('rejects invalid submissions and enforces reason length limits', () => {
    component.guardarCita();
    expect(component.form.touched).toBeTrue();
    expect(citaService.guardarCita).not.toHaveBeenCalled();
    for (const [length, valid] of [[5, false], [6, true], [255, true], [256, false]] as const) {
      component.form.controls['motivo'].setValue('a'.repeat(length));
      expect(component.form.controls['motivo'].valid).withContext(String(length)).toBe(valid);
    }
  });

  it('creates a cita with the selected identifiers and refreshes the list', () => {
    spyOn(Swal, 'fire');
    component.modoFormulario = 'C';
    completarFormulario();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(citaService.guardarCita).toHaveBeenCalledWith(jasmine.objectContaining({
      mascotaId: 7, medicoId: 3, fechaHora: '2026-10-15T10:30', motivo: 'Control general', estado: 'programada'
    }));
    expect(citaService.listarCitas).toHaveBeenCalledTimes(2);
    expect(component.enviando).toBeFalse();
  });

  it('updates the selected cita instead of creating another one', () => {
    spyOn(Swal, 'fire');
    spyOn(component, 'openModal');
    component.abrirEdicion(cita);
    component.guardarCita();
    expect(citaService.actualizarCita).toHaveBeenCalledWith(jasmine.objectContaining({ id: 1, mascotaId: 7, medicoId: 3 }));
    expect(citaService.guardarCita).not.toHaveBeenCalled();
  });

  it('defaults new appointments to programada and hides the status selector', () => {
    spyOn(component, 'openModal');
    component.abrirEdicion({ ...cita, estado: 'confirmada' });
    component.nuevaCita('C');
    fixture.detectChanges();
    expect(component.form.controls['estado'].value).toBe('programada');
    expect(fixture.nativeElement.querySelector('#citaEstado')).toBeNull();
  });

  it('preserves the current status but only offers cancelada and confirmada as changes', () => {
    spyOn(component, 'openModal');
    spyOn(Swal, 'fire');
    for (const estado of [' PROGRAMADA ', 'pendiente', 'atendida', 'confirmada']) {
      component.abrirEdicion({ ...cita, estado });
      fixture.detectChanges();
      const selector: HTMLSelectElement = fixture.nativeElement.querySelector('#citaEstado');
      expect(selector.value).toContain(estado.trim().toLowerCase());
      expect(Array.from(selector.options).filter((opcion) => !opcion.disabled).map((opcion) => opcion.value))
        .toEqual(['cancelada', 'confirmada']);
    }
    for (const estado of ['cancelada', 'confirmada']) {
      component.abrirEdicion(cita);
      fixture.detectChanges();
      const selector: HTMLSelectElement = fixture.nativeElement.querySelector('#citaEstado');
      selector.value = estado;
      selector.dispatchEvent(new Event('change'));
      component.guardarCita();
      expect(citaService.actualizarCita).toHaveBeenCalledWith(jasmine.objectContaining({ id: cita.id, estado }));
    }
  });

  it('identifies cancelled appointments and rejects attempts to edit them', () => {
    const abrir = spyOn(component, 'openModal');
    const aviso = spyOn(Swal, 'fire');
    for (const estado of ['cancelada', 'CANCELADA', ' Cancelada ']) {
      const cancelada = { ...cita, estado };
      component.listEspecializaciones = [cancelada];
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.btn-outline-info').getAttribute('aria-label'))
        .toBe('No se puede editar una cita cancelada');
      component.abrirEdicion(cancelada);
    }
    expect(abrir).not.toHaveBeenCalled();
    expect(aviso).toHaveBeenCalledWith('Cita cancelada', 'No se puede editar una cita cancelada.', 'warning');
  });

  it('opens the details of each row including cancelled appointments without changing the form', () => {
    const mostrar = jasmine.createSpy('show');
    component.modalDetalleInstance = { show: mostrar, hide: jasmine.createSpy('hide') };
    component.listEspecializaciones = [cita, { ...cita, id: 2, estado: 'cancelada' }];
    const valores = component.form.getRawValue();
    fixture.detectChanges();
    const botones: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.btn-ver-cita'));
    expect(botones.length).toBe(2);
    botones[0].click();
    expect(component.citaDetalle?.id).toBe(1);
    botones[1].click();
    expect(component.citaDetalle?.id).toBe(2);
    expect(mostrar).toHaveBeenCalledTimes(2);
    expect(component.form.getRawValue()).toEqual(valores);
    expect(component.citaSelected).toBeNull();
  });

  it('shows appointment, pet, doctor and client data in a read-only modal with only a close button', () => {
    const ocultar = jasmine.createSpy('hide');
    component.modalDetalleInstance = { show: jasmine.createSpy('show'), hide: ocultar };
    component.verCita({
      ...cita,
      mascota: { ...mascota, edad: 4, raza: { nombre: 'Labrador', especie: 'Canino' } },
      medico: { ...medico, especializacion: { nombre: 'Cirugia' } },
      cliente: { nombres: 'Maria', apellidos: 'Lopez', tipoDocumento: 'CC', numeroDocumento: '456', direccion: 'Calle 10' }
    });
    fixture.detectChanges();
    const modal: HTMLElement = fixture.nativeElement.querySelector('#modalVerCita');
    for (const texto of ['Luna', 'Labrador', 'Canino', 'Andres', 'Perez', 'RP123', 'Cirugia', 'Maria', 'Lopez', '456', 'Calle 10', 'Control general']) {
      expect(modal.textContent).withContext(texto).toContain(texto);
    }
    expect(modal.querySelectorAll('input, select, textarea, form').length).toBe(0);
    expect(modal.querySelectorAll('button').length).toBe(1);
    const cerrar = modal.querySelector('button');
    expect(cerrar?.textContent?.trim()).toBe('Cerrar');
    cerrar?.click();
    expect(ocultar).toHaveBeenCalled();
    expect(citaService.actualizarCita).not.toHaveBeenCalled();
    expect(citaService.guardarCita).not.toHaveBeenCalled();
  });

  it('uses the pet owner when the appointment has no direct client and handles missing details', () => {
    component.modalDetalleInstance = { show: jasmine.createSpy('show'), hide: jasmine.createSpy('hide') };
    component.verCita({ ...cita, mascota: { ...mascota, cliente: { nombres: 'Propietario' } } });
    fixture.detectChanges();
    const modal: HTMLElement = fixture.nativeElement.querySelector('#modalVerCita');
    expect(modal.textContent).toContain('Propietario');
    component.verCita({ ...cita, mascota: undefined, medico: undefined, cliente: undefined, motivo: null });
    fixture.detectChanges();
    expect(modal.textContent).not.toContain('Propietario');
    expect(modal.textContent).toContain('No hay información del cliente registrada.');
    expect(modal.textContent).toContain('No registrado');
  });

  it('rejects updates based on the original status even if the form status changes', () => {
    component.modoFormulario = 'E';
    completarFormulario();
    component.citaSelected = { ...cita, estado: ' CANCELADA ' };
    component.form.controls['estado'].setValue('confirmada');
    component.guardarCita();
    fixture.detectChanges();
    expect(citaService.actualizarCita).not.toHaveBeenCalled();
    expect(citaService.guardarCita).not.toHaveBeenCalled();
    expect(component.enviando).toBeFalse();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('.modal-body [role="alert"]').textContent)
      .toContain('No se puede actualizar una cita cancelada.');
  });

  it('blocks duplicate requests while saving', () => {
    const respuesta = new Subject<Cita>();
    citaService.guardarCita.and.returnValue(respuesta);
    component.modoFormulario = 'C';
    completarFormulario();
    component.guardarCita();
    component.guardarCita();
    fixture.detectChanges();
    expect(citaService.guardarCita).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    respuesta.complete();
  });

  it('displays save errors without losing the form values', () => {
    spyOn(console, 'error');
    citaService.guardarCita.and.returnValue(throwError(() => ({ error: { mensaje: 'Horario no disponible' } })));
    component.modoFormulario = 'C';
    completarFormulario();
    component.guardarCita();
    fixture.detectChanges();
    expect(component.enviando).toBeFalse();
    expect(component.form.value.motivo).toBe('Control general');
    expect(fixture.nativeElement.querySelector('.modal-body [role="alert"]').textContent).toContain('Horario no disponible');
  });

  it('displays catalog and list errors', () => {
    spyOn(console, 'error');
    mascotaService.listarMascotas.and.returnValue(throwError(() => new Error('offline')));
    medicoService.listarMedicosDisponiblesPorFecha.and.returnValue(throwError(() => new Error('offline')));
    citaService.listarCitas.and.returnValue(throwError(() => new Error('offline')));
    component.listarMascotas();
    component.form.controls['fechaHora'].setValue('2026-10-15T10:30');
    component.consultarMedicosDisponibles();
    component.listarCitas();
    fixture.detectChanges();
    expect(component.cargandoMascotas).toBeFalse();
    expect(component.cargandoMedicos).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar las mascotas.');
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar los médicos disponibles.');
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar las citas.');
  });

  it('calculates a read-only end exactly fifteen minutes later, including day and year changes', () => {
    for (const [inicio, fin] of [
      ['2026-10-15T10:30', '2026-10-15T10:45'],
      ['2026-10-31T23:50', '2026-11-01T00:05'],
      ['2026-12-31T23:50', '2027-01-01T00:05']
    ]) {
      component.form.controls['fechaHora'].setValue(inicio);
      fixture.detectChanges();
      const entrada: HTMLInputElement = fixture.nativeElement.querySelector('#citaFechaFin');
      expect(entrada.readOnly).toBeTrue();
      expect(entrada.value).toBe(fin);
      expect(component.fechaFin?.getTime()).toBe(new Date(inicio).getTime() + 900000);
    }
  });

  it('queries availability from the button using Date objects for the selected interval', () => {
    const consultar = spyOn(component, 'listarMedicosDisponiblesPorFecha').and.callThrough();
    const entrada: HTMLInputElement = fixture.nativeElement.querySelector('#citaFechaHora');
    entrada.value = '2026-10-15T10:30';
    entrada.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('#consultarMedicos').click();
    expect(consultar).toHaveBeenCalledWith(new Date(2026, 9, 15, 10, 30), new Date(2026, 9, 15, 10, 45));
    expect(medicoService.listarMedicosDisponiblesPorFecha).toHaveBeenCalledWith(
      new Date(2026, 9, 15, 10, 30), new Date(2026, 9, 15, 10, 45)
    );
    expect(component.listMedicos).toEqual([medico]);
    expect(component.disponibilidadConsultada).toBeTrue();
  });

  it('does not query without a valid start date', () => {
    for (const fecha of [null, '', 'invalida']) {
      component.form.controls['fechaHora'].setValue(fecha);
      component.consultarMedicosDisponibles();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#consultarMedicos').disabled).toBeTrue();
      expect(fixture.nativeElement.querySelector('#citaFechaFin').value).toBe('');
      expect(component.form.controls['fechaHora'].touched).toBeTrue();
    }
    expect(medicoService.listarMedicosDisponiblesPorFecha).not.toHaveBeenCalled();
  });

  it('clears availability and the selected doctor when the start changes', () => {
    completarFormulario();
    component.consultarMedicosDisponibles();
    component.form.controls['medico'].setValue(medico);
    component.form.controls['fechaHora'].setValue('2026-10-15T11:00');
    expect(component.listMedicos).toEqual([]);
    expect(component.form.controls['medico'].value).toBeNull();
    expect(component.disponibilidadConsultada).toBeFalse();
    expect(component.form.invalid).toBeTrue();
  });

  it('ignores old responses after changing the date or closing the modal', () => {
    const respuesta = new Subject<Medico[]>();
    medicoService.listarMedicosDisponiblesPorFecha.and.returnValue(respuesta);
    component.form.controls['fechaHora'].setValue('2026-10-15T10:30');
    component.consultarMedicosDisponibles();
    component.form.controls['fechaHora'].setValue('2026-10-15T11:00');
    respuesta.next([medico]);
    expect(component.listMedicos).toEqual([]);
    expect(component.cargandoMedicos).toBeFalse();
    component.consultarMedicosDisponibles();
    component.closeModal();
    respuesta.next([medico]);
    expect(component.listMedicos).toEqual([]);
    expect(component.disponibilidadConsultada).toBeFalse();
    respuesta.complete();
  });

  it('blocks duplicate availability requests and reports an empty result', () => {
    const respuesta = new Subject<Medico[]>();
    medicoService.listarMedicosDisponiblesPorFecha.and.returnValue(respuesta);
    component.form.controls['fechaHora'].setValue('2026-10-15T10:30');
    component.consultarMedicosDisponibles();
    component.consultarMedicosDisponibles();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#consultarMedicos').disabled).toBeTrue();
    expect(medicoService.listarMedicosDisponiblesPorFecha).toHaveBeenCalledTimes(1);
    respuesta.next([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('No hay médicos disponibles');
    expect(component.form.controls['medico'].invalid).toBeTrue();
    respuesta.complete();
  });

  it('retries failed availability queries using the current interval', () => {
    spyOn(console, 'error');
    medicoService.listarMedicosDisponiblesPorFecha.and.returnValue(throwError(() => new Error('offline')));
    component.form.controls['fechaHora'].setValue('2026-10-15T10:30');
    component.consultarMedicosDisponibles();
    fixture.detectChanges();
    medicoService.listarMedicosDisponiblesPorFecha.and.returnValue(of([medico]));
    fixture.nativeElement.querySelector('#citaMedico + [role="alert"] button').click();
    expect(component.errorMedicos).toBe('');
    expect(component.listMedicos).toEqual([medico]);
    expect(medicoService.listarMedicosDisponiblesPorFecha).toHaveBeenCalledTimes(2);
  });
});
