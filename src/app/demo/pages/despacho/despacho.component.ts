import { NgTemplateOutlet } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { ComprobantesDespachoComponent } from './comprobantes-despacho.component';
import { HistorialDespachoComponent } from './historial-despacho.component';
import { SalidasMedicamentoComponent } from './salidas-medicamento.component';

interface FormulaEncontrada {
  formulaId: number;
  fechaGeneracion: string | null;
  propietario: string;
  mascota: string;
  medico: string;
  estado: string;
}

interface LineaDespacho {
  formulaId: number;
  numeroLinea: number;
  medicamento: string;
  cantidadPrescrita: number | null;
  cantidadEntregada: number;
  loteId: number | null;
  numeroLote: string | null;
  disponibleLote: number;
  fechaVence: string | null;
  estado: string;
    dosis: string;
  viaAdministracion: string | null;
  frecuencia: string | null;
  duracionTratamiento: string | null;
  indicaciones: string | null;
}

interface Entrega {
  formulaId: number;
  numeroLinea: number;
  loteId: number;
  cantidad: number;
  claveOperacion: string;
}

interface Comprobante {
  entregaId: number;
  cantidadEntregada: number;
}

@Component({
  selector: 'app-despacho',
  standalone: true,
    imports: [
    FormsModule,
    NgTemplateOutlet,
    ComprobantesDespachoComponent,
    HistorialDespachoComponent,
    SalidasMedicamentoComponent
  ],
  templateUrl: './despacho.component.html'
})
export class DespachoComponent {
  formulaId: number | null = null;
  texto = '';
  fecha = '';
  resultados: FormulaEncontrada[] = [];
  busquedaRealizada = false;
  detalleEnModal = false;

  lineas: LineaDespacho[] = [];
  cantidades: Record<number, number | null> = {};
  ocupado = false;
  error = '';
  mensaje = '';
  reintento: Entrega | null = null;

  private readonly claveLocal = 'clinica.despacho.entregaPendiente';

  constructor(
    private readonly backend: BackendService,
    private readonly modalService: NgbModal
  ) {
    const guardada = sessionStorage.getItem(this.claveLocal);
    if (guardada) {
      try {
        this.reintento = JSON.parse(guardada) as Entrega;
        this.formulaId = this.reintento.formulaId;
      } catch {
        sessionStorage.removeItem(this.claveLocal);
      }
    }
  }

  get bloqueado(): boolean {
    return this.ocupado || this.reintento !== null;
  }

  async buscarCoincidencias(): Promise<void> {
    if (this.bloqueado) return;

    const texto = this.texto.trim();
    this.error = '';
    this.mensaje = '';
    this.resultados = [];
    this.busquedaRealizada = false;
    this.lineas = [];
    this.cantidades = {};
    this.formulaId = null;

    if (!texto && !this.fecha) {
      this.error = 'Escribe un documento, un nombre o selecciona una fecha.';
      return;
    }

    let params = new HttpParams();
    if (texto) params = params.set('texto', texto);
    if (this.fecha) params = params.set('fecha', this.fecha);

    this.ocupado = true;
    try {
      this.resultados = await firstValueFrom(
        this.backend.get<FormulaEncontrada[]>(
          environment.apiUrlAuth, 'despacho', 'formulas/buscar', params
        )
      );
      this.busquedaRealizada = true;
    } catch (fallo) {
      this.error = this.textoError(fallo, 'No se pudieron buscar las fórmulas.');
    } finally {
      this.ocupado = false;
    }
  }

  async buscarPorNumero(): Promise<void> {
    if (this.bloqueado) return;

    this.resultados = [];
    this.busquedaRealizada = false;
    const id = this.formulaId;

    if (id === null || !Number.isSafeInteger(id) || id < 1) {
      this.lineas = [];
      this.mensaje = '';
      this.error = 'Indica un número de fórmula válido.';
      return;
    }

    await this.cargarDetalle(id);
  }

  async abrirResultado(id: number, plantilla: TemplateRef<unknown>): Promise<void> {
    if (this.bloqueado || this.detalleEnModal) return;

    this.formulaId = id;
    this.detalleEnModal = true;

    try {
      await this.cargarDetalle(id);
      if (this.lineas.length === 0) return;

      const ventana = this.modalService.open(plantilla, {
        size: 'lg',
        centered: true,
        scrollable: true,
        backdrop: 'static',
        ariaLabelledBy: 'titulo-modal-despacho',
        beforeDismiss: () => !this.ocupado
      });

      await ventana.result.then(() => undefined, () => undefined);
    } finally {
      this.detalleEnModal = false;
      this.lineas = [];
      this.cantidades = {};
    }
  }

  private async cargarDetalle(id: number): Promise<void> {
        this.cerrarCancelacion();
    this.ocupado = true;
    this.error = '';
    this.mensaje = '';
    this.lineas = [];
    this.cantidades = {};

    try {
      await this.consultar(id);
      if (this.lineas.length === 0) {
        this.mensaje = 'Esta fórmula no tiene líneas para mostrar.';
      }
    } catch (fallo) {
      this.error = this.textoError(fallo, 'No se pudo consultar la fórmula.');
    } finally {
      this.ocupado = false;
    }
  }

  private async consultar(id: number): Promise<void> {
    this.lineas = await firstValueFrom(
      this.backend.get<LineaDespacho[]>(
        environment.apiUrlAuth, 'despacho', 'formula/' + id
      )
    );
    this.cantidades = {};
  }
    async iniciarPreparacion(): Promise<void> {
    const primera = this.lineas[0];
    if (this.bloqueado || !primera || primera.estado !== 'FORMULADO') return;

    this.ocupado = true;
    this.error = '';
    this.mensaje = '';

    try {
      await firstValueFrom(
        this.backend.put<void>(
          environment.apiUrlAuth,
          'despacho',
          'formula/' + primera.formulaId + '/preparacion',
          {}
        )
      );

      for (const linea of this.lineas) {
        linea.estado = 'EN_PREPARACION';
      }

      const resultado = this.resultados.find(
        fila => fila.formulaId === primera.formulaId
      );
      if (resultado) resultado.estado = 'EN_PREPARACION';

      this.mensaje = 'La fórmula ' + primera.formulaId + ' quedó en preparación.';
    } catch (fallo) {
      this.error = this.textoError(
        fallo,
        'No se pudo verificar el cambio. Vuelve a abrir la fórmula para consultar su estado.'
      );
    } finally {
      this.ocupado = false;
    }
  }
    async marcarPendientePorDisponibilidad(): Promise<void> {
    const primera = this.lineas[0];
    if (!primera || this.bloqueado) return;

    this.ocupado = true;
    this.error = '';
    this.mensaje = '';

    try {
      await firstValueFrom(
        this.backend.put<void>(
          environment.apiUrlAuth,
          'despacho',
          'formula/' + primera.formulaId + '/pendiente-disponibilidad',
          {}
        )
      );

const estado = 'PENDIENTE_DISPONIBILIDAD';

      for (const linea of this.lineas) {
        linea.estado = estado;
      }

      const fila = this.resultados.find(
        resultado => resultado.formulaId === primera.formulaId
      );
      if (fila) fila.estado = estado;

      this.mensaje = 'La fórmula ' + primera.formulaId
        + ' quedó pendiente por disponibilidad.';
    } catch (fallo) {
      this.error = this.textoError(
        fallo,
        'No se pudo verificar el cambio. Vuelve a consultar la fórmula.'
      );
    } finally {
      this.ocupado = false;
    }
  }
    cancelacionFormulaId: number | null = null;
  motivoCancelacion = '';

  puedeCancelar(): boolean {
    const estado = this.lineas[0]?.estado;
    return (estado === 'EN_PREPARACION' || estado === 'PENDIENTE_DISPONIBILIDAD')
      && this.lineas.every(linea => linea.cantidadEntregada === 0);
  }

  abrirCancelacion(): void {
    const formula = this.lineas[0];
    if (!formula || this.bloqueado || !this.puedeCancelar()) return;

    this.cancelacionFormulaId = formula.formulaId;
    this.motivoCancelacion = '';
    this.error = '';
    this.mensaje = '';
  }

  cerrarCancelacion(): void {
    this.cancelacionFormulaId = null;
    this.motivoCancelacion = '';
  }

