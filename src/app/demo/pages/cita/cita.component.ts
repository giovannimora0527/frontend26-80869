import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Cita, CitaFiltro, CitaRq, ESTADOS_EDITABLES, EstadoCita, TRANSICIONES_CITA } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { PageResponse } from 'src/app/models/page-response';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ColumnaTabla, DataTableComponent } from 'src/app/shared/data-table/data-table.component';
import { hoy, unirFechaHora } from 'src/app/utils/fechas';
import { mensajeDeError } from 'src/app/utils/api-error';
import { abrirModal, cerrarModal } from 'src/app/utils/modal';
import { noEnBlanco } from 'src/app/utils/validadores';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoServiceService } from '../medico/service/medico-service.service';
import { CitaService } from './service/cita.service';

/**
 * Gestión de citas médicas: DataTable paginado en el servidor (orden inicial fecha/hora
 * descendente), filtros, creación y edición con combos dependientes Cliente → Mascota,
 * y cambios de estado respetando las transiciones permitidas.
 */
@Component({
  selector: 'app-cita',
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent implements OnInit {
  /** Id del modal de creación/edición. */
  readonly modalId = 'modalCita';
  /** Columnas del DataTable. */
  readonly columnas: ColumnaTabla[] = [
    { campo: 'fecha', titulo: 'Fecha', ordenPor: 'fechaHora', formato: 'fecha' },
    { campo: 'hora', titulo: 'Hora', ordenPor: 'fechaHora', formato: 'hora' },
    { campo: 'clienteNombre', titulo: 'Cliente', ordenPor: 'cliente' },
    { campo: 'mascotaNombre', titulo: 'Mascota', ordenPor: 'mascota' },
    { campo: 'medicoNombre', titulo: 'Veterinario', ordenPor: 'medico' },
    { campo: 'estado', titulo: 'Estado', ordenPor: 'estado', formato: 'estado' }
  ];
  /** Estados con los que puede nacer una cita. */
  readonly estadosIniciales: EstadoCita[] = ['PROGRAMADA', 'PENDIENTE', 'CONFIRMADA'];
  /** Texto del botón de cada cambio de estado. */
  readonly etiquetaEstado: Record<EstadoCita, string> = {
    PENDIENTE: 'Pendiente',
    PROGRAMADA: 'Programar',
    CONFIRMADA: 'Confirmar',
    ATENDIDA: 'Marcar atendida',
    CANCELADA: 'Cancelar'
  };

  /** Página actual de citas. */
  pagina: PageResponse<Cita> | null = null;
  /** Indica si hay una consulta en curso. */
  cargando = false;
  /** Paginación, orden y filtros vigentes. */
  filtro: CitaFiltro = { page: 0, size: 10, sortBy: 'fechaHora', sortDir: 'desc' };
  /** Estados para el filtro. */
  estados: string[] = [];
  /** Clientes para los combos. */
  clientes: Cliente[] = [];
  /** Veterinarios para los combos. */
  medicos: Medico[] = [];
  /** Mascotas del cliente seleccionado (combo dependiente). */
  mascotas: Mascota[] = [];
  /** Formulario de filtros. */
  filtrosForm!: FormGroup;
  /** Formulario de creación/edición. */
  citaForm!: FormGroup;
  /** Cita que se está editando (null al crear). */
  citaSeleccionada: Cita | null = null;
  /** Indica si el modal está en modo edición. */
  modoEdicion = false;
  /** Evita envíos dobles. */
  enviando = false;
  /** Fecha mínima permitida en el input de fecha. */
  readonly fechaMinima = hoy();

  /**
   * @param citaService Servicio de citas.
   * @param clienteService Servicio de clientes.
   * @param mascotaService Servicio de mascotas.
   * @param medicoService Servicio de veterinarios.
   * @param notificacion Mensajes al usuario.
   * @param formBuilder Constructor de formularios reactivos.
   * @param destroyRef Referencia para cancelar suscripciones al destruir el componente.
   */
  constructor(
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoServiceService,
    private readonly notificacion: NotificacionService,
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {}

  /** Inicializa formularios, combos y la primera página. */
  ngOnInit(): void {
    this.filtrosForm = this.formBuilder.group({
      estado: [''],
      texto: [''],
      medicoId: [''],
      fechaDesde: [''],
      fechaHasta: ['']
    });
    this.citaForm = this.formBuilder.group(
      {
        clienteId: [null, Validators.required],
        mascotaId: [null, Validators.required],
        medicoId: [null, Validators.required],
        fecha: ['', Validators.required],
        hora: ['', Validators.required],
        motivo: ['', [Validators.required, noEnBlanco(), Validators.maxLength(500)]],
        estado: ['PROGRAMADA', Validators.required]
      },
      { validators: (grupo: AbstractControl) => this.validarFechaHora(grupo) }
    );
    // Combo dependiente: al elegir cliente solo se consultan sus mascotas.
    this.citaForm.controls['clienteId'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((clienteId: number | null) => this.cargarMascotas(clienteId));

    this.citaService.estados().subscribe({ next: (d) => (this.estados = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
    this.clienteService.listarClientes().subscribe({ next: (d) => (this.clientes = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
    this.medicoService.listarMedicos().subscribe({ next: (d) => (this.medicos = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
    this.cargar();
  }

  /**
   * Validador de grupo: la fecha y hora no pueden quedar en el pasado. Al editar, solo se
   * exige si el usuario cambió la fecha u hora originales.
   *
   * @param grupo Formulario de la cita.
   * @returns Error `fechaPasada` o null.
   */
  private validarFechaHora(grupo: AbstractControl): ValidationErrors | null {
    const fecha = grupo.get('fecha')?.value as string;
    const hora = grupo.get('hora')?.value as string;
    if (!fecha || !hora) {
      return null;
    }
    const nueva = unirFechaHora(fecha, hora);
    if (this.citaSeleccionada && nueva.substring(0, 16) === this.citaSeleccionada.fechaHora.substring(0, 16)) {
      return null;
    }
    return new Date(nueva).getTime() < Date.now() ? { fechaPasada: true } : null;
  }

  /** @returns Controles del formulario de citas para la plantilla. */
  get f(): { [clave: string]: AbstractControl } {
    return this.citaForm.controls;
  }

  /** Consulta la página actual de citas en el servidor. */
  cargar(): void {
    this.cargando = true;
    this.citaService.listar(this.filtro).subscribe({
      next: (datos) => {
        this.pagina = datos;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.notificacion.error(mensajeDeError(error));
      }
    });
  }

  /** Aplica los filtros del formulario y vuelve a la primera página. */
  buscar(): void {
    const v = this.filtrosForm.getRawValue();
    this.filtro = {
      ...this.filtro,
      page: 0,
      estado: v.estado || undefined,
      texto: v.texto?.trim() || undefined,
      medicoId: v.medicoId ? Number(v.medicoId) : undefined,
      fechaDesde: v.fechaDesde || undefined,
      fechaHasta: v.fechaHasta || undefined
    };
    this.cargar();
  }

  /** Limpia los filtros y restablece el orden inicial (fecha/hora descendente). */
  limpiar(): void {
    this.filtrosForm.reset({ estado: '', texto: '', medicoId: '', fechaDesde: '', fechaHasta: '' });
    this.filtro = { page: 0, size: this.filtro.size, sortBy: 'fechaHora', sortDir: 'desc' };
    this.cargar();
  }

  /**
   * Cambia el orden: misma columna alterna la dirección, otra columna ordena ascendente.
   *
   * @param alias Alias de columna entendido por el backend.
   */
  ordenar(alias: string): void {
    if (this.filtro.sortBy === alias) {
      this.filtro = { ...this.filtro, page: 0, sortDir: this.filtro.sortDir === 'asc' ? 'desc' : 'asc' };
    } else {
      this.filtro = { ...this.filtro, page: 0, sortBy: alias, sortDir: 'asc' };
    }
    this.cargar();
  }

  /** @param pagina Página destino (base 0). */
  cambiarPagina(pagina: number): void {
    this.filtro = { ...this.filtro, page: pagina };
    this.cargar();
  }

  /** @param tamanio Nuevo tamaño de página. */
  cambiarTamanio(tamanio: number): void {
    this.filtro = { ...this.filtro, page: 0, size: tamanio };
    this.cargar();
  }

  /**
   * Carga las mascotas del cliente elegido; al cambiar de cliente se limpia la mascota.
   *
   * @param clienteId Cliente seleccionado o null.
   */
  private cargarMascotas(clienteId: number | null): void {
    this.citaForm.controls['mascotaId'].reset(null);
    this.mascotas = [];
    if (!clienteId) {
      return;
    }
    this.mascotaService.listarPorCliente(Number(clienteId)).subscribe({
      next: (datos) => (this.mascotas = datos),
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });
  }

  /** Abre el modal para crear una cita. */
  nuevaCita(): void {
    this.modoEdicion = false;
    this.citaSeleccionada = null;
    this.mascotas = [];
    this.citaForm.enable();
    this.citaForm.reset({ clienteId: null, mascotaId: null, medicoId: null, fecha: '', hora: '', motivo: '', estado: 'PROGRAMADA' });
    abrirModal(this.modalId);
  }

  /**
   * Abre el modal para editar fecha, hora, veterinario y motivo (cliente y mascota quedan bloqueados).
   *
   * @param cita Cita a editar.
   */
  editarCita(cita: Cita): void {
    this.modoEdicion = true;
    this.citaSeleccionada = cita;
    this.citaForm.enable();
    this.citaForm.patchValue(
      {
        clienteId: cita.clienteId,
        medicoId: cita.medicoId,
        fecha: cita.fecha,
        hora: cita.hora.substring(0, 5),
        motivo: cita.motivo,
        estado: cita.estado
      },
      { emitEvent: false }
    );
    this.mascotaService.listarPorCliente(cita.clienteId).subscribe({
      next: (datos) => {
        this.mascotas = datos;
        this.citaForm.controls['mascotaId'].setValue(cita.mascotaId);
      },
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });
    this.citaForm.controls['clienteId'].disable();
    this.citaForm.controls['mascotaId'].disable();
    this.citaForm.controls['estado'].disable();
    abrirModal(this.modalId);
  }

  /** Valida el formulario y crea o actualiza la cita. */
  guardar(): void {
    if (this.citaForm.invalid || this.enviando) {
      this.citaForm.markAllAsTouched();
      return;
    }
    const v = this.citaForm.getRawValue();
    const rq: CitaRq = {
      clienteId: Number(v.clienteId),
      mascotaId: Number(v.mascotaId),
      medicoId: Number(v.medicoId),
      fechaHora: unirFechaHora(v.fecha, v.hora),
      motivo: String(v.motivo).trim(),
      estado: this.modoEdicion ? undefined : v.estado
    };
    this.enviando = true;
    const solicitud = this.modoEdicion && this.citaSeleccionada
      ? this.citaService.actualizar(this.citaSeleccionada.id, rq)
      : this.citaService.crear(rq);
    solicitud.subscribe({
      next: () => {
        this.enviando = false;
        cerrarModal(this.modalId);
        this.notificacion.exito(this.modoEdicion ? 'La cita fue actualizada correctamente.' : 'La cita fue creada correctamente.');
        this.cargar();
      },
      error: (error) => {
        this.enviando = false;
        this.notificacion.error(mensajeDeError(error));
      }
    });
  }

  /**
   * Indica si la cita todavía puede editarse (el backend vuelve a validarlo).
   *
   * @param cita Cita de la fila.
   * @returns true si el estado permite editar.
   */
  puedeEditar(cita: Cita): boolean {
    return ESTADOS_EDITABLES.includes(cita.estado);
  }

  /**
   * Estados a los que puede pasar la cita según la matriz de transiciones.
   *
   * @param cita Cita de la fila.
   * @returns Lista de estados destino.
   */
  transiciones(cita: Cita): EstadoCita[] {
    return TRANSICIONES_CITA[cita.estado] ?? [];
  }

  /**
   * Cambia el estado de la cita previa confirmación.
   *
   * @param cita Cita a modificar.
   * @param nuevoEstado Estado destino.
   */
  async cambiarEstado(cita: Cita, nuevoEstado: EstadoCita): Promise<void> {
    const confirmado = await this.notificacion.confirmar(
      `¿Desea cambiar la cita de ${cita.mascotaNombre} a ${nuevoEstado}?`
    );
    if (!confirmado) {
      return;
    }
    this.citaService.cambiarEstado(cita.id, nuevoEstado).subscribe({
      next: () => {
        this.notificacion.exito(`La cita quedó en estado ${nuevoEstado}.`);
        this.cargar();
      },
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });
  }

  /**
   * Reactiva una cita cancelada (operación explícita).
   *
   * @param cita Cita cancelada.
   */
  async reactivar(cita: Cita): Promise<void> {
    const confirmado = await this.notificacion.confirmar(
      `¿Desea reactivar la cita de ${cita.mascotaNombre}? Quedará como PENDIENTE.`
    );
    if (!confirmado) {
      return;
    }
    this.citaService.reactivar(cita.id).subscribe({
      next: () => {
        this.notificacion.exito('La cita fue reactivada.');
        this.cargar();
      },
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });
  }
}
