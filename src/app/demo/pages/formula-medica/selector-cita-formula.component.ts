import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface CitaParaFormula {
  id: number;
  mascota: string;
  propietario: string;
  fechaHora: string;
}

@Component({
  selector: 'app-selector-cita-formula',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label for="buscar-cita-formula" class="form-label">
      Buscar por mascota o propietario
    </label>
    <input id="buscar-cita-formula"
           type="search"
           class="form-control mb-2"
           placeholder="Ej. Max"
           [(ngModel)]="busqueda"
           [ngModelOptions]="{standalone: true}"
           [disabled]="cargando || !!error" />

    <label for="cita-atendida-formula" class="form-label">Cita atendida</label>
    <select id="cita-atendida-formula"
            class="form-select"
            [ngModel]="citaId"
            (ngModelChange)="seleccionar($event)"
            [ngModelOptions]="{standalone: true}"
            [disabled]="cargando || !!error">
      <option [ngValue]="null">Selecciona una cita</option>

      @if (citaId !== null && !seleccionVisible) {
        <option [ngValue]="citaId">
          {{ etiquetaSeleccionada }}
        </option>
      }

      @for (cita of filtradas; track cita.id) {
        <option [ngValue]="cita.id">
          {{ cita.mascota }} · {{ cita.fechaHora }} · {{ cita.propietario }}
        </option>
      }
    </select>

    @if (cargando) {
      <small role="status">Cargando citas atendidas…</small>
    } @else if (error) {
      <p role="alert" class="text-danger mb-1">{{ error }}</p>
      <button type="button" class="btn btn-outline-secondary btn-sm"
              (click)="cargar()">Reintentar</button>
    } @else if (citas.length === 0) {
      <small class="text-secondary">No hay citas atendidas disponibles para tu cuenta.</small>
    } @else if (filtradas.length === 0) {
      <small class="text-secondary">Ninguna cita coincide con la búsqueda.</small>
    }
  `
})
export class SelectorCitaFormulaComponent implements OnInit {
  @Input() citaId: number | null = null;
  @Output() citaIdChange = new EventEmitter<number | null>();

  citas: CitaParaFormula[] = [];
  busqueda = '';
  cargando = false;
  error = '';

  constructor(private readonly backend: BackendService) {}

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    if (this.cargando) return;
    this.cargando = true;
    this.error = '';

    try {
      this.citas = await firstValueFrom(
        this.backend.get<CitaParaFormula[]>(
          environment.apiUrlAuth, 'formula-medica', 'citas-atendidas'
        )
      );
    } catch {
      this.error = 'No se pudieron cargar las citas atendidas.';
    } finally {
      this.cargando = false;
    }
  }

  get filtradas(): CitaParaFormula[] {
    const termino = this.normalizar(this.busqueda.trim());
    if (!termino) return this.citas;

    return this.citas.filter(cita =>
      this.normalizar(cita.mascota + ' ' + cita.propietario).includes(termino)
    );
  }

  get seleccionVisible(): boolean {
    return this.filtradas.some(cita => cita.id === this.citaId);
  }

  get etiquetaSeleccionada(): string {
    const cita = this.citas.find(item => item.id === this.citaId);

    return cita
      ? cita.mascota + ' · ' + cita.fechaHora + ' · ' + cita.propietario
      : 'Cita vinculada a esta fórmula (#' + this.citaId + ')';
  }

  seleccionar(id: number | null): void {
    this.citaId = id;
    this.citaIdChange.emit(id);
  }

  private normalizar(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}