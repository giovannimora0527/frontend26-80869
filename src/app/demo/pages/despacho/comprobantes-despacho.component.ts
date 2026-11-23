import { Component, Input, OnChanges } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface FilaComprobante {
  entregaId: number;
  formulaId: number;
  fechaEntrega: string;
  responsable: string;
  propietario: string;
  mascota: string;
  numeroLinea: number;
  medicamento: string;
  numeroLote: string;
  cantidadEntregada: number;
}

interface EntregaConDetalle {
  id: number;
  filas: FilaComprobante[];
}

@Component({
  selector: 'app-comprobantes-despacho',
  standalone: true,
  template: `
    <section class="border-top pt-3 mt-3">
      <button type="button" class="btn btn-outline-primary"
              [disabled]="cargando" (click)="consultar()">
        {{ cargando ? 'Consultando…' : 'Ver comprobantes de entrega' }}
      </button>

      @if (mensaje) {
        <p class="mt-2 mb-0" role="status">{{ mensaje }}</p>
      }

      @for (entrega of entregas; track entrega.id) {
        <div class="d-flex flex-wrap align-items-center gap-2 mt-3">
          <span>
            Entrega #{{ entrega.id }} · {{ entrega.filas[0].fechaEntrega }}
          </span>
          <button type="button" class="btn btn-sm btn-outline-success"
                  [disabled]="generando" (click)="descargar(entrega)">
            Descargar comprobante PDF
          </button>
        </div>
      }
    </section>
  `
})
export class ComprobantesDespachoComponent implements OnChanges {
  @Input({ required: true }) formulaId!: number;

  entregas: EntregaConDetalle[] = [];
  mensaje = '';
  cargando = false;
  generando = false;

  constructor(private readonly backend: BackendService) {}

  ngOnChanges(): void {
    this.entregas = [];
    this.mensaje = '';
  }

  async consultar(): Promise<void> {
    if (this.cargando) return;

    const idConsultado = this.formulaId;
    this.cargando = true;
    this.mensaje = '';
    this.entregas = [];

    try {
      const filas = await firstValueFrom(
        this.backend.get<FilaComprobante[]>(
          environment.apiUrlAuth,
          'despacho',
          'formula/' + idConsultado + '/comprobantes'
        )
      );

      if (idConsultado !== this.formulaId) return;

      const agrupadas = new Map<number, FilaComprobante[]>();
      for (const fila of filas) {
        const grupo = agrupadas.get(fila.entregaId) ?? [];
        grupo.push(fila);
        agrupadas.set(fila.entregaId, grupo);
      }

      this.entregas = Array.from(agrupadas, ([id, detalle]) => ({
        id,
        filas: detalle
      }));

      if (this.entregas.length === 0) {
        this.mensaje = 'Esta fórmula todavía no tiene entregas confirmadas.';
      }
    } catch (fallo) {
      if (idConsultado === this.formulaId) {
        const respuesta = fallo as { error?: { message?: string } };
        this.mensaje = respuesta.error?.message
          || 'No se pudieron consultar los comprobantes.';
      }
    } finally {
      this.cargando = false;
    }
  }

  async descargar(entrega: EntregaConDetalle): Promise<void> {
    if (this.generando || entrega.filas.length === 0) return;

    this.generando = true;
    this.mensaje = '';

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const primera = entrega.filas[0];
      const margen = 18;
      const ancho = pdf.internal.pageSize.getWidth();
      const alto = pdf.internal.pageSize.getHeight();
      let y = 0;

      const encabezado = () => {
        pdf.setFillColor(20, 92, 76);
        pdf.rect(0, 0, ancho, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(15);
        pdf.text('Clínica Veterinaria UNIMINUTO', margen, 13);
        pdf.setFontSize(11);
        pdf.text('Comprobante de entrega #' + entrega.id, margen, 22);
        pdf.setTextColor(35, 45, 55);
        y = 42;
      };

      const escribir = (texto: string, negrita = false) => {
        const estilo = negrita ? 'bold' : 'normal';
        pdf.setFont('helvetica', estilo);
        pdf.setFontSize(11);
        const renglones: string[] = pdf.splitTextToSize(texto, ancho - margen * 2);

        for (const renglon of renglones) {
          if (y > alto - 24) {
            pdf.addPage();
            encabezado();
          }
          pdf.setFont('helvetica', estilo);
          pdf.setFontSize(11);
          pdf.text(renglon, margen, y);
          y += 6;
        }
      };

      encabezado();
      escribir('Fórmula médica #' + primera.formulaId, true);
      escribir('Fecha y hora de entrega: ' + primera.fechaEntrega);
      escribir('Responsable del despacho: ' + primera.responsable);
      escribir('Propietario: ' + primera.propietario);
      escribir('Mascota: ' + primera.mascota);
      y += 4;
      escribir('Medicamentos entregados', true);

      let total = 0;
      for (const fila of entrega.filas) {
        y += 3;
        escribir('Línea ' + fila.numeroLinea + ' · ' + fila.medicamento, true);
        escribir('Lote: ' + fila.numeroLote);
        escribir('Unidades entregadas: ' + fila.cantidadEntregada);
        total += fila.cantidadEntregada;
      }

      y += 4;
      escribir('Total de unidades en esta entrega: ' + total, true);

      const paginas = pdf.getNumberOfPages();
      for (let pagina = 1; pagina <= paginas; pagina++) {
        pdf.setPage(pagina);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(90, 100, 110);
        pdf.text('Página ' + pagina + ' de ' + paginas, ancho - margen, alto - 10, {
          align: 'right'
        });
      }

      pdf.save('comprobante-entrega-' + entrega.id + '-formula-' + primera.formulaId + '.pdf');
    } catch {
      this.mensaje = 'No se pudo generar el PDF. Vuelve a intentar.';
    } finally {
      this.generando = false;
    }
  }
}