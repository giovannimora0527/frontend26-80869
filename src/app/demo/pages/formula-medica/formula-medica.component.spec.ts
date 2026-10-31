import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FormulaMedicaComponent } from './formula-medica.component';
import { FormulaService } from './service/formula.service';
import { CitaService } from '../cita/service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicamentoService } from '../medicamento/service/medicamento.service';
import { MedicoService } from '../medico/service/medico.service';

describe('FormulaMedicaComponent', () => {
  let component: FormulaMedicaComponent;
  let fixture: ComponentFixture<FormulaMedicaComponent>;
  let formulaService: jasmine.SpyObj<FormulaService>;

  beforeEach(async () => {
    formulaService = jasmine.createSpyObj('FormulaService', ['listarPaginado', 'buscarPorId', 'crearFormula',
      'actualizarFormula', 'cambiarEstado', 'listarMedicamentos']);
    formulaService.listarPaginado.and.returnValue(of({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 }));
    formulaService.listarMedicamentos.and.returnValue(of([]));
    const medicamentoService = jasmine.createSpyObj('MedicamentoService', ['listarMedicamentos']);
    medicamentoService.listarMedicamentos.and.returnValue(of([]));
    const clienteService = jasmine.createSpyObj('ClienteService', ['listarClientesActivos']);
    clienteService.listarClientesActivos.and.returnValue(of([]));
    const medicoService = jasmine.createSpyObj('MedicoService', ['listar']);
    medicoService.listar.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [FormulaMedicaComponent],
      providers: [
        { provide: FormulaService, useValue: formulaService },
        { provide: MedicamentoService, useValue: medicamentoService },
        { provide: ClienteService, useValue: clienteService },
        { provide: MedicoService, useValue: medicoService },
        { provide: MascotaService, useValue: jasmine.createSpyObj('MascotaService', ['listarPorCliente']) },
        { provide: CitaService, useValue: jasmine.createSpyObj('CitaService', ['listarCitasPorMascota']) }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(FormulaMedicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga las fórmulas por fecha de creación descendente', () => {
    const filtro = formulaService.listarPaginado.calls.mostRecent().args[0];
    expect(filtro.sort).toBe('fechaCreacion');
    expect(filtro.dir).toBe('desc');
  });

  it('valida la dosis: número mayor a cero con unidad', () => {
    const dosis = component.f['dosis'];
    ['0 ml', '-1 ml', 'abc', '5'].forEach((v) => {
      dosis.setValue(v);
      expect(dosis.valid).withContext(v).toBeFalse();
    });
    ['0.5 ml', '1 tableta', '1/2 tableta', '2,5 mg'].forEach((v) => {
      dosis.setValue(v);
      expect(dosis.valid).withContext(v).toBeTrue();
    });
  });

  it('valida la duración: número mayor a cero y máximo 365 días', () => {
    const duracion = component.f['duracion'];
    ['0 días', 'abc', '400 días', '2 años'].forEach((v) => {
      duracion.setValue(v);
      expect(duracion.valid).withContext(v).toBeFalse();
    });
    ['5 días', '2 semanas', '1 mes', '3'].forEach((v) => {
      duracion.setValue(v);
      expect(duracion.valid).withContext(v).toBeTrue();
    });
  });

  it('no envía una fórmula incompleta', () => {
    component.nuevaFormula();
    component.guardarFormula();
    expect(formulaService.crearFormula).not.toHaveBeenCalled();
  });
});
