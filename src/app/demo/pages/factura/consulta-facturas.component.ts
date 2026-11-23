import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { PagoFacturaComponent } from './pago-factura.component';
import { jsPDF } from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface LineaGuardada {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descuento: number;
  porcentajeIva: number;
  valorIva: number;
  totalLinea: number;
}

interface FacturaGuardada {
  facturaId: number;
  citaId: number;
  fechaEmision: string;
  propietario: string;
  mascota: string;
  medico: string;
  especialidad: string;
  estadoPago: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  totalPagado: number;
saldo: number;
  lineas: LineaGuardada[];
}

@Component({
  selector: 'app-consulta-facturas',
  standalone: true,
  imports: [PagoFacturaComponent],
  template: `
    <div class="mt-3">
      <button type="button" class="btn btn-outline-success"
              [disabled]="cargando || !citaValida" (click)="consultar()">
        {{ cargando ? 'Consultando…' : 'Consultar facturas de la cita' }}
      </button>

      @if (error) {
        <p class="alert alert-danger mt-2" role="alert">{{ error }}</p>
      } @else if (consultado && facturas.length === 0) {
        <p class="text-secondary mt-2" role="status">
          No hay facturas emitidas para esa cita.
        </p>
      }

      @for (f of facturas; track f.facturaId) {
        <article class="border rounded p-3 mt-3">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h2 class="h5 mb-0">Factura {{ f.facturaId }} · Cita {{ f.citaId }}</h2>
            <button type="button" class="btn btn-success btn-sm" (click)="descargar(f)">
              Descargar factura en PDF
            </button>
          </div>

          <p class="mt-2 mb-1">Emitida: {{ f.fechaEmision }} · {{ f.estadoPago }}</p>
          <p class="mb-1">Propietario: {{ f.propietario }} · Mascota: {{ f.mascota }}</p>
          <p>Médico: {{ f.medico }} · {{ f.especialidad }}</p>

          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Total de línea</th>
                </tr>
              </thead>
              <tbody>
                @for (linea of f.lineas; track linea.id) {
                  <tr>
                    <td>{{ linea.descripcion }}</td>
                    <td>{{ linea.cantidad }}</td>
                    <td>{{ pesos(linea.precioUnitario) }}</td>
                    <td>{{ pesos(linea.totalLinea) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="mb-1">Subtotal: {{ pesos(f.subtotal) }}</p>
          <p class="mb-1">Descuento: {{ pesos(f.descuento) }}</p>
          <p class="mb-1">Impuestos: {{ pesos(f.impuestos) }}</p>
          <p class="mb-1"><strong>Total de la factura: {{ pesos(f.total) }}</strong></p>
<p class="mb-1">Total pagado: {{ pesos(f.totalPagado) }}</p>
<p class="mb-2"><strong>Saldo pendiente: {{ pesos(f.saldo) }}</strong></p>
        <app-pago-factura
  [facturaId]="f.facturaId"
  [estadoPago]="f.estadoPago"
  (registrado)="aplicarPago(f, $event)">
</app-pago-factura>
@if (f.estadoPago === 'PENDIENTE_DE_PAGO' && f.totalPagado === 0) {
  <button type="button" class="btn btn-outline-danger btn-sm mt-3"
          [disabled]="anulando"
          (click)="abrirAnulacion(dialogoAnulacion)">
    Anular factura
  </button>

  <dialog #dialogoAnulacion
          class="border rounded shadow p-0"
          style="width: min(30rem, 92vw)"
          [attr.aria-labelledby]="'titulo-anular-' + f.facturaId"
          (cancel)="anulando && $event.preventDefault()">

    <div class="p-4">
      <h3 class="h5" [id]="'titulo-anular-' + f.facturaId">
        Anular factura {{ f.facturaId }}
      </h3>

      <p>
        Cita {{ f.citaId }} · {{ f.propietario }} · Total {{ pesos(f.total) }}
      </p>

      <label class="form-label" [for]="'motivo-anular-' + f.facturaId">
        Motivo de la anulación
      </label>
      <textarea #motivoAnulacion class="form-control" rows="3"
                [id]="'motivo-anular-' + f.facturaId"
                maxlength="500" required autofocus
                [disabled]="anulando"></textarea>

      @if (errorAnulacion) {
        <p class="alert alert-danger mt-3 mb-0" role="alert">
          {{ errorAnulacion }}
        </p>
      }

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button type="button" class="btn btn-outline-secondary"
                [disabled]="anulando" (click)="dialogoAnulacion.close()">
          Volver
        </button>

        <button type="button" class="btn btn-danger"
                [disabled]="anulando"
                (click)="confirmarAnulacion(f, motivoAnulacion.value, dialogoAnulacion)">
          {{ anulando ? 'Anulando…' : 'Confirmar anulación' }}
        </button>
      </div>
    </div>
  </dialog>
}
        </article>
      }
    </div>
  `
})
export class ConsultaFacturasComponent implements OnChanges {
  @Input() citaId: number | null = null;
  @Output() pagoActualizado = new EventEmitter<{
  facturaId: number;
  estadoPago: string;
}>();

  facturas: FacturaGuardada[] = [];
  consultado = false;
  cargando = false;
  error = '';

  private solicitud = 0;
  private readonly moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  constructor(private readonly backend: BackendService) {}

  get citaValida(): boolean {
    return this.citaId !== null && Number.isSafeInteger(this.citaId) && this.citaId > 0;
  }

  ngOnChanges(): void {
    this.solicitud++;
    this.facturas = [];
    this.consultado = false;
    this.cargando = false;
    this.error = '';
  }

