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
import { Formula } from 'src/app/models/formula';
import { Mascota } from 'src/app/models/mascota';
import { Medicamento } from 'src/app/models/medicamento';
import { Medico } from 'src/app/models/medico';
import { FiltroPaginado } from 'src/app/models/pagina';
import { FormulaResumen, FormulaRq } from 'src/app/models/resumenes';
import { aFechaBackend, aInputFechaHora, ahoraInput, mensajeError } from 'src/app/utils/http-utils';
import { CitaService } from '../cita/service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicamentoService } from '../medicamento/service/medicamento.service';
import { MedicoService } from '../medico/service/medico.service';
import { FormulaService } from './service/formula.service';

type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };
type ColumnaOrden = 'fechaCreacion' | 'fechaEmision' | 'mascota' | 'cliente' | 'veterinario' | 'medicamento' | 'estado';

/** Dosis: número mayor a cero (decimal o fracción) + unidad, por ejemplo "0.5 ml" o "1/2 tableta". */
function dosisValida(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '').trim();
  if (!valor) {
    return null;
  }
  const m = /^(\d+(?:[.,]\d+)?)(?:\/(\d+))?\s*[\p{L}µ%][\p{L}µ%/.\s]{0,38}$/u.exec(valor);
  if (!m) {
    return { dosis: true };
  }
  const cantidad = parseFloat(m[1].replace(',', '.'));
  return cantidad > 0 && (!m[2] || parseInt(m[2], 10) > 0) ? null : { dosis: true };
}

/** Duración: número entero mayor a cero con unidad opcional (horas, días, semanas, meses); máximo 365 días. */
function duracionValida(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '').trim();
  if (!valor) {
    return null;
  }
  const m = /^(\d{1,3})\s*(horas?|d[ií]as?|semanas?|mes(?:es)?)?$/i.exec(valor);
  if (!m || parseInt(m[1], 10) <= 0) {
    return { duracion: true };
  }
  const n = parseInt(m[1], 10);
  const unidad = (m[2] ?? '').toLowerCase();
  const dias = unidad.startsWith('hora') ? Math.ceil(n / 24) : unidad.startsWith('semana') ? n * 7 : unidad.startsWith('mes') ? n * 30 : n;
  return dias <= 365 ? null : { duracion: true };
}

/**
 * Gestión de fórmulas médicas: listado resumido y paginado en el servidor (orden inicial por
 * fecha de creación descendente), filtros, creación con combos dependientes
 * Cliente → Mascota → Consulta, edición, detalle completo e inactivación (sin borrado físico).
 */
