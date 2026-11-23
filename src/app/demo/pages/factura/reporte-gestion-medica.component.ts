import { HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface FilaMedica {
  medicoId: number;
  medico: string;
  especialidad: string;
  estado: string;
  cantidad: number;
}

interface ReporteMedico {
  desde: string;
  hasta: string;
  resumen: {
    totalCitas: number;
    citasAtendidas: number;
    mascotasAtendidas: number;
  };
  detalle: FilaMedica[];
}

@Component({
  selector: 'app-reporte-gestion-medica',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="border-top mt-4 pt-3" aria-labelledby="titulo-gestion-medica">
      <h2 id="titulo-gestion-medica" class="h5">Reporte de gestión médica</h2>

      <form class="d-flex flex-wrap align-items-end gap-2 mb-3"
            (ngSubmit)="consultar()">
        <div>
          <label for="medica-desde" class="form-label">Fecha inicial de la cita</label>
          <input id="medica-desde" type="date" name="desde" class="form-control"
                 required [(ngModel)]="desde" (ngModelChange)="limpiar()"
                 [disabled]="ocupado" />
        </div>
        <div>
          <label for="medica-hasta" class="form-label">Fecha final de la cita</label>
          <input id="medica-hasta" type="date" name="hasta" class="form-control"
                 required [(ngModel)]="hasta" (ngModelChange)="limpiar()"
                 [min]="desde" [disabled]="ocupado" />
        </div>
        <button type="submit" class="btn btn-success"
                [disabled]="ocupado || !desde || !hasta || hasta < desde">
          {{ consultando ? 'Consultando…' : 'Consultar gestión médica' }}
        </button>
      </form>

      @if (error) {
        <p class="alert alert-danger" role="alert">{{ error }}</p>
      }

      @if (reporte; as r) {
        @if (r.resumen.totalCitas === 0) {
          <p role="status">No hay citas entre {{ r.desde }} y {{ r.hasta }}.</p>
        } @else {
          <p>
            <strong>Citas del período:</strong> {{ r.resumen.totalCitas }} ·
            <strong>Citas atendidas:</strong> {{ r.resumen.citasAtendidas }} ·
            <strong>Mascotas distintas atendidas:</strong> {{ r.resumen.mascotasAtendidas }}
          </p>

          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <caption class="caption-top">Citas del {{ r.desde }} al {{ r.hasta }}</caption>
              <thead>
                <tr>
                  <th scope="col">Veterinario</th>
                  <th scope="col">Especialidad</th>
                  <th scope="col">Estado</th>
                  <th scope="col" class="text-end">Cantidad de citas</th>
                </tr>
              </thead>
              <tbody>
                @for (fila of r.detalle; track fila.medicoId + '-' + fila.estado) {
                  <tr>
                    <th scope="row">{{ fila.medico }}</th>
                    <td>{{ fila.especialidad }}</td>
                    <td>{{ fila.estado }}</td>
                    <td class="text-end">{{ fila.cantidad }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline-success"
                    (click)="descargarPdf(r)">Descargar PDF</button>
            <button type="button" class="btn btn-outline-success"
                    [disabled]="ocupado" (click)="descargarExcel(r)">
              {{ exportando ? 'Generando…' : 'Descargar Excel' }}
            </button>
          </div>
        }
      }
    </section>
  `
})
export class ReporteGestionMedicaComponent {
  desde = '';
  hasta = '';
  error = '';
  consultando = false;
  exportando = false;
  reporte: ReporteMedico | null = null;

  constructor(private readonly backend: BackendService) {}

  get ocupado(): boolean {
    return this.consultando || this.exportando;
  }

  limpiar(): void {
    this.reporte = null;
    this.error = '';
  }

  async consultar(): Promise<void> {
    if (this.ocupado || !this.desde || !this.hasta || this.hasta < this.desde) return;

    this.limpiar();
    this.consultando = true;

    try {
      const params = new HttpParams()
        .set('desde', this.desde)
        .set('hasta', this.hasta);

      this.reporte = await firstValueFrom(
        this.backend.get<ReporteMedico>(
          environment.apiUrlAuth, 'reportes', 'gestion-medica', params
        )
      );
    } catch (fallo) {
      this.error = (fallo as { error?: { message?: string } }).error?.message
        || 'No se pudo consultar el reporte de gestión médica.';
    } finally {
      this.consultando = false;
    }
  }

  descargarPdf(r: ReporteMedico): void {
    const pdf = new jsPDF({ orientation: 'landscape' });
    const generado = new Date().toLocaleString('es-CO');
    const limite = pdf.internal.pageSize.getHeight() - 12;
    let y = 0;

    const encabezado = (): void => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Clínica Veterinaria UNIMINUTO', 14, 16);
      pdf.setFontSize(11);
      pdf.text('Reporte de gestión médica', 14, 24);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Período: ' + r.desde + ' al ' + r.hasta, 14, 32);
      pdf.text('Generado: ' + generado, 14, 39);
      pdf.text(
        'Citas: ' + r.resumen.totalCitas
        + '     Atendidas: ' + r.resumen.citasAtendidas
        + '     Mascotas distintas atendidas: ' + r.resumen.mascotasAtendidas,
        14, 48
      );
      pdf.setFont('helvetica', 'bold');
      pdf.text('Veterinario', 14, 60);
      pdf.text('Especialidad', 102, 60);
      pdf.text('Estado', 187, 60);
      pdf.text('Citas', 280, 60, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      y = 69;
    };

    encabezado();
    for (const fila of r.detalle) {
      const medico: string[] = pdf.splitTextToSize(fila.medico, 82);
      const especialidad: string[] = pdf.splitTextToSize(fila.especialidad, 79);
      const altura = Math.max(medico.length, especialidad.length) * 5 + 3;

      if (y + altura > limite) {
        pdf.addPage();
        encabezado();
      }

      pdf.text(medico, 14, y);
      pdf.text(especialidad, 102, y);
      pdf.text(fila.estado, 187, y);
      pdf.text(String(fila.cantidad), 280, y, { align: 'right' });
      y += altura;
    }

    pdf.save('gestion-medica-' + r.desde + '-al-' + r.hasta + '.pdf');
  }

  async descargarExcel(r: ReporteMedico): Promise<void> {
    if (this.ocupado) return;
    this.exportando = true;
    this.error = '';

    try {
      const { Workbook } = await import('exceljs');
      const libro = new Workbook();
      const hoja = libro.addWorksheet('Gestión médica');

      hoja.addRow(['Clínica Veterinaria UNIMINUTO']);
      hoja.addRow(['Reporte de gestión médica']);
      hoja.addRow(['Fecha inicial', r.desde, 'Fecha final', r.hasta]);
      hoja.addRow(['Generado', new Date().toLocaleString('es-CO')]);
      hoja.addRow(['Citas del período', r.resumen.totalCitas]);
      hoja.addRow(['Citas atendidas', r.resumen.citasAtendidas]);
      hoja.addRow(['Mascotas distintas atendidas', r.resumen.mascotasAtendidas]);
      hoja.addRow([]);

      const encabezado = hoja.addRow(['Veterinario', 'Especialidad', 'Estado', 'Citas']);
      encabezado.font = { bold: true };

      for (const fila of r.detalle) {
        hoja.addRow([fila.medico, fila.especialidad, fila.estado, fila.cantidad]);
      }

      hoja.getColumn(1).width = 38;
      hoja.getColumn(2).width = 32;
      hoja.getColumn(3).width = 22;
      hoja.getColumn(4).width = 16;

      const datos = await libro.xlsx.writeBuffer();
      const bytes = Uint8Array.from(new Uint8Array(datos));
      const archivo = new Blob([bytes.buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'gestion-medica-' + r.desde + '-al-' + r.hasta + '.xlsx';
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      this.error = 'No se pudo generar el Excel de gestión médica.';
    } finally {
      this.exportando = false;
    }
  }
}