import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Barra inferior de un DataTable con paginación del servidor:
 * "Mostrando X a Y de Z", selector de tamaño y botones de página.
 */
@Component({
  selector: 'app-paginador',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
      <div class="d-flex align-items-center gap-2">
        <label class="mb-0 small">Mostrar</label>
        <select class="form-select form-select-sm w-auto" (change)="cambiarTamanio.emit(+$any($event.target).value)">
          <option *ngFor="let t of tamanios" [value]="t" [selected]="t === size">{{ t }}</option>
        </select>
        <span class="small text-muted">
          {{ total === 0 ? 'Sin registros' : 'Mostrando ' + desde + ' a ' + hasta + ' de ' + total }}
        </span>
      </div>
      <nav *ngIf="totalPages > 1" aria-label="Paginación">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="page === 0">
            <button type="button" class="page-link" (click)="irAPagina.emit(page - 1)">Anterior</button>
          </li>
          <li class="page-item" *ngFor="let p of paginasVisibles" [class.active]="p === page">
            <button type="button" class="page-link" (click)="irAPagina.emit(p)">{{ p + 1 }}</button>
          </li>
          <li class="page-item" [class.disabled]="page >= totalPages - 1">
            <button type="button" class="page-link" (click)="irAPagina.emit(page + 1)">Siguiente</button>
          </li>
        </ul>
      </nav>
    </div>
  `
})
export class PaginadorComponent {
  @Input() page = 0;
  @Input() size = 10;
  @Input() total = 0;
  @Input() totalPages = 0;
  @Input() tamanios: number[] = [5, 10, 25, 50];
  @Output() irAPagina = new EventEmitter<number>();
  @Output() cambiarTamanio = new EventEmitter<number>();

  /** Primer registro mostrado (base 1). */
  get desde(): number {
    return this.total === 0 ? 0 : this.page * this.size + 1;
  }

  /** Último registro mostrado. */
  get hasta(): number {
    return Math.min((this.page + 1) * this.size, this.total);
  }

  /** Ventana de hasta 5 páginas alrededor de la actual. */
  get paginasVisibles(): number[] {
    const inicio = Math.max(0, Math.min(this.page - 2, this.totalPages - 5));
    const fin = Math.min(this.totalPages, inicio + 5);
    return Array.from({ length: fin - inicio }, (_, i) => inicio + i);
  }
}
