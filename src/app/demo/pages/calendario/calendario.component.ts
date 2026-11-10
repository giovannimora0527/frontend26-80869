import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

import { CalendarioService, CitaCalendario } from './service/calendario.service';
import { getJwtRol } from 'src/app/utils/jwt.util';

/**
 * Pantalla de calendario de citas con FullCalendar (vista mensual, semanal y
 * diaria).
 *
 * Un medico ve unicamente sus citas; recepcion y administrador ven todas. Al
 * hacer clic en una cita se muestran sus datos y las acciones disponibles
 * (confirmar, atender, reprogramar, cancelar). Incluye la descarga del reporte
 * en Excel del rango visible.
 */
@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.scss'
})
export class CalendarioComponent implements OnInit {
  rol: string | null = null;
  cargando = false;

  // Rango actualmente visible en el calendario (lo fija FullCalendar).
  private rangoInicio?: Date;
  private rangoFin?: Date;

  private citasPorId = new Map<number, CitaCalendario>();

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next hoy',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    customButtons: {
      hoy: {
        text: 'Hoy',
        click: () => this.irAHoy()
      }
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Dia'
    },
    height: 'auto',
    nowIndicator: true,
    datesSet: (info) => {
      this.rangoInicio = info.start;
      this.rangoFin = info.end;
      this.cargarCitas();
    },
    eventClick: (arg) => this.alHacerClicEnCita(arg),
    events: []
  };

  constructor(private calendarioService: CalendarioService) {}

  ngOnInit(): void {
    this.rol = getJwtRol();
  }

  private irAHoy(): void {
    // El boton "Hoy" se maneja recargando la vista en la fecha actual.
    window.location.reload();
  }

  private cargarCitas(): void {
    if (!this.rangoInicio || !this.rangoFin) {
      return;
    }
    this.cargando = true;
    this.calendarioService
      .listarCitas(this.aIso(this.rangoInicio), this.aIso(this.rangoFin))
      .subscribe({
        next: (citas) => {
          this.cargando = false;
          this.citasPorId.clear();
          const eventos: EventInput[] = citas.map((c) => {
            this.citasPorId.set(c.id, c);
            return {
              id: String(c.id),
              title: `${c.mascotaNombre} - ${c.clienteNombre}`,
              start: c.fechaHora,
              end: c.fechaHoraFin,
              backgroundColor: this.colorEstado(c.estado),
              borderColor: this.colorEstado(c.estado)
            };
          });
          this.calendarOptions = { ...this.calendarOptions, events: eventos };
        },
        error: (err: HttpErrorResponse) => {
          this.cargando = false;
          this.manejarError(err, 'No fue posible cargar las citas');
        }
      });
  }

  private alHacerClicEnCita(arg: EventClickArg): void {
    const cita = this.citasPorId.get(Number(arg.event.id));
    if (!cita) {
      return;
    }
    const esActiva = !['CANCELADA', 'ATENDIDA', 'FINALIZADA'].includes(
      (cita.estado || '').toUpperCase()
    );
    const detalle = `
      <div style="text-align:left">
        <p><b>Fecha:</b> ${(cita.fechaHora || '').replace('T', ' ').substring(0, 16)}</p>
        <p><b>Estado:</b> ${cita.estado}</p>
        <p><b>Mascota:</b> ${cita.mascotaNombre}</p>
        <p><b>Propietario:</b> ${cita.clienteNombre} (${cita.clienteTelefono || 'sin telefono'})</p>
        ${this.rol !== 'Medico' ? `<p><b>Medico:</b> ${cita.medicoNombre}</p>` : ''}
        <p><b>Motivo:</b> ${cita.motivo || '-'}</p>
      </div>`;

    if (!esActiva) {
      Swal.fire({ title: 'Detalle de la cita', html: detalle, icon: 'info' });
      return;
    }

    Swal.fire({
      title: 'Detalle de la cita',
      html: detalle,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Atender',
      denyButtonText: 'Reprogramar',
      cancelButtonText: 'Cerrar',
      footer:
        cita.estado?.toUpperCase() === 'PROGRAMADA'
          ? '<button id="btn-confirmar" class="swal2-styled" style="background:#3db5e6">Confirmar</button>' +
            '<button id="btn-cancelar-cita" class="swal2-styled" style="background:#dc3545">Cancelar cita</button>'
          : '<button id="btn-cancelar-cita" class="swal2-styled" style="background:#dc3545">Cancelar cita</button>',
      didOpen: () => {
        document.getElementById('btn-confirmar')?.addEventListener('click', () => {
          Swal.close();
          this.cambiarEstado(cita, 'CONFIRMADA', 'confirmar esta cita');
        });
        document.getElementById('btn-cancelar-cita')?.addEventListener('click', () => {
          Swal.close();
          this.cambiarEstado(cita, 'CANCELADA', 'cancelar esta cita');
        });
      }
    }).then((res) => {
      if (res.isConfirmed) {
        this.cambiarEstado(cita, 'ATENDIDA', 'marcar como atendida esta cita');
      } else if (res.isDenied) {
        this.reprogramar(cita);
      }
    });
  }

  private cambiarEstado(cita: CitaCalendario, estado: string, accion: string): void {
    Swal.fire({
      title: 'Confirmar',
      text: `Esta seguro de ${accion}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si',
      cancelButtonText: 'No'
    }).then((res) => {
      if (!res.isConfirmed) {
        return;
      }
      this.calendarioService.cambiarEstado(cita.id, estado).subscribe({
        next: (r) => {
          Swal.fire({ icon: 'success', title: 'Listo', text: r.message });
          this.cargarCitas();
        },
        error: (err: HttpErrorResponse) => this.manejarError(err, 'No fue posible cambiar el estado')
      });
    });
  }

  private reprogramar(cita: CitaCalendario): void {
    Swal.fire({
      title: 'Reprogramar cita',
      input: 'datetime-local' as unknown as undefined,
      inputLabel: 'Nueva fecha y hora',
      inputValue: (cita.fechaHora || '').substring(0, 16),
      showCancelButton: true,
      confirmButtonText: 'Reprogramar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (!res.isConfirmed || !res.value) {
        return;
      }
      const valor = res.value.length === 16 ? res.value + ':00' : res.value;
      this.calendarioService.reprogramar(cita.id, valor).subscribe({
        next: (r) => {
          Swal.fire({ icon: 'success', title: 'Listo', text: r.message });
          this.cargarCitas();
        },
        error: (err: HttpErrorResponse) => this.manejarError(err, 'No fue posible reprogramar')
      });
    });
  }

  descargarReporte(): void {
    if (!this.rangoInicio || !this.rangoFin) {
      return;
    }
    this.calendarioService
      .descargarReporte(null, this.aIso(this.rangoInicio), this.aIso(this.rangoFin))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'reporte-citas.xlsx';
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () =>
          Swal.fire({ icon: 'error', title: 'Error', text: 'No fue posible generar el reporte' })
      });
  }

  private colorEstado(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'PROGRAMADA': return '#4680ff';
      case 'CONFIRMADA': return '#3db5e6';
      case 'ATENDIDA': return '#2ca87f';
      case 'FINALIZADA': return '#2ca87f';
      case 'CANCELADA': return '#dc3545';
      default: return '#6c757d';
    }
  }

  private aIso(fecha: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}T${p(fecha.getHours())}:${p(fecha.getMinutes())}:${p(fecha.getSeconds())}`;
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || mensaje });
  }
}
