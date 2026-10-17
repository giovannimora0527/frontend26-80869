import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Cliente } from 'src/app/models/cliente';
import { Mascota } from 'src/app/models/mascota';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { mensajeDeError } from 'src/app/utils/api-error';
import { ClienteService } from '../cliente/service/cliente.service';
import { AnotacionesTablaComponent } from '../historia-medica/anotaciones-tabla/anotaciones-tabla.component';
import { MascotaService } from '../mascota/service/mascota.service';

/**
 * Consulta del histórico de anotaciones de una mascota: se elige Cliente → Mascota y se muestra
 * el DataTable de anotaciones (filtro, orden por fecha, paginación y detalle). Las anotaciones
 * nuevas se agregan desde el modal "Ver" de la historia clínica.
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
  /** Mascota cuyo histórico se muestra. */
  mascotaId: number | null = null;

  /**
   * @param clienteService Servicio de clientes.
   * @param mascotaService Servicio de mascotas.
   * @param notificacion Mensajes al usuario.
   * @param formBuilder Constructor de formularios reactivos.
   * @param destroyRef Referencia para cancelar suscripciones.
   */
  constructor(
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly notificacion: NotificacionService,
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {}

  /** Carga los clientes y enlaza el combo dependiente Cliente → Mascota. */
  ngOnInit(): void {
    this.selectorForm = this.formBuilder.group({ clienteId: [null], mascotaId: [null] });
    this.clienteService.listarClientes().subscribe({ next: (d) => (this.clientes = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
    this.selectorForm.controls['clienteId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((clienteId: number | null) => {
      this.selectorForm.controls['mascotaId'].reset(null);
      this.mascotas = [];
      this.mascotaId = null;
      if (clienteId) {
        this.mascotaService.listarPorCliente(Number(clienteId)).subscribe({ next: (d) => (this.mascotas = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
      }
    });
    this.selectorForm.controls['mascotaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id: number | null) => {
      this.mascotaId = id ? Number(id) : null;
    });
  }
}
