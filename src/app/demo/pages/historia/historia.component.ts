import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { concatMap, finalize, forkJoin, from, Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { HistoriaService } from './service/historia.service';
import { AnotacionHistoriaService } from './service/anotacion-historia.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { CitaService } from '../cita/service/cita.service';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { Cita } from 'src/app/models/cita';
import { HistoriaRq } from 'src/app/models/historia-rq';
import { AnotacionHistoriaRq } from 'src/app/models/anotacion-historia-rq';

type ColumnaOrden = 'fecha' | 'mascota' | 'cliente' | 'veterinario' | 'motivo' | 'diagnostico' | 'observaciones' | 'estado';
type FilaHistoria = Record<ColumnaOrden, string> & { fechaOrden: number; detalle: HistoriaMedica };

@Component({
  selector: 'app-historia',
  imports: [CommonModule, NgbModalModule, ReactiveFormsModule],
  templateUrl: './historia.component.html',
  styleUrl: './historia.component.scss'
})
export class HistoriaComponent {

  listHistorias: HistoriaMedica[] = [];
  cargandoHistorias = false;
  errorHistorias = '';
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  readonly columnas: { clave: ColumnaOrden; titulo: string }[] = [
    { clave: 'fecha', titulo: 'Fecha de creación' },
    { clave: 'mascota', titulo: 'Mascota' },
    { clave: 'cliente', titulo: 'Cliente' },
    { clave: 'veterinario', titulo: 'Veterinario' },
    { clave: 'motivo', titulo: 'Motivo de consulta' },
    { clave: 'diagnostico', titulo: 'Diagnóstico' },
    { clave: 'observaciones', titulo: 'Observaciones' },
    { clave: 'estado', titulo: 'Estado' }
  ];
  columnaOrden: ColumnaOrden = 'fecha';
  direccionOrden: 'asc' | 'desc' = 'desc';
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private modalDetalle?: NgbModalRef;
  private modalFormulario?: NgbModalRef;
  historiaDetalle: HistoriaMedica | null = null;

  private readonly formBuilder = inject(FormBuilder);
  private readonly anotacionHistoriaService = inject(AnotacionHistoriaService);
  private readonly mascotaService = inject(MascotaService);
  private readonly citaService = inject(CitaService);
  readonly formHistoria = this.formBuilder.group({
    mascotaId: this.formBuilder.control<number | null>(null, Validators.required)
  });
  readonly formAnotacion = this.formBuilder.nonNullable.group({
    anotaciones: this.formBuilder.array([this.crearFilaAnotacion()])
  });
  historiaAnotacion: HistoriaMedica | null = null;
  listMascotas: Mascota[] = [];
  listCitas: Cita[] = [];
  cargandoCatalogos = false;
  errorCatalogos = '';
  respuestaError = '';
  guardando = false;

  constructor(private readonly historiaService: HistoriaService) {
    this.destroyRef.onDestroy(() => {
      this.modalDetalle?.dismiss();
      this.modalFormulario?.dismiss();
    });
    this.listarHistorias();
  }

  get anotacionesForm() {
    return this.formAnotacion.controls.anotaciones;
  }

  agregarAnotacion(): void {
    if (!this.guardando) {
      this.anotacionesForm.push(this.crearFilaAnotacion());
    }
  }

  quitarAnotacion(indice: number): void {
    if (!this.guardando && this.anotacionesForm.length > 1) {
      this.anotacionesForm.removeAt(indice);
    }
  }

  private crearFilaAnotacion() {
    const fila = this.formBuilder.nonNullable.group({
      citaId: this.formBuilder.control<number | null>(null, Validators.required),
      medicoId: this.formBuilder.control<number | null>(null, Validators.required),
      descripcion: ['', [Validators.required, Validators.pattern(/\S/)]],
      diagnostico: ['', [Validators.required, Validators.pattern(/\S/)]],
      observaciones: ['', [Validators.required, Validators.pattern(/\S/)]]
    });
    // El veterinario de la anotación es siempre el asignado a la cita seleccionada.
    fila.controls.citaId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(citaId => {
      fila.controls.medicoId.setValue(this.medicosDeCita(citaId)[0]?.id ?? null);
    });
    return fila;
  }

  listarHistorias(): void {
    if (this.cargandoHistorias) {
      return;
    }
    this.cargandoHistorias = true;
    this.errorHistorias = '';
    this.historiaService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (historias) => {
        this.listHistorias = historias;
        this.cargandoHistorias = false;
        this.paginaActual = Math.min(this.paginaActual, this.totalPaginas || 1);
      },
      error: (err) => {
        this.cargandoHistorias = false;
        this.errorHistorias = 'No fue posible cargar las historias médicas.';
        console.error('Error al listar historias médicas:', err);
      }
    });
  }

  get historiasFiltradas(): FilaHistoria[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filas = this.listHistorias.map((detalle): FilaHistoria => {
      const { historia, anotaciones } = detalle;
      const ultimaAnotacion = anotaciones.reduce<typeof anotaciones[number] | undefined>(
        (ultima, anotacion) => !ultima || new Date(anotacion.fecha).getTime() > new Date(ultima.fecha).getTime()
          ? anotacion : ultima,
        undefined
      );
      const mascota = historia.mascota;
      const cliente = mascota.cliente;
      const medico = ultimaAnotacion?.medico;
      const cita = ultimaAnotacion?.cita;

      return {
        detalle,
        fecha: formatDate(historia.fechaCreacion, 'yyyy-MM-dd', 'en-US'),
        fechaOrden: new Date(historia.fechaCreacion).getTime(),
        mascota: mascota.nombreMascota || mascota.nombre || 'No informado',
        cliente: `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim() || 'No informado',
        veterinario: `${medico?.nombres ?? ''} ${medico?.apellidos ?? ''}`.trim() || 'No informado',
        motivo: cita?.motivo?.trim() || 'No informado',
        diagnostico: ultimaAnotacion?.diagnostico?.trim() || 'No informado',
        observaciones: ultimaAnotacion?.observaciones?.trim() || 'No informado',
        estado: mascota.activo == null ? 'No informado' : mascota.activo ? 'Activo' : 'Inactivo'
      };
    });
    const filtradas = filas.filter(fila =>
      this.columnas.some(({ clave }) => this.normalizarTexto(fila[clave]).includes(termino)) ||
      fila.detalle.anotaciones.some(anotacion =>
        [anotacion.diagnostico, anotacion.observaciones].some(texto =>
          this.normalizarTexto(texto ?? '').includes(termino)))
    );

    return filtradas.sort((filaA, filaB) => {
      const comparacion = this.columnaOrden === 'fecha'
        ? filaA.fechaOrden - filaB.fechaOrden
        : filaA[this.columnaOrden].localeCompare(filaB[this.columnaOrden], 'es', {
          numeric: true, sensitivity: 'base'
        });
      return this.direccionOrden === 'asc' ? comparacion : -comparacion;
    });
  }

  ordenarPor(columna: ColumnaOrden): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }
    this.paginaActual = 1;
  }

  get historiasPaginadas(): FilaHistoria[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.historiasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.historiasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  actualizarBusqueda(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.terminoBusqueda = event.target.value;
      this.paginaActual = 1;
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  verDetalle(historia: HistoriaMedica, contenido: TemplateRef<unknown>): void {
    this.historiaDetalle = historia;
    this.modalDetalle = this.modalService.open(contenido, {
      size: 'lg',
      scrollable: true,
      ariaLabelledBy: 'detalleHistoriaTitulo'
    });
    this.modalDetalle.hidden.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.historiaDetalle = null;
      this.modalDetalle = undefined;
    });
  }

  /** Mascotas activas que todavía no tienen historia médica. */
  get mascotasDisponibles(): Mascota[] {
    const conHistoria = new Set(this.listHistorias.map(({ historia }) => historia.mascota?.mascotaId));
    return this.listMascotas.filter(mascota =>
      mascota.mascotaId != null && mascota.activo !== false && !conHistoria.has(mascota.mascotaId));
  }

  /** Veterinario asignado a la cita indicada (lista vacía si no hay cita o no tiene médico). */
  medicosDeCita(citaId: number | null | undefined): Medico[] {
    const medico = citaId == null ? undefined : this.citasDisponibles.find(cita => cita.id === citaId)?.medico;
    return medico?.id != null ? [medico] : [];
  }

  /** Citas asignadas a la mascota de la historia (el backend ya las filtra por mascota). */
  get citasDisponibles(): Cita[] {
    return this.historiaAnotacion ? this.listCitas.filter(cita => cita.id != null) : [];
  }

  /** Indica si la cita ya está asociada a alguna anotación de la historia seleccionada. */
  citaConAnotacion(cita: Cita): boolean {
    return !!this.historiaAnotacion?.anotaciones.some(anotacion => anotacion.cita?.id === cita.id);
  }

  nombreCompleto(persona?: { nombres?: string; apellidos?: string } | null): string {
    return `${persona?.nombres ?? ''} ${persona?.apellidos ?? ''}`.trim() || 'No informado';
  }

  abrirNuevaHistoria(contenido: TemplateRef<unknown>): void {
    if (this.guardando) {
      return;
    }
    this.formHistoria.reset({ mascotaId: null });
    this.historiaAnotacion = null;
    this.abrirFormulario(contenido, 'formHistoriaTitulo');
    this.cargarCatalogos(forkJoin({ mascotas: this.mascotaService.listarMascotas() }));
  }

  abrirNuevaAnotacion(historia: HistoriaMedica, contenido: TemplateRef<unknown>): void {
    if (this.guardando) {
      return;
    }
    this.historiaAnotacion = historia;
    this.listCitas = [];
    this.anotacionesForm.clear();
    this.anotacionesForm.push(this.crearFilaAnotacion());

    const mascotaId = historia.historia.mascota?.mascotaId;
    if (mascotaId == null) {
      this.errorCatalogos = 'La historia no tiene una mascota asociada para consultar sus citas.';
      return;
    }
    this.cargarCatalogos(forkJoin({ citas: this.citaService.listarCitasPorMascota(mascotaId) }));
    this.abrirFormulario(contenido, 'formAnotacionTitulo');
  }

  cerrarFormulario(): void {
    if (!this.guardando) {
      this.modalFormulario?.close();
    }
  }

  guardarHistoria(): void {
    if (this.guardando) {
      return;
    }
    this.formHistoria.markAllAsTouched();
    const mascotaId = this.formHistoria.controls.mascotaId.value;
    if (mascotaId == null || !this.mascotasDisponibles.some(mascota => mascota.mascotaId === mascotaId)) {
      this.respuestaError = 'Selecciona una mascota disponible.';
      return;
    }
    const solicitud: HistoriaRq = { mascotaId };
    this.enviar(this.historiaService.crearHistoria(solicitud), 'La historia médica fue creada correctamente.');
  }

  guardarAnotacion(): void {
    if (this.guardando) {
      return;
    }
    this.formAnotacion.markAllAsTouched();
    const historiaId = this.historiaAnotacion?.historia.id;
    const filas = this.anotacionesForm.getRawValue();
    if (this.formAnotacion.invalid || historiaId == null || filas.length === 0) {
      this.respuestaError = 'Completa los campos obligatorios de todas las anotaciones.';
      return;
    }
    const solicitudes: AnotacionHistoriaRq[] = [];
    for (const { medicoId, citaId, descripcion, diagnostico, observaciones } of filas) {
      if (medicoId == null || citaId == null ||
        !this.medicosDeCita(citaId).some(medico => medico.id === medicoId)) {
        this.respuestaError = 'Cada anotación debe tener una cita con su veterinario asignado.';
        return;
      }
      solicitudes.push({
        historiaId, medicoId, citaId, descripcion: descripcion.trim(),
        diagnostico: diagnostico.trim(), observaciones: observaciones.trim()
      });
    }

    // Se guardan en orden; si una falla, se retiran del formulario las ya creadas para no duplicarlas al reintentar.
    let guardadas = 0;
    this.guardando = true;
    this.respuestaError = '';
    from(solicitudes).pipe(
      concatMap(solicitud => this.anotacionHistoriaService.crearAnotacionHistoria(solicitud)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.guardando = false)
    ).subscribe({
      next: () => guardadas++,
      complete: () => {
        this.guardando = false;
        this.cerrarFormulario();
        this.listarHistorias();
        void Swal.fire('Operación exitosa', guardadas === 1
          ? 'La anotación fue creada correctamente.'
          : `Se crearon ${guardadas} anotaciones correctamente.`, 'success');
      },
      error: error => {
        for (let i = 0; i < guardadas; i++) {
          this.anotacionesForm.removeAt(0);
        }
        const detalle = error?.error?.message || 'No fue posible guardar la anotación. Intenta nuevamente.';
        this.respuestaError = guardadas > 0
          ? `Se guardaron ${guardadas} anotación(es); las restantes no se guardaron: ${detalle}`
          : detalle;
        if (guardadas > 0) {
          this.listarHistorias();
        }
        console.error('Error al guardar anotaciones de historia médica:', error);
      }
    });
  }

  private abrirFormulario(contenido: TemplateRef<unknown>, titulo: string): void {
    this.respuestaError = '';
    const modal = this.modalService.open(contenido, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      ariaLabelledBy: titulo
    });
    this.modalFormulario = modal;
    modal.hidden.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.modalFormulario === modal) {
        this.modalFormulario = undefined;
        this.historiaAnotacion = null;
      }
    });
  }

  private cargarCatalogos(peticion: Observable<{ mascotas?: Mascota[]; citas?: Cita[] }>): void {
    this.cargandoCatalogos = true;
    this.errorCatalogos = '';
    peticion.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargandoCatalogos = false)
    ).subscribe({
      next: ({ mascotas, citas }) => {
        this.listMascotas = mascotas ?? this.listMascotas;
        this.listCitas = citas ?? this.listCitas;
      },
      error: error => {
        this.errorCatalogos = 'No fue posible cargar la información del formulario.';
        console.error('Error al cargar catálogos de historia médica:', error);
      }
    });
  }

  private enviar(solicitud: Observable<unknown>, mensaje: string): void {
    this.guardando = true;
    this.respuestaError = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.guardando = false)
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarFormulario();
        this.listarHistorias();
        void Swal.fire('Operación exitosa', mensaje, 'success');
      },
      error: error => {
        this.respuestaError = error?.error?.message || 'No fue posible guardar la información. Intenta nuevamente.';
        console.error('Error al guardar en historia médica:', error);
      }
    });
  }

  private normalizarTexto(texto: string): string {
    return texto.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