  pesos(valor: number): string {
    return this.moneda.format(valor);
  }

  async consultar(): Promise<void> {
    if (!this.citaValida || this.cargando) return;

    const solicitud = ++this.solicitud;
    this.cargando = true;
    this.consultado = false;
    this.error = '';
    this.facturas = [];

    try {
      const datos = await firstValueFrom(
        this.backend.get<FacturaGuardada[]>(
          environment.apiUrlAuth, 'factura', 'cita/' + this.citaId
        )
      );

      if (solicitud === this.solicitud) {
        this.facturas = datos;
        this.consultado = true;
      }
    } catch (fallo) {
      if (solicitud === this.solicitud) {
        this.error = (fallo as { error?: { message?: string } }).error?.message
          || 'No se pudieron consultar las facturas.';
      }
    } finally {
      if (solicitud === this.solicitud) this.cargando = false;
    }
  }
  aplicarPago(
  factura: FacturaGuardada,
  pago: { facturaId: number; estadoPago: string; totalPagado: number; saldo: number }
): void {
  factura.estadoPago = pago.estadoPago;
  factura.totalPagado = pago.totalPagado;
  factura.saldo = pago.saldo;
  this.pagoActualizado.emit(pago);
}
anulando = false;
errorAnulacion = '';

abrirAnulacion(dialogo: HTMLDialogElement): void {
  this.errorAnulacion = '';
  const campo = dialogo.querySelector('textarea');
  if (campo) campo.value = '';
  dialogo.showModal();
}

async confirmarAnulacion(
  factura: FacturaGuardada,
  texto: string,
  dialogo: HTMLDialogElement
): Promise<void> {
  if (this.anulando) return;

  const motivo = texto.trim();
  if (!motivo || motivo.length > 500) {
    this.errorAnulacion = 'Escribe el motivo de la anulación, de hasta 500 caracteres.';
    return;
  }

  this.anulando = true;
  this.errorAnulacion = '';

  try {
    await firstValueFrom(
      this.backend.put<void>(
        environment.apiUrlAuth,
        'factura',
        factura.facturaId + '/anular',
        { motivo }
      )
    );

    dialogo.close();
    factura.estadoPago = 'ANULADA';
    factura.saldo = 0;
    this.pagoActualizado.emit({
      facturaId: factura.facturaId,
      estadoPago: factura.estadoPago
    });
  } catch (fallo) {
    const respuesta = fallo as { error?: { message?: string } };
    this.errorAnulacion = respuesta.error?.message
      || 'No se pudo comprobar la anulación. Vuelve a consultar la factura para verificar su estado.';
  } finally {
    this.anulando = false;
  }
}

  descargar(f: FacturaGuardada): void {
    const pdf = new jsPDF();
    const margen = 18;
    const ancho = pdf.internal.pageSize.getWidth() - margen * 2;
    const limite = pdf.internal.pageSize.getHeight() - 20;
    let y = 20;

    const escribir = (texto: string, tamano = 11, negrita = false): void => {
      pdf.setFont('helvetica', negrita ? 'bold' : 'normal');
      pdf.setFontSize(tamano);
      const partes: string[] = pdf.splitTextToSize(texto, ancho);

      for (const parte of partes) {
        if (y > limite) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(parte, margen, y);
        y += tamano * 0.45 + 1;
      }
    };

    escribir('Clínica Veterinaria UNIMINUTO', 16, true);
    escribir('Factura ' + f.facturaId + ' · Cita ' + f.citaId, 14, true);
    escribir('Fecha de emisión: ' + f.fechaEmision);
    escribir('Estado de pago: ' + f.estadoPago);
    y += 3;

    escribir('Propietario: ' + f.propietario);
    escribir('Mascota: ' + f.mascota);
    escribir('Médico: ' + f.medico + ' · Especialidad: ' + f.especialidad);
    y += 3;

    escribir('Servicios y medicamentos entregados', 12, true);
    for (const linea of f.lineas) {
      if (y + 22 > limite) {
        pdf.addPage();
        y = 20;
      }
      escribir(linea.descripcion, 11, true);
      escribir('Cantidad: ' + linea.cantidad
        + ' · Precio unitario: ' + this.pesos(linea.precioUnitario)
        + ' · Subtotal: ' + this.pesos(linea.subtotal), 10);
      escribir('Descuento: ' + this.pesos(linea.descuento)
        + ' · IVA (' + linea.porcentajeIva + '%): ' + this.pesos(linea.valorIva)
        + ' · Total: ' + this.pesos(linea.totalLinea), 10);
      y += 2;
    }

    if (y + 35 > limite) {
      pdf.addPage();
      y = 20;
    }
    escribir('Subtotal: ' + this.pesos(f.subtotal));
    escribir('Descuento: ' + this.pesos(f.descuento));
    escribir('Impuestos: ' + this.pesos(f.impuestos));
    escribir('Total de la factura: ' + this.pesos(f.total), 14, true);
    escribir('Total pagado: ' + this.pesos(f.totalPagado));
escribir('Saldo pendiente: ' + this.pesos(f.saldo), 12, true);

    const paginas = pdf.getNumberOfPages();
    for (let n = 1; n <= paginas; n++) {
      pdf.setPage(n);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(
        'Factura ' + f.facturaId + ' · Valores en COP · Página ' + n + ' de ' + paginas,
        margen, pdf.internal.pageSize.getHeight() - 10
      );
    }

    pdf.save('factura-' + f.facturaId + '-cita-' + f.citaId + '.pdf');
  }
}