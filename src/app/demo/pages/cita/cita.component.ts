import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import Swal from 'sweetalert2';
import { Cita } from 'src/app/models/cita';
import { CitaService } from './service/cita.service';
import { Mascota } from 'src/app/models/mascota';
import { Medico } from 'src/app/models/medico';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoService } from '../medico/service/medico.service';

type ColumnaOrden = 'mascota' | 'medico' | 'fechaHora' | 'motivo' | 'estado';
type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };



@Component({
  selector: 'app-cita',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './cita.component.html',
  styleUrl: './cita.component.scss'
})
export class CitaComponent {

  // Variables para el modal.
  modalInstance: ModalBootstrap | null = null;
  modalDetalleInstance: ModalBootstrap | null = null;
  citaDetalle: Cita | null = null;
  titleModal: string = "";
  modoFormulario: string = "";
  titleBoton: string = "";


  // Variables para la paginación, ordenamiento y búsqueda en la datatable.
  listEspecializaciones: Cita[] = [];
  listMascotas: Mascota[] = [];
  listMedicos: Medico[] = [];
  cargandoMascotas = false;
  cargandoMedicos = false;
  errorMascotas = '';
  errorMedicos = '';
  errorCitas = '';
  disponibilidadConsultada = false;
  private consultaMedicos?: Subscription;
  private readonly destroyRef = inject(DestroyRef);
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'mascota';
  direccionOrden: 'asc' | 'desc' = 'asc';

  // Formulario para crear o editar especializacion.
  form!: FormGroup;
  citaSelected: Cita | null = null;
  enviando = false;
  respuestaError = '';

