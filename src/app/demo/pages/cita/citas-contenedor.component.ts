import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CitaComponent } from './cita.component';
import { CalendarioComponent } from '../calendario/calendario.component';

type PestanaCitas = 'lista' | 'calendario';

/**
 * Contenedor del modulo de citas con dos pestanas:
 *   - Lista: el modulo de gestion de citas (tabla, crear y editar).
 *   - Calendario: la vista de calendario (FullCalendar).
 *
 * Unifica ambos en una sola pantalla para evitar menus duplicados.
 */
@Component({
  selector: 'app-citas-contenedor',
  standalone: true,
  imports: [CommonModule, CitaComponent, CalendarioComponent],
  templateUrl: './citas-contenedor.component.html'
})
export class CitasContenedorComponent {
  pestana: PestanaCitas = 'lista';
}
