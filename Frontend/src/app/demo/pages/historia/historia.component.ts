import { Component } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { Historia, HistoriaRequest } from 'src/app/models/historia';
import { Anotacion, AnotacionRequest } from 'src/app/models/anotacion';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { HistoriaService } from './service/historia.service';
import { AnotacionService } from './service/anotacion.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from 'src/app/services/medico.service';
import { CitaService } from '../cita/service/cita.service';

/** Columnas por las que se puede ordenar la tabla de historias. */
type ColumnaOrden = 'fecha' | 'mascota' | 'cliente' | 'medico' | 'estado';

/**
 * Componente que gestiona el listado y creacion de historias clinicas (la
 * consulta principal, punto 3.1 y 3.2), asi como la visualizacion y registro
 * de anotaciones dentro de cada historia (puntos 3.3 y 3.4).
 */
@Component({
  selector: 'app-historia',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './historia.component.html',
  styleUrl: './historia.component.scss'
})
export class HistoriaComponent {

  /** Estados posibles de una historia / consulta. */
  readonly estados: string[] = ['ACTIVA', 'PROGRAMADA', 'ATENDIDA', 'CERRADA'];

  /** Modales de bootstrap. */
  private modalForm: Modal | null = null;
  private modalDetalle: Modal | null = null;
  private modalAnotacion: Modal | null = null;

  /** Listado de historias. */
  listHistorias: Historia[] = [];
  /** Catalogos para resolver nombres y alimentar combos. */
  listClientes: Cliente[] = [];
  listMascotas: Mascota[] = [];
  listMascotasCliente: Mascota[] = [];
  listMedicos: Medico[] = [];
  listCitas: Cita[] = [];

  /** Historia seleccionada para ver detalle. */
  historiaDetalle: Historia | null = null;
  /** Anotaciones de la historia en detalle. */
  listAnotaciones: Anotacion[] = [];
  /** Anotacion seleccionada para ver su detalle. */
  anotacionDetalle: Anotacion | null = null;

  /** Filtro / paginacion / orden del listado de historias. */
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'fecha';
  direccionOrden: 'asc' | 'desc' = 'desc';

  /** Filtro / paginacion del datatable de anotaciones (dentro del modal). */
  terminoBusquedaAnotacion = '';
  paginaActualAnotacion = 1;
  readonly registrosPorPaginaAnotacion = 4;

  /** Formulario para crear una historia clinica (consulta principal). */
  form!: FormGroup;
  /** Formulario para agregar una anotacion. */
  formAnotacion!: FormGroup;
  /** Banderas de envio en curso. */
  enviando = false;
  enviandoAnotacion = false;

  constructor(
    private readonly historiaService: HistoriaService,
    private readonly anotacionService: AnotacionService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService,
    private readonly citaService: CitaService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormularios();
    this.listar();
    this.listarCatalogos();
  }

  /**
   * Inicializa los formularios reactivos con sus validaciones.
   */
  private inicializarFormularios(): void {
    // Historia = consulta principal (campos del punto 3.2).
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [{ value: null, disabled: true }, Validators.required],
      citaId: [null],
      medicoId: [null, Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      diagnostico: ['', Validators.maxLength(1000)],
      observaciones: ['', Validators.maxLength(1000)],
      estado: ['ACTIVA', Validators.required]
    });
    // Anotacion = nota de evolucion (campos del punto 3.3).
    this.formAnotacion = this.formBuilder.group({
      medicoId: [null, Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
      observacion: ['', Validators.maxLength(1000)],
      diagnostico: ['', Validators.maxLength(1000)]
    });
  }

  /** Acceso rapido a los controles del formulario de historia. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Acceso rapido a los controles del formulario de anotacion. */
  get fa(): { [key: string]: AbstractControl } {
    return this.formAnotacion.controls;
  }

  /**
   * Carga el listado de historias clinicas.
   */
  listar(): void {
    this.historiaService.listarHistorias().subscribe({
      next: (data) => {
        this.listHistorias = data ?? [];
        this.paginaActual = 1;
      },
      error: (error) => Swal.fire('Error', this.obtenerMensajeError(error), 'error')
    });
  }

