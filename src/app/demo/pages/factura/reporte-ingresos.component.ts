import { HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface IngresoDiario {
  fecha: string;
  pagosRecibidos: number;
  facturasConPago: number;
  ingresoRecibido: number;
}

interface ReporteIngresos {
  desde: string;
  hasta: string;
  filas: IngresoDiario[];
  pagos: number;
  total: number;
}

@Component({
  selector: 'app-reporte-ingresos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="border-top mt-4 pt-3" aria-labelledby="titulo-ingresos">
      <h2 id="titulo-ingresos" class="h5">Reporte de ingresos por período</h2>

      <form class="d-flex flex-wrap align-items-end gap-2 mb-3"
            (ngSubmit)="consultar()">
        <div>
          <label for="ingreso-desde" class="form-label">Fecha inicial</label>
          <input id="ingreso-desde" name="desde" type="date" class="form-control"
                 required [(ngModel)]="desde" (ngModelChange)="limpiar()"
                 [disabled]="ocupado" />
        </div>
        <div>
          <label for="ingreso-hasta" class="form-label">Fecha final</label>
          <input id="ingreso-hasta" name="hasta" type="date" class="form-control"
                 required [(ngModel)]="hasta" (ngModelChange)="limpiar()"
                 [min]="desde" [disabled]="ocupado" />
        </div>
        <button type="submit" class="btn btn-success"
                [disabled]="ocupado || !desde || !hasta || hasta < desde">
          {{ consultando ? 'Consultando…' : 'Consultar ingresos' }}
        </button>
      </form>

      @if (error) {
        <p class="alert alert-danger" role="alert">{{ error }}</p>
      }

      @if (reporte; as r) {
        @if (r.filas.length === 0) {
          <p role="status">No se registraron pagos entre {{ r.desde }} y {{ r.hasta }}.</p>
        } @else {
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <caption class="caption-top">Ingresos del {{ r.desde }} al {{ r.hasta }}</caption>
              <thead>
                <tr>
                  <th scope="col">Fecha de pago</th>
                  <th scope="col">Pagos recibidos</th>
                  <th scope="col">Facturas con pago ese día</th>
                  <th scope="col" class="text-end">Ingreso recibido</th>
                </tr>
              </thead>
              <tbody>
                @for (fila of r.filas; track fila.fecha) {
                  <tr>
                    <th scope="row">{{ fila.fecha }}</th>
                    <td>{{ fila.pagosRecibidos }}</td>
                    <td>{{ fila.facturasConPago }}</td>
                    <td class="text-end">{{ moneda.format(fila.ingresoRecibido) }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total del período</th>
                  <td>{{ r.pagos }}</td>
                  <td></td>
                  <td class="text-end fw-bold">{{ moneda.format(r.total) }}</td>
                </tr>
              </tfoot>
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
export class ReporteIngresosComponent {
  desde = '';
  hasta = '';
  error = '';
  consultando = false;
  exportando = false;
  reporte: ReporteIngresos | null = null;

  readonly moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 2
  });

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
    const desde = this.desde;
    const hasta = this.hasta;

    try {
      const params = new HttpParams().set('desde', desde).set('hasta', hasta);
      const filas = await firstValueFrom(
        this.backend.get<IngresoDiario[]>(
          environment.apiUrlAuth, 'reportes', 'financieros/ingresos', params
        )
      );

      const centavos = filas.reduce(
        (suma, fila) => suma + Math.round(fila.ingresoRecibido * 100), 0
      );

      this.reporte = {
        desde, hasta, filas,
        pagos: filas.reduce((suma, fila) => suma + fila.pagosRecibidos, 0),
        total: centavos / 100
      };
    } catch (fallo) {
      this.error = (fallo as { error?: { message?: string } }).error?.message
        || 'No se pudo consultar el reporte de ingresos.';
    } finally {
      this.consultando = false;
    }
  }

  descargarPdf(r: ReporteIngresos): void {
    const pdf = new jsPDF();
    const generado = new Date().toLocaleString('es-CO');
    let y = 0;

    const encabezado = (): void => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Clínica Veterinaria UNIMINUTO', 15, 18);
      pdf.setFontSize(11);
      pdf.text('Reporte de ingresos por período', 15, 26);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Período: ' + r.desde + ' al ' + r.hasta, 15, 34);
      pdf.text('Generado: ' + generado, 15, 41);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fecha', 15, 53);
      pdf.text('Pagos', 67, 53);
      pdf.text('Facturas del día', 95, 53);
      pdf.text('Ingreso (COP)', 194, 53, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      y = 63;
    };

    encabezado();
    for (const fila of r.filas) {
      if (y > 272) {
        pdf.addPage();
        encabezado();
      }
      pdf.text(fila.fecha, 15, y);
      pdf.text(String(fila.pagosRecibidos), 67, y);
      pdf.text(String(fila.facturasConPago), 95, y);
      pdf.text(this.moneda.format(fila.ingresoRecibido), 194, y, { align: 'right' });
      y += 8;
    }

    if (y > 268) {
      pdf.addPage();
      encabezado();
    }
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total del período', 15, y + 5);
    pdf.text(String(r.pagos), 67, y + 5);
    pdf.text(this.moneda.format(r.total), 194, y + 5, { align: 'right' });
    pdf.save('ingresos-' + r.desde + '-al-' + r.hasta + '.pdf');
  }

  async descargarExcel(r: ReporteIngresos): Promise<void> {
    if (this.ocupado) return;
    this.exportando = true;
    this.error = '';

    try {
      const { Workbook } = await import('exceljs');
      const libro = new Workbook();
      const hoja = libro.addWorksheet('Ingresos');
      hoja.addRow(['Clínica Veterinaria UNIMINUTO']);
      hoja.addRow(['Reporte de ingresos por período']);
      hoja.addRow(['Desde', r.desde, 'Hasta', r.hasta]);
      hoja.addRow(['Generado', new Date().toLocaleString('es-CO')]);
      hoja.addRow([]);
      const cabecera = hoja.addRow([
        'Fecha de pago', 'Pagos recibidos', 'Facturas con pago ese día', 'Ingreso (COP)'
      ]);
      cabecera.font = { bold: true };

      for (const fila of r.filas) {
        hoja.addRow([fila.fecha, fila.pagosRecibidos, fila.facturasConPago, fila.ingresoRecibido]);
      }
      const total = hoja.addRow(['Total del período', r.pagos, null, r.total]);
      total.font = { bold: true };

      hoja.getColumn(1).width = 32;
      hoja.getColumn(2).width = 28;
      hoja.getColumn(3).width = 28;
      hoja.getColumn(4).width = 22;
      hoja.getColumn(4).numFmt = '#,##0.00';

      const datos = await libro.xlsx.writeBuffer();
      const bytes = Uint8Array.from(new Uint8Array(datos));
      const archivo = new Blob([bytes.buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'ingresos-' + r.desde + '-al-' + r.hasta + '.xlsx';
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      this.error = 'No se pudo generar el archivo Excel. Intenta de nuevo.';
    } finally {
      this.exportando = false;
    }
  }
}