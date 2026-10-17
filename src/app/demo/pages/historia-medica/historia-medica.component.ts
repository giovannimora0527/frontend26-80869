import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnotacionRq } from 'src/app/models/anotacion';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { Historia, HistoriaFiltro, HistoriaRq } from 'src/app/models/historia';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { PageResponse } from 'src/app/models/page-response';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ColumnaTabla, DataTableComponent } from 'src/app/shared/data-table/data-table.component';
import { mensajeDeError } from 'src/app/utils/api-error';
import { abrirModal, cerrarModal } from 'src/app/utils/modal';
import { noEnBlanco } from 'src/app/utils/validadores';
import { AnotacionService } from '../anotacion-historia/service/anotacion.service';
import { CitaService } from '../cita/service/cita.service';
import { ClienteService } from '../cliente/service/cliente.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoServiceService } from '../medico/service/medico-service.service';
import { AnotacionesTablaComponent } from './anotaciones-tabla/anotaciones-tabla.component';
import { HistoriaService } from './service/historia.service';

/**
 * Gestión de historias clínicas: DataTable paginado en el servidor (orden inicial por fecha y
 * hora de consulta descendente), filtros, creación a partir de una cita atendida (combos
 * Cliente → Mascota → Cita), y modal "Ver" con el detalle y el histórico de anotaciones.
 */
@Component({
  selector: 'app-historia-medica',
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, AnotacionesTablaComponent],
  templateUrl: './historia-medica.component.html',
  styleUrl: './historia-medica.component.scss'
})
export class HistoriaMedicaComponent implements OnInit {
  /** Id del modal de creación. */
  readonly modalNuevaId = 'modalHistoriaNueva';
  /** Id del modal de detalle. */
  readonly modalVerId = 'modalHistoriaVer';
  /** Columnas del DataTable. */
  readonly columnas: ColumnaTabla[] = [
    { campo: 'fechaConsulta', titulo: 'Fecha', ordenPor: 'fechaConsulta', formato: 'fechaHora' },
    { campo: 'mascotaNombre', titulo: 'Mascota', ordenPor: 'mascota' },
    { campo: 'clienteNombre', titulo: 'Cliente', ordenPor: 'cliente' },
    { campo: 'medicoNombre', titulo: 'Veterinario', ordenPor: 'medico' },
    { campo: 'motivo', titulo: 'Motivo de consulta', ordenPor: 'motivo', max: 50 },
    { campo: 'estado', titulo: 'Estado', ordenPor: 'estado', formato: 'estado' }
  ];

  /** Página actual de historias. */
  pagina: PageResponse<Historia> | null = null;
  /** Indica si hay una consulta en curso. */
  cargando = false;
  /** Paginación, orden y filtros vigentes. */
  filtro: HistoriaFiltro = { page: 0, size: 10, sortBy: 'fechaConsulta', sortDir: 'desc' };
  /** Clientes para el combo. */
  clientes: Cliente[] = [];
  /** Veterinarios para los combos. */
  medicos: Medico[] = [];
  /** Mascotas del cliente elegido. */
  mascotas: Mascota[] = [];
  /** Citas atendidas de la mascota elegida. */
  citasAtendidas: Cita[] = [];
  /** Formulario de filtros. */
  filtrosForm!: FormGroup;
  /** Formulario de nueva historia. */
  historiaForm!: FormGroup;
  /** Formulario de nueva anotación (dentro del modal Ver). */
  anotacionForm!: FormGroup;
  /** Historia que se muestra en el modal Ver. */
  historiaSeleccionada: Historia | null = null;
  /** Contador que fuerza la recarga de la tabla de anotaciones. */
  refrescarAnotaciones = 0;
  /** Evita envíos dobles. */
  enviando = false;

  /**
   * @param historiaService Servicio de historias.
   * @param anotacionService Servicio de anotaciones.
   * @param citaService Servicio de citas.
   * @param clienteService Servicio de clientes.
   * @param mascotaService Servicio de mascotas.
   * @param medicoService Servicio de veterinarios.
   * @param notificacion Mensajes al usuario.
   * @param formBuilder Constructor de formularios reactivos.
   * @param destroyRef Referencia para cancelar suscripciones.
   */
  constructor(
    private readonly historiaService: HistoriaService,
    private readonly anotacionService: AnotacionService,
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
    this.filtrosForm = this.formBuilder.group({ texto: [''], estado: [''], medicoId: [''], fechaDesde: [''], fechaHasta: [''] });
    this.historiaForm = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [null, Validators.required],
      citaId: [null, Validators.required],
      medicoId: [null, Validators.required],
      motivo: ['', [Validators.required, noEnBlanco()]],
      diagnostico: ['', [Validators.required, noEnBlanco()]],
      observaciones: ['']
    });
    this.anotacionForm = this.formBuilder.group({
      medicoId: [null, Validators.required],
      descripcion: ['', [Validators.required, noEnBlanco()]],
      observacion: ['', [Validators.required, noEnBlanco()]],
      diagnosticoEvolucion: ['', [Validators.required, noEnBlanco()]]
    });

    // Combos dependientes: Cliente → Mascotas del cliente → Citas atendidas de la mascota.
    this.historiaForm.controls['clienteId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((clienteId: number | null) => {
      this.historiaForm.controls['mascotaId'].reset(null);
      this.mascotas = [];
      if (clienteId) {
        this.mascotaService.listarPorCliente(Number(clienteId)).subscribe({ next: (d) => (this.mascotas = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
      }
    });
    this.historiaForm.controls['mascotaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((mascotaId: number | null) => {
      this.historiaForm.controls['citaId'].reset(null);
      this.citasAtendidas = [];
      if (mascotaId) {
        this.citaService.listar({ mascotaId: Number(mascotaId), estado: 'ATENDIDA', page: 0, size: 100, sortBy: 'fechaHora', sortDir: 'desc' }).subscribe({
          next: (d) => (this.citasAtendidas = d.content),
          error: (e) => this.notificacion.error(mensajeDeError(e))
        });
      }
    });
    // Al elegir la cita se heredan el veterinario y el motivo.
    this.historiaForm.controls['citaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((citaId: number | null) => {
      const cita = this.citasAtendidas.find((c) => c.id === Number(citaId));
      if (cita) {
        this.historiaForm.patchValue({ medicoId: cita.medicoId, motivo: cita.motivo });
      }
    });

    this.clienteService.listarClientes().subscribe({ next: (d) => (this.clientes = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
    this.medicoService.listarMedicos().subscribe({ next: (d) => (this.medicos = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
    this.cargar();
  }

  /** @returns Controles del formulario de historia para la plantilla. */
  get f(): { [clave: string]: AbstractControl } {
    return this.historiaForm.controls;
  }

  /** @returns Controles del formulario de anotación para la plantilla. */
  get fa(): { [clave: string]: AbstractControl } {
    return this.anotacionForm.controls;
  }

  /** Consulta la página actual de historias en el servidor. */
  cargar(): void {
    this.cargando = true;
    this.historiaService.listar(this.filtro).subscribe({
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
      texto: v.texto?.trim() || undefined,
      estado: v.estado || undefined,
      medicoId: v.medicoId ? Number(v.medicoId) : undefined,
      fechaDesde: v.fechaDesde || undefined,
      fechaHasta: v.fechaHasta || undefined
    };
    this.cargar();
  }

  /** Limpia filtros y restablece el orden inicial (fecha de consulta descendente). */
  limpiar(): void {
    this.filtrosForm.reset({ texto: '', estado: '', medicoId: '', fechaDesde: '', fechaHasta: '' });
    this.filtro = { page: 0, size: this.filtro.size, sortBy: 'fechaConsulta', sortDir: 'desc' };
    this.cargar();
  }

  /** @param alias Alias de columna entendido por el backend. */
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

  /** Abre el modal para registrar una historia clínica. */
  nuevaHistoria(): void {
    this.mascotas = [];
    this.citasAtendidas = [];
    this.historiaForm.reset({ clienteId: null, mascotaId: null, citaId: null, medicoId: null, motivo: '', diagnostico: '', observaciones: '' });
    abrirModal(this.modalNuevaId);
  }

  /** Valida y crea la historia clínica a partir de la cita atendida seleccionada. */
  guardarHistoria(): void {
    if (this.historiaForm.invalid || this.enviando) {
      this.historiaForm.markAllAsTouched();
      return;
    }
    const v = this.historiaForm.getRawValue();
    const rq: HistoriaRq = {
      clienteId: Number(v.clienteId),
      mascotaId: Number(v.mascotaId),
      citaId: Number(v.citaId),
      medicoId: Number(v.medicoId),
      motivo: String(v.motivo).trim(),
      diagnostico: String(v.diagnostico).trim(),
      observaciones: v.observaciones?.trim() || undefined
    };
    this.enviando = true;
    this.historiaService.crear(rq).subscribe({
      next: () => {
        this.enviando = false;
        cerrarModal(this.modalNuevaId);
        this.notificacion.exito('La historia clínica fue registrada correctamente.');
        this.cargar();
      },
      error: (error) => {
        this.enviando = false;
        this.notificacion.error(mensajeDeError(error));
      }
    });
  }

  /**
   * Abre el modal con el detalle de la historia y su histórico de anotaciones.
   *
   * @param historia Historia de la fila.
   */
  verHistoria(historia: Historia): void {
    this.historiaService.consultar(historia.id).subscribe({
      next: (datos) => {
        this.historiaSeleccionada = datos;
        this.anotacionForm.reset({ medicoId: datos.medicoId, descripcion: '', observacion: '', diagnosticoEvolucion: '' });
        this.refrescarAnotaciones++;
        abrirModal(this.modalVerId);
      },
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });
  }

  /** Valida y agrega una anotación a la historia que se está viendo. */
  guardarAnotacion(): void {
    if (!this.historiaSeleccionada || this.anotacionForm.invalid || this.enviando) {
      this.anotacionForm.markAllAsTouched();
      return;
    }
    const v = this.anotacionForm.getRawValue();
    const rq: AnotacionRq = {
      historiaId: this.historiaSeleccionada.id,
      medicoId: Number(v.medicoId),
      descripcion: String(v.descripcion).trim(),
      observacion: String(v.observacion).trim(),
      diagnosticoEvolucion: String(v.diagnosticoEvolucion).trim()
    };
    this.enviando = true;
    this.anotacionService.crear(rq).subscribe({
      next: () => {
        this.enviando = false;
        this.anotacionForm.reset({ medicoId: rq.medicoId, descripcion: '', observacion: '', diagnosticoEvolucion: '' });
        this.refrescarAnotaciones++;
        this.notificacion.exito('La anotación fue agregada.');
      },
      error: (error) => {
        this.enviando = false;
        this.notificacion.error(mensajeDeError(error));
      }
    });
  }

  /**
   * Cierra la historia (ya no admite más anotaciones) previa confirmación.
   *
   * @param historia Historia de la fila.
   */
  async cerrarHistoria(historia: Historia): Promise<void> {
    const confirmado = await this.notificacion.confirmar(`¿Desea cerrar la historia de ${historia.mascotaNombre}? Ya no se podrán agregar anotaciones.`);
    if (!confirmado) {
      return;
    }
    this.historiaService.cerrar(historia.id).subscribe({
      next: () => {
        this.notificacion.exito('La historia clínica fue cerrada.');
        this.cargar();
      },
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });
  }
}