  /**
   * Carga los catalogos de clientes, mascotas, medicos y citas.
   */
  listarCatalogos(): void {
    this.clienteService.listarClientes().subscribe({
      next: (data) => (this.listClientes = data ?? []),
      error: (error) => console.error('Error al listar clientes:', error)
    });
    this.mascotaService.listarMascotas().subscribe({
      next: (data) => (this.listMascotas = data ?? []),
      error: (error) => console.error('Error al listar mascotas:', error)
    });
    this.medicoService.listarMedicos().subscribe({
      next: (data) => (this.listMedicos = data ?? []),
      error: (error) => console.error('Error al listar medicos:', error)
    });
    this.citaService.listarCitas().subscribe({
      next: (data) => (this.listCitas = data ?? []),
      error: (error) => console.error('Error al listar citas:', error)
    });
  }

  /**
   * Reacciona al cambio de cliente cargando sus mascotas (combo dependiente).
   *
   * @param clienteId identificador del cliente.
   */
  onClienteChange(clienteId: number | null): void {
    this.form.get('mascotaId')?.reset({ value: null, disabled: true });
    this.form.get('citaId')?.reset(null);
    this.listMascotasCliente = [];
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarMascotasPorCliente(clienteId).subscribe({
      next: (data) => {
        this.listMascotasCliente = data ?? [];
        this.form.get('mascotaId')?.enable();
      },
      error: (error) => Swal.fire('Error', this.obtenerMensajeError(error), 'error')
    });
  }

  /**
   * Devuelve las citas de la mascota seleccionada (para el combo de cita).
   */
  get citasDeMascota(): Cita[] {
    const mascotaId = this.form.get('mascotaId')?.value;
    if (!mascotaId) {
      return [];
    }
    return this.listCitas.filter((cita) => cita.mascotaId === Number(mascotaId));
  }

  /**
   * Filtra, ordena y retorna las historias a mostrar.
   */
  get historiasFiltradas(): Historia[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listHistorias.filter((historia) => {
      if (!termino) {
        return true;
      }
      const valores = [
        historia.mascotaNombre ?? this.nombreMascota(historia.pacienteId),
        historia.clienteNombre ?? this.nombreClientePorMascota(historia.pacienteId),
        historia.medicoNombre,
        historia.motivo,
        historia.estado,
        historia.fechaCreacion ? formatDate(historia.fechaCreacion, 'yyyy-MM-dd HH:mm', 'en-US') : ''
      ];
      return valores.some((valor) => this.normalizarTexto(String(valor ?? '')).includes(termino));
    });

    return [...filtradas].sort((a, b) => {
      const valorA = this.valorOrden(a, this.columnaOrden);
      const valorB = this.valorOrden(b, this.columnaOrden);
      const comparacion = typeof valorA === 'number' && typeof valorB === 'number'
        ? valorA - valorB
        : String(valorA).localeCompare(String(valorB), 'es', { numeric: true, sensitivity: 'base' });
      return this.direccionOrden === 'asc' ? comparacion : -comparacion;
    });
  }

  /**
   * Obtiene el valor por el que se ordena una historia.
   */
  private valorOrden(historia: Historia, columna: ColumnaOrden): string | number {
    switch (columna) {
      case 'fecha':
        return historia.fechaCreacion ? new Date(historia.fechaCreacion).getTime() : 0;
      case 'mascota':
        return historia.mascotaNombre ?? this.nombreMascota(historia.pacienteId);
      case 'cliente':
        return historia.clienteNombre ?? this.nombreClientePorMascota(historia.pacienteId);
      case 'medico':
        return historia.medicoNombre ?? '';
      case 'estado':
        return historia.estado ?? '';
    }
  }

