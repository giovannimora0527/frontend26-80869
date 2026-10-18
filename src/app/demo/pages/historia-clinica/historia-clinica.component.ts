import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { Cita, CitaResumen } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { ESTADOS_HISTORIA, HistoriaClinica, HistoriaFiltro, HistoriaResumen, HistoriaRq } from 'src/app/models/historia-clinica';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { Pagina, ParametrosPagina } from 'src/app/models/pagina';
import { CitaService } from 'src/app/services/cita.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { HistoriaClinicaService } from 'src/app/services/historia-clinica.service';
import { MedicoService } from 'src/app/services/medico.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { OrdenThComponent } from 'src/app/shared/orden-th/orden-th.component';
import { AnotacionesHistoriaComponent } from './anotaciones-historia/anotaciones-historia.component';
import { TablaServidor } from 'src/app/utils/tabla-servidor';
import { alertaError, alertaExito, confirmar } from 'src/app/utils/alertas.util';
import { mensajeDeError } from 'src/app/utils/error.util';
import { abrirModal, cerrarModal } from 'src/app/utils/modal.util';
import { formatearFechaHora } from 'src/app/utils/fecha.util';

/**
 * Módulo de **Historias clínicas**.
 *
 * - Listado resumido (paginación, filtros y orden en el servidor) separado del detalle.
 * - Creación en modal con combos dependientes Cliente → Mascota → Cita atendida.
 * - Modal "Ver": datos completos de la historia + DataTable de anotaciones (componente hijo) y cierre de la historia.
 *
 * La historia solo nace de una cita **Atendida** y cada cita tiene una sola historia; el backend lo garantiza y
 * aquí se muestra su mensaje si el usuario intenta algo inválido.
 */
@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent, OrdenThComponent, AnotacionesHistoriaComponent],
  templateUrl: './historia-clinica.component.html'
})
export class HistoriaClinicaComponent extends TablaServidor<HistoriaResumen, HistoriaFiltro> implements OnInit, OnDestroy {
  filtro: HistoriaFiltro = this.filtroVacio();

  clientes: Cliente[] = [];
  medicos: Medico[] = [];
  mascotasFiltro: Mascota[] = [];
  mascotasForm: Mascota[] = [];
  citasForm: CitaResumen[] = [];
  readonly estados = ESTADOS_HISTORIA;

  form!: FormGroup;
  enviando = false;
  cargandoMascotas = false;
  cargandoCitas = false;
  errorFormulario = '';
  /** Veterinario de la cita elegida (se envía junto con la historia). */
  medicoDeLaCita: { id: number; nombre: string } | null = null;

  historiaDetalle: HistoriaClinica | null = null;
  cargandoDetalle = false;
  errorDetalle = '';
  cerrando = false;

  readonly formatear = formatearFechaHora;

  constructor(
    private readonly historiaService: HistoriaClinicaService,
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly medicoService: MedicoService,
    private readonly mascotaService: MascotaService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute
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
    this.cargar();

    // Llegada desde el módulo de citas ("Historia" en una cita atendida): abre el formulario ya diligenciado.
    const citaId = Number(this.route.snapshot.queryParamMap.get('citaId'));
    if (citaId) {
      this.nuevaDesdeCita(citaId);
    }
  }

  ngOnDestroy(): void {
    this.destruir();
  }

  protected consultar(pagina: ParametrosPagina): Observable<Pagina<HistoriaResumen>> {
    return this.historiaService.listarPaginado(pagina, this.filtro);
  }

