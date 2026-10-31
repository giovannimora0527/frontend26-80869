import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { Usuario } from 'src/app/models/usuario';
import { UsuarioRq } from 'src/app/models/usuario-rq';
import { AuthService } from 'src/app/services/auth.service';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { UsuarioService } from './service/usuario.service';

/** Opciones del filtro por estado del listado. */
type FiltroEstado = 'todos' | 'activos' | 'inactivos';

/** Largo mínimo de la contraseña (igual que en el backend). */
const PASSWORD_MIN = 6;

/**
 * Pantalla de gestión de usuarios: listar, buscar, crear, editar y activar/desactivar.
 *
 * Los usuarios nunca se borran: al desactivarlos pierden el acceso pero se conserva su
 * información. El backend impide desactivar o cambiar de perfil al último administrador
 * activo; aquí solo se reflejan esas reglas en el formulario y en los mensajes.
 */
@Component({
  selector: 'app-usuario',
  imports: [CommonModule, ReactiveFormsModule, PaginacionComponent],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);

  /** Perfiles disponibles (ids definidos en la tabla `perfil`). */
  readonly perfiles = [
    { valor: 1, etiqueta: 'Administrador' },
    { valor: 2, etiqueta: 'Recepción' },
    { valor: 3, etiqueta: 'Médico' }
  ] as const;

  /** Id del usuario que tiene la sesión abierta (no puede desactivarse a sí mismo). */
  readonly usuarioActualId: number | null = this.authService.getUsuario()?.id ?? null;

  /** Formulario reactivo de creación y edición. */
  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.pattern(/^\S+$/), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/), Validators.maxLength(255)]],
    rol: [0, Validators.min(1)],
    password: [''],
    confirmarPassword: ['']
  }, { validators: [this.contrasenasCoinciden] });

  /** Mensajes de error por campo y tipo de validación. */
  private readonly mensajes: Record<string, Record<string, string>> = {
    username: {
      required: 'El nombre de usuario es obligatorio.',
      pattern: 'El nombre de usuario no puede tener espacios.',
      maxlength: 'Máximo 50 caracteres.'
    },
    email: {
      required: 'El correo electrónico es obligatorio.',
      pattern: 'Escribe un correo válido (ejemplo: nombre@dominio.com).',
      maxlength: 'Máximo 255 caracteres.'
    },
    rol: { min: 'Selecciona un perfil.' },
    password: {
      required: 'La contraseña es obligatoria.',
      minlength: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`
    },
    confirmarPassword: {
      required: 'Confirma la contraseña.',
      noCoincide: 'Las contraseñas no coinciden.'
    }
  };

  /** Usuarios recibidos del backend. */
  usuarios: Usuario[] = [];
  /** Usuario que se está editando; `null` cuando se crea uno nuevo. */
  usuarioSeleccionado: Usuario | null = null;

  /** `true` mientras se carga el listado. */
  cargando = false;
  /** `true` mientras se envía el formulario (evita doble envío). */
  enviando = false;
  /** Identificador del usuario cuyo estado se está cambiando (bloquea su botón). */
  cambiandoEstadoId: number | null = null;
  /** Mensaje de error del listado. */
  errorListado = '';
  /** Mensaje de error del formulario (incluye los que envía el backend). */
  errorFormulario = '';
  /** `true` para mostrar la contraseña en texto plano en el formulario. */
  verPassword = false;

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

  /** `true` si se está editando un usuario (la contraseña pasa a ser opcional). */
  get editando(): boolean {
    return this.usuarioSeleccionado?.id != null;
  }

  /** Carga el listado de usuarios desde el backend. */
  listar(): void {
    this.cargando = true;
    this.errorListado = '';
    this.usuarioService.getUsuarios().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.paginaActual = Math.min(this.paginaActual, Math.max(1, this.totalPaginas));
      },
      error: (error) => {
        this.errorListado = obtenerMensajeError(error, 'No fue posible cargar los usuarios.');
      }
    });
  }

  /** Usuarios que cumplen el filtro de estado y el texto de búsqueda. */
  get usuariosFiltrados(): Usuario[] {
    const termino = this.normalizar(this.terminoBusqueda.trim());
    return this.usuarios.filter((usuario) => {
      if (this.filtroEstado === 'activos' && !usuario.activo) {
        return false;
      }
      if (this.filtroEstado === 'inactivos' && usuario.activo) {
        return false;
      }
      if (!termino) {
        return true;
      }
      const texto = [usuario.username, usuario.email, usuario.perfil]
        .map((valor) => this.normalizar(String(valor ?? '')))
        .join(' ');
      return texto.includes(termino);
    });
  }

  /** Usuarios de la página actual. */
  get usuariosPaginados(): Usuario[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.usuariosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Total de páginas según los usuarios filtrados. */
  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.registrosPorPagina);
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

  /** Color de la insignia según el perfil. */
  claseBadgePerfil(rol?: number): string {
    switch (rol) {
      case 1: return 'bg-primary';
      case 2: return 'bg-info';
      case 3: return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }

  /** `true` si el campo fue tocado y no es válido (para marcarlo en rojo). */
  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    if (!control || !control.touched) {
      return false;
    }
    const noCoincide = campo === 'confirmarPassword' && this.form.hasError('noCoincide');
    return control.invalid || noCoincide;
  }

  /** Mensaje de error del campo, o texto vacío si no hay error. */
  mensajeError(campo: string): string {
    if (!this.invalido(campo)) {
      return '';
    }
    const errores = this.form.get(campo)?.errors
      ?? (campo === 'confirmarPassword' ? { noCoincide: true } : null);
    if (!errores) {
      return '';
    }
    return this.mensajes[campo]?.[Object.keys(errores)[0]] ?? 'El dato no es válido.';
  }

  /** Abre el modal para crear un usuario nuevo. */
  abrirCreacion(): void {
    if (this.enviando) {
      return;
    }
    this.usuarioSeleccionado = null;
    this.form.reset({ rol: 0 });
    this.configurarContrasena(true);
    this.errorFormulario = '';
    this.verPassword = false;
    this.titleModal = 'Crear usuario';
    this.titleBoton = 'Guardar usuario';
    this.abrirModal();
  }

  /** Abre el modal con los datos del usuario para editarlo. */
  abrirEdicion(usuario: Usuario): void {
    if (this.enviando) {
      return;
    }
    this.usuarioSeleccionado = usuario;
    this.errorFormulario = '';
    this.verPassword = false;
    this.form.reset({
      username: usuario.username ?? '',
      email: usuario.email ?? '',
      rol: usuario.rol ?? 0,
      password: '',
      confirmarPassword: ''
    });
    this.configurarContrasena(false);
    this.titleModal = 'Editar usuario';
    this.titleBoton = 'Actualizar usuario';
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
    const datos: UsuarioRq = {
      username: valores.username.trim(),
      email: valores.email.trim(),
      rol: Number(valores.rol),
      password: valores.password ? valores.password : null
    };
    const id = this.usuarioSeleccionado?.id;
    const solicitud = id != null
      ? this.usuarioService.actualizarUsuario(id, datos)
      : this.usuarioService.crearUsuario(datos);

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
          'No fue posible guardar el usuario. Revisa los datos e inténtalo de nuevo.');
      }
    });
  }

  /** Pide confirmación y activa o desactiva al usuario. */
  async confirmarCambioEstado(usuario: Usuario): Promise<void> {
    if (this.cambiandoEstadoId !== null || usuario.id == null || this.esUsuarioActual(usuario)) {
      return;
    }
    const id = usuario.id;
    const nuevoEstado = !usuario.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const confirmacion = await Swal.fire({
      title: `¿Deseas ${accion} este usuario?`,
      text: usuario.username,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed) {
      return;
    }
    this.cambiandoEstadoId = id;
    this.usuarioService.cambiarEstado(id, nuevoEstado).pipe(
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

  /** `true` si el usuario de la fila es quien tiene la sesión abierta. */
  esUsuarioActual(usuario: Usuario): boolean {
    return this.usuarioActualId !== null && usuario.id === this.usuarioActualId;
  }

  /**
   * Ajusta las validaciones de la contraseña: obligatoria al crear;
   * al editar solo se valida si el usuario escribe una nueva.
   */
  private configurarContrasena(obligatoria: boolean): void {
    const password = this.form.controls.password;
    const confirmar = this.form.controls.confirmarPassword;
    password.setValidators(obligatoria
      ? [Validators.required, Validators.minLength(PASSWORD_MIN)]
      : [Validators.minLength(PASSWORD_MIN)]);
    confirmar.setValidators(obligatoria ? [Validators.required] : []);
    password.updateValueAndValidity();
    confirmar.updateValueAndValidity();
  }

  /** Error a nivel de formulario cuando "confirmar contraseña" no es igual a la contraseña. */
  private contrasenasCoinciden(grupo: AbstractControl): ValidationErrors | null {
    const password = grupo.get('password')?.value ?? '';
    const confirmar = grupo.get('confirmarPassword')?.value ?? '';
    return password === confirmar ? null : { noCoincide: true };
  }

  /** Muestra el modal de Bootstrap (se crea la instancia la primera vez). */
  private abrirModal(): void {
    const elemento = document.getElementById('modalUsuario');
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
