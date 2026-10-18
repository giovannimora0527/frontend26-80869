import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { PageResponse } from 'src/app/models/page-response';

/** Formatos de celda soportados por la tabla. */
export type FormatoColumna = 'texto' | 'fecha' | 'hora' | 'fechaHora' | 'estado' | 'activo';

/**
 * Definición de una columna del DataTable.
 */
export interface ColumnaTabla {
  /** Propiedad de la fila que se muestra. */
  campo: string;
  /** Título de la columna. */
  titulo: string;
  /** Alias que entiende el backend para ordenar; si no existe, la columna no es ordenable. */
  ordenPor?: string;
  /** Formato de la celda (por defecto texto). */
  formato?: FormatoColumna;
  /** Máximo de caracteres a mostrar antes de truncar con "…". */
  max?: number;
}

/**
 * DataTable reutilizable con paginación, ordenamiento y estado de carga.
 * El filtrado, el orden y la paginación se hacen en el servidor: este componente
 * solo muestra los datos y emite los eventos del usuario.
 */
@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  templateUrl: './data-table.component.html'
})
export class DataTableComponent {
  /** Columnas a mostrar. */
  @Input() columnas: ColumnaTabla[] = [];
  /** Página de datos devuelta por el backend. */
  @Input() pagina: PageResponse<unknown> | null = null;
  /** Indica si se está consultando al backend. */
  @Input() cargando = false;
  /** Alias de la columna ordenada actualmente. */
  @Input() sortBy = '';
  /** Dirección del orden actual. */
  @Input() sortDir: 'asc' | 'desc' = 'desc';
  /** Plantilla con los botones de acción de cada fila (recibe la fila como contexto). */
  @Input() accionesTpl?: TemplateRef<unknown>;
  /** Mensaje cuando no hay registros. */
  @Input() mensajeVacio = 'No se encontraron registros.';
  /** Tamaños de página ofrecidos al usuario. */
  readonly tamanios = [5, 10, 25, 50];

  /** Emite el alias de la columna cuando el usuario pide ordenar. */
  @Output() ordenar = new EventEmitter<string>();
  /** Emite el número de página (base 0) cuando el usuario cambia de página. */
  @Output() cambioPagina = new EventEmitter<number>();
  /** Emite el nuevo tamaño de página. */
  @Output() cambioTamanio = new EventEmitter<number>();

  /**
   * Obtiene el valor de una propiedad de la fila.
   *
   * @param fila Fila de datos.
   * @param campo Nombre de la propiedad.
   * @returns Valor de la celda (texto, número, fecha o nulo).
   */
  valor(fila: unknown, campo: string): string | number | Date | null {
    return (fila as Record<string, string | number | Date | null>)[campo];
  }

  /**
   * Trunca un texto largo para que la tabla sea legible.
   *
   * @param valor Valor de la celda.
   * @param max Máximo de caracteres.
   * @returns Texto original o truncado con "…".
   */
  texto(valor: unknown, max?: number): string {
    const cadena = valor === null || valor === undefined ? '' : String(valor);
    return max && cadena.length > max ? cadena.substring(0, max) + '…' : cadena;
  }

  /**
   * Devuelve la hora recortada a HH:mm.
   *
   * @param valor Hora en formato HH:mm:ss.
   * @returns Hora en formato HH:mm.
   */
  hora(valor: unknown): string {
    return valor ? String(valor).substring(0, 5) : '';
  }

  /**
   * Clase de Bootstrap para el badge de un estado.
   *
   * @param estado Estado de la cita (PENDIENTE...CANCELADA) o de la historia (ACTIVA, CERRADA).
   * @returns Clases CSS.
   */
  claseEstado(estado: unknown): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-warning text-dark';
      case 'PROGRAMADA':
        return 'bg-info text-dark';
      case 'CONFIRMADA':
        return 'bg-primary';
      case 'ATENDIDA':
      case 'ACTIVA':
        return 'bg-success';
      case 'CANCELADA':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Números de página (base 0) que se muestran en el paginador: una ventana de 5.
   *
   * @returns Lista de páginas visibles.
   */
  get paginasVisibles(): number[] {
    if (!this.pagina) {
      return [];
    }
    const total = this.pagina.totalPages;
    const inicio = Math.max(0, Math.min(this.pagina.page - 2, total - 5));
    const fin = Math.min(total, inicio + 5);
    return Array.from({ length: fin - inicio }, (_, i) => inicio + i);
  }

  /** @returns Primer registro mostrado (base 1). */
  get desde(): number {
    return this.pagina && this.pagina.totalElements > 0 ? this.pagina.page * this.pagina.size + 1 : 0;
  }

  /** @returns Último registro mostrado. */
  get hasta(): number {
    return this.pagina ? Math.min((this.pagina.page + 1) * this.pagina.size, this.pagina.totalElements) : 0;
  }

  /**
   * Pide cambiar de página si está dentro del rango.
   *
   * @param pagina Página destino (base 0).
   */
  irAPagina(pagina: number): void {
    if (this.pagina && pagina >= 0 && pagina < this.pagina.totalPages && pagina !== this.pagina.page) {
      this.cambioPagina.emit(pagina);
    }
  }

  /**
   * Notifica el nuevo tamaño de página elegido en el selector.
   *
   * @param evento Evento change del select.
   */
  alCambiarTamanio(evento: Event): void {
    this.cambioTamanio.emit(Number((evento.target as HTMLSelectElement).value));
  }
}
