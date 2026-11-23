import { HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Cita } from 'src/app/models/cita';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-reporte-citas',
  standalone: true,
  template: `
    <section class="border rounded p-3 mb-4" aria-labelledby="titulo-reporte-citas">
      <h2 id="titulo-reporte-citas" class="h5 mb-3">Reporte de citas en Excel</h2>

      <form class="row g-3 align-items-end"
            (submit)="$event.preventDefault(); descargar()">
        <div class="col-sm-4">
          <label for="reporte-citas-inicio" class="form-label">Fecha inicial</label>
          <input #inicio id="reporte-citas-inicio" type="date"
                 class="form-control" required
                 [value]="fechaInicio" [max]="fechaFin || null"
                 [disabled]="descargando"
                 (input)="fechaInicio = inicio.value; mensaje = ''" />
        </div>

        <div class="col-sm-4">
          <label for="reporte-citas-fin" class="form-label">Fecha final</label>
          <input #fin id="reporte-citas-fin" type="date"
                 class="form-control" required
                 [value]="fechaFin" [min]="fechaInicio || null"
                 [disabled]="descargando"
                 (input)="fechaFin = fin.value; mensaje = ''" />
        </div>

        <div class="col-sm-4">
          <button type="submit" class="btn btn-outline-success"
                  [disabled]="descargando">
            {{ descargando ? 'Generando…' : 'Descargar Excel' }}
          </button>
        </div>
      </form>

      @if (mensaje) {
        <p class="mt-3 mb-0" role="status"
           [class.text-danger]="esError">
          {{ mensaje }}
        </p>
      }
    </section>
  `
})
export class ReporteCitasComponent {
  fechaInicio = '';
  fechaFin = '';
  descargando = false;
  mensaje = '';
  esError = false;

  constructor(private readonly backend: BackendService) {}

  async descargar(): Promise<void> {
    if (this.descargando) return;

    this.mensaje = '';
    this.esError = false;

    if (!this.fechaInicio || !this.fechaFin || this.fechaInicio > this.fechaFin) {
      this.esError = true;
      this.mensaje = 'Selecciona un rango de fechas válido.';
      return;
    }

    const inicio = this.fechaInicio;
    const fin = this.fechaFin;
    this.descargando = true;

    try {
      const parametros = new HttpParams()
        .set('fechaInicio', `${inicio}T00:00:00`)
        .set('fechaFin', `${fin}T23:59:59.999999`);

      const citas = await firstValueFrom(
        this.backend.get<Cita[]>(
          environment.apiUrlAuth,
          'cita',
          'listar-rango',
          parametros
        )
      );

      if (citas.length === 0) {
        this.mensaje = 'No hay citas para tu usuario en ese rango de fechas.';
        return;
      }

      const { Workbook } = await import('exceljs');
      const libro = new Workbook();
      const hoja = libro.addWorksheet('Agenda', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });

      hoja.columns = [
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Hora de inicio', key: 'hora', width: 17 },
        { header: 'Mascota', key: 'mascota', width: 24 },
        { header: 'Propietario', key: 'propietario', width: 30 },
        { header: 'Veterinario', key: 'medico', width: 30 },
        { header: 'Motivo', key: 'motivo', width: 45 },
        { header: 'Estado', key: 'estado', width: 18 }
      ];

      const ordenadas = [...citas].sort(
        (a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
      );

      for (const cita of ordenadas) {
        const fecha = new Date(cita.fechaHora);
        const cliente = cita.cliente ?? cita.mascota?.cliente;

        // Excel representa las fechas como días y las horas como fracciones de día.
        // Usamos los mismos valores locales que muestra el calendario.
        const fechaExcel = Date.UTC(
          fecha.getFullYear(), fecha.getMonth(), fecha.getDate()
        ) / 86400000 + 25569;

        hoja.addRow({
          fecha: fechaExcel,
          hora: (fecha.getHours() * 60 + fecha.getMinutes()) / 1440,
          mascota: cita.mascota?.nombreMascota ?? cita.mascota?.nombre ?? '',
          propietario: [cliente?.nombres, cliente?.apellidos].filter(Boolean).join(' '),
          medico: [cita.medico?.nombres, cita.medico?.apellidos].filter(Boolean).join(' '),
          motivo: cita.motivo ?? '',
          estado: (cita.estado ?? '').toUpperCase()
        });
      }

      hoja.getColumn('fecha').numFmt = 'dd/mm/yyyy';
      hoja.getColumn('hora').numFmt = 'hh:mm';
      hoja.getColumn('motivo').alignment = { wrapText: true };
      hoja.autoFilter = 'A1:G1';

      const encabezado = hoja.getRow(1);
      encabezado.height = 24;
      encabezado.eachCell(celda => {
        celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        celda.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF176B52' }
        };
        celda.alignment = { vertical: 'middle' };
      });

      const contenido = await libro.xlsx.writeBuffer();
      const bytes = new Uint8Array(contenido);
      const archivo = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `agenda_${inicio}_${fin}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      this.mensaje = `Reporte generado con ${citas.length} cita(s).`;
    } catch (error: unknown) {
      const fallo = error as { status?: number; error?: { message?: string } };
      this.esError = true;
      this.mensaje = fallo.status === 401
        ? 'Tu sesión venció. Vuelve a iniciar sesión para descargar el reporte.'
        : fallo.error?.message ?? 'No se pudo generar el archivo Excel.';
    } finally {
      this.descargando = false;
    }
  }
}