import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Cita } from 'src/app/models/cita';

type VistaCalendario = 'Día' | 'Semana' | 'Mes';

interface DiaCalendario {
  fecha: Date;
  citas: Cita[];
}

@Component({
  selector: 'app-calendario-citas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mb-4" aria-labelledby="titulo-calendario">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h2 id="titulo-calendario" class="h5 me-auto mb-0">
          Calendario de citas
        </h2>

        <div class="btn-group" role="group" aria-label="Vista del calendario">
          <button *ngFor="let opcion of vistas"
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  [class.active]="vista === opcion"
                  [attr.aria-pressed]="vista === opcion"
                  (click)="cambiarVista(opcion)">
            {{ opcion }}
          </button>
        </div>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <button type="button" class="btn btn-sm btn-outline-secondary"
                (click)="mover(-1)" aria-label="Periodo anterior">
          ‹ Anterior
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary"
                (click)="irAHoy()">Hoy</button>
        <button type="button" class="btn btn-sm btn-outline-secondary"
                (click)="mover(1)" aria-label="Periodo siguiente">
          Siguiente ›
        </button>
        <strong class="ms-1" aria-live="polite">{{ tituloPeriodo }}</strong>
      </div>

      <div class="cal-scroll">
        <div class="cal-grid" [class.un-dia]="vista === 'Día'">
          <article *ngFor="let dia of dias"
                   class="cal-dia"
                   [class.fuera-mes]="vista === 'Mes' && dia.fecha.getMonth() !== referencia.getMonth()">
            <button type="button" class="cal-fecha"
                    [attr.aria-label]="'Ver citas del ' + fechaCompleta(dia.fecha)"
                    (click)="abrirDia(dia.fecha)">
              {{ fechaCorta(dia.fecha) }}
            </button>

            <p *ngIf="vista === 'Día' && dia.citas.length === 0"
               class="small text-secondary mt-2 mb-0">
              Sin citas para este día.
            </p>

            <button *ngFor="let cita of dia.citas"
                    type="button" class="cal-cita"
                    [attr.data-estado]="(cita.estado || '').trim().toLowerCase()"
                    (click)="verDetalle.emit(cita)">
              <strong>{{ cita.fechaHora | date:'HH:mm' }} – {{ horaFin(cita) }}</strong>
              <span>{{ cita.mascota?.nombreMascota || cita.mascota?.nombre || 'Mascota' }}</span>
              <small>{{ cita.estado | uppercase }}</small>
            </button>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cal-scroll { overflow-x: auto; }
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(112px, 1fr));
      gap: 1px;
      min-width: 790px;
      padding: 1px;
      background: #dce2e7;
    }
    .cal-grid.un-dia { grid-template-columns: 1fr; min-width: 0; }
    .cal-dia { min-height: 78px; padding: 6px; background: white; }
    .fuera-mes { background: #f4f6f8; }
    .cal-fecha {
      border: 0; background: transparent; color: #34495e;
      font-weight: 600; padding: 2px 4px;
    }
    .cal-cita {
      display: grid; width: 100%; margin-top: 4px; padding: 5px 7px;
      text-align: left; border: 0; border-left: 4px solid #667085;
      border-radius: 4px; background: #f1f3f5; color: #17212b;
      overflow-wrap: anywhere;
    }
    .cal-cita[data-estado="programada"],
    .cal-cita[data-estado="pendiente"] { border-color: #ab7300; background: #fff4d6; }
    .cal-cita[data-estado="confirmada"] { border-color: #087956; background: #dcf5e8; }
    .cal-cita[data-estado="cancelada"] { border-color: #b32d40; background: #fde5e8; }
    .cal-cita[data-estado="atendida"],
    .cal-cita[data-estado="finalizada"] { border-color: #315fb5; background: #e5edff; }
  `]
})
export class CalendarioCitasComponent {
  @Output() verDetalle = new EventEmitter<Cita>();

  readonly vistas: VistaCalendario[] = ['Día', 'Semana', 'Mes'];
  vista: VistaCalendario = 'Mes';
  referencia = new Date();
  dias: DiaCalendario[] = [];
  tituloPeriodo = '';

  private registros: Cita[] = [];

  private readonly formatoCorto = new Intl.DateTimeFormat('es-CO', {
    weekday: 'short', day: 'numeric'
  });

  private readonly formatoLargo = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  private readonly formatoMes = new Intl.DateTimeFormat('es-CO', {
    month: 'long', year: 'numeric'
  });

  @Input()
  set citas(valor: Cita[]) {
    this.registros = valor || [];
    this.actualizar();
  }

  cambiarVista(vista: VistaCalendario): void {
    this.vista = vista;
    this.actualizar();
  }

  abrirDia(fecha: Date): void {
    this.referencia = new Date(fecha.getTime());
    this.cambiarVista('Día');
  }

  irAHoy(): void {
    this.referencia = new Date();
    this.actualizar();
  }

  mover(paso: number): void {
    const fecha = new Date(this.referencia.getTime());

    if (this.vista === 'Mes') {
      fecha.setDate(1);
      fecha.setMonth(fecha.getMonth() + paso);
    } else {
      fecha.setDate(fecha.getDate() + paso * (this.vista === 'Semana' ? 7 : 1));
    }

    this.referencia = fecha;
    this.actualizar();
  }

  fechaCorta(fecha: Date): string {
    return this.formatoCorto.format(fecha);
  }

  fechaCompleta(fecha: Date): string {
    return this.formatoLargo.format(fecha);
  }

  horaFin(cita: Cita): string {
    const fin = new Date(cita.fechaHora);
    fin.setMinutes(fin.getMinutes() + 15);
    return fin.toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
  }

  private actualizar(): void {
    const inicio = new Date(this.referencia.getTime());
    inicio.setHours(0, 0, 0, 0);
    let cantidadDias = 1;

    if (this.vista === 'Mes') {
      inicio.setDate(1);
      const diasDelMes = new Date(
        inicio.getFullYear(), inicio.getMonth() + 1, 0
      ).getDate();
      const diasPrevios = (inicio.getDay() + 6) % 7;
      inicio.setDate(1 - diasPrevios);
      cantidadDias = Math.ceil((diasPrevios + diasDelMes) / 7) * 7;
    } else if (this.vista === 'Semana') {
      inicio.setDate(inicio.getDate() - (inicio.getDay() + 6) % 7);
      cantidadDias = 7;
    }

    const dias: DiaCalendario[] = [];
    const porFecha = new Map<string, DiaCalendario>();

    for (let i = 0; i < cantidadDias; i++) {
      const fecha = new Date(inicio.getTime());
      fecha.setDate(inicio.getDate() + i);
      const dia = { fecha, citas: [] as Cita[] };
      dias.push(dia);
      porFecha.set(fecha.toDateString(), dia);
    }

    for (const cita of this.registros) {
      if (!cita.fechaHora) continue;
      const fecha = new Date(cita.fechaHora);
      porFecha.get(fecha.toDateString())?.citas.push(cita);
    }

    for (const dia of dias) {
      dia.citas.sort((a, b) =>
        new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
      );
    }

    this.dias = dias;
    if (this.vista === 'Mes') {
      this.tituloPeriodo = this.formatoMes.format(this.referencia);
    } else if (this.vista === 'Semana') {
      this.tituloPeriodo = this.fechaCompleta(inicio) + ' – '
        + this.fechaCompleta(dias[dias.length - 1].fecha);
    } else {
      this.tituloPeriodo = this.fechaCompleta(inicio);
    }
  }
}