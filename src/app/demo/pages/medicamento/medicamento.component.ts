import { getJwtPayload } from 'src/app/utils/jwt.util';
import { ImportarInventarioComponent } from './service/importar-inventario.component';
import { VerLotesComponent } from './ver-lotes.component';
import { NuevoProductoComponent } from './nuevo-producto.component';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, TemplateRef } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize, Observable } from 'rxjs';
import {
  InventarioResumen,
  MedicamentoService
} from './service/medicamento.service';

const PRECIO_MAXIMO = 9999999999.99;
const ENTERO_MAXIMO = 2147483647;

const validadoresPrecio = [
  Validators.required,
  Validators.min(0),
  Validators.max(PRECIO_MAXIMO),
  Validators.pattern(/^\d+(\.\d{1,2})?$/)
];

@Component({
  selector: 'app-medicamento',
  imports: [CommonModule, ReactiveFormsModule, NuevoProductoComponent, VerLotesComponent, ImportarInventarioComponent],
  templateUrl: './medicamento.component.html',
  styleUrl: './medicamento.component.scss'
})
export class MedicamentoComponent implements OnInit {
  get puedeGestionarInventario(): boolean {
    return getJwtPayload()?.rol?.trim().toLowerCase() === 'administrador';
  }
  inventario: InventarioResumen[] = [];
  busqueda = '';
  cargando = false;
  mensajeError = '';
  mensajeExito = '';

  productoSeleccionado: InventarioResumen | null = null;
  guardando = false;
  errorFormulario = '';
  hoy = '';

  private ventana?: NgbModalRef;

  readonly formulario = new FormGroup({
    precioVenta: new FormControl<number | null>(null, validadoresPrecio),
    stockMinimo: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(ENTERO_MAXIMO),
      Validators.pattern(/^\d+$/)
    ])
  });

  readonly formularioLote = new FormGroup({
    numeroLote: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(60),
        Validators.pattern(/\S/)
      ]
    }),
    fechaCompra: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    fechaVence: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    precioCompra: new FormControl<number | null>(null, validadoresPrecio),
    cantidadIngresada: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(ENTERO_MAXIMO),
      Validators.pattern(/^\d+$/)
    ])
  });

  constructor(
    private readonly medicamentoService: MedicamentoService,
    private readonly modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.cargarInventario();
  }

  cargarInventario(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.medicamentoService.listarInventario()
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: datos => {
          if (Array.isArray(datos)) {
            this.inventario = datos;
          } else {
            this.mensajeError = 'El servidor devolvió un formato de inventario inesperado.';
          }
        },
        error: () => {
          this.mensajeError = 'No se pudo cargar el inventario.';
        }
      });
  }

  get productosFiltrados(): InventarioResumen[] {
    const termino = this.normalizar(this.busqueda.trim());
    return this.inventario.filter(producto =>
      this.normalizar(producto.nombre).includes(termino)
    );
  }

  abrirEdicion(producto: InventarioResumen, plantilla: TemplateRef<unknown>): void {
    this.formulario.reset({
      precioVenta: producto.precioVenta,
      stockMinimo: producto.stockMinimo
    });
    this.abrirModal(producto, plantilla, 'titulo-editar-producto');
  }

  abrirLote(producto: InventarioResumen, plantilla: TemplateRef<unknown>): void {
    this.hoy = this.fechaLocalDeHoy();
    this.formularioLote.reset({
      numeroLote: '',
      fechaCompra: this.hoy,
      fechaVence: '',
      precioCompra: null,
      cantidadIngresada: null
    });
    const controlVencimiento = this.formularioLote.controls.fechaVence;
    controlVencimiento.setValidators(
      producto.tipoProducto === 'UTENSILIO' ? [] : [Validators.required]
    );
    controlVencimiento.updateValueAndValidity();
    this.abrirModal(producto, plantilla, 'titulo-registrar-lote');
  }

  guardarCambios(): void {
    const producto = this.productoSeleccionado;
    if (!producto || this.guardando) {
      return;
    }

    this.errorFormulario = '';
    this.formulario.markAllAsTouched();

    const { precioVenta, stockMinimo } = this.formulario.getRawValue();
    if (this.formulario.invalid || precioVenta === null || stockMinimo === null) {
      return;
    }

    this.guardar(
      this.medicamentoService.actualizarPrecioYStockMinimo(
        producto.id,
        { precioVenta, stockMinimo }
      ),
      `Se actualizaron el precio y el stock mínimo de ${producto.nombre}.`,
      'No se pudieron guardar los cambios.'
    );
  }

  guardarLote(): void {
    const producto = this.productoSeleccionado;
    if (!producto || this.guardando) {
      return;
    }

    this.errorFormulario = '';
    this.formularioLote.markAllAsTouched();

    const { numeroLote, fechaCompra, fechaVence, precioCompra, cantidadIngresada } =
      this.formularioLote.getRawValue();

    if (this.formularioLote.invalid || precioCompra === null || cantidadIngresada === null) {
      return;
    }

    // Los controles date entregan las fechas en formato AAAA-MM-DD.
    this.hoy = this.fechaLocalDeHoy();
    if (fechaCompra > this.hoy) {
      this.errorFormulario = 'La fecha de compra no puede ser posterior a hoy.';
      return;
    }

    if (fechaVence && fechaVence < this.hoy) {
      this.errorFormulario = 'El lote debe estar vigente el día del ingreso.';
      return;
    }

    const lote = numeroLote.trim();
    this.guardar(
      this.medicamentoService.registrarLote(producto.id, {
        numeroLote: lote,
        fechaCompra,
        fechaVence: fechaVence || null,
        precioCompra,
        cantidadIngresada
      }),
      `Se registró el lote ${lote} de ${producto.nombre} con ${cantidadIngresada} unidades.`,
      'No se pudo registrar el lote. Revisa los datos y el número de lote.'
    );
  }

  private abrirModal(
    producto: InventarioResumen,
    plantilla: TemplateRef<unknown>,
    tituloId: string
  ): void {
    this.productoSeleccionado = producto;
    this.errorFormulario = '';
    this.mensajeExito = '';

    this.ventana = this.modalService.open(plantilla, {
      centered: true,
      ariaLabelledBy: tituloId,
      beforeDismiss: () => !this.guardando
    });
  }

  private guardar(
    solicitud: Observable<void>,
    mensajeExito: string,
    mensajeFallo: string
  ): void {
    this.guardando = true;

    solicitud.pipe(finalize(() => this.guardando = false)).subscribe({
      next: () => {
        this.ventana?.close();
        this.mensajeExito = mensajeExito;
        this.cargarInventario();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.errorFormulario =
            'Se perdió la conexión. Consulta el inventario antes de volver a enviar.';
          return;
        }

        const detalle = error.error?.message || error.error?.mensaje;
        this.errorFormulario =
          typeof detalle === 'string' && error.status < 500 ? detalle : mensajeFallo;
      }
    });
  }

  private fechaLocalDeHoy(): string {
    const fecha = new Date();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  alertaVencimiento(fecha: string | null): string {
    if (!fecha) return '';

    // El backend envía una fecha de calendario en formato AAAA-MM-DD.
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    if (!partes) return '';

    const hoy = new Date();
    const inicio = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fin = Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
    const dias = (fin - inicio) / 86400000;

    if (dias < 0 || dias > 30) return '';
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Próximo a vencer · mañana';
    return `Próximo a vencer · ${dias} días`;
  }

  private normalizar(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}