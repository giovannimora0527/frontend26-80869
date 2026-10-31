import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { CitaRq, CitaResumen } from 'src/app/models/resumenes';
import { FiltroPaginado } from 'src/app/models/pagina';
import { aFechaBackend, aInputFechaHora, ahoraInput, mensajeError } from 'src/app/utils/http-utils';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { CitaService } from './service/cita.service';

type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };

/** Columnas por las que el backend sabe ordenar. */
type ColumnaOrden = 'fecha' | 'cliente' | 'mascota' | 'veterinario' | 'motivo' | 'estado';

/** Estados con los que una cita todavía está "viva". */
const ESTADOS_ACTIVOS = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA'];

/** Valida que la fecha y hora sea un valor real y que no esté en el pasado (solo al crear). */
function fechaValida(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  return Number.isNaN(new Date(control.value).getTime()) ? { fechaInvalida: true } : null;
}

/**
 * Gestión de citas: listado paginado en el servidor (orden inicial fecha/hora descendente),
 * filtros, creación y edición con combos dependientes Cliente → Mascota, y acciones por estado.
 */
@Component({
  selector: 'app-cita',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbDropdownModule, NgbTooltipModule],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly busqueda$ = new Subject<string>();

  // ---- listado ----
  filas: CitaResumen[] = [];
  totalElementos = 0;
  totalPaginas = 0;
  pagina = 0;
  tamanio = 10;
  readonly tamanios = [5, 10, 20, 50];
  columnaOrden: ColumnaOrden = 'fecha';
  direccionOrden: 'asc' | 'desc' = 'desc';
  q = '';
  estadoFiltro = '';
  desde = '';
  hasta = '';
  cargando = false;
  errorCitas = '';
  readonly estados = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA'];

  // ---- formulario ----
  form!: FormGroup;
  modoFormulario: 'C' | 'E' = 'C';
  titleModal = '';
  titleBoton = '';
  citaSelected: CitaResumen | null = null;
  enviando = false;
  respuestaError = '';
  minFechaHora = ahoraInput();
  clientes: Cliente[] = [];
  mascotas: Mascota[] = [];
  medicos: Medico[] = [];
  cargandoMascotas = false;
  cargandoMedicos = false;
  soloDisponibles = false;
  errorCombos = '';
  readonly estadosFormulario = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA'];

  // ---- detalle ----
  citaDetalle: Cita | null = null;
  private modalForm: ModalBootstrap | null = null;
  private modalDetalle: ModalBootstrap | null = null;

  constructor(
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService,
    private readonly fb: FormBuilder
  ) {
    this.inicializarFormulario();
    // Combo dependiente: cada vez que cambia el cliente se vuelven a consultar sus mascotas.
    this.f['clienteId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.alCambiarCliente());
  }

  ngOnInit(): void {
    this.busqueda$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((texto) => {
        this.q = texto;
        this.pagina = 0;
        this.cargar();
      });
    this.cargar();
  }

  // =====================  LISTADO  =====================

  /** Pide al backend la página actual con los filtros y el orden elegidos. */
  cargar(): void {
    const filtro: FiltroPaginado = {
      page: this.pagina,
      size: this.tamanio,
      sort: this.columnaOrden,
      dir: this.direccionOrden,
      q: this.q.trim(),
      estado: this.estadoFiltro,
      desde: this.desde,
      hasta: this.hasta
    };
    this.cargando = true;
    this.errorCitas = '';
    this.citaService.listarPaginado(filtro).subscribe({
      next: (rs) => {
        this.filas = rs.content;
        this.totalElementos = rs.totalElements;
        this.totalPaginas = rs.totalPages;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.filas = [];
        this.errorCitas = mensajeError(err, 'No fue posible cargar las citas.');
      }
    });
  }

  buscar(event: Event): void {
    this.busqueda$.next((event.target as HTMLInputElement).value);
  }

  /** Aplica un filtro (estado o fechas) y vuelve a la primera página. */
  aplicarFiltros(): void {
    if (this.desde && this.hasta && this.desde > this.hasta) {
      Swal.fire('Rango inválido', 'La fecha "desde" no puede ser posterior a "hasta".', 'warning');
      return;
    }
    this.pagina = 0;
    this.cargar();
  }

  limpiarFiltros(): void {
    this.q = '';
    this.estadoFiltro = '';
    this.desde = '';
    this.hasta = '';
    this.pagina = 0;
    this.columnaOrden = 'fecha';
    this.direccionOrden = 'desc';
    this.cargar();
  }

  ordenarPor(columna: ColumnaOrden): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }
    this.pagina = 0;
    this.cargar();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas && pagina !== this.pagina) {
      this.pagina = pagina;
      this.cargar();
    }
  }

  cambiarTamanio(): void {
    this.pagina = 0;
    this.cargar();
  }

  get paginas(): number[] {
    const inicio = Math.max(0, Math.min(this.pagina - 2, this.totalPaginas - 5));
    const fin = Math.min(this.totalPaginas, inicio + 5);
    return Array.from({ length: fin - inicio }, (_, i) => inicio + i);
  }

  get desdeRegistro(): number {
    return this.totalElementos === 0 ? 0 : this.pagina * this.tamanio + 1;
  }

  get hastaRegistro(): number {
    return Math.min((this.pagina + 1) * this.tamanio, this.totalElementos);
  }

  iconoOrden(columna: ColumnaOrden): string {
    if (this.columnaOrden !== columna) {
      return 'fa-sort';
    }
    return this.direccionOrden === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  // =====================  REGLAS DE LA PANTALLA POR ESTADO  =====================

  esActiva(estado: string | undefined): boolean {
    return ESTADOS_ACTIVOS.includes((estado ?? '').toUpperCase());
  }

  /** Solo las citas pendientes o programadas se pueden confirmar. */
  puedeConfirmar(estado: string): boolean {
    return ['PENDIENTE', 'PROGRAMADA'].includes(estado.toUpperCase());
  }

  /** Una cita solo se atiende si ya ocurrió (el backend lo vuelve a validar). */
  puedeAtender(cita: CitaResumen): boolean {
    return this.esActiva(cita.estado) && new Date(cita.fechaHora).getTime() <= Date.now();
  }

  esCancelada(estado: string | undefined): boolean {
    return (estado ?? '').toUpperCase() === 'CANCELADA';
  }

  // =====================  ACCIONES POR FILA  =====================

  confirmar(cita: CitaResumen): void {
    this.cambiarEstado(cita, 'CONFIRMADA', '¿Confirmar la cita?', 'Quedará como Confirmada.');
  }

  atender(cita: CitaResumen): void {
    this.cambiarEstado(cita, 'ATENDIDA', '¿Marcar como atendida?',
      'Se creará su historia clínica y la cita ya no podrá modificarse.');
  }

  cancelar(cita: CitaResumen): void {
    this.cambiarEstado(cita, 'CANCELADA', '¿Cancelar la cita?',
      'Una cita cancelada no se puede editar; solo se puede reactivar.');
  }

  reactivar(cita: CitaResumen): void {
    Swal.fire({
      title: '¿Reactivar la cita?',
      text: 'Se vuelve a validar la agenda y quedará como Programada.',
      icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, reactivar', cancelButtonText: 'No'
    }).then((r) => {
      if (r.isConfirmed) {
        this.citaService.reactivar(cita.id).subscribe({
          next: (rs) => this.exito(rs?.message ?? 'La cita fue reactivada.'),
          error: (err) => Swal.fire('No se pudo reactivar', mensajeError(err), 'error')
        });
      }
    });
  }

  private cambiarEstado(cita: CitaResumen, estado: string, titulo: string, texto: string): void {
    Swal.fire({
      title: titulo, text: texto, icon: 'question', showCancelButton: true,
      confirmButtonText: 'Sí', cancelButtonText: 'No'
    }).then((r) => {
      if (r.isConfirmed) {
        this.citaService.cambiarEstado(cita.id, estado).subscribe({
          next: (rs) => this.exito(rs?.message ?? 'La cita fue actualizada.'),
          error: (err) => Swal.fire('No se pudo cambiar el estado', mensajeError(err), 'error')
        });
      }
    });
  }

  private exito(mensaje: string): void {
    this.cargar();
    Swal.fire('Operación exitosa', mensaje, 'success');
  }

  // =====================  DETALLE  =====================

  verCita(cita: CitaResumen): void {
    this.citaService.buscarPorId(cita.id).subscribe({
      next: (detalle) => {
        this.citaDetalle = detalle;
        this.abrir('modalVerCita', 'D');
      },
      error: (err) => Swal.fire('No se pudo consultar', mensajeError(err, 'Registro no encontrado.'), 'error')
    });
  }

  cerrarDetalle(): void {
    this.modalDetalle?.hide();
  }

  // =====================  FORMULARIO  =====================

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      mascotaId: [{ value: null, disabled: true }, Validators.required],
      medicoId: [null, Validators.required],
      fechaHora: [null, [Validators.required, fechaValida]],
      motivo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(255)]],
      estado: ['PROGRAMADA', Validators.required]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  nuevaCita(): void {
    this.modoFormulario = 'C';
    this.titleModal = 'Crear cita';
    this.titleBoton = 'Guardar cita';
    this.citaSelected = null;
    this.minFechaHora = ahoraInput();
    this.reiniciar();
    this.f['clienteId'].enable();
    this.f['estado'].setValue('PROGRAMADA');
    this.cargarCombos();
    this.abrir('modalCrearCita', 'F');
  }

  abrirEdicion(cita: CitaResumen): void {
    if (!this.esActiva(cita.estado)) {
      Swal.fire(this.esCancelada(cita.estado) ? 'Cita cancelada' : 'Cita atendida',
        this.esCancelada(cita.estado)
          ? 'Una cita cancelada no se puede editar. Usa la opción de reactivar.'
          : 'Una cita atendida no se puede modificar porque hace parte del historial clínico.',
        'warning');
      return;
    }
    this.modoFormulario = 'E';
    this.titleModal = 'Editar cita';
    this.titleBoton = 'Actualizar cita';
    this.citaSelected = cita;
    this.reiniciar();
    this.cargarCombos();
    this.citaService.buscarPorId(cita.id).subscribe({
      next: (detalle) => {
        const clienteId = detalle.cliente?.id ?? detalle.mascota?.cliente?.id ?? null;
        this.mascotas = detalle.mascota ? [detalle.mascota] : [];
        this.form.patchValue({
          clienteId,
          mascotaId: detalle.mascota?.mascotaId ?? null,
          medicoId: detalle.medico?.id ?? null,
          fechaHora: aInputFechaHora(detalle.fechaHora),
          motivo: detalle.motivo ?? '',
          estado: (detalle.estado ?? 'PROGRAMADA').toUpperCase()
        }, { emitEvent: false });
        // Cliente y mascota no cambian en una cita existente (el backend también lo impide).
        this.f['clienteId'].disable();
        this.f['mascotaId'].disable();
        this.abrir('modalCrearCita', 'F');
      },
      error: (err) => Swal.fire('No se pudo cargar la cita', mensajeError(err), 'error')
    });
  }

  /** Combo dependiente: al elegir cliente se consultan únicamente sus mascotas. */
  private alCambiarCliente(): void {
    const clienteId = this.f['clienteId'].value as number | null;
    this.mascotas = [];
    this.f['mascotaId'].reset();
    if (!clienteId) {
      this.f['mascotaId'].disable();
      return;
    }
    this.cargandoMascotas = true;
    this.mascotaService.listarPorCliente(Number(clienteId)).subscribe({
      next: (lista) => {
        this.mascotas = lista.filter((m) => m.activo !== false);
        this.cargandoMascotas = false;
        this.f['mascotaId'].enable();
      },
      error: (err) => {
        this.cargandoMascotas = false;
        this.errorCombos = mensajeError(err, 'No fue posible cargar las mascotas del cliente.');
      }
    });
  }

  /** Muestra solo los veterinarios libres en la hora elegida (ventana de 15 min). */
  consultarDisponibles(): void {
    const valor = this.f['fechaHora'].value as string | null;
    if (!valor || this.f['fechaHora'].invalid) {
      this.f['fechaHora'].markAsTouched();
      return;
    }
    const inicio = new Date(valor);
    const fin = new Date(inicio.getTime() + 15 * 60 * 1000);
    this.cargandoMedicos = true;
    this.medicoService.listarMedicosDisponiblesPorFecha(inicio, fin).subscribe({
      next: (lista) => {
        this.medicos = lista;
        this.soloDisponibles = true;
        this.cargandoMedicos = false;
        if (!lista.some((m) => m.id === this.f['medicoId'].value)) {
          this.f['medicoId'].reset();
        }
      },
      error: (err) => {
        this.cargandoMedicos = false;
        this.errorCombos = mensajeError(err, 'No fue posible consultar los veterinarios disponibles.');
      }
    });
  }

  verTodosLosMedicos(): void {
    this.soloDisponibles = false;
    this.cargarMedicos();
  }

  guardarCita(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (this.modoFormulario === 'C' && new Date(v.fechaHora).getTime() < Date.now()) {
      this.respuestaError = 'La fecha y hora de la cita no puede ser anterior a la actual.';
      return;
    }
    const cita: CitaRq = {
      clienteId: Number(v.clienteId),
      mascotaId: Number(v.mascotaId),
      medicoId: Number(v.medicoId),
      fechaHora: aFechaBackend(v.fechaHora),
      motivo: String(v.motivo).trim(),
      estado: v.estado
    };
    this.enviando = true;
    this.respuestaError = '';
    const solicitud = this.modoFormulario === 'C'
      ? this.citaService.guardarCita(cita)
      : this.citaService.actualizarCita(this.citaSelected?.id as number, cita);
    solicitud.subscribe({
      next: (rs) => {
        this.enviando = false;
        this.cerrarFormulario();
        this.exito(rs?.message ?? (this.modoFormulario === 'C' ? 'La cita fue creada.' : 'La cita fue actualizada.'));
      },
      error: (err) => {
        this.enviando = false;
        this.respuestaError = mensajeError(err, 'No fue posible guardar la cita.');
      }
    });
  }

  cerrarFormulario(): void {
    this.modalForm?.hide();
    this.reiniciar();
  }

  private reiniciar(): void {
    this.form.reset({ estado: 'PROGRAMADA' });
    this.f['mascotaId'].disable();
    this.mascotas = [];
    this.soloDisponibles = false;
    this.respuestaError = '';
    this.errorCombos = '';
  }

  private cargarCombos(): void {
    this.clienteService.listarClientesActivos().subscribe({
      next: (lista) => (this.clientes = lista),
      error: (err) => (this.errorCombos = mensajeError(err, 'No fue posible cargar los clientes.'))
    });
    this.cargarMedicos();
  }

  private cargarMedicos(): void {
    this.medicoService.listar().subscribe({
      next: (lista) => (this.medicos = lista.filter((m) => m.estado !== false)),
      error: (err) => (this.errorCombos = mensajeError(err, 'No fue posible cargar los veterinarios.'))
    });
  }

  private abrir(id: string, cual: 'F' | 'D'): void {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    const Modal = (window as unknown as WindowBootstrap).bootstrap.Modal;
    if (cual === 'F') {
      this.modalForm ??= new Modal(el);
      this.modalForm.show();
    } else {
      this.modalDetalle ??= new Modal(el);
      this.modalDetalle.show();
    }
  }
}
