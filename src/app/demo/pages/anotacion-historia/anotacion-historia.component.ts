import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Cliente } from 'src/app/models/cliente';
import { HistoriaResumen } from 'src/app/models/historia';
import { Mascota } from 'src/app/models/mascota';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { mensajeDeError } from 'src/app/utils/api-error';
import { ClienteService } from '../cliente/service/cliente.service';
import { AnotacionesTablaComponent } from '../historia-medica/anotaciones-tabla/anotaciones-tabla.component';
import { HistoriaService } from '../historia-medica/service/historia.service';
import { MascotaService } from '../mascota/service/mascota.service';

/**
 * Consulta del histórico de anotaciones: se elige Cliente → Mascota → Historia clínica (combos
 * dependientes) y se muestra el DataTable de anotaciones de esa historia (filtro, orden por
 * fecha, paginación y detalle). Las anotaciones nuevas se agregan desde el modal "Ver" de la
 * pantalla de historias clínicas.
 */
@Component({
  selector: 'app-anotacion-historia',
  imports: [CommonModule, ReactiveFormsModule, AnotacionesTablaComponent],
  templateUrl: './anotacion-historia.component.html',
  styleUrl: './anotacion-historia.component.scss'
})
export class AnotacionHistoriaComponent implements OnInit {
  /** Formulario con los combos dependientes. */
  selectorForm!: FormGroup;
  /** Clientes para el combo. */
  clientes: Cliente[] = [];
  /** Mascotas del cliente elegido. */
  mascotas: Mascota[] = [];
  /** Historias clínicas de la mascota elegida. */
  historias: HistoriaResumen[] = [];
  /** Historia cuyas anotaciones se muestran. */
  historiaId: number | null = null;

  /**
   * @param clienteService Servicio de clientes.
   * @param mascotaService Servicio de mascotas.
   * @param historiaService Servicio de historias clínicas.
   * @param notificacion Mensajes al usuario.
   * @param formBuilder Constructor de formularios reactivos.
   * @param destroyRef Referencia para cancelar suscripciones.
   */
  constructor(
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly historiaService: HistoriaService,
    private readonly notificacion: NotificacionService,
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {}

  /** Carga los clientes y enlaza los combos dependientes Cliente → Mascota → Historia. */
  ngOnInit(): void {
    this.selectorForm = this.formBuilder.group({ clienteId: [null], mascotaId: [null], historiaId: [null] });
    this.clienteService.listarClientes().subscribe({
      next: (datos) => (this.clientes = datos),
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });

    this.selectorForm.controls['clienteId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((clienteId: number | null) => {
      this.selectorForm.controls['mascotaId'].reset(null);
      this.mascotas = [];
      if (clienteId) {
        this.mascotaService.listarPorCliente(Number(clienteId)).subscribe({
          next: (datos) => (this.mascotas = datos),
          error: (error) => this.notificacion.error(mensajeDeError(error))
        });
      }
    });

    this.selectorForm.controls['mascotaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((mascotaId: number | null) => {
      this.selectorForm.controls['historiaId'].reset(null);
      this.historias = [];
      if (mascotaId) {
        this.historiaService.listar({ mascotaId: Number(mascotaId), page: 0, size: 100, sortBy: 'fechaHora', sortDir: 'desc' }).subscribe({
          next: (datos) => (this.historias = datos.content),
          error: (error) => this.notificacion.error(mensajeDeError(error))
        });
      }
    });

    this.selectorForm.controls['historiaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id: number | null) => {
      this.historiaId = id ? Number(id) : null;
    });
  }
}
