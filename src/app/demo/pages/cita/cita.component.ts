import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Cita, CitaFiltro, CitaResumen, CitaRq, ESTADOS_CITA } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { Pagina, ParametrosPagina } from 'src/app/models/pagina';
import { CitaService } from 'src/app/services/cita.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { MedicoService } from 'src/app/services/medico.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { OrdenThComponent } from 'src/app/shared/orden-th/orden-th.component';
import { TablaServidor } from 'src/app/utils/tabla-servidor';
import { alertaError, alertaExito, confirmar } from 'src/app/utils/alertas.util';
import { mensajeDeError } from 'src/app/utils/error.util';
import { abrirModal, cerrarModal } from 'src/app/utils/modal.util';
import { esPasada, fechaIso, formatearFechaHora, horaIso, separarFechaHora } from 'src/app/utils/fecha.util';

/** Estados con los que se puede registrar una cita nueva (la agenda solo admite citas vigentes). */
const ESTADOS_NUEVA = ['Pendiente', 'Programada', 'Confirmada'];
/** Estados en los que la cita sigue vigente y por tanto se puede editar o cancelar. */
const ESTADOS_ACTIVOS = ['Pendiente', 'Programada', 'Confirmada'];

/**
 * Módulo de **Citas**.
 *
 * - Listado resumido con paginación, filtros y orden en el servidor (DataTable).
 * - Formulario reactivo en modal (crear / editar) con combos dependientes Cliente → Mascota.
 * - Modal "Ver" con el detalle completo, separado del listado.
 * - Cancelar / reactivar como operaciones explícitas (no hay borrado físico).
 *
 * Las reglas críticas (disponibilidad ±15 min, fechas pasadas, estados) las valida el backend; aquí solo se
 * replican para dar retroalimentación inmediata y se muestra el mensaje exacto del servidor si las rechaza.
 */
@Component({
  selector: 'app-cita',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, PaginadorComponent, OrdenThComponent],
  templateUrl: './cita.component.html'
})
export class CitaComponent extends TablaServidor<CitaResumen, CitaFiltro> implements OnInit, OnDestroy {
  filtro: CitaFiltro = this.filtroVacio();

  /** Catálogos para los combos. */
  clientes: Cliente[] = [];
  medicos: Medico[] = [];
  mascotasFiltro: Mascota[] = [];
  mascotasForm: Mascota[] = [];
  readonly estados = ESTADOS_CITA;
  readonly hoy = fechaIso();

  /** Estado del formulario. */
  form!: FormGroup;
  modo: 'C' | 'E' = 'C';
  citaEnEdicion: Cita | null = null;
  enviando = false;
  cargandoCita = false;
  cargandoMascotas = false;
  errorFormulario = '';

  /** Estado del modal "Ver". */
  citaDetalle: Cita | null = null;
  cargandoDetalle = false;
  errorDetalle = '';

  readonly formatear = formatearFechaHora;

  constructor(
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly medicoService: MedicoService,
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
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destruir();
  }

  protected consultar(pagina: ParametrosPagina): Observable<Pagina<CitaResumen>> {
    return this.citaService.listarPaginado(pagina, this.filtro);
  }

  private filtroVacio(): CitaFiltro {
    return { texto: '', estado: '', clienteId: null, mascotaId: null, medicoId: null, fechaDesde: '', fechaHasta: '' };
  }

  /** Quita filtros y orden. */
  limpiarFiltros(): void {
    this.mascotasFiltro = [];
    this.limpiar(this.filtroVacio());
  }

  /** Combo dependiente del filtro: al elegir cliente se cargan solo sus mascotas. */
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
    this.form = this.fb.group(
      {
        clienteId: [null, Validators.required],
        mascotaId: [{ value: null, disabled: true }, Validators.required],
        medicoId: [null, Validators.required],
        fecha: ['', Validators.required],
        hora: ['', Validators.required],
        motivo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
        estado: ['Pendiente', Validators.required]
      },
      { validators: (g: AbstractControl) => this.validarFechaHora(g) }
    );
    this.form.get('clienteId')!.valueChanges.subscribe((id) => this.alCambiarClienteForm(id));
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** La fecha/hora no puede estar en el pasado, salvo al editar una cita sin mover su agenda. */
  private validarFechaHora(g: AbstractControl): ValidationErrors | null {
    const fecha = g.get('fecha')?.value as string;
    const hora = g.get('hora')?.value as string;
    if (!fecha || !hora || !esPasada(fecha, hora)) {
      return null;
    }
    if (this.modo === 'E' && this.citaEnEdicion) {
      const orig = separarFechaHora(this.citaEnEdicion.fechaHora);
      const mismoMedico = Number(g.get('medicoId')?.value) === this.citaEnEdicion.medico?.id;
      if (orig.fecha === fecha && orig.hora === hora && mismoMedico) {
        return null;
      }
    }
    return { fechaPasada: true };
  }

  /** Combo dependiente del formulario: Cliente → Mascota. */
  private alCambiarClienteForm(clienteId: number | null, mascotaIdPreseleccionada?: number): void {
    const ctrl = this.form.get('mascotaId')!;
    ctrl.reset(null);
    this.mascotasForm = [];
    if (!clienteId) {
      ctrl.disable({ emitEvent: false });
      return;
    }
    this.cargandoMascotas = true;
    this.mascotaService.buscarPorCliente(Number(clienteId)).subscribe({
      next: (m) => {
        this.mascotasForm = m;
        this.cargandoMascotas = false;
        if (this.modo === 'C') {
          ctrl.enable({ emitEvent: false });
        }
        if (mascotaIdPreseleccionada) {
          ctrl.setValue(mascotaIdPreseleccionada);
        }
      },
      error: (e) => {
        this.cargandoMascotas = false;
        this.errorFormulario = mensajeDeError(e, 'No se pudieron cargar las mascotas del cliente.');
      }
    });
  }

  /** Abre el modal para registrar una cita nueva. */
  nueva(): void {
    this.modo = 'C';
    this.citaEnEdicion = null;
    this.errorFormulario = '';
    this.mascotasForm = [];
    this.form.reset({ estado: 'Pendiente', fecha: this.hoy, hora: '' });
    this.form.get('clienteId')!.enable({ emitEvent: false });
    this.form.get('mascotaId')!.disable({ emitEvent: false });
    abrirModal('modalCita');
  }

  /** Abre el modal para editar una cita vigente. Cliente y mascota no se pueden cambiar. */
  editar(fila: CitaResumen): void {
    this.modo = 'E';
    this.errorFormulario = '';
    this.cargandoCita = true;
    abrirModal('modalCita');
    this.citaService.consultar(fila.id).subscribe({
      next: (cita) => {
        this.citaEnEdicion = cita;
        const { fecha, hora } = separarFechaHora(cita.fechaHora);
        this.mascotasForm = cita.mascota ? [cita.mascota] : [];
        this.form.get('clienteId')!.disable({ emitEvent: false });
        this.form.get('mascotaId')!.disable({ emitEvent: false });
        this.form.patchValue(
          {
            clienteId: cita.cliente?.id ?? null,
            mascotaId: cita.mascota?.mascotaId ?? null,
            medicoId: cita.medico?.id ?? null,
            fecha, hora, motivo: cita.motivo, estado: cita.estado
          },
          { emitEvent: false }
        );
        this.cargandoCita = false;
      },
      error: (e) => {
        this.cargandoCita = false;
        cerrarModal('modalCita');
        alertaError(mensajeDeError(e, 'No se pudo cargar la cita.'));
      }
    });
  }

  /** Estados que se ofrecen en el combo según el modo. */
  get estadosDisponibles(): readonly string[] {
    return this.modo === 'C' ? ESTADOS_NUEVA : this.estados;
  }

  /** Envía el formulario (crear o actualizar). */
  guardar(): void {
    if (this.enviando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const rq: CitaRq = {
      clienteId: Number(v.clienteId),
      mascotaId: Number(v.mascotaId),
      medicoId: Number(v.medicoId),
      fecha: v.fecha,
      hora: v.hora,
      motivo: String(v.motivo).trim(),
      estado: v.estado
    };
    this.enviando = true;
    this.errorFormulario = '';
    const peticion = this.modo === 'C'
      ? this.citaService.crear(rq)
      : this.citaService.actualizar(this.citaEnEdicion!.id, rq);
    peticion.subscribe({
      next: (r) => {
        this.enviando = false;
        cerrarModal('modalCita');
        alertaExito(r.message || (this.modo === 'C' ? 'Cita registrada correctamente.' : 'Cita actualizada correctamente.'));
        this.cargar();
      },
      error: (e) => {
        this.enviando = false;
        this.errorFormulario = mensajeDeError(e, 'No se pudo guardar la cita.');
      }
    });
  }

  /* ------------------------------ Acciones de fila ------------------------------ */

  esActiva(c: CitaResumen): boolean {
    return ESTADOS_ACTIVOS.includes(c.estado);
  }

  /** Modal "Ver": consulta el detalle completo al servidor (el listado solo trae un resumen). */
  ver(fila: CitaResumen): void {
    this.citaDetalle = null;
    this.errorDetalle = '';
    this.cargandoDetalle = true;
    abrirModal('modalVerCita');
    this.citaService.consultar(fila.id).subscribe({
      next: (c) => { this.citaDetalle = c; this.cargandoDetalle = false; },
      error: (e) => { this.cargandoDetalle = false; this.errorDetalle = mensajeDeError(e, 'No se pudo cargar la cita.'); }
    });
  }

  async cancelar(fila: CitaResumen): Promise<void> {
    const ok = await confirmar('Cancelar cita',
      `¿Cancelar la cita de ${fila.mascotaNombre} del ${formatearFechaHora(fila.fechaHora)}? Liberará la agenda del veterinario.`,
      'Sí, cancelar');
    if (!ok) { return; }
    this.citaService.cancelar(fila.id).subscribe({
      next: (r) => { alertaExito(r.message || 'Cita cancelada.'); this.cargar(); },
      error: (e) => alertaError(mensajeDeError(e, 'No se pudo cancelar la cita.'))
    });
  }

  async reactivar(fila: CitaResumen): Promise<void> {
    const ok = await confirmar('Reactivar cita',
      `Se volverá a validar la agenda del veterinario para el ${formatearFechaHora(fila.fechaHora)}.`,
      'Sí, reactivar');
    if (!ok) { return; }
    this.citaService.reactivar(fila.id).subscribe({
      next: (r) => { alertaExito(r.message || 'Cita reactivada.'); this.cargar(); },
      error: (e) => alertaError(mensajeDeError(e, 'No se pudo reactivar la cita.'))
    });
  }

  /** Clase de color según el estado. */
  claseEstado(estado: string): string {
    switch (estado) {
      case 'Atendida': return 'bg-success';
      case 'Cancelada': return 'bg-danger';
      case 'Confirmada': return 'bg-info';
      case 'Programada': return 'bg-primary';
      default: return 'bg-warning text-dark';
    }
  }

  nombreCompleto(p?: { nombres?: string; apellidos?: string } | null): string {
    return p ? `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim() : '';
  }
}
