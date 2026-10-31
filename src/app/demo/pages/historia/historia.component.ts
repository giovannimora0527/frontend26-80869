import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { FiltroPaginado } from 'src/app/models/pagina';
import { AnotacionRq, HistoriaClinicaRq, HistoriaResumen } from 'src/app/models/resumenes';
import { aFechaBackend, aInputFechaHora, ahoraInput, mensajeError } from 'src/app/utils/http-utils';
import { CitaService } from '../cita/service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';
import { AnotacionHistoriaService } from './service/anotacion-historia.service';
import { HistoriaService } from './service/historia.service';

type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };
type ColumnaOrden = 'fecha' | 'mascota' | 'cliente' | 'veterinario' | 'motivo' | 'estado';
type ColumnaAnotacion = 'fecha' | 'veterinario' | 'descripcion' | 'diagnostico' | 'observaciones';

/**
 * Gestión de historias clínicas (una por consulta): listado paginado en el servidor (orden inicial
 * fecha de consulta descendente), registro con combos dependientes Cliente → Mascota → Cita,
 * edición del contenido clínico y modal de detalle con el histórico de anotaciones
 * (filtrable, ordenable y paginado) más la creación de nuevas anotaciones.
 */
@Component({
  selector: 'app-historia',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbDropdownModule, NgbTooltipModule],
  templateUrl: './historia.component.html',
  styleUrl: './historia.component.scss'
})
export class HistoriaComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly busqueda$ = new Subject<string>();
  private readonly busquedaAnotacion$ = new Subject<string>();

  // ---- listado ----
  filas: HistoriaResumen[] = [];
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
  errorHistorias = '';
  readonly estados = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA', 'ATENDIDA'];

  // ---- formulario de historia ----
  form!: FormGroup;
  modoFormulario: 'C' | 'E' = 'C';
  titleModal = '';
  titleBoton = '';
  historiaSelected: HistoriaResumen | null = null;
  enviando = false;
  respuestaError = '';
  errorCombos = '';
  clientes: Cliente[] = [];
  mascotas: Mascota[] = [];
  citas: Cita[] = [];
  medicos: Medico[] = [];
  cargandoMascotas = false;
  cargandoCitas = false;
  maxFechaConsulta = ahoraInput();

  // ---- detalle + anotaciones ----
  detalle: HistoriaMedica | null = null;
  anotaciones: AnotacionHistoria[] = [];
  anotacionesTotal = 0;
  anotacionesPaginas = 0;
  anotacionesPagina = 0;
  anotacionesTamanio = 5;
  anotacionesQ = '';
  anotacionesDir: 'asc' | 'desc' = 'desc';
  anotacionesColumna: ColumnaAnotacion = 'fecha';
  cargandoAnotaciones = false;
  errorAnotaciones = '';
  anotacionDetalle: AnotacionHistoria | null = null;

  // ---- formulario de anotación ----
  formAnotacion!: FormGroup;
  enviandoAnotacion = false;
  errorAnotacion = '';
  private historiaAnotacion: HistoriaResumen | null = null;
  private reabrirDetalle = false;

  private modalForm: ModalBootstrap | null = null;
  private modalDetalle: ModalBootstrap | null = null;
  private modalAnotacion: ModalBootstrap | null = null;

  constructor(
    private readonly historiaService: HistoriaService,
    private readonly anotacionService: AnotacionHistoriaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly citaService: CitaService,
    private readonly medicoService: MedicoService,
    private readonly fb: FormBuilder
  ) {
    this.inicializarFormularios();
    this.f['clienteId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.alCambiarCliente());
    this.f['mascotaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.alCambiarMascota());
    this.f['citaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.alCambiarCita());
  }

  ngOnInit(): void {
    this.busqueda$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((t) => { this.q = t; this.pagina = 0; this.cargar(); });
    this.busquedaAnotacion$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((t) => { this.anotacionesQ = t; this.anotacionesPagina = 0; this.cargarAnotaciones(); });
    this.cargar();
  }

  // =====================  LISTADO  =====================

  cargar(): void {
    const filtro: FiltroPaginado = {
      page: this.pagina, size: this.tamanio, sort: this.columnaOrden, dir: this.direccionOrden,
      q: this.q.trim(), estado: this.estadoFiltro, desde: this.desde, hasta: this.hasta
    };
    this.cargando = true;
    this.errorHistorias = '';
    this.historiaService.listarPaginado(filtro).subscribe({
      next: (rs) => {
        this.filas = rs.content;
        this.totalElementos = rs.totalElements;
        this.totalPaginas = rs.totalPages;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.filas = [];
        this.errorHistorias = mensajeError(err, 'No fue posible cargar las historias clínicas.');
      }
    });
  }

  buscar(event: Event): void {
    this.busqueda$.next((event.target as HTMLInputElement).value);
  }

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

  iconoOrden(columna: ColumnaOrden): string {
    return this.columnaOrden !== columna ? 'fa-sort' : (this.direccionOrden === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
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

  // =====================  FORMULARIOS  =====================

  private inicializarFormularios(): void {
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      mascotaId: [{ value: null, disabled: true }, Validators.required],
      citaId: [{ value: null, disabled: true }, Validators.required],
      medicoId: [{ value: null, disabled: true }, Validators.required],
      fechaHora: [null, Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      diagnostico: ['', [Validators.required, Validators.maxLength(2000)]],
      observaciones: ['', [Validators.required, Validators.maxLength(2000)]]
    });
    this.formAnotacion = this.fb.group({
      medicoId: [null, Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
      diagnostico: ['', [Validators.required, Validators.maxLength(2000)]],
      observaciones: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  get fa(): { [key: string]: AbstractControl } {
    return this.formAnotacion.controls;
  }

  nuevaHistoria(): void {
    this.modoFormulario = 'C';
    this.titleModal = 'Nueva historia clínica';
    this.titleBoton = 'Guardar historia';
    this.historiaSelected = null;
    this.maxFechaConsulta = ahoraInput();
    this.reiniciar();
    this.f['clienteId'].enable();
    this.cargarCombos();
    this.abrir('modalCrearHistoria', 'F');
  }

  abrirEdicion(fila: HistoriaResumen): void {
    this.modoFormulario = 'E';
    this.titleModal = 'Editar historia clínica';
    this.titleBoton = 'Actualizar historia';
    this.historiaSelected = fila;
    this.reiniciar();
    this.historiaService.buscarPorId(fila.id).subscribe({
      next: (rs) => {
        const h = rs.historia;
        this.clientes = h.mascota?.cliente ? [h.mascota.cliente] : [];
        this.mascotas = h.mascota ? [h.mascota] : [];
        this.citas = h.cita ? [h.cita] : [];
        this.medicos = h.medico ? [h.medico] : [];
        this.form.patchValue({
          clienteId: h.mascota?.cliente?.id ?? null,
          mascotaId: h.mascota?.mascotaId ?? null,
          citaId: h.cita?.id ?? null,
          medicoId: h.medico?.id ?? null,
          fechaHora: aInputFechaHora(h.fechaConsulta),
          motivo: h.motivo ?? '',
          diagnostico: h.diagnostico ?? '',
          observaciones: h.observaciones ?? ''
        }, { emitEvent: false });
        // Solo el contenido clínico se edita; cliente, mascota, cita, veterinario y fecha quedan fijos.
        ['clienteId', 'mascotaId', 'citaId', 'medicoId', 'fechaHora'].forEach((c) => this.f[c].disable());
        this.abrir('modalCrearHistoria', 'F');
      },
      error: (err) => Swal.fire('No se pudo cargar la historia', mensajeError(err), 'error')
    });
  }

  /** Combo dependiente 1: cliente → sus mascotas. */
  private alCambiarCliente(): void {
    const clienteId = this.f['clienteId'].value as number | null;
    this.mascotas = [];
    this.citas = [];
    this.f['mascotaId'].reset();
    this.f['citaId'].reset();
    this.f['citaId'].disable();
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

  /** Combo dependiente 2: mascota → sus citas ya ocurridas y no canceladas. */
  private alCambiarMascota(): void {
    const mascotaId = this.f['mascotaId'].value as number | null;
    this.citas = [];
    this.f['citaId'].reset();
    if (!mascotaId) {
      this.f['citaId'].disable();
      return;
    }
    this.cargandoCitas = true;
    this.citaService.listarCitasPorMascota(Number(mascotaId)).subscribe({
      next: (lista) => {
        this.citas = lista.filter((c) => (c.estado ?? '').toUpperCase() !== 'CANCELADA'
          && new Date(c.fechaHora).getTime() <= Date.now());
        this.cargandoCitas = false;
        this.f['citaId'].enable();
      },
      error: (err) => {
        this.cargandoCitas = false;
        this.errorCombos = mensajeError(err, 'No fue posible cargar las citas de la mascota.');
      }
    });
  }

  /** Al elegir la cita se completan veterinario, fecha y motivo (el veterinario debe ser el de la cita). */
  private alCambiarCita(): void {
    const cita = this.citas.find((c) => c.id === this.f['citaId'].value);
    if (!cita || this.modoFormulario !== 'C') {
      return;
    }
    this.medicos = cita.medico ? [cita.medico] : [];
    this.f['medicoId'].setValue(cita.medico?.id ?? null, { emitEvent: false });
    this.f['fechaHora'].setValue(aInputFechaHora(cita.fechaHora), { emitEvent: false });
    this.f['motivo'].setValue(cita.motivo ?? '', { emitEvent: false });
  }

  etiquetaCita(c: Cita): string {
    return `${(c.fechaHora as string).toString().replace('T', ' ').slice(0, 16)} · ${c.motivo ?? ''}`;
  }

  guardarHistoria(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const rq: HistoriaClinicaRq = {
      clienteId: Number(v.clienteId),
      mascotaId: Number(v.mascotaId),
      citaId: Number(v.citaId),
      medicoId: Number(v.medicoId),
      fechaHora: aFechaBackend(v.fechaHora),
      motivo: String(v.motivo).trim(),
      diagnostico: String(v.diagnostico).trim(),
      observaciones: String(v.observaciones).trim()
    };
    this.enviando = true;
    this.respuestaError = '';
    const solicitud = this.modoFormulario === 'C'
      ? this.historiaService.crearHistoria(rq)
      : this.historiaService.actualizarHistoria(this.historiaSelected?.id as number, rq);
    solicitud.subscribe({
      next: (rs) => {
        this.enviando = false;
        this.cerrarFormulario();
        this.cargar();
        Swal.fire('Operación exitosa', rs?.message ?? 'Historia clínica guardada.', 'success');
      },
      error: (err) => {
        this.enviando = false;
        this.respuestaError = mensajeError(err, 'No fue posible guardar la historia clínica.');
      }
    });
  }

  cerrarFormulario(): void {
    this.modalForm?.hide();
    this.reiniciar();
  }

  private reiniciar(): void {
    this.form.reset({ motivo: '', diagnostico: '', observaciones: '' });
    this.f['mascotaId'].disable();
    this.f['citaId'].disable();
    this.f['medicoId'].disable();
    this.f['fechaHora'].enable();
    this.mascotas = [];
    this.citas = [];
    this.respuestaError = '';
    this.errorCombos = '';
  }

  private cargarCombos(): void {
    this.clienteService.listarClientesActivos().subscribe({
      next: (l) => (this.clientes = l),
      error: (err) => (this.errorCombos = mensajeError(err, 'No fue posible cargar los clientes.'))
    });
  }

  // =====================  DETALLE Y ANOTACIONES  =====================

  /** Abre el detalle de la historia con el histórico de anotaciones. */
  verHistoria(fila: HistoriaResumen): void {
    this.historiaService.buscarPorId(fila.id).subscribe({
      next: (rs) => {
        this.detalle = rs;
        this.historiaAnotacion = fila;
        this.anotacionesQ = '';
        this.anotacionesPagina = 0;
        this.anotacionesDir = 'desc';
        this.anotacionesColumna = 'fecha';
        this.anotacionDetalle = null;
        this.cargarAnotaciones();
        this.abrir('modalVerHistoria', 'D');
      },
      error: (err) => Swal.fire('No se pudo consultar', mensajeError(err, 'Registro no encontrado.'), 'error')
    });
  }

  cargarAnotaciones(): void {
    const id = this.detalle?.historia.id;
    if (!id) {
      return;
    }
    const filtro: FiltroPaginado = {
      page: this.anotacionesPagina, size: this.anotacionesTamanio, sort: this.anotacionesColumna,
      dir: this.anotacionesDir, q: this.anotacionesQ.trim()
    };
    this.cargandoAnotaciones = true;
    this.errorAnotaciones = '';
    this.anotacionService.listarPorHistoria(id, filtro).subscribe({
      next: (rs) => {
        this.anotaciones = rs.content;
        this.anotacionesTotal = rs.totalElements;
        this.anotacionesPaginas = rs.totalPages;
        this.cargandoAnotaciones = false;
      },
      error: (err) => {
        this.cargandoAnotaciones = false;
        this.anotaciones = [];
        this.errorAnotaciones = mensajeError(err, 'No fue posible cargar las anotaciones.');
      }
    });
  }

  buscarAnotacion(event: Event): void {
    this.busquedaAnotacion$.next((event.target as HTMLInputElement).value);
  }

  ordenarAnotaciones(columna: ColumnaAnotacion): void {
    if (this.anotacionesColumna === columna) {
      this.anotacionesDir = this.anotacionesDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.anotacionesColumna = columna;
      this.anotacionesDir = columna === 'fecha' ? 'desc' : 'asc';
    }
    this.anotacionesPagina = 0;
    this.cargarAnotaciones();
  }

  iconoOrdenAnotacion(columna: ColumnaAnotacion): string {
    return this.anotacionesColumna !== columna ? 'fa-sort' : (this.anotacionesDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
  }

  cambiarPaginaAnotaciones(pagina: number): void {
    if (pagina >= 0 && pagina < this.anotacionesPaginas && pagina !== this.anotacionesPagina) {
      this.anotacionesPagina = pagina;
      this.cargarAnotaciones();
    }
  }

  /** Detalle de una anotación (con las fórmulas de su consulta). */
  verAnotacion(a: AnotacionHistoria): void {
    this.anotacionService.buscarPorId(a.id).subscribe({
      next: (rs) => (this.anotacionDetalle = rs),
      error: (err) => Swal.fire('No se pudo consultar', mensajeError(err, 'Registro no encontrado.'), 'error')
    });
  }

  cerrarDetalle(): void {
    this.modalDetalle?.hide();
    this.anotacionDetalle = null;
  }

  // ---- nueva anotación ----

  /** Abre el formulario de anotación; si viene desde el detalle, lo cierra y lo reabre al terminar. */
  nuevaAnotacion(fila: HistoriaResumen, desdeDetalle = false): void {
    this.historiaAnotacion = fila;
    this.reabrirDetalle = desdeDetalle;
    this.errorAnotacion = '';
    this.formAnotacion.reset({ descripcion: '', diagnostico: '', observaciones: '', medicoId: fila.medicoId ?? null });
    this.medicoService.listar().subscribe({
      next: (l) => (this.medicos = l.filter((m) => m.estado !== false)),
      error: (err) => (this.errorAnotacion = mensajeError(err, 'No fue posible cargar los veterinarios.'))
    });
    if (desdeDetalle) {
      this.modalDetalle?.hide();
    }
    this.abrir('modalAnotacion', 'A');
  }

  /** Atajo: agregar anotación a la historia que se está viendo. */
  nuevaAnotacionDelDetalle(): void {
    if (this.historiaAnotacion) {
      this.nuevaAnotacion(this.historiaAnotacion, true);
    }
  }

  guardarAnotacion(): void {
    if (this.formAnotacion.invalid || this.enviandoAnotacion || !this.historiaAnotacion) {
      this.formAnotacion.markAllAsTouched();
      return;
    }
    const v = this.formAnotacion.getRawValue();
    const rq: AnotacionRq = {
      historiaId: this.historiaAnotacion.id,
      medicoId: Number(v.medicoId),
      descripcion: String(v.descripcion).trim(),
      diagnostico: String(v.diagnostico).trim(),
      observaciones: String(v.observaciones).trim()
    };
    this.enviandoAnotacion = true;
    this.errorAnotacion = '';
    this.anotacionService.crearAnotacion(rq).subscribe({
      next: (rs) => {
        this.enviandoAnotacion = false;
        this.modalAnotacion?.hide();
        this.cargar();
        Swal.fire('Operación exitosa', rs?.message ?? 'Anotación creada.', 'success').then(() => {
          if (this.reabrirDetalle && this.historiaAnotacion) {
            this.verHistoria(this.historiaAnotacion);
          }
        });
      },
      error: (err) => {
        this.enviandoAnotacion = false;
        this.errorAnotacion = mensajeError(err, 'No fue posible guardar la anotación.');
      }
    });
  }

  cancelarAnotacion(): void {
    this.modalAnotacion?.hide();
    if (this.reabrirDetalle && this.historiaAnotacion) {
      this.verHistoria(this.historiaAnotacion);
    }
  }

  private abrir(id: string, cual: 'F' | 'D' | 'A'): void {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    const Modal = (window as unknown as WindowBootstrap).bootstrap.Modal;
    if (cual === 'F') {
      this.modalForm ??= new Modal(el);
      this.modalForm.show();
    } else if (cual === 'D') {
      this.modalDetalle ??= new Modal(el);
      this.modalDetalle.show();
    } else {
      this.modalAnotacion ??= new Modal(el);
      this.modalAnotacion.show();
    }
  }
}
