import { Observable, Subject, Subscription, debounceTime } from 'rxjs';
import { Pagina, ParametrosPagina } from '../models/pagina';
import { mensajeDeError } from './error.util';

/**
 * Lógica común de un DataTable con paginación, filtros y orden **en el servidor**.
 *
 * Cada pantalla solo indica cómo consultar (`consultar`) y qué filtro usa; esta clase se encarga de:
 * página actual, tamaño, orden, estado de carga, mensaje de error, "sin resultados" y debounce de filtros.
 * Una respuesta vieja nunca pisa a una más reciente (se cancela la petición anterior).
 *
 * @typeParam T fila del listado
 * @typeParam F objeto de filtros
 */
export abstract class TablaServidor<T, F extends object> {
  filas: T[] = [];
  cargando = false;
  error = '';
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;
  sortBy = '';
  sortDir: 'asc' | 'desc' = 'desc';
  readonly tamanios = [5, 10, 25, 50];

  /** Filtros actuales (enlazados al formulario de filtros). */
  abstract filtro: F;

  private peticion?: Subscription;
  private readonly cambiosTexto = new Subject<void>();
  private readonly suscripcionTexto: Subscription;

  protected constructor(protected readonly ordenInicial: { sortBy: string; sortDir: 'asc' | 'desc' }) {
    this.sortBy = ordenInicial.sortBy;
    this.sortDir = ordenInicial.sortDir;
    this.suscripcionTexto = this.cambiosTexto.pipe(debounceTime(350)).subscribe(() => this.buscar());
  }

  /** Llama al backend con la paginación recibida y el filtro actual. */
  protected abstract consultar(pagina: ParametrosPagina): Observable<Pagina<T>>;

  /** Recarga la página actual. */
  cargar(): void {
    this.peticion?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.peticion = this.consultar({ page: this.page, size: this.size, sortBy: this.sortBy, sortDir: this.sortDir })
      .subscribe({
        next: (r) => {
          this.filas = r.content;
          this.totalElements = r.totalElements;
          this.totalPages = r.totalPages;
          this.cargando = false;
        },
        error: (e) => {
          this.filas = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.cargando = false;
          this.error = mensajeDeError(e, 'No se pudo cargar el listado.');
        }
      });
  }

  /** Aplica filtros: vuelve a la primera página. */
  buscar(): void {
    this.page = 0;
    this.cargar();
  }

  /** Para campos de texto: espera a que el usuario deje de escribir antes de consultar. */
  buscarConRetraso(): void {
    this.cambiosTexto.next();
  }

  /** Quita todos los filtros y restablece el orden inicial. */
  limpiar(filtroVacio: F): void {
    this.filtro = filtroVacio;
    this.sortBy = this.ordenInicial.sortBy;
    this.sortDir = this.ordenInicial.sortDir;
    this.buscar();
  }

  /** Cambia de página (índice base 0). */
  irAPagina(p: number): void {
    if (p < 0 || (this.totalPages > 0 && p >= this.totalPages) || p === this.page) {
      return;
    }
    this.page = p;
    this.cargar();
  }

  /** Cambia el tamaño de página. */
  cambiarTamanio(n: number): void {
    this.size = Number(n);
    this.buscar();
  }

  /** Ordena por una columna; si ya estaba ordenada invierte la dirección. */
  ordenar(columna: string): void {
    if (this.sortBy === columna) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = columna;
      this.sortDir = 'asc';
    }
    this.buscar();
  }

  /** Libera suscripciones; llamar desde `ngOnDestroy`. */
  destruir(): void {
    this.peticion?.unsubscribe();
    this.suscripcionTexto.unsubscribe();
  }
}
