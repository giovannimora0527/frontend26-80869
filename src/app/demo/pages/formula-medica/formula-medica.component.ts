import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';
import { Observable } from 'rxjs';

import { CitaResumen } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { FormulaFiltro, FormulaMedica, FormulaResumen, FormulaRq } from 'src/app/models/formula-medica';
import { Mascota } from 'src/app/models/mascota';
import { Medicamento } from 'src/app/models/medicamento';
import { Medico } from 'src/app/models/medico';
import { Pagina, ParametrosPagina } from 'src/app/models/pagina';
import { CitaService } from 'src/app/services/cita.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { FormulaMedicaService } from 'src/app/services/formula-medica.service';
import { MedicamentoService } from 'src/app/services/medicamento.service';
import { MedicoService } from 'src/app/services/medico.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { OrdenThComponent } from 'src/app/shared/orden-th/orden-th.component';
import { TablaServidor } from 'src/app/utils/tabla-servidor';
import { alertaError, alertaExito, confirmar } from 'src/app/utils/alertas.util';
import { mensajeDeError } from 'src/app/utils/error.util';
import { abrirModal, cerrarModal } from 'src/app/utils/modal.util';
import { formatearFechaHora, separarFechaHora } from 'src/app/utils/fecha.util';

/** La dosis debe contener una cantidad mayor que cero (por ejemplo "500 mg", "2,5 ml"). */
function dosisValida(control: AbstractControl): ValidationErrors | null {
  const texto = String(control.value ?? '').trim();
  if (!texto) {
    return null; // lo cubre `required`
  }
  const m = /(\d+(?:[.,]\d+)?)/.exec(texto);
  return m && parseFloat(m[1].replace(',', '.')) > 0 ? null : { dosisSinCantidad: true };
}

/**
 * Módulo de **Fórmulas médicas**.
 *
 * - Listado resumido con paginación, filtros y orden en el servidor.
 * - Formulario reactivo en modal con combos dependientes Cliente → Mascota → Cita (más Medicamento).
 * - Al editar solo se modifican dosis, frecuencia, duración e indicaciones (regla del backend).
 * - Las fórmulas se **inactivan**, nunca se eliminan; una fórmula inactiva queda solo de consulta.
 */
@Component({
  selector: 'app-formula-medica',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent, OrdenThComponent],
  templateUrl: './formula-medica.component.html'
})
export class FormulaMedicaComponent extends TablaServidor<FormulaResumen, FormulaFiltro> implements OnInit, OnDestroy {
  filtro: FormulaFiltro = this.filtroVacio();

  clientes: Cliente[] = [];
  medicos: Medico[] = [];
  medicamentos: Medicamento[] = [];
  mascotasFiltro: Mascota[] = [];
  mascotasForm: Mascota[] = [];
  citasForm: CitaResumen[] = [];

  form!: FormGroup;
  modo: 'C' | 'E' = 'C';
  formulaEnEdicion: FormulaMedica | null = null;
  enviando = false;
  cargandoFormula = false;
  cargandoMascotas = false;
  cargandoCitas = false;
  errorFormulario = '';

  formulaDetalle: FormulaMedica | null = null;
  cargandoDetalle = false;
  errorDetalle = '';

  readonly formatear = formatearFechaHora;