  constructor(private readonly citaService: CitaService,    
    private readonly formBuilder: FormBuilder,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoService) {
    this.inicializarFormulario();
    this.listarCitas();
    this.listarMascotas();
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      mascota: [null, Validators.required],
      medico: [null, Validators.required],
      fechaHora: [null, [
        Validators.required,
        (control: AbstractControl) => control.value && Number.isNaN(new Date(control.value).getTime())
          ? { fechaInvalida: true } : null
      ]],
      motivo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(255)]],
      estado: ['', Validators.required],
    });
    this.form.controls['fechaHora'].valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.consultaMedicos?.unsubscribe();
      this.cargandoMedicos = false;
      this.disponibilidadConsultada = false;
      this.errorMedicos = '';
      this.listMedicos = [];
      this.form.controls['medico'].reset();
    });
  }

  listarCitas() {
    this.errorCitas = '';
    this.citaService.listarCitas().subscribe({
      next: (citas) => {
        this.listEspecializaciones = citas;
        this.paginaActual = Math.min(this.paginaActual, this.totalPaginas || 1);
      },
      error: (err) => {
        this.errorCitas = 'No fue posible cargar las citas.';
        console.error('Error al listar citas:', err);
      }
    });
  }

  listarMascotas(): void {
    this.cargandoMascotas = true;
    this.errorMascotas = '';
    this.mascotaService.listarMascotas().subscribe({
      next: (mascotas) => {
        this.listMascotas = mascotas;
        this.cargandoMascotas = false;
      },
      error: (error) => {
        this.cargandoMascotas = false;
        this.errorMascotas = 'No fue posible cargar las mascotas.';
        console.error('Error al listar mascotas:', error);
      }
    });
  }

  get fechaInicio(): Date | null {
    const control = this.form.controls['fechaHora'];
    return control.valid && control.value ? new Date(control.value) : null;
  }

  get fechaFin(): Date | null {
    const inicio = this.fechaInicio;
    return inicio ? new Date(inicio.getTime() + 15 * 60 * 1000) : null;
  }

  consultarMedicosDisponibles(): void {
    const inicio = this.fechaInicio;
    const fin = this.fechaFin;
    if (!inicio || !fin) {
      this.form.controls['fechaHora'].markAsTouched();
      return;
    }
    if (this.cargandoMedicos || this.enviando) {
      return;
    }
    this.listarMedicosDisponiblesPorFecha(inicio, fin);
  }

  listarMedicosDisponiblesPorFecha(fechaInicio: Date, fechaFin: Date): void {
    this.consultaMedicos?.unsubscribe();
    this.listMedicos = [];
    this.form.controls['medico'].reset();
    this.disponibilidadConsultada = false;
    this.cargandoMedicos = true;
    this.errorMedicos = '';
    this.consultaMedicos = this.medicoService
      .listarMedicosDisponiblesPorFecha(fechaInicio, fechaFin)
      .pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (medicos) => {
        this.listMedicos = medicos;
        this.cargandoMedicos = false;
        this.disponibilidadConsultada = true;
      },
      error: (error) => {
        this.cargandoMedicos = false;
        this.errorMedicos = 'No fue posible cargar los médicos disponibles.';
        console.error('Error al listar médicos disponibles:', error);
      }
    });
  }

  compararMascotas(mascotaA: Mascota | null, mascotaB: Mascota | null): boolean {
    return mascotaA === mascotaB ||
      (mascotaA?.mascotaId != null && mascotaA.mascotaId === mascotaB?.mascotaId);
  }

  compararMedicos(medicoA: Medico | null, medicoB: Medico | null): boolean {
    return medicoA === medicoB || (medicoA?.id != null && medicoA.id === medicoB?.id);
  }

  // Obtiene los controles del formulario para facilitar el acceso a sus propiedades y métodos.
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Filtra la lista de citas según el término de búsqueda ingresado por el usuario.
   * @returns Un arreglo de citas filtradas.
   */
  get citasFiltradas(): Cita[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listEspecializaciones.filter((cita) => {
      if (!termino) {
        return true;
      }

      const valores = [
        this.obtenerValorOrden(cita, 'mascota'),
        this.obtenerValorOrden(cita, 'medico'),
        this.obtenerValorOrden(cita, 'fechaHora'),
        cita.motivo,
        cita.estado
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return [...filtradas].sort((citaA, citaB) => {
      const valorA = this.obtenerValorOrden(citaA, this.columnaOrden);
      const valorB = this.obtenerValorOrden(citaB, this.columnaOrden);
      const comparacion = typeof valorA === 'number' && typeof valorB === 'number'
        ? valorA - valorB
        : String(valorA).localeCompare(String(valorB), 'es', { numeric: true, sensitivity: 'base' });

      return this.direccionOrden === 'asc' ? comparacion : -comparacion;
    });
  }

  private obtenerValorOrden(cita: Cita, columna: ColumnaOrden): string | number {
    switch (columna) {
      case 'mascota':
        return cita.mascota?.nombreMascota ?? cita.mascota?.nombre ?? '';
      case 'medico':
        return  `${cita.medico?.nombres ?? ''} ${cita.medico?.apellidos ?? ''}`;
      case 'fechaHora':
        return cita.fechaHora ? formatDate(cita.fechaHora, 'yyyy-MM-dd HH:mm', 'en-US')
          : '';
      case 'motivo':
        return cita.motivo ?? '';
      case 'estado':
        return cita.estado ?? '';
    }
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

  get citasPaginadas(): Cita[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.citasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.citasFiltradas.length / this.registrosPorPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  // Metodo que actualiza el termino de busqueda y reinicia la pagina actual a 1.
  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  // Cambia paginacion.
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // Metodo privado para normalizar el texto, eliminando acentos y convirtiendo a minúsculas.
  private normalizarTexto(texto: string): string {
    return texto
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

   /**
     * Metodos para la gestion de especializaciones (crear, editar, guardar).
     */
  
    // Evento para abrir el modal de crear o editar especializacion, dependiendo del modo recibido.
    nuevaCita(modo: string) {
      this.titleModal = modo === 'C' ? 'Crear Cita' : 'Editar Cita';
      this.modoFormulario = modo;
      this.citaSelected = null;
      this.resetFormulario();
      this.form.controls['estado'].setValue('programada');
      this.openModal(modo);
    }  
   
  
    verCita(cita: Cita): void {
      this.citaDetalle = cita;
      const modalElement = document.getElementById('modalVerCita');
      if (modalElement) {
        this.modalDetalleInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(modalElement);
        this.modalDetalleInstance.show();
      }
    }

    cerrarDetalle(): void {
      this.modalDetalleInstance?.hide();
    }

    esCitaCancelada(cita: Cita | null): boolean {
      return cita?.estado?.trim().toLowerCase() === 'cancelada';
    }

    abrirEdicion(cita: Cita) {
      if (this.esCitaCancelada(cita)) {
        Swal.fire('Cita cancelada', 'No se puede editar una cita cancelada.', 'warning');
        return;
      }
      this.resetFormulario();
      this.citaSelected = cita;
      this.modoFormulario = 'E';
      this.form.patchValue({
        fechaHora: cita.fechaHora ? formatDate(cita.fechaHora, "yyyy-MM-dd'T'HH:mm", 'en-US') : null,
        mascota: cita.mascota,
        medico: cita.medico,
        motivo: cita.motivo ?? null,
        estado: cita.estado?.trim().toLowerCase() ?? null
      });
      this.listMedicos = cita.medico ? [cita.medico] : [];
      this.openModal(this.modoFormulario);
    }
  
    /**
     * 
     * @returns Acción realizada sobre la cita (crear o actualizar).
     */
    guardarCita() {
      if (this.modoFormulario === 'E' && this.esCitaCancelada(this.citaSelected)) {
        this.respuestaError = 'No se puede actualizar una cita cancelada.';
        return;
      }
      if (this.form.invalid || this.enviando) {
        this.form.markAllAsTouched();
        return;
      }
  
      const valores = this.form.getRawValue();
      const cita: Cita = {
        id: this.citaSelected?.id,
        mascotaId: valores.mascota.mascotaId,
        medicoId: valores.medico.id,
        fechaHora: valores.fechaHora,
        motivo: valores.motivo ?? null,
        estado: this.modoFormulario === 'C' ? 'programada' : valores.estado
      };
  
      this.enviando = true;
      this.respuestaError = '';
      const solicitud = this.modoFormulario === 'C'
        ? this.citaService.guardarCita(cita)
        : this.citaService.actualizarCita(cita);
  
      solicitud.subscribe({
        next: (respuesta) => {
          this.enviando = false;
          const mensaje = this.obtenerMensajeRespuesta(
            respuesta,
            this.modoFormulario === 'C' ? 'La cita fue creada correctamente.' : 'La cita fue actualizada correctamente.'
          );
          this.closeModal();
          this.listarCitas();
          Swal.fire('Operación exitosa', mensaje, 'success');
        },
        error: (error) => {
          this.enviando = false;
          console.error('Error al guardar la cita:', error);
          this.respuestaError = error.error?.mensaje ?? error.error?.message ?? error.message ??
            'No fue posible guardar la cita.';
        }
      });
    }
  
    private obtenerMensajeRespuesta(respuesta: unknown, mensajePredeterminado: string): string {
      if (respuesta && typeof respuesta === 'object') {
        const cuerpo = respuesta as { mensaje?: unknown; message?: unknown };
        const mensaje = cuerpo.mensaje ?? cuerpo.message;
        if (typeof mensaje === 'string') {
          return mensaje;
        }
      }
      return mensajePredeterminado;
    }


  resetFormulario() {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.respuestaError = '';
  }


  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.resetFormulario();
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Cita' : 'Editar Cita';
    this.titleBoton = modo === 'C' ? 'Guardar Cita' : 'Actualizar Cita';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearCita');
    if (modalElement) {
      // Verificar si ya existe una instancia del modal
      this.modalInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

}