@Component({
  selector: 'app-formula-medica',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbDropdownModule, NgbTooltipModule],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly busqueda$ = new Subject<string>();

  // ---- listado ----
  filas: FormulaResumen[] = [];
  totalElementos = 0;
  totalPaginas = 0;
  pagina = 0;
  tamanio = 10;
  readonly tamanios = [5, 10, 20, 50];
  columnaOrden: ColumnaOrden = 'fechaCreacion';
  direccionOrden: 'asc' | 'desc' = 'desc';
  q = '';
  estadoFiltro = '';
  medicamentoFiltro: number | null = null;
  desde = '';
  hasta = '';
  cargando = false;
  errorFormulas = '';

  // ---- formulario ----
  form!: FormGroup;
  modoFormulario: 'C' | 'E' = 'C';
  titleModal = '';
  titleBoton = '';
  formulaSelected: FormulaResumen | null = null;
  enviando = false;
  respuestaError = '';
  errorCombos = '';
  clientes: Cliente[] = [];
  mascotas: Mascota[] = [];
  citas: Cita[] = [];
  medicos: Medico[] = [];
  medicamentos: Medicamento[] = [];
  cargandoMascotas = false;
  cargandoCitas = false;
  maxEmision = ahoraInput();

  // ---- detalle ----
  formulaDetalle: Formula | null = null;
  private modalForm: ModalBootstrap | null = null;
  private modalDetalle: ModalBootstrap | null = null;

  constructor(
    private readonly formulaService: FormulaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly citaService: CitaService,
    private readonly medicoService: MedicoService,
    private readonly medicamentoService: MedicamentoService,
    private readonly fb: FormBuilder
  ) {
    this.inicializarFormulario();
    this.f['clienteId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.alCambiarCliente());
    this.f['mascotaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.alCambiarMascota());
    this.f['citaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.alCambiarCita());
  }

  ngOnInit(): void {
    this.busqueda$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((texto) => {
        this.q = texto;
        this.pagina = 0;
        this.cargar();
      });
    this.medicamentoService.listarMedicamentos().subscribe({ next: (l) => (this.medicamentos = l) });
    this.cargar();
  }

  // =====================  LISTADO  =====================

  cargar(): void {
    const filtro: FiltroPaginado = {
      page: this.pagina,
      size: this.tamanio,
      sort: this.columnaOrden,
      dir: this.direccionOrden,
      q: this.q.trim(),
      medicamentoId: this.medicamentoFiltro ?? undefined,
      activo: this.estadoFiltro === '' ? undefined : this.estadoFiltro === 'true',
      desde: this.desde,
      hasta: this.hasta
    };
    this.cargando = true;
    this.errorFormulas = '';
    this.formulaService.listarPaginado(filtro).subscribe({
      next: (rs) => {
        this.filas = rs.content;
        this.totalElementos = rs.totalElements;
        this.totalPaginas = rs.totalPages;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.filas = [];
        this.errorFormulas = mensajeError(err, 'No fue posible cargar las fórmulas.');
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
    this.medicamentoFiltro = null;
    this.desde = '';
    this.hasta = '';
    this.pagina = 0;
    this.columnaOrden = 'fechaCreacion';
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
    if (this.columnaOrden !== columna) {
      return 'fa-sort';
    }
    return this.direccionOrden === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
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

  // =====================  ACCIONES  =====================

  verFormula(fila: FormulaResumen): void {
    this.formulaService.buscarPorId(fila.id).subscribe({
      next: (detalle) => {
        this.formulaDetalle = detalle;
        this.abrir('modalVerFormula', 'D');
      },
      error: (err) => Swal.fire('No se pudo consultar', mensajeError(err, 'Registro no encontrado.'), 'error')
    });
  }

  cerrarDetalle(): void {
    this.modalDetalle?.hide();
  }

  /** Inactiva o reactiva la fórmula: nunca se elimina físicamente porque hace parte del historial clínico. */
  cambiarEstado(fila: FormulaResumen): void {
    const activar = !fila.activo;
    Swal.fire({
      title: activar ? '¿Activar la fórmula?' : '¿Inactivar la fórmula?',
      text: activar ? 'Podrá volver a editarse.' : 'No se elimina: queda inactiva y ya no se podrá editar.',
      icon: 'question', showCancelButton: true, confirmButtonText: 'Sí', cancelButtonText: 'No'
    }).then((r) => {
      if (r.isConfirmed) {
        this.formulaService.cambiarEstado(fila.id, activar).subscribe({
          next: (rs) => {
            this.cargar();
            Swal.fire('Operación exitosa', rs?.message ?? 'Estado actualizado.', 'success');
          },
          error: (err) => Swal.fire('No se pudo cambiar el estado', mensajeError(err), 'error')
        });
      }
    });
  }

  // =====================  FORMULARIO  =====================

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      mascotaId: [{ value: null, disabled: true }, Validators.required],
      citaId: [{ value: null, disabled: true }, Validators.required],
      medicoId: [null, Validators.required],
      medicamentoId: [null, Validators.required],
      dosis: ['', [Validators.required, dosisValida]],
      frecuencia: ['', [Validators.required, Validators.maxLength(100)]],
      duracion: ['', [Validators.required, duracionValida]],
      indicaciones: ['', [Validators.required, Validators.maxLength(1000)]],
      fechaEmision: [ahoraInput(), Validators.required]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  nuevaFormula(): void {
    this.modoFormulario = 'C';
    this.titleModal = 'Nueva fórmula médica';
    this.titleBoton = 'Guardar fórmula';
    this.formulaSelected = null;
    this.maxEmision = ahoraInput();
    this.reiniciar();
    this.f['clienteId'].enable();
    this.f['medicoId'].enable();
    this.cargarCombos();
    this.abrir('modalCrearFormula', 'F');
  }

  abrirEdicion(fila: FormulaResumen): void {
    if (!fila.activo) {
      Swal.fire('Fórmula inactiva', 'Una fórmula inactiva no se puede editar. Actívala primero.', 'warning');
      return;
    }
    this.modoFormulario = 'E';
    this.titleModal = 'Editar fórmula médica';
    this.titleBoton = 'Actualizar fórmula';
    this.formulaSelected = fila;
    this.maxEmision = ahoraInput();
    this.reiniciar();
    this.cargarCombos();
    this.formulaService.buscarPorId(fila.id).subscribe({
      next: (fm) => {
        this.clientes = fm.mascota?.cliente ? [fm.mascota.cliente] : this.clientes;
        this.mascotas = fm.mascota ? [fm.mascota] : [];
        this.citas = fm.cita ? [fm.cita] : [];
        this.form.patchValue({
          clienteId: fm.mascota?.cliente?.id ?? null,
          mascotaId: fm.mascota?.mascotaId ?? null,
          citaId: fm.cita?.id ?? null,
          medicoId: fm.medico?.id ?? null,
          medicamentoId: fm.medicamento?.id ?? null,
          dosis: fm.dosis,
          frecuencia: fm.frecuencia,
          duracion: fm.duracion,
          indicaciones: fm.indicaciones ?? '',
          fechaEmision: aInputFechaHora(fm.fechaEmision)
        }, { emitEvent: false });
        // La consulta, la mascota y el veterinario no cambian en una fórmula ya emitida.
        ['clienteId', 'mascotaId', 'citaId', 'medicoId'].forEach((c) => this.f[c].disable());
        this.abrir('modalCrearFormula', 'F');
      },
      error: (err) => Swal.fire('No se pudo cargar la fórmula', mensajeError(err), 'error')
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
        this.errorCombos = mensajeError(err, 'No fue posible cargar las mascotas.');
      }
    });
  }

  /** Combo dependiente 2: mascota → sus consultas (citas no canceladas que ya ocurrieron). */
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
        this.errorCombos = mensajeError(err, 'No fue posible cargar las consultas de la mascota.');
      }
    });
  }

  /** Al elegir la consulta se propone su veterinario y una fecha de emisión válida (hoy). */
  private alCambiarCita(): void {
    const cita = this.citas.find((c) => c.id === this.f['citaId'].value);
    if (cita?.medico && this.modoFormulario === 'C') {
      this.f['medicoId'].setValue(cita.medico.id, { emitEvent: false });
    }
  }

  etiquetaCita(c: Cita): string {
    return `${(c.fechaHora as string).toString().replace('T', ' ').slice(0, 16)} · ${c.motivo ?? ''}`;
  }

  guardarFormula(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const rq: FormulaRq = {
      mascotaId: Number(v.mascotaId),
      citaId: Number(v.citaId),
      medicoId: Number(v.medicoId),
      medicamentoId: Number(v.medicamentoId),
      dosis: String(v.dosis).trim(),
      frecuencia: String(v.frecuencia).trim(),
      duracion: String(v.duracion).trim(),
      indicaciones: String(v.indicaciones).trim(),
      fechaEmision: aFechaBackend(v.fechaEmision)
    };
    this.enviando = true;
    this.respuestaError = '';
    const solicitud = this.modoFormulario === 'C'
      ? this.formulaService.crearFormula(rq)
      : this.formulaService.actualizarFormula(this.formulaSelected?.id as number, rq);
    solicitud.subscribe({
      next: (rs) => {
        this.enviando = false;
        this.cerrarFormulario();
        this.cargar();
        Swal.fire('Operación exitosa', rs?.message ?? 'Fórmula guardada.', 'success');
      },
      error: (err) => {
        this.enviando = false;
        this.respuestaError = mensajeError(err, 'No fue posible guardar la fórmula.');
      }
    });
  }

  cerrarFormulario(): void {
    this.modalForm?.hide();
    this.reiniciar();
  }

  private reiniciar(): void {
    this.form.reset({ fechaEmision: ahoraInput(), dosis: '', frecuencia: '', duracion: '', indicaciones: '' });
    this.f['mascotaId'].disable();
    this.f['citaId'].disable();
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
    this.medicoService.listar().subscribe({
      next: (l) => (this.medicos = l.filter((m) => m.estado !== false)),
      error: (err) => (this.errorCombos = mensajeError(err, 'No fue posible cargar los veterinarios.'))
    });
    this.formulaService.listarMedicamentos().subscribe({
      next: (l) => (this.medicamentos = l),
      error: (err) => (this.errorCombos = mensajeError(err, 'No fue posible cargar los medicamentos.'))
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
