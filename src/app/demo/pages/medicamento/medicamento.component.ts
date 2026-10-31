import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { Medicamento } from 'src/app/models/medicamento';
import { MedicamentoRq } from 'src/app/models/medicamento-rq';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { fechaLocalISO, fechaNoFutura, vencimientoPosterior } from 'src/app/utils/validadores';
import { MedicamentoService } from './service/medicamento.service';

/** Opciones del filtro por estado del listado. */
type FiltroEstado = 'todos' | 'activos' | 'inactivos';

/**
 * Pantalla de gestión de medicamentos: listar, buscar, crear, editar y activar/desactivar.
 *
 * Los medicamentos nunca se borran porque las fórmulas ya emitidas los referencian.
 * Un medicamento vencido no se puede activar. Las reglas críticas se validan en el
 * backend; aquí solo se reflejan en el formulario.
 */
@Component({
  selector: 'app-medicamento',
  imports: [CommonModule, ReactiveFormsModule, PaginacionComponent],
  templateUrl: './medicamento.component.html',
  styleUrl: './medicamento.component.scss'
})
export class MedicamentoComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly medicamentoService = inject(MedicamentoService);

  /** Fecha de hoy (`AAAA-MM-DD`), usada como máximo de la fecha de compra. */
  readonly hoy = fechaLocalISO();

  /** Formulario reactivo de creación y edición. */
  readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    presentacion: ['', Validators.maxLength(100)],
    descripcion: ['', Validators.maxLength(1000)],
    fechaCompra: ['', [Validators.required, fechaNoFutura]],
    fechaVence: ['', Validators.required]
  }, { validators: vencimientoPosterior });

  /** Mensajes de error por campo y tipo de validación. */
  private readonly mensajes: Record<string, Record<string, string>> = {
    nombre: {
      required: 'El nombre es obligatorio.',
      pattern: 'El nombre no puede contener solo espacios.',
      maxlength: 'Máximo 100 caracteres.'
    },
    presentacion: { maxlength: 'Máximo 100 caracteres.' },
    descripcion: { maxlength: 'Máximo 1000 caracteres.' },
    fechaCompra: {
      required: 'La fecha de compra es obligatoria.',
      fechaFutura: 'La fecha de compra no puede ser futura.'
    },
    fechaVence: { required: 'La fecha de vencimiento es obligatoria.' }
  };

  /** Medicamentos recibidos del backend. */
  medicamentos: Medicamento[] = [];
  /** Medicamento que se está editando; `null` cuando se crea uno nuevo. */
  medicamentoSeleccionado: Medicamento | null = null;

  /** `true` mientras se carga el listado. */
  cargando = false;
  /** `true` mientras se envía el formulario (evita doble envío). */
  enviando = false;
  /** Identificador del medicamento cuyo estado se está cambiando (bloquea su botón). */
  cambiandoEstadoId: number | null = null;
  /** Mensaje de error del listado. */
  errorListado = '';
  /** Mensaje de error del formulario (incluye los que envía el backend). */
  errorFormulario = '';

  // Modal
  private modalInstance: Modal | null = null;
  titleModal = '';
  titleBoton = '';

  // Búsqueda, filtro y paginación del listado
  terminoBusqueda = '';
  filtroEstado: FiltroEstado = 'todos';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  constructor() {
    this.destroyRef.onDestroy(() => this.modalInstance?.dispose());
  }

  ngOnInit(): void {
    this.listar();
  }

  /** Carga el listado de medicamentos desde el backend. */
  listar(): void {
    this.cargando = true;
    this.errorListado = '';
    this.medicamentoService.listarMedicamentos().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (data) => {
        this.medicamentos = data;
        this.paginaActual = Math.min(this.paginaActual, Math.max(1, this.totalPaginas));
      },
      error: (error) => {
        this.errorListado = obtenerMensajeError(error, 'No fue posible cargar los medicamentos.');
      }
    });
  }

  /** Medicamentos que cumplen el filtro de estado y el texto de búsqueda. */
  get medicamentosFiltrados(): Medicamento[] {
    const termino = this.normalizar(this.terminoBusqueda.trim());
    return this.medicamentos.filter((medicamento) => {
      if (this.filtroEstado === 'activos' && !medicamento.activo) {
        return false;
      }
      if (this.filtroEstado === 'inactivos' && medicamento.activo) {
        return false;
      }
      if (!termino) {
        return true;
      }
      const texto = [medicamento.nombre, medicamento.presentacion, medicamento.descripcion]
        .map((valor) => this.normalizar(String(valor ?? '')))
        .join(' ');
      return texto.includes(termino);
    });
  }

  /** Medicamentos de la página actual. */
  get medicamentosPaginados(): Medicamento[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.medicamentosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Total de páginas según los medicamentos filtrados. */
  get totalPaginas(): number {
    return Math.ceil(this.medicamentosFiltrados.length / this.registrosPorPagina);
  }

  /** Actualiza el texto de búsqueda y vuelve a la primera página. */
  actualizarBusqueda(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  /** Cambia el filtro por estado y vuelve a la primera página. */
  cambiarFiltroEstado(event: Event): void {
    this.filtroEstado = (event.target as HTMLSelectElement).value as FiltroEstado;
    this.paginaActual = 1;
  }

  /** Cambia la página mostrada. */
  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
  }

  /** `true` si el lote ya venció (la fecha de vencimiento es anterior a hoy). */
  estaVencido(medicamento: Medicamento): boolean {
    return typeof medicamento.fechaVence === 'string'
      && medicamento.fechaVence.substring(0, 10) < this.hoy;
  }

  /** `true` si el campo fue tocado y no es válido (para marcarlo en rojo). */
  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.touched && control.invalid;
  }

  /** `true` si las fechas están en orden incorrecto (vencimiento no posterior a la compra). */
  get vencimientoIncorrecto(): boolean {
    const vence = this.form.controls.fechaVence;
    return !!this.form.errors?.['vencimientoInvalido'] && (vence.touched || vence.dirty);
  }

  /** Mensaje de error del campo, o texto vacío si no hay error. */
  mensajeError(campo: string): string {
    const errores = this.form.get(campo)?.errors;
    if (!errores || !this.invalido(campo)) {
      return '';
    }
    return this.mensajes[campo]?.[Object.keys(errores)[0]] ?? 'El dato no es válido.';
  }

  /** Abre el modal para crear un medicamento nuevo. */
  abrirCreacion(): void {
    if (this.enviando) {
      return;
    }
    this.medicamentoSeleccionado = null;
    this.form.reset();
    this.errorFormulario = '';
    this.titleModal = 'Crear medicamento';
    this.titleBoton = 'Guardar medicamento';
    this.abrirModal();
  }

  /** Abre el modal con los datos del medicamento para editarlo. */
  abrirEdicion(medicamento: Medicamento): void {
    if (this.enviando) {
      return;
    }
    this.medicamentoSeleccionado = medicamento;
    this.errorFormulario = '';
    this.form.reset({
      nombre: medicamento.nombre ?? '',
      presentacion: medicamento.presentacion ?? '',
      descripcion: medicamento.descripcion ?? '',
      fechaCompra: typeof medicamento.fechaCompra === 'string' ? medicamento.fechaCompra.substring(0, 10) : '',
      fechaVence: typeof medicamento.fechaVence === 'string' ? medicamento.fechaVence.substring(0, 10) : ''
    });
    this.titleModal = 'Editar medicamento';
    this.titleBoton = 'Actualizar medicamento';
    this.abrirModal();
  }

  /** Cierra el modal (no hace nada mientras se está enviando). */
  cerrarModal(): void {
    if (!this.enviando) {
      this.modalInstance?.hide();
    }
  }

  /** Valida el formulario y envía la creación o edición al backend. */
  guardar(): void {
    if (this.enviando) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorFormulario = 'Revisa los campos marcados en rojo.';
      return;
    }
    const valores = this.form.getRawValue();
    const datos: MedicamentoRq = {
      nombre: valores.nombre.trim(),
      presentacion: valores.presentacion.trim() || null,
      descripcion: valores.descripcion.trim() || null,
      fechaCompra: valores.fechaCompra,
      fechaVence: valores.fechaVence
    };
    const id = this.medicamentoSeleccionado?.id;
    const solicitud = id != null
      ? this.medicamentoService.actualizarMedicamento(id, datos)
      : this.medicamentoService.crearMedicamento(datos);

    this.enviando = true;
    this.errorFormulario = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.enviando = false)
    ).subscribe({
      next: (respuesta) => {
        this.enviando = false;
        this.cerrarModal();
        this.listar();
        void Swal.fire('Operación exitosa', respuesta.message, 'success');
      },
      error: (error) => {
        this.errorFormulario = obtenerMensajeError(error,
          'No fue posible guardar el medicamento. Revisa los datos e inténtalo de nuevo.');
      }
    });
  }

  /** Pide confirmación y activa o desactiva el medicamento. */
  async confirmarCambioEstado(medicamento: Medicamento): Promise<void> {
    if (this.cambiandoEstadoId !== null || medicamento.id == null) {
      return;
    }
    const id = medicamento.id;
    const nuevoEstado = !medicamento.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const confirmacion = await Swal.fire({
      title: `¿Deseas ${accion} este medicamento?`,
      text: medicamento.nombre,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed) {
      return;
    }
    this.cambiandoEstadoId = id;
    this.medicamentoService.cambiarEstado(id, nuevoEstado).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cambiandoEstadoId = null)
    ).subscribe({
      next: (respuesta) => {
        this.listar();
        void Swal.fire('Operación exitosa', respuesta.message, 'success');
      },
      error: (error) => {
        void Swal.fire('No se pudo cambiar el estado',
          obtenerMensajeError(error, 'Inténtalo de nuevo en unos minutos.'), 'warning');
      }
    });
  }

  /** Muestra el modal de Bootstrap (se crea la instancia la primera vez). */
  private abrirModal(): void {
    const elemento = document.getElementById('modalMedicamento');
    if (elemento) {
      this.modalInstance ??= new Modal(elemento, { backdrop: 'static', keyboard: false });
      this.modalInstance.show();
    }
  }

  /** Pasa a minúsculas y quita tildes para buscar sin distinguir acentos. */
  private normalizar(texto: string): string {
    return texto.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
