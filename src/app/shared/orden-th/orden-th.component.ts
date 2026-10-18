import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Encabezado de columna ordenable (se usa dentro de un `<th>`).
 * Muestra la flecha de la dirección cuando la columna es la ordenada.
 */
@Component({
  selector: 'app-orden-th',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" class="btn btn-link p-0 text-decoration-none text-reset fw-bold" (click)="ordenar.emit(columna)">
      {{ etiqueta }}
      <span class="ms-1 small">
        <ng-container *ngIf="sortBy === columna; else neutro">{{ sortDir === 'asc' ? '▲' : '▼' }}</ng-container>
        <ng-template #neutro><span class="text-muted">⇅</span></ng-template>
      </span>
    </button>
  `
})
export class OrdenThComponent {
  @Input() etiqueta = '';
  @Input() columna = '';
  @Input() sortBy = '';
  @Input() sortDir: 'asc' | 'desc' = 'asc';
  @Output() ordenar = new EventEmitter<string>();
}