  /**
   * Cambia la columna/direccion de ordenamiento.
   */
  ordenarPor(columna: ColumnaOrden): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }
    this.paginaActual = 1;
  }

  /** Historias de la pagina actual. */
  get historiasPaginadas(): Historia[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.historiasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Numero total de paginas del listado. */
  get totalPaginas(): number {
    return Math.ceil(this.historiasFiltradas.length / this.registrosPorPagina);
  }

  /** Arreglo de numeros de pagina del listado. */
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  /**
   * Actualiza el termino de busqueda del listado.
   */
  actualizarBusqueda(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  /**
   * Cambia de pagina del listado.
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  /**
   * Resuelve el nombre de una mascota a partir de su id.
   */
  nombreMascota(mascotaId?: number): string {
    const mascota = this.listMascotas.find((m) => m.mascotaId === mascotaId);
    return mascota ? (mascota.nombreMascota ?? '') : `#${mascotaId ?? ''}`;
  }

  /**
   * Resuelve el nombre del cliente dueño de una mascota.
   */
  nombreClientePorMascota(mascotaId?: number): string {
    const mascota = this.listMascotas.find((m) => m.mascotaId === mascotaId);
    if (mascota?.cliente) {
      return `${mascota.cliente.nombres ?? ''} ${mascota.cliente.apellidos ?? ''}`.trim();
    }
    return '';
  }

  /**
   * Resuelve el nombre de un medico a partir de su id.
   */
  nombreMedico(medicoId?: number): string {
    const medico = this.listMedicos.find((m) => m.id === medicoId);
    return medico ? `${medico.nombres} ${medico.apellidos}` : `#${medicoId ?? ''}`;
  }

  /**
   * Abre el modal de creacion de historia.
   */
  nuevaHistoria(): void {
    this.form.reset({ estado: 'ACTIVA' });
    this.form.get('mascotaId')?.disable();
    this.listMascotasCliente = [];
    const modalElement = document.getElementById('modalHistoria');
    if (modalElement) {
      this.modalForm ??= new Modal(modalElement);
      this.modalForm.show();
    }
  }

  /**
   * Valida y envia el formulario para crear una historia clinica.
   */
  guardarHistoria(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const request: HistoriaRequest = {
      clienteId: valores.clienteId ? Number(valores.clienteId) : undefined,
      pacienteId: Number(valores.mascotaId),
      citaId: valores.citaId ? Number(valores.citaId) : undefined,
      medicoId: Number(valores.medicoId),
      motivo: valores.motivo,
      diagnostico: valores.diagnostico,
      observaciones: valores.observaciones,
      estado: valores.estado
    };

    this.enviando = true;
    this.historiaService.crearHistoria(request).subscribe({
      next: () => {
        this.enviando = false;
        this.modalForm?.hide();
        this.listar();
        Swal.fire('Operacion exitosa', 'La historia clinica fue creada correctamente.', 'success');
      },
      error: (error) => {
        this.enviando = false;
        Swal.fire('Error', this.obtenerMensajeError(error), 'error');
      }
    });
  }

  /**
   * Abre el modal de detalle y carga las anotaciones de la historia.
   *
   * @param historia historia a visualizar.
   */
  verDetalle(historia: Historia): void {
    this.historiaDetalle = historia;
    this.listAnotaciones = [];
    this.terminoBusquedaAnotacion = '';
    this.paginaActualAnotacion = 1;
    this.formAnotacion.reset();
    this.cargarAnotaciones();
    const modalElement = document.getElementById('modalDetalleHistoria');
    if (modalElement) {
      this.modalDetalle ??= new Modal(modalElement);
      this.modalDetalle.show();
    }
  }

  /**
   * Carga las anotaciones de la historia en detalle.
   */
  private cargarAnotaciones(): void {
    if (!this.historiaDetalle?.id) {
      return;
    }
    this.anotacionService.listarPorHistoria(this.historiaDetalle.id).subscribe({
      next: (data) => (this.listAnotaciones = data ?? []),
      error: (error) => Swal.fire('Error', this.obtenerMensajeError(error), 'error')
    });
  }

  /**
   * Anotaciones filtradas por el termino de busqueda (dentro del modal).
   */
  get anotacionesFiltradas(): Anotacion[] {
    const termino = this.normalizarTexto(this.terminoBusquedaAnotacion.trim());
    return this.listAnotaciones.filter((anotacion) => {
      if (!termino) {
        return true;
      }
      const valores = [
        anotacion.descripcion,
        anotacion.observacion,
        anotacion.diagnostico,
        anotacion.medicoNombre ?? this.nombreMedico(anotacion.medicoId),
        anotacion.fecha ? formatDate(anotacion.fecha, 'yyyy-MM-dd HH:mm', 'en-US') : ''
      ];
      return valores.some((valor) => this.normalizarTexto(String(valor ?? '')).includes(termino));
    });
  }

  /** Anotaciones de la pagina actual (dentro del modal). */
  get anotacionesPaginadas(): Anotacion[] {
    const inicio = (this.paginaActualAnotacion - 1) * this.registrosPorPaginaAnotacion;
    return this.anotacionesFiltradas.slice(inicio, inicio + this.registrosPorPaginaAnotacion);
  }

  /** Total de paginas del datatable de anotaciones. */
  get totalPaginasAnotacion(): number {
    return Math.ceil(this.anotacionesFiltradas.length / this.registrosPorPaginaAnotacion);
  }

  /** Numeros de pagina del datatable de anotaciones. */
  get paginasAnotacion(): number[] {
    return Array.from({ length: this.totalPaginasAnotacion }, (_, i) => i + 1);
  }

  /**
   * Actualiza el filtro de anotaciones.
   */
  actualizarBusquedaAnotacion(event: Event): void {
    this.terminoBusquedaAnotacion = (event.target as HTMLInputElement).value;
    this.paginaActualAnotacion = 1;
  }

  /**
   * Cambia de pagina del datatable de anotaciones.
   */
  cambiarPaginaAnotacion(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasAnotacion) {
      this.paginaActualAnotacion = pagina;
    }
  }

  /**
   * Abre el modal con el detalle de una anotacion.
   *
   * @param anotacion anotacion a visualizar.
   */
  verDetalleAnotacion(anotacion: Anotacion): void {
    this.anotacionDetalle = anotacion;
    const modalElement = document.getElementById('modalDetalleAnotacion');
    if (modalElement) {
      this.modalAnotacion ??= new Modal(modalElement);
      this.modalAnotacion.show();
    }
  }

  /**
   * Valida y envia el formulario para agregar una anotacion a la historia.
   */
  agregarAnotacion(): void {
    if (this.formAnotacion.invalid || this.enviandoAnotacion || !this.historiaDetalle?.id) {
      this.formAnotacion.markAllAsTouched();
      return;
    }
    const valores = this.formAnotacion.getRawValue();
    const request: AnotacionRequest = {
      historiaId: this.historiaDetalle.id,
      medicoId: Number(valores.medicoId),
      descripcion: valores.descripcion,
      observacion: valores.observacion,
      diagnostico: valores.diagnostico
    };

    this.enviandoAnotacion = true;
    this.anotacionService.crearAnotacion(request).subscribe({
      next: (respuesta) => {
        this.enviandoAnotacion = false;
        this.formAnotacion.reset();
        this.cargarAnotaciones();
        this.listar();
        Swal.fire('Operacion exitosa', respuesta?.message ?? 'Anotacion registrada correctamente.', 'success');
      },
      error: (error) => {
        this.enviandoAnotacion = false;
        Swal.fire('Error', this.obtenerMensajeError(error), 'error');
      }
    });
  }

  /**
   * Cierra el modal de creacion de historia.
   */
  closeModalForm(): void {
    this.modalForm?.hide();
  }

  /**
   * Cierra el modal de detalle de historia.
   */
  closeModalDetalle(): void {
    this.modalDetalle?.hide();
  }

  /**
   * Cierra el modal de detalle de anotacion.
   */
  closeModalAnotacion(): void {
    this.modalAnotacion?.hide();
  }

  /**
   * Normaliza texto para busquedas.
   */
  private normalizarTexto(texto: string): string {
    return texto.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Extrae un mensaje de error legible de la respuesta del backend.
   */
  private obtenerMensajeError(error: unknown): string {
    const err = error as { error?: { message?: string }; message?: string };
    return err?.error?.message ?? err?.message ?? 'Ocurrio un error inesperado.';
  }
}