  async confirmarCancelacion(): Promise<void> {
    const id = this.cancelacionFormulaId;
    const motivo = this.motivoCancelacion.trim();

    if (this.bloqueado || id === null || id !== this.lineas[0]?.formulaId
        || !this.puedeCancelar()) return;

    if (!motivo || motivo.length > 100) {
      this.error = 'Escribe un motivo de máximo 100 caracteres.';
      return;
    }

    this.ocupado = true;
    this.error = '';
    this.mensaje = '';

    try {
      await firstValueFrom(
        this.backend.put<void>(
          environment.apiUrlAuth, 'despacho',
          'formula/' + id + '/cancelacion', { motivo }
        )
      );

      for (const linea of this.lineas) {
        linea.estado = 'CANCELADO';
      }
      this.resultados = this.resultados.filter(fila => fila.formulaId !== id);
      this.cerrarCancelacion();
      this.mensaje = 'Se canceló el despacho de la fórmula ' + id + '.';
    } catch (fallo) {
      this.error = this.textoError(fallo, 'No se pudo verificar la cancelación.');
    } finally {
      this.ocupado = false;
    }
  }

  pendiente(linea: LineaDespacho): number | null {
    if (linea.cantidadPrescrita === null) return null;
    return Math.max(0, linea.cantidadPrescrita - linea.cantidadEntregada);
  }

  maximo(linea: LineaDespacho): number {
    if (linea.estado === 'CANCELADO' || linea.estado === 'DESPACHADO') return 0;
    return Math.min(this.pendiente(linea) ?? 0, linea.disponibleLote);
  }

  confirmar(linea: LineaDespacho): void {
    if (this.bloqueado || linea.loteId === null) return;

    const cantidad = this.cantidades[linea.numeroLinea];
    const limite = this.maximo(linea);

    if (cantidad == null || !Number.isInteger(cantidad)
        || cantidad < 1 || cantidad > limite) {
      this.error = 'Indica una cantidad entera entre 1 y ' + limite + '.';
      return;
    }

    const entrega: Entrega = {
      formulaId: linea.formulaId,
      numeroLinea: linea.numeroLinea,
      loteId: linea.loteId,
      cantidad,
      claveOperacion: crypto.randomUUID()
    };

    sessionStorage.setItem(this.claveLocal, JSON.stringify(entrega));
    this.reintento = entrega;
    void this.enviar(entrega);
  }

  async enviar(entrega: Entrega): Promise<void> {
    if (this.ocupado) return;

    this.ocupado = true;
    this.error = '';
    this.mensaje = '';

    try {
      const recibo = await firstValueFrom(
        this.backend.post<Comprobante>(
          environment.apiUrlAuth, 'despacho', 'confirmar', entrega
        )
      );

      sessionStorage.removeItem(this.claveLocal);
      this.reintento = null;
      this.formulaId = entrega.formulaId;
      this.lineas = [];
      this.mensaje = 'Entrega #' + recibo.entregaId
        + ' registrada. Unidades entregadas: ' + recibo.cantidadEntregada + '.';

      try {
        await this.consultar(entrega.formulaId);

        const estado = this.lineas[0]?.estado;
        if (estado === 'DESPACHADO' || estado === 'CANCELADO') {
          this.resultados = this.resultados.filter(
            fila => fila.formulaId !== entrega.formulaId
          );
        } else if (estado) {
          for (const fila of this.resultados) {
            if (fila.formulaId === entrega.formulaId) fila.estado = estado;
          }
        }
      } catch {
        this.busquedaRealizada = false;
        this.resultados = [];
        this.error = 'La entrega quedó registrada. Vuelve a buscar la fórmula para actualizar el saldo.';
      }
    } catch (fallo) {
      const estado = (fallo as { status?: number }).status;

      if (estado && estado >= 400 && estado < 500) {
        sessionStorage.removeItem(this.claveLocal);
        this.reintento = null;
        this.lineas = [];
        this.error = this.textoError(fallo, 'La entrega fue rechazada.')
          + ' Vuelve a consultar la fórmula.';
      } else {
        this.error = 'No se pudo comprobar la respuesta. Pulsa Comprobar la última entrega.';
      }
    } finally {
      this.ocupado = false;
    }
  }

  private textoError(fallo: unknown, porDefecto: string): string {
    return (fallo as { error?: { message?: string } }).error?.message || porDefecto;
  }
}