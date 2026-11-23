import { Component, Input, OnChanges } from '@angular/core';
import { jsPDF } from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface Prefactura {
  citaId: number;
  fechaAtencion: string;
  propietario: string;
  mascota: string;
  medico: string;
  especialidad: string;
  tarifa: {
    servicio: string;
    vigenteDesde: string;
    valorBase: number;
    porcentajeIva: number;
  };
  medicamentos: {
    formulaId: number;
    numeroLinea: number;
    medicamento: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  subtotalMedicamentos: number;
  ivaServicio: number;
  totalEstimado: number;
}

@Component({
  selector: 'app-prefactura-cita',
  standalone: true,
  styles: [`
    .dialogo-prefactura {
      width: min(900px, 92vw);
      max-height: 85vh;
      margin: auto;
      padding: 0;
      overflow: auto;
      border: 0;
      border-radius: 0.75rem;
      box-shadow: 0 12px 40px rgb(0 0 0 / 20%);
    }

    .dialogo-prefactura::backdrop {
      background: rgb(0 0 0 / 40%);
    }
  `],
  template: `
    <div class="my-3">
      <button type="button"
              class="btn btn-outline-success"
              [disabled]="!citaId"
              (click)="dialogoPrefactura.showModal(); consultar()">
        Ver prefactura de la cita
      </button>
    </div>

    <dialog #dialogoPrefactura
            class="dialogo-prefactura"
            aria-labelledby="titulo-prefactura-cita">
      <header class="modal-header">
        <h2 id="titulo-prefactura-cita" class="modal-title h5">
          Prefactura de la cita {{ citaId }}
        </h2>
        <button type="button" class="btn-close"
                aria-label="Cerrar prefactura"
                (click)="dialogoPrefactura.close()">
        </button>
      </header>

      <div class="modal-body">
        @if (cargando) {
          <p role="status" class="mb-0">Consultando la prefactura…</p>
        } @else if (error) {
          <p role="alert" class="alert alert-danger">{{ error }}</p>
          <button type="button" class="btn btn-outline-secondary btn-sm"
                  (click)="consultar()">
            Reintentar
          </button>
                }
        @if (prefactura; as p) {
          <p class="mb-1">
            <strong>Mascota:</strong> {{ p.mascota }} ·
            <strong>Propietario:</strong> {{ p.propietario }}
          </p>
          <p class="mb-1">
            <strong>Médico:</strong> {{ p.medico }} · {{ p.especialidad }}
          </p>
          <p>
            <strong>{{ p.tarifa.servicio }}:</strong> {{ pesos(p.tarifa.valorBase) }}
          </p>

          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th scope="col">Fórmula</th>
                  <th scope="col">Medicamento</th>
                  <th scope="col">Cantidad formulada</th>
                  <th scope="col">Precio unitario</th>
                  <th scope="col">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @for (m of p.medicamentos; track m.formulaId + '-' + m.numeroLinea) {
                  <tr>
                    <td>{{ m.formulaId }}</td>
                    <td>{{ m.medicamento }}</td>
                    <td>{{ m.cantidad }}</td>
                    <td>{{ pesos(m.precioUnitario) }}</td>
                    <td>{{ pesos(m.subtotal) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5">La cita no tiene medicamentos formulados.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="mb-1">
            Medicamentos formulados: {{ pesos(p.subtotalMedicamentos) }}
          </p>
          <p class="mb-1">IVA del servicio: {{ pesos(p.ivaServicio) }}</p>
          <p class="mb-0">
            <strong>Total estimado: {{ pesos(p.totalEstimado) }}</strong>
          </p>
        }
      </div>

      <footer class="modal-footer">
        <button type="button" class="btn btn-outline-secondary"
                (click)="dialogoPrefactura.close()">
          Volver a la fórmula
        </button>

        @if (prefactura; as p) {
          <button type="button" class="btn btn-success"
                  (click)="descargarPdf(p)">
            Descargar prefactura en PDF
          </button>
        }
      </footer>
    </dialog>
  `
})
export class PrefacturaCitaComponent implements OnChanges {
  @Input() citaId: number | null = null;

  prefactura: Prefactura | null = null;
  cargando = false;
  error = '';

  private consultaActual = 0;
  private readonly moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  constructor(private readonly backend: BackendService) {}

  ngOnChanges(): void {
    this.consultaActual++;
    this.prefactura = null;
    this.error = '';
    this.cargando = false;
  }

  pesos(valor: number): string {
    return this.moneda.format(valor);
  }

  async consultar(): Promise<void> {
    if (!this.citaId || this.cargando) return;

    const consulta = ++this.consultaActual;
    this.cargando = true;
    this.error = '';
    this.prefactura = null;

    try {
      const datos = await firstValueFrom(
        this.backend.get<Prefactura>(
          environment.apiUrlAuth, 'prefactura', 'cita/' + this.citaId
        )
      );
      if (consulta === this.consultaActual) this.prefactura = datos;
    } catch (fallo) {
      if (consulta === this.consultaActual) {
        this.error = (fallo as { error?: { message?: string } }).error?.message
          || 'No se pudo consultar la prefactura.';
      }
    } finally {
      if (consulta === this.consultaActual) this.cargando = false;
    }
  }

  descargarPdf(p: Prefactura): void {
    const pdf = new jsPDF();
    const margen = 18;
    const ancho = pdf.internal.pageSize.getWidth() - margen * 2;
    const limite = pdf.internal.pageSize.getHeight() - 20;
    let y = margen;

    // Divide los textos largos y conserva espacio para el pie de página.
    const escribir = (texto: string, tamano = 11, negrita = false): void => {
      pdf.setFont('helvetica', negrita ? 'bold' : 'normal');
      pdf.setFontSize(tamano);

      const lineas: string[] = pdf.splitTextToSize(texto, ancho);
      const altoLinea = tamano * 0.45 + 1;

      for (const linea of lineas) {
        if (y + altoLinea > limite) {
          pdf.addPage();
          y = margen;
        }
        pdf.text(linea, margen, y);
        y += altoLinea;
      }
    };

    const fechaGeneracion = new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Bogota'
    }).format(new Date());

    escribir('Clínica Veterinaria UNIMINUTO', 16, true);
    escribir('Prefactura de atención · Cita ' + p.citaId, 14, true);
    escribir('Generada: ' + fechaGeneracion + ' (hora de Bogotá)', 10);
    escribir('Valores estimados en pesos colombianos (COP).', 10);
    y += 3;

    escribir('Datos de la atención', 12, true);
    escribir('Fecha de atención: ' + p.fechaAtencion);
    escribir('Mascota: ' + p.mascota + '     Propietario: ' + p.propietario);
    escribir('Médico: ' + p.medico + '     Especialidad: ' + p.especialidad);
    y += 3;

    escribir('Servicio prestado', 12, true);
    escribir(p.tarifa.servicio + ' · ' + this.pesos(p.tarifa.valorBase));
    escribir('Tarifa vigente desde: ' + p.tarifa.vigenteDesde, 10);
    y += 3;

    escribir('Medicamentos formulados', 12, true);

    if (p.medicamentos.length === 0) {
      escribir('Sin medicamentos formulados.');
    }

    for (const m of p.medicamentos) {
      if (y + 16 > limite) {
        pdf.addPage();
        y = margen;
      }
      escribir('Fórmula ' + m.formulaId + ' · Línea ' + m.numeroLinea
        + ' · ' + m.medicamento, 11, true);
      escribir('Cantidad: ' + m.cantidad
        + '     Precio unitario: ' + this.pesos(m.precioUnitario)
        + '     Subtotal: ' + this.pesos(m.subtotal), 10);
      y += 2;
    }

    if (y + 42 > limite) {
      pdf.addPage();
      y = margen;
    }

    y += 3;
    escribir('Resumen', 12, true);
    escribir('Valor base del servicio: ' + this.pesos(p.tarifa.valorBase));
    escribir('Medicamentos formulados: ' + this.pesos(p.subtotalMedicamentos));
    escribir('IVA del servicio (' + p.tarifa.porcentajeIva + '%): '
      + this.pesos(p.ivaServicio));
    escribir('Total estimado: ' + this.pesos(p.totalEstimado), 14, true);

    const paginas = pdf.getNumberOfPages();
    for (let pagina = 1; pagina <= paginas; pagina++) {
      pdf.setPage(pagina);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(
        'Prefactura · Cita ' + p.citaId + ' · Página ' + pagina + ' de ' + paginas,
        margen,
        pdf.internal.pageSize.getHeight() - 10
      );
    }

    pdf.save('prefactura-cita-' + p.citaId + '.pdf');
  }
}