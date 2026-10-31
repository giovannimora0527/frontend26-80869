import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { Cliente } from 'src/app/models/cliente';
import { ClienteRq } from 'src/app/models/cliente-rq';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { fechaLocalISO, fechaNoFutura } from 'src/app/utils/validadores';
import { ClienteService } from './service/cliente.service';

/** Opciones del filtro por estado del listado. */
type FiltroEstado = 'todos' | 'activos' | 'inactivos';

/**
 * Pantalla de gestión de clientes: listar, buscar, crear, editar y activar/desactivar.
 *
 * Los clientes nunca se borran: al desactivarlos se conserva su información (mascotas,
 * citas e historias) y el backend impide desactivar a quien tiene citas por delante.
 * Las reglas críticas se validan en el backend; aquí solo se reflejan en el formulario.
 */
@Component({
  selector: 'app-cliente',
  imports: [CommonModule, ReactiveFormsModule, PaginacionComponent],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);

  /** Tipos de documento que acepta el backend. */
  readonly tiposDocumento = [
    { valor: 'CC', etiqueta: 'CC - Cédula de Ciudadanía' },
    { valor: 'CE', etiqueta: 'CE - Cédula de Extranjería' },
    { valor: 'TI', etiqueta: 'TI - Tarjeta de Identidad' },
    { valor: 'PA', etiqueta: 'PA - Pasaporte' }
  ] as const;

  /** Opciones de género (el campo es opcional). */
  readonly generos = [
    { valor: 'M', etiqueta: 'Masculino' },
    { valor: 'F', etiqueta: 'Femenino' },
    { valor: 'O', etiqueta: 'Otro' }
  ] as const;

  /** Fecha de hoy (`AAAA-MM-DD`), usada como máximo del campo fecha de nacimiento. */
  readonly hoy = fechaLocalISO();

  /** Formulario reactivo de creación y edición. */
  readonly form = this.formBuilder.nonNullable.group({
    tipoDocumento: ['', Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,20}$/)]],
    nombres: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    fechaNacimiento: ['', [Validators.required, fechaNoFutura]],
    genero: [''],
    telefono: ['', Validators.pattern(/^[0-9+\-\s]{7,20}$/)],
    direccion: ['', Validators.maxLength(500)]
  });

  /** Mensajes de error por campo y tipo de validación. */
  private readonly mensajes: Record<string, Record<string, string>> = {
    tipoDocumento: { required: 'Selecciona un tipo de documento.' },
    numeroDocumento: {
      required: 'El número de documento es obligatorio.',
      pattern: 'Usa entre 5 y 20 letras o números, sin espacios ni símbolos.'
    },
    nombres: {
      required: 'Los nombres son obligatorios.',
      pattern: 'Los nombres no pueden contener solo espacios.',
      maxlength: 'Máximo 100 caracteres.'
    },
    apellidos: {
      required: 'Los apellidos son obligatorios.',
      pattern: 'Los apellidos no pueden contener solo espacios.',
      maxlength: 'Máximo 100 caracteres.'
    },
    fechaNacimiento: {
      required: 'La fecha de nacimiento es obligatoria.',
      fechaFutura: 'La fecha de nacimiento no puede ser futura.'
    },
    telefono: { pattern: 'Usa entre 7 y 20 caracteres (números, +, - o espacios).' },
    direccion: { maxlength: 'Máximo 500 caracteres.' }
  };

  /** Clientes recibidos del backend. */
  clientes: Cliente[] = [];
  /** Cliente que se está editando; `null` cuando se crea uno nuevo. */
  clienteSeleccionado: Cliente | null = null;

  /** `true` mientras se carga el listado. */
  cargando = false;
  /** `true` mientras se envía el formulario (evita doble envío). */
  enviando = false;
  /** Identificador del cliente cuyo estado se está cambiando (bloquea su botón). */
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

  /** Carga el listado de clientes desde el backend. */
  listar(): void {
    this.cargando = true;
    this.errorListado = '';
    this.clienteService.listarClientes().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (data) => {
        this.clientes = data;
        this.paginaActual = Math.min(this.paginaActual, Math.max(1, this.totalPaginas));
      },
      error: (error) => {
        this.errorListado = obtenerMensajeError(error, 'No fue posible cargar los clientes.');
      }
    });
  }

  /** Clientes que cumplen el filtro de estado y el texto de búsqueda. */
  get clientesFiltrados(): Cliente[] {
    const termino = this.normalizar(this.terminoBusqueda.trim());
    return this.clientes.filter((cliente) => {
      if (this.filtroEstado === 'activos' && !cliente.activo) {
        return false;
      }
      if (this.filtroEstado === 'inactivos' && cliente.activo) {
        return false;
      }
      if (!termino) {
        return true;
      }
      const texto = [cliente.nombres, cliente.apellidos, cliente.tipoDocumento,
        cliente.numeroDocumento, cliente.telefono]
        .map((valor) => this.normalizar(String(valor ?? '')))
        .join(' ');
      return texto.includes(termino);
    });
  }

  /** Clientes de la página actual. */
  get clientesPaginados(): Cliente[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.clientesFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Total de páginas según los clientes filtrados. */
  get totalPaginas(): number {
    return Math.ceil(this.clientesFiltrados.length / this.registrosPorPagina);
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

  /** Nombre completo para mostrar en la tabla. */
  nombreCompleto(cliente: Cliente): string {
    return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim();
  }

  /** `true` si el campo fue tocado y no es válido (para marcarlo en rojo). */
  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.touched && control.invalid;
  }

  /** Mensaje de error del campo, o texto vacío si no hay error. */
  mensajeError(campo: string): string {
    const errores = this.form.get(campo)?.errors;
    if (!errores || !this.invalido(campo)) {
      return '';
    }
    return this.mensajes[campo]?.[Object.keys(errores)[0]] ?? 'El dato no es válido.';
  }

  /** Abre el modal para crear un cliente nuevo. */
  abrirCreacion(): void {
    if (this.enviando) {
      return;
    }
    this.clienteSeleccionado = null;
    this.form.reset({ tipoDocumento: '', genero: '' });
    this.errorFormulario = '';
    this.titleModal = 'Crear cliente';
    this.titleBoton = 'Guardar cliente';
    this.abrirModal();
  }

  /** Abre el modal con los datos del cliente para editarlo. */
  abrirEdicion(cliente: Cliente): void {
    if (this.enviando) {
      return;
    }
    this.clienteSeleccionado = cliente;
    this.errorFormulario = '';
    this.form.reset({
      tipoDocumento: cliente.tipoDocumento ?? '',
      numeroDocumento: cliente.numeroDocumento ?? '',
      nombres: cliente.nombres ?? '',
      apellidos: cliente.apellidos ?? '',
      fechaNacimiento: typeof cliente.fechaNacimiento === 'string' ? cliente.fechaNacimiento.substring(0, 10) : '',
      genero: cliente.genero ?? '',
      telefono: cliente.telefono ?? '',
      direccion: cliente.direccion ?? ''
    });
    this.titleModal = 'Editar cliente';
    this.titleBoton = 'Actualizar cliente';
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
    const datos: ClienteRq = {
      tipoDocumento: valores.tipoDocumento,
      numeroDocumento: valores.numeroDocumento.trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      fechaNacimiento: valores.fechaNacimiento,
      genero: valores.genero || null,
      telefono: valores.telefono.trim() || null,
      direccion: valores.direccion.trim() || null
    };
    const id = this.clienteSeleccionado?.id;
    const solicitud = id != null
      ? this.clienteService.actualizarCliente(id, datos)
      : this.clienteService.crearCliente(datos);

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
          'No fue posible guardar el cliente. Revisa los datos e inténtalo de nuevo.');
      }
    });
  }

  /** Pide confirmación y activa o desactiva al cliente. */
  async confirmarCambioEstado(cliente: Cliente): Promise<void> {
    if (this.cambiandoEstadoId !== null || cliente.id == null) {
      return;
    }
    const id = cliente.id;
    const nuevoEstado = !cliente.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const confirmacion = await Swal.fire({
      title: `¿Deseas ${accion} este cliente?`,
      text: this.nombreCompleto(cliente),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed) {
      return;
    }
    this.cambiandoEstadoId = id;
    this.clienteService.cambiarEstado(id, nuevoEstado).pipe(
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
    const elemento = document.getElementById('modalCliente');
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
