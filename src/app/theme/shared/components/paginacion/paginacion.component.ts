import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Barra de paginación reutilizable (Bootstrap).
 *
 * Solo muestra los botones y avisa cuando el usuario elige otra página; el
 * componente que la usa decide qué datos mostrar. Las páginas se cuentan desde 1.
 *
 * Uso: `<app-paginacion [paginaActual]="pagina" [totalPaginas]="total" (paginaCambiada)="cambiar($event)" />`
 */
@Component({
  selector: 'app-paginacion',
  imports: [CommonModule],
  template: `
    <nav *ngIf="totalPaginas > 1" aria-label="Paginación">
      <ul class="pagination justify-content-end mb-0">
        <li class="page-item" [class.disabled]="paginaActual === 1">
          <button class="page-link" type="button" [disabled]="paginaActual === 1"
            (click)="cambiar(paginaActual - 1)">Anterior</button>
        </li>
        <li class="page-item" *ngFor="let pagina of paginasVisibles" [class.active]="pagina === paginaActual">
          <button class="page-link" type="button"
            [attr.aria-current]="pagina === paginaActual ? 'page' : null"
            (click)="cambiar(pagina)">{{ pagina }}</button>
        </li>
        <li class="page-item" [class.disabled]="paginaActual === totalPaginas">
          <button class="page-link" type="button" [disabled]="paginaActual === totalPaginas"
            (click)="cambiar(paginaActual + 1)">Siguiente</button>
        </li>
      </ul>
    </nav>
  `
})
export class PaginacionComponent {
  /** Página que se está mostrando (empieza en 1). */
  @Input() paginaActual = 1;

  /** Cantidad total de páginas disponibles. */
  @Input() totalPaginas = 1;

  /** Máximo de números de página visibles a la vez. */
  @Input() maximoVisibles = 5;

  /** Se emite con el número de página elegido por el usuario. */
  @Output() paginaCambiada = new EventEmitter<number>();

  /**
   * Números de página a mostrar: una ventana centrada en la página actual.
   * @returns lista de números de página visibles.
   */
  get paginasVisibles(): number[] {
    const cantidad = Math.min(this.maximoVisibles, this.totalPaginas);
    let inicio = Math.max(1, this.paginaActual - Math.floor(cantidad / 2));
    inicio = Math.min(inicio, this.totalPaginas - cantidad + 1);
    return Array.from({ length: cantidad }, (_, i) => inicio + i);
  }

  /**
   * Avisa al componente padre que se eligió otra página (solo si es válida).
   * @param pagina número de página elegido.
   */
  cambiar(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.paginaActual) {
      this.paginaCambiada.emit(pagina);
    }
  }
}
