import { Component } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { Cita, CitaRequest } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { CitaService } from './service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from 'src/app/services/medico.service';

/** Columnas por las que se puede ordenar la tabla de citas. */
type ColumnaOrden = 'fechaHora' | 'cliente' | 'mascota' | 'medico' | 'estado';

/**
 * Componente que gestiona el listado, creacion y edicion de citas medicas.
 * Implementa paginacion, filtro, ordenamiento y combos dependientes
 * (Cliente -> Mascotas del cliente).
 */
@Component({
  selector: 'app-cita',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent {

  /** Estados validos de una cita, usados en el combo del formulario. */
  readonly estados: string[] = ['PROGRAMADA', 'PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA'];

  /** Instancia del modal de bootstrap. */
  private modalInstance: Modal | null = null;
  /** Titulo del modal segun el modo (crear/editar). */
  titleModal = '';
  /** Texto del boton principal del modal. */
  titleBoton = '';
  /** Modo del formulario: 'C' crear, 'E' editar. */
  modoFormulario = '';

  /** Listado de citas obtenido del backend. */
  listCitas: Cita[] = [];
  /** Catalogos para resolver nombres en la tabla y combos. */
  listClientes: Cliente[] = [];
  listMedicos: Medico[] = [];
  /** Todas las mascotas, usadas para resolver nombres en la tabla. */
  listMascotas: Mascota[] = [];
  /** Mascotas del cliente seleccionado en el formulario. */
  listMascotasCliente: Mascota[] = [];

  /** Termino de busqueda del filtro de texto. */
  terminoBusqueda = '';
  /** Pagina actual de la tabla. */
  paginaActual = 1;
  /** Cantidad de registros por pagina. */
  readonly registrosPorPagina = 5;
  /** Columna por la que se ordena actualmente. */
  columnaOrden: ColumnaOrden = 'fechaHora';
  /** Direccion del ordenamiento. */
  direccionOrden: 'asc' | 'desc' = 'desc';

  /** Formulario reactivo de la cita. */
  form!: FormGroup;
  /** Cita seleccionada para edicion. */
  citaSelected: Cita | null = null;
  /** Bandera para deshabilitar el boton mientras se envia. */
  enviando = false;

  constructor(
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
    this.listar();
    this.listarClientes();
    this.listarMedicos();
    this.listarMascotas();
  }

  /**
   * Inicializa el formulario reactivo con sus validaciones.
   */
  private inicializarFormulario(): void {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [{ value: null, disabled: true }, Validators.required],
      medicoId: [null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.maxLength(500)]],
      estado: ['PROGRAMADA', Validators.required]
    });
  }

  /** Acceso rapido a los controles del formulario. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Carga el listado de citas desde el backend.
   */
  listar(): void {
    this.citaService.listarCitas().subscribe({
      next: (data) => {
        this.listCitas = data ?? [];
        this.paginaActual = 1;
      },
      error: (error) => Swal.fire('Error', this.obtenerMensajeError(error), 'error')
    });
  }

  /**
   * Carga el catalogo de clientes.
   */
  listarClientes(): void {
    this.clienteService.listarClientes().subscribe({
      next: (data) => (this.listClientes = data ?? []),
      error: (error) => console.error('Error al listar clientes:', error)
    });
  }

  /**
   * Carga el catalogo de medicos.
   */
  listarMedicos(): void {
    this.medicoService.listarMedicos().subscribe({
      next: (data) => (this.listMedicos = data ?? []),
      error: (error) => console.error('Error al listar medicos:', error)
    });
  }

  /**
   * Carga el catalogo completo de mascotas para resolver nombres en la tabla.
   */
  listarMascotas(): void {
    this.mascotaService.listarMascotas().subscribe({
      next: (data) => (this.listMascotas = data ?? []),
      error: (error) => console.error('Error al listar mascotas:', error)
    });
  }

  /**
   * Reacciona al cambio de cliente cargando sus mascotas (combo dependiente).
   *
   * @param clienteId identificador del cliente seleccionado.
   */
  onClienteChange(clienteId: number | null): void {
    this.form.get('mascotaId')?.reset({ value: null, disabled: true });
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
   * Filtra, ordena y retorna las citas a mostrar.
   */
  get citasFiltradas(): Cita[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listCitas.filter((cita) => {
      if (!termino) {
        return true;
      }
      const valores = [
        this.nombreCliente(cita.clienteId),
        this.nombreMascota(cita.mascotaId),
        this.nombreMedico(cita.medicoId),
        cita.estado,
        cita.motivo,
        cita.fechaHora ? formatDate(cita.fechaHora, 'yyyy-MM-dd HH:mm', 'en-US') : ''
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
   * Obtiene el valor por el que se ordena una cita segun la columna.
   */
  private valorOrden(cita: Cita, columna: ColumnaOrden): string | number {
    switch (columna) {
      case 'fechaHora':
        return cita.fechaHora ? new Date(cita.fechaHora).getTime() : 0;
      case 'cliente':
        return this.nombreCliente(cita.clienteId);
      case 'mascota':
        return this.nombreMascota(cita.mascotaId);
      case 'medico':
        return this.nombreMedico(cita.medicoId);
      case 'estado':
        return cita.estado ?? '';
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

  /** Citas de la pagina actual. */
  get citasPaginadas(): Cita[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.citasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Numero total de paginas. */
  get totalPaginas(): number {
    return Math.ceil(this.citasFiltradas.length / this.registrosPorPagina);
  }

  /** Arreglo de numeros de pagina para la navegacion. */
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  /**
   * Actualiza el termino de busqueda y reinicia la paginacion.
   */
  actualizarBusqueda(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  /**
   * Cambia de pagina validando los limites.
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  /**
   * Resuelve el nombre completo de un cliente a partir de su id.
   */
  nombreCliente(clienteId?: number): string {
    const cliente = this.listClientes.find((c) => c.id === clienteId);
    return cliente ? `${cliente.nombres} ${cliente.apellidos}` : `#${clienteId ?? ''}`;
  }

  /**
   * Resuelve el nombre de una mascota a partir de su id.
   */
  nombreMascota(mascotaId?: number): string {
    const mascota = this.listMascotas.find((m) => m.mascotaId === mascotaId)
      ?? this.listMascotasCliente.find((m) => m.mascotaId === mascotaId);
    return mascota ? (mascota.nombreMascota ?? '') : `#${mascotaId ?? ''}`;
  }

  /**
   * Resuelve el nombre de un medico a partir de su id.
   */
  nombreMedico(medicoId?: number): string {
    const medico = this.listMedicos.find((m) => m.id === medicoId);
    return medico ? `${medico.nombres} ${medico.apellidos}` : `#${medicoId ?? ''}`;
  }

  /**
   * Abre el modal en modo creacion.
   */
  nuevaCita(): void {
    this.modoFormulario = 'C';
    this.citaSelected = null;
    this.listMascotasCliente = [];
    this.form.reset({ estado: 'PROGRAMADA' });
    this.form.get('mascotaId')?.disable();
    this.openModal('C');
  }

  /**
   * Abre el modal en modo edicion y carga los datos de la cita.
   *
   * @param cita cita a editar.
   */
  abrirEdicion(cita: Cita): void {
    if (cita.estado === 'CANCELADA') {
      Swal.fire('No permitido', 'Una cita cancelada no puede editarse.', 'warning');
      return;
    }
    this.modoFormulario = 'E';
    this.citaSelected = cita;
    const fechaHora = cita.fechaHora ? new Date(cita.fechaHora) : null;

    this.form.patchValue({
      clienteId: cita.clienteId ?? null,
      medicoId: cita.medicoId ?? null,
      fecha: fechaHora ? formatDate(fechaHora, 'yyyy-MM-dd', 'en-US') : '',
      hora: fechaHora ? formatDate(fechaHora, 'HH:mm', 'en-US') : '',
      motivo: cita.motivo ?? '',
      estado: cita.estado ?? 'PROGRAMADA'
    });

    // Carga las mascotas del cliente y luego selecciona la de la cita.
    if (cita.clienteId) {
      this.mascotaService.listarMascotasPorCliente(cita.clienteId).subscribe({
        next: (data) => {
          this.listMascotasCliente = data ?? [];
          this.form.get('mascotaId')?.enable();
          this.form.get('mascotaId')?.setValue(cita.mascotaId ?? null);
        },
        error: (error) => Swal.fire('Error', this.obtenerMensajeError(error), 'error')
      });
    }
    this.openModal('E');
  }

  /**
   * Valida y envia el formulario para crear o actualizar la cita.
   */
  guardarCita(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const request: CitaRequest = {
      id: this.modoFormulario === 'E' ? this.citaSelected?.id : undefined,
      clienteId: valores.clienteId ? Number(valores.clienteId) : undefined,
      mascotaId: Number(valores.mascotaId),
      medicoId: Number(valores.medicoId),
      fechaHora: `${valores.fecha}T${valores.hora}:00`,
      motivo: valores.motivo,
      estado: valores.estado
    };

    this.enviando = true;
    const solicitud = this.modoFormulario === 'C'
      ? this.citaService.crearCita(request)
      : this.citaService.actualizarCita(request);

    solicitud.subscribe({
      next: (respuesta) => {
        this.enviando = false;
        this.closeModal();
        this.listar();
        Swal.fire('Operacion exitosa', respuesta?.message ?? 'La cita se guardo correctamente.', 'success');
      },
      error: (error) => {
        this.enviando = false;
        Swal.fire('Error', this.obtenerMensajeError(error), 'error');
      }
    });
  }

  /**
   * Abre el modal de bootstrap configurando titulos segun el modo.
   */
  private openModal(modo: string): void {
    this.titleModal = modo === 'C' ? 'Registrar Cita' : 'Editar Cita';
    this.titleBoton = modo === 'C' ? 'Guardar Cita' : 'Actualizar Cita';
    const modalElement = document.getElementById('modalCita');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  /**
   * Cierra el modal de bootstrap.
   */
  closeModal(): void {
    this.modalInstance?.hide();
  }

  /**
   * Normaliza texto para busquedas (minusculas, sin acentos).
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