  private filtroVacio(): HistoriaFiltro {
    return { texto: '', estado: '', clienteId: null, mascotaId: null, medicoId: null, fechaDesde: '', fechaHasta: '' };
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
      motivo: ['', [Validators.required, Validators.minLength(3)]],
      diagnostico: ['', [Validators.required, Validators.minLength(3)]],
      observaciones: ['']
    });
    this.form.get('clienteId')!.valueChanges.subscribe((id) => this.cargarMascotas(id));
    this.form.get('mascotaId')!.valueChanges.subscribe((id) => this.cargarCitas(id));
    this.form.get('citaId')!.valueChanges.subscribe((id) => this.alElegirCita(id));
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Cliente → Mascota. */
  private cargarMascotas(clienteId: number | null, preseleccion?: number, citaPreseleccion?: number): void {
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
      next: (lista) => {
        this.mascotasForm = lista;
        this.cargandoMascotas = false;
        m.enable({ emitEvent: false });
        if (preseleccion) {
          m.setValue(preseleccion, { emitEvent: false });
          this.cargarCitas(preseleccion, citaPreseleccion);
        }
      },
      error: (e) => {
        this.cargandoMascotas = false;
        this.errorFormulario = mensajeDeError(e, 'No se pudieron cargar las mascotas.');
      }
    });
  }

  /** Mascota → Citas atendidas (solo esas pueden tener historia). */
  private cargarCitas(mascotaId: number | null, preseleccion?: number): void {
    this.limpiarCitas();
    if (!mascotaId) {
      return;
    }
    this.cargandoCitas = true;
    this.citaService.listarPaginado(
      { page: 0, size: 100, sortBy: 'fecha', sortDir: 'desc' },
      { mascotaId: Number(mascotaId), estado: 'Atendida' }
    ).subscribe({
      next: (p) => {
        this.citasForm = p.content;
        this.cargandoCitas = false;
        this.form.get('citaId')!.enable({ emitEvent: false });
        if (preseleccion) {
          this.form.get('citaId')!.setValue(preseleccion);
        }
      },
      error: (e) => {
        this.cargandoCitas = false;
        this.errorFormulario = mensajeDeError(e, 'No se pudieron cargar las citas de la mascota.');
      }
    });
  }

  private limpiarCitas(): void {
    this.citasForm = [];
    this.medicoDeLaCita = null;
    this.form.get('citaId')!.reset(null, { emitEvent: false });
    this.form.get('citaId')!.disable({ emitEvent: false });
  }

  /** Al elegir la cita se toma su veterinario y se sugiere el motivo. */
  private alElegirCita(citaId: number | null): void {
    const c = this.citasForm.find((x) => x.id === Number(citaId));
    this.medicoDeLaCita = c ? { id: c.medicoId, nombre: c.medicoNombre } : null;
    if (c && !this.form.get('motivo')!.value) {
      this.form.get('motivo')!.setValue(c.motivo);
    }
  }

  /** Abre el modal para crear una historia desde cero. */
  nueva(): void {
    this.errorFormulario = '';
    this.mascotasForm = [];
    this.limpiarCitas();
    this.form.reset({ motivo: '', diagnostico: '', observaciones: '' });
    this.form.get('mascotaId')!.disable({ emitEvent: false });
    abrirModal('modalHistoria');
  }

  /** Abre el modal con cliente, mascota y cita ya seleccionados (viene del módulo de citas). */
  nuevaDesdeCita(citaId: number): void {
    this.nueva();
    this.citaService.consultar(citaId).subscribe({
      next: (cita: Cita) => {
        this.form.get('clienteId')!.setValue(cita.cliente.id, { emitEvent: false });
        this.cargarMascotas(cita.cliente.id!, cita.mascota.mascotaId, cita.id);
      },
      error: (e) => this.errorFormulario = mensajeDeError(e, 'No se pudo cargar la cita indicada.')
    });
  }

  /** Crea la historia. */
  guardar(): void {
    if (this.enviando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const rq: HistoriaRq = {
      clienteId: Number(v.clienteId),
      mascotaId: Number(v.mascotaId),
      citaId: Number(v.citaId),
      medicoId: this.medicoDeLaCita!.id,
      motivo: String(v.motivo).trim(),
      diagnostico: String(v.diagnostico).trim(),
      observaciones: String(v.observaciones ?? '').trim()
    };
    this.enviando = true;
    this.errorFormulario = '';
    this.historiaService.crear(rq).subscribe({
      next: (r) => {
        this.enviando = false;
        cerrarModal('modalHistoria');
        alertaExito(r.message || 'Historia clínica creada correctamente.');
        this.cargar();
      },
      error: (e) => {
        this.enviando = false;
        this.errorFormulario = mensajeDeError(e, 'No se pudo crear la historia clínica.');
      }
    });
  }

  /* ------------------------------ Detalle ------------------------------ */

  /** Modal "Ver": detalle completo + anotaciones. */
  ver(fila: HistoriaResumen): void {
    this.historiaDetalle = null;
    this.errorDetalle = '';
    this.cargandoDetalle = true;
    abrirModal('modalVerHistoria');
    this.recargarDetalle(fila.id);
  }

  private recargarDetalle(id: number): void {
    this.historiaService.consultar(id).subscribe({
      next: (h) => { this.historiaDetalle = h; this.cargandoDetalle = false; },
      error: (e) => { this.cargandoDetalle = false; this.errorDetalle = mensajeDeError(e, 'No se pudo cargar la historia.'); }
    });
  }

  /** Cierra la historia (queda de solo lectura). */
  async cerrarHistoria(): Promise<void> {
    if (!this.historiaDetalle || this.cerrando) {
      return;
    }
    const ok = await confirmar('Cerrar historia clínica',
      'Una historia cerrada no admite nuevas anotaciones. ¿Desea cerrarla?', 'Sí, cerrar');
    if (!ok) { return; }
    const id = this.historiaDetalle.id;
    this.cerrando = true;
    this.historiaService.cerrar(id).subscribe({
      next: (r) => {
        this.cerrando = false;
        alertaExito(r.message || 'Historia cerrada.');
        this.recargarDetalle(id);
        this.cargar();
      },
      error: (e) => { this.cerrando = false; alertaError(mensajeDeError(e, 'No se pudo cerrar la historia.')); }
    });
  }

  esAbierta(estado?: string): boolean {
    return (estado ?? '').toLowerCase() === 'abierta';
  }

  nombreCompleto(p?: { nombres?: string; apellidos?: string } | null): string {
    return p ? `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim() : '';
  }
}
