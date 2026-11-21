import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, formatDate } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { Especializacion } from 'src/app/models/especializacion';

import Swal from 'sweetalert2';

import { EspecializacionService } from './service/especializacion.service';

type ColumnaOrden = 'nombre' | 'descripcion' | 'codigoEspecializacion';
type ModalBootstrap = { show(): void; hide(): void };
type WindowBootstrap = Window & { bootstrap: { Modal: new (element: Element) => ModalBootstrap } };

@Component({
  selector: 'app-especializacion',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './especializacion.component.html',
  styleUrl: './especializacion.component.scss'
})
export class EspecializacionComponent {
  // Variables para el modal.
  modalInstance: ModalBootstrap | null = null;
  titleModal: string = "";
  modoFormulario: string = "";
  titleBoton: string = "";

  // Variables para la paginación, ordenamiento y búsqueda en la datatable.
  listEspecializaciones: Especializacion[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  columnaOrden: ColumnaOrden = 'nombre';
  direccionOrden: 'asc' | 'desc' = 'asc';


  // Formulario para crear o editar especializacion.
  form!: FormGroup;
  especializacionSelected: Especializacion | null = null;
  enviando = false;
  respuestaError = '';

  constructor(private readonly especializacionService: EspecializacionService,
    private readonly formBuilder: FormBuilder
  ) {
    this.listar();
    this.inicializarFormulario();
  }

  // Metodo ue permite inicializar el formulario con sus controles y validaciones.
  inicializarFormulario() {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required],
      descripcion: [null, Validators.required],
      codigoEspecializacion: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  listar() {
    this.especializacionService.listar().subscribe({
      next: (data) => {
        this.listEspecializaciones = data;
      },
      error: (err) => {
        console.error('Error al listar especializaciones', err);
      }
    });
  }

  // Obtiene los controles del formulario para facilitar el acceso a sus propiedades y métodos.
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Filtra la lista de especializaciones según el término de búsqueda ingresado por el usuario.
   * @returns Un arreglo de especializaciones filtradas.
   */
  get especializacionesFiltradas(): Especializacion[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listEspecializaciones.filter((especializacion) => {
      if (!termino) {
        return true;
      }

      const valores = [
        especializacion.nombre,
        especializacion.descripcion,
        especializacion.codigoEspecializacion
      ];

      return valores.some((valor) =>
        this.normalizarTexto(String(valor ?? '')).includes(termino)
      );
    });

    return [...filtradas].sort((especializacionA, especializacionB) => {
      const valorA = this.obtenerValorOrden(especializacionA, this.columnaOrden);
      const valorB = this.obtenerValorOrden(especializacionB, this.columnaOrden);
      const comparacion = typeof valorA === 'number' && typeof valorB === 'number'
        ? valorA - valorB
        : String(valorA).localeCompare(String(valorB), 'es', { numeric: true, sensitivity: 'base' });

      return this.direccionOrden === 'asc' ? comparacion : -comparacion;
    });
  }

  private obtenerValorOrden(especializacion: Especializacion, columna: ColumnaOrden): string | number {
    switch (columna) {
      case 'nombre':
        return especializacion.nombre ?? '';
      case 'descripcion':
        return especializacion.descripcion ?? '';
      case 'codigoEspecializacion':
        return especializacion.codigoEspecializacion ?? '';
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

  get especializacionesPaginadas(): Especializacion[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.especializacionesFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.especializacionesFiltradas.length / this.registrosPorPagina);
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
  nuevaEspecializacion(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Especialización' : 'Editar Especialización';
    this.modoFormulario = modo;
    this.especializacionSelected = null;
    this.resetFormulario();
    this.openModal(modo);
  }

  resetFormulario() {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.respuestaError = '';
  }

  abrirEdicion(especializacion: Especializacion) {
    this.especializacionSelected = especializacion;
    this.modoFormulario = 'E';
    this.form.patchValue({
      nombre: especializacion.nombre,
      descripcion: especializacion.descripcion ?? null,
      codigoEspecializacion: especializacion.codigoEspecializacion ?? null
    });
    this.openModal(this.modoFormulario);
  }

  /**
   * 
   * @returns Acción realizada sobre la mascota (crear o actualizar).
   */
  guardarEspecializacion() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const especializacion: Especializacion = {
      id: this.especializacionSelected?.id,
      nombre: valores.nombre,
      descripcion: valores.descripcion,
      codigoEspecializacion: valores.codigoEspecializacion ?? null
    };

    this.enviando = true;
    this.respuestaError = '';
    const solicitud = this.modoFormulario === 'C'
      ? this.especializacionService.crearEspecializacion(especializacion)
      : this.especializacionService.actualizarEspecializacion(especializacion);

    solicitud.subscribe({
      next: (respuesta) => {
        this.enviando = false;
        const mensaje = this.obtenerMensajeRespuesta(
          respuesta,
          this.modoFormulario === 'C' ? 'La especialización fue creada correctamente.' : 'La especialización fue actualizada correctamente.'
        );
        this.closeModal();
        this.listar();
        Swal.fire('Operación exitosa', mensaje, 'success');
      },
      error: (error) => {
        this.enviando = false;
        console.error('Error al guardar la especialización:', error);
        Swal.fire('Error', error.message, 'error');
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

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.resetFormulario();
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Especialización' : 'Editar Especialización';
    this.titleBoton = modo === 'C' ? 'Guardar Especialización' : 'Actualizar Especialización';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearEspecializacion');
    if (modalElement) {
      // Verificar si ya existe una instancia del modal
      this.modalInstance ??= new (window as unknown as WindowBootstrap).bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }



}