  constructor(
    private readonly formulaService: FormulaMedicaService,
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly medicoService: MedicoService,
    private readonly medicamentoService: MedicamentoService,
    private readonly mascotaService: MascotaService,
    private readonly fb: FormBuilder
  ) {
    super({ sortBy: 'fecha', sortDir: 'desc' });
  }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.clienteService.listarClientes().subscribe({
      next: (d) => (this.clientes = d),
      error: (e) => (this.error = mensajeDeError(e, 'No se pudieron cargar los clientes.'))
    });
    this.medicoService.listarMedicos().subscribe({
      next: (d) => (this.medicos = d),
      error: (e) => (this.error = mensajeDeError(e, 'No se pudieron cargar los veterinarios.'))
    });
    this.medicamentoService.listarMedicamentos().subscribe({
      next: (d) => (this.medicamentos = d),
      error: (e) => (this.error = mensajeDeError(e, 'No se pudieron cargar los medicamentos.'))
    });
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destruir();
  }

  protected consultar(pagina: ParametrosPagina): Observable<Pagina<FormulaResumen>> {
    return this.formulaService.listarPaginado(pagina, this.filtro);
  }

  private filtroVacio(): FormulaFiltro {
    return { texto: '', activo: '', clienteId: null, mascotaId: null, medicoId: null, medicamentoId: null, fechaDesde: '', fechaHasta: '' };
  }

  limpiarFiltros(): void {
    this.mascotasFiltro = [];
    this.limpiar(this.filtroVacio());
  }

  /** Combo dependiente del filtro: Cliente → Mascota. */
  alCambiarClienteFiltro(): void {
    this.filtro.mascotaId = null;
    this.mascotasFiltro = [];
    if (this.filtro.clienteId) {
      this.mascotaService.buscarPorCliente(Number(this.filtro.clienteId)).subscribe({
        next: (m) => (this.mascotasFiltro = m),
        error: (e) => (this.error = mensajeDeError(e))
      });
    }
    this.buscar();
  }

  /* ------------------------------ Formulario ------------------------------ */

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      mascotaId: [{ value: null, disabled: true }, Validators.required],
      citaId: [{ value: null, disabled: true }, Validators.required],
      medicamentoId: [null, Validators.required],
      dosis: ['', [Validators.required, Validators.maxLength(100), dosisValida]],
      frecuencia: ['', [Validators.required, Validators.maxLength(100)]],
      duracionDias: [null, [Validators.required, Validators.min(1), Validators.max(365), Validators.pattern(/^\d+$/)]],
      indicaciones: ['', [Validators.required, Validators.minLength(3)]]
    });
    this.form.get('clienteId')!.valueChanges.subscribe((id) => this.cargarMascotas(id));
    this.form.get('mascotaId')!.valueChanges.subscribe((id) => this.cargarCitas(id));
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Cliente → Mascota. */
  private cargarMascotas(clienteId: number | null): void {
    const m = this.form.get('mascotaId')!;
    m.reset(null, { emitEvent: false });
    this.mascotasForm = [];
    this.limpiarCitas();
    if (!clienteId) {
      m.disable({ emitEvent: false });
      return;
    }
    this.cargandoMascotas = true;
    this.mascotaService.buscarPorCliente(Number(clienteId)).subscribe({
      next: (lista) => { this.mascotasForm = lista; this.cargandoMascotas = false; m.enable({ emitEvent: false }); },
      error: (e) => { this.cargandoMascotas = false; this.errorFormulario = mensajeDeError(e, 'No se pudieron cargar las mascotas.'); }
    });
  }

  /** Mascota → Citas no canceladas (a una cita cancelada no se le emite fórmula). */
  private cargarCitas(mascotaId: number | null): void {
    this.limpiarCitas();
    if (!mascotaId) {
      return;
    }
    this.cargandoCitas = true;
    this.citaService.listarPaginado(
      { page: 0, size: 100, sortBy: 'fecha', sortDir: 'desc' },
      { mascotaId: Number(mascotaId) }
    ).subscribe({
      next: (p) => {
        this.citasForm = p.content.filter((c) => c.estado !== 'Cancelada');
        this.cargandoCitas = false;
        this.form.get('citaId')!.enable({ emitEvent: false });
      },
      error: (e) => { this.cargandoCitas = false; this.errorFormulario = mensajeDeError(e, 'No se pudieron cargar las citas.'); }
    });
  }

  private limpiarCitas(): void {
    this.citasForm = [];
    this.form.get('citaId')!.reset(null, { emitEvent: false });
    this.form.get('citaId')!.disable({ emitEvent: false });
  }

  /** Abre el modal para emitir una fórmula nueva. */
  nueva(): void {
    this.modo = 'C';
    this.formulaEnEdicion = null;
    this.errorFormulario = '';
    this.mascotasForm = [];
    this.form.reset({ dosis: '', frecuencia: '', indicaciones: '' });
    this.form.get('clienteId')!.enable({ emitEvent: false });
    this.form.get('medicamentoId')!.enable({ emitEvent: false });
    this.limpiarCitas();
    this.form.get('mascotaId')!.disable({ emitEvent: false });
    abrirModal('modalFormula');
  }

  /** Abre el modal para editar dosis, frecuencia, duración e indicaciones de una fórmula activa. */
  editar(fila: FormulaResumen): void {
    this.modo = 'E';
    this.errorFormulario = '';
    this.cargandoFormula = true;
    abrirModal('modalFormula');
    this.formulaService.consultar(fila.id).subscribe({
      next: (fm) => {
        this.formulaEnEdicion = fm;
        const { fecha, hora } = separarFechaHora(fm.cita?.fechaHora);
        this.mascotasForm = fm.cita?.mascota ? [fm.cita.mascota] : [];
        this.citasForm = [{
          id: fm.cita.id, fecha, hora, fechaHora: fm.cita.fechaHora, clienteId: fm.cita.cliente?.id ?? 0,
          clienteNombre: '', mascotaId: fm.cita.mascota?.mascotaId ?? 0, mascotaNombre: fm.cita.mascota?.nombreMascota ?? '',
          medicoId: fm.cita.medico?.id ?? 0, medicoNombre: `${fm.cita.medico?.nombres ?? ''} ${fm.cita.medico?.apellidos ?? ''}`.trim(),
          estado: fm.cita.estado, motivo: fm.cita.motivo
        }];
        ['clienteId', 'mascotaId', 'citaId', 'medicamentoId'].forEach((c) => this.form.get(c)!.disable({ emitEvent: false }));
        this.form.patchValue({
          clienteId: fm.cita?.cliente?.id ?? null,
          mascotaId: fm.cita?.mascota?.mascotaId ?? null,
          citaId: fm.cita?.id ?? null,
          medicamentoId: fm.medicamento?.id ?? null,
          dosis: fm.dosis, frecuencia: fm.frecuencia, duracionDias: fm.duracionDias, indicaciones: fm.indicaciones
        }, { emitEvent: false });
        this.cargandoFormula = false;
      },
      error: (e) => {
        this.cargandoFormula = false;
        cerrarModal('modalFormula');
        alertaError(mensajeDeError(e, 'No se pudo cargar la fórmula.'));
      }
    });
  }

  /** Crea o actualiza la fórmula. */
  guardar(): void {
    if (this.enviando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const rq: FormulaRq = {
      citaId: Number(v.citaId),
      medicamentoId: Number(v.medicamentoId),
      dosis: String(v.dosis).trim(),
      frecuencia: String(v.frecuencia).trim(),
      duracionDias: Number(v.duracionDias),
      indicaciones: String(v.indicaciones).trim()
    };
    this.enviando = true;
    this.errorFormulario = '';
    const peticion = this.modo === 'C'
      ? this.formulaService.crear(rq)
      : this.formulaService.actualizar(this.formulaEnEdicion!.id, rq);
    peticion.subscribe({
      next: (r) => {
        this.enviando = false;
        cerrarModal('modalFormula');
        alertaExito(r.message || (this.modo === 'C' ? 'Fórmula registrada correctamente.' : 'Fórmula actualizada correctamente.'));
        this.cargar();
      },
      error: (e) => {
        this.enviando = false;
        this.errorFormulario = mensajeDeError(e, 'No se pudo guardar la fórmula.');
      }
    });
  }

  /* ------------------------------ Acciones de fila ------------------------------ */

  /** Modal "Ver": detalle completo. */
  ver(fila: FormulaResumen): void {
    this.formulaDetalle = null;
    this.errorDetalle = '';
    this.cargandoDetalle = true;
    abrirModal('modalVerFormula');
    this.formulaService.consultar(fila.id).subscribe({
      next: (fm) => { this.formulaDetalle = fm; this.cargandoDetalle = false; },
      error: (e) => { this.cargandoDetalle = false; this.errorDetalle = mensajeDeError(e, 'No se pudo cargar la fórmula.'); }
    });
  }

  async inactivar(fila: FormulaResumen): Promise<void> {
    const ok = await confirmar('Inactivar fórmula',
      `La fórmula de ${fila.medicamentoNombre} para ${fila.mascotaNombre} quedará inactiva y ya no se podrá modificar. No se elimina del historial.`,
      'Sí, inactivar');
    if (!ok) { return; }
    this.formulaService.inactivar(fila.id).subscribe({
      next: (r) => { alertaExito(r.message || 'Fórmula inactivada.'); this.cargar(); },
      error: (e) => alertaError(mensajeDeError(e, 'No se pudo inactivar la fórmula.'))
    });
  }

  nombreCompleto(p?: { nombres?: string; apellidos?: string } | null): string {
    return p ? `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim() : '';
  }
}
