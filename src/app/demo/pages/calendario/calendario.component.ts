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

import { CalendarioService, CitaCalendario, AtenderCita, AtenderCitaMedicamento } from './service/calendario.service';
import { InventarioService, Medicamento } from '../inventario/service/inventario.service';
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

  // Catalogo de medicamentos para el formulario de atencion (formula opcional).
  private medicamentos: Medicamento[] = [];

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

  constructor(
    private calendarioService: CalendarioService,
    private inventarioService: InventarioService
  ) {}

  ngOnInit(): void {
    this.rol = getJwtRol();
    this.cargarMedicamentos();
  }

  private cargarMedicamentos(): void {
    this.inventarioService.listar().subscribe({
      next: (data) => (this.medicamentos = data),
      error: () => (this.medicamentos = [])
    });
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
        this.abrirAtencion(cita);
      } else if (res.isDenied) {
        this.reprogramar(cita);
      }
    });
  }

  /**
   * Abre la ventana de atencion de la cita: muestra los datos de la cita (solo
   * lectura) y permite registrar la anotacion (descripcion, diagnostico,
   * observaciones) y, opcionalmente, una formula con uno o varios medicamentos.
   * Al guardar, el backend registra la anotacion, crea la formula si hay
   * medicamentos y marca la cita como ATENDIDA, todo en una sola operacion.
   */
  private abrirAtencion(cita: CitaCalendario): void {
    const opciones = this.medicamentos
      .filter((m) => m.id != null)
      .map((m) => `<option value="${m.id}">${this.escapar(m.nombre)}</option>`)
      .join('');

    // Estilos reutilizables (marca Clinica DDSF: aguamarina #4bbdb2, petroleo #123b3a).
    const inp = 'width:100%;box-sizing:border-box;border:1px solid #dfe6e4;border-radius:8px;'
      + 'padding:8px 10px;font-size:13px;background:#fff;color:#2b3a39;outline:none;';
    const lbl = 'display:block;font-size:12px;font-weight:600;color:#123b3a;margin:0 0 4px';

    const filaMedicamento = (): string => `
      <tr class="fila-med">
        <td style="padding:4px">
          <select class="med-id" style="${inp}">
            <option value="">Seleccione...</option>${opciones}
          </select>
        </td>
        <td style="padding:4px"><input class="med-dosis" placeholder="Dosis" style="${inp}"></td>
        <td style="padding:4px"><input class="med-frec" placeholder="Frecuencia" style="${inp}"></td>
        <td style="padding:4px"><input class="med-dur" placeholder="Duracion" style="${inp}"></td>
        <td style="padding:4px;width:64px"><input class="med-cant" type="number" min="1" value="1" style="${inp}text-align:center"></td>
        <td style="padding:4px"><input class="med-via" placeholder="Via" style="${inp}"></td>
        <td style="padding:4px;width:38px;text-align:center">
          <button type="button" class="med-quitar" title="Quitar"
            style="border:none;background:#fdeaea;color:#e2686b;border-radius:8px;width:30px;height:32px;cursor:pointer;font-size:15px;line-height:1">&times;</button>
        </td>
      </tr>`;

    const seccion = (titulo: string): string =>
      `<div style="font-size:13px;font-weight:700;color:#123b3a;margin:14px 0 8px;padding-bottom:4px;border-bottom:2px solid #e4f1ef">${titulo}</div>`;

    const cuerpo = `
      <div style="text-align:left;max-height:64vh;overflow:auto;padding:2px 6px">

        <div style="background:#eef7f5;border-left:4px solid #4bbdb2;border-radius:8px;padding:12px 14px;font-size:13px;color:#2b3a39;
                    display:grid;grid-template-columns:1fr 1fr;gap:4px 18px">
          <div><span style="color:#5b6b69">Mascota:</span> <b>${this.escapar(cita.mascotaNombre)}</b></div>
          <div><span style="color:#5b6b69">Veterinario:</span> <b>${this.escapar(cita.medicoNombre)}</b></div>
          <div style="grid-column:1 / span 2"><span style="color:#5b6b69">Propietario:</span> <b>${this.escapar(cita.clienteNombre)}</b> (${this.escapar(cita.clienteTelefono || 'sin telefono')})</div>
          <div><span style="color:#5b6b69">Fecha:</span> <b>${(cita.fechaHora || '').replace('T', ' ').substring(0, 16)}</b></div>
          <div><span style="color:#5b6b69">Motivo:</span> <b>${this.escapar(cita.motivo || '-')}</b></div>
        </div>

        ${seccion('Anotacion de la atencion')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="grid-column:1 / span 2">
            <label style="${lbl}">Descripcion <span style="color:#e2686b">*</span></label>
            <textarea id="at-descripcion" rows="2" style="${inp}resize:vertical"></textarea>
          </div>
          <div>
            <label style="${lbl}">Diagnostico <span style="color:#e2686b">*</span></label>
            <textarea id="at-diagnostico" rows="2" style="${inp}resize:vertical"></textarea>
          </div>
          <div>
            <label style="${lbl}">Observaciones <span style="color:#e2686b">*</span></label>
            <textarea id="at-observaciones" rows="2" style="${inp}resize:vertical"></textarea>
          </div>
        </div>

        ${seccion('Formula (opcional)')}
        <label style="${lbl}">Indicaciones generales</label>
        <textarea id="at-indicaciones" rows="2" style="${inp}resize:vertical;margin-bottom:10px"></textarea>

        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="color:#123b3a;text-align:left">
              <th style="padding:2px 4px;font-weight:600">Medicamento</th>
              <th style="padding:2px 4px;font-weight:600">Dosis</th>
              <th style="padding:2px 4px;font-weight:600">Frecuencia</th>
              <th style="padding:2px 4px;font-weight:600">Duracion</th>
              <th style="padding:2px 4px;font-weight:600;text-align:center">Cant.</th>
              <th style="padding:2px 4px;font-weight:600">Via</th>
              <th style="padding:2px 4px"></th>
            </tr>
          </thead>
          <tbody id="at-medicamentos">${filaMedicamento()}</tbody>
        </table>

        <button type="button" id="at-agregar-med"
          style="margin-top:8px;border:1px dashed #4bbdb2;background:#eef7f5;color:#128073;border-radius:8px;
                 padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer">+ Agregar medicamento</button>
        <p style="font-size:12px;color:#8a9795;margin:8px 0 0">Si no agrega medicamentos, solo se registra la anotacion.</p>
      </div>`;

    Swal.fire({
      title: 'Atender cita',
      html: cuerpo,
      width: 760,
      showCancelButton: true,
      confirmButtonText: 'Guardar atencion',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4bbdb2',
      cancelButtonColor: '#6d7f84',
      focusConfirm: false,
      didOpen: () => {
        const cont = document.getElementById('at-medicamentos');
        document.getElementById('at-agregar-med')?.addEventListener('click', () => {
          cont?.insertAdjacentHTML('beforeend', filaMedicamento());
        });
        // Delegacion: quitar la fila al pulsar su boton (siempre deja al menos una).
        cont?.addEventListener('click', (ev) => {
          const boton = (ev.target as HTMLElement).closest('.med-quitar');
          if (!boton) {
            return;
          }
          const filas = cont.querySelectorAll('.fila-med');
          if (filas.length > 1) {
            boton.closest('.fila-med')?.remove();
          } else {
            // Si es la unica fila, se limpia en vez de eliminarla.
            boton.closest('.fila-med')?.querySelectorAll('input,select').forEach((el) => {
              const campo = el as HTMLInputElement | HTMLSelectElement;
              campo.value = campo.classList.contains('med-cant') ? '1' : '';
            });
          }
        });
      },
      preConfirm: () => {
        const valor = (id: string): string =>
          (document.getElementById(id) as HTMLTextAreaElement | null)?.value.trim() ?? '';
        const descripcion = valor('at-descripcion');
        const diagnostico = valor('at-diagnostico');
        const observaciones = valor('at-observaciones');

        if (!descripcion || !diagnostico || !observaciones) {
          Swal.showValidationMessage('Descripcion, diagnostico y observaciones son obligatorios.');
          return false;
        }

        const medicamentos: AtenderCitaMedicamento[] = [];
        const filas = Array.from(document.querySelectorAll('#at-medicamentos .fila-med'));
        for (const fila of filas) {
          const medId = (fila.querySelector('.med-id') as HTMLSelectElement).value;
          if (!medId) {
            continue; // fila vacia: se ignora
          }
          const dosis = (fila.querySelector('.med-dosis') as HTMLInputElement).value.trim();
          if (!dosis) {
            Swal.showValidationMessage('Cada medicamento agregado debe tener dosis.');
            return false;
          }
          const cantidad = Number((fila.querySelector('.med-cant') as HTMLInputElement).value) || 1;
          medicamentos.push({
            medicamentoId: Number(medId),
            dosis,
            frecuencia: (fila.querySelector('.med-frec') as HTMLInputElement).value.trim(),
            duracion: (fila.querySelector('.med-dur') as HTMLInputElement).value.trim(),
            cantidad,
            viaAdministracion: (fila.querySelector('.med-via') as HTMLInputElement).value.trim()
          });
        }

        const datos: AtenderCita = {
          citaId: cita.id,
          descripcion,
          diagnostico,
          observaciones,
          indicaciones: valor('at-indicaciones'),
          medicamentos
        };
        return datos;
      }
    }).then((res) => {
      if (!res.isConfirmed || !res.value) {
        return;
      }
      this.guardarAtencion(res.value as AtenderCita);
    });
  }

  private guardarAtencion(datos: AtenderCita): void {
    this.calendarioService.atenderCita(datos).subscribe({
      next: (r) => {
        Swal.fire({ icon: 'success', title: 'Listo', text: r.message });
        this.cargarCitas();
      },
      error: (err: HttpErrorResponse) => this.manejarError(err, 'No fue posible registrar la atencion')
    });
  }

  /** Escapa texto para insertarlo de forma segura en el HTML del modal. */
  private escapar(valor: string): string {
    const div = document.createElement('div');
    div.textContent = valor ?? '';
    return div.innerHTML;
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
