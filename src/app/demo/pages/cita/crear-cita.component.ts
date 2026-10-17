import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import {
  ClinicaVeterinariaService,
  CitaRq,
  ErrorResponse,
  Medico
} from '../../../services/clinica-veterinaria.service';
import { Cliente } from '../../../models/cliente';
import { Mascota } from '../../../models/mascota';

@Component({
  selector: 'app-crear-cita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-cita.component.html'
})
export class CrearCitaComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private mascotasSubscription?: Subscription;

  private readonly fechaFuturaValidator: ValidatorFn = (
    control: AbstractControl<string>
  ): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const fecha = new Date(control.value);
    return Number.isNaN(fecha.getTime()) || fecha.getTime() <= Date.now()
      ? { fechaNoFutura: true }
      : null;
  };

  private readonly noWhitespaceValidator: ValidatorFn = (
    control: AbstractControl<string>
  ): ValidationErrors | null =>
    control.value.trim().length > 0 ? null : { soloEspacios: true };

  readonly form = this.formBuilder.group({
    clienteId: [null as number | null, Validators.required],
    mascotaId: [{ value: null as number | null, disabled: true }, Validators.required],
    medicoId: [{ value: null as number | null, disabled: true }, Validators.required],
    fechaHora: ['', [Validators.required, this.fechaFuturaValidator]],
    motivo: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(500), this.noWhitespaceValidator]
    ]
  });

  clientes: Cliente[] = [];
  mascotas: Mascota[] = [];
  medicos: Medico[] = [];
  cargandoMascotas = false;
  guardando = false;
  readonly fechaMinima = this.formatoFechaLocal(new Date());

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly clinicaService: ClinicaVeterinariaService
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarMedicos();
  }

  cambiarCliente(): void {
    const clienteId = this.form.controls.clienteId.value;
    this.mascotas = [];
    this.cargandoMascotas = false;
    this.form.controls.mascotaId.reset(null);
    this.form.controls.mascotaId.disable();
    this.form.controls.medicoId.reset(null);
    this.form.controls.medicoId.disable();
    this.mascotasSubscription?.unsubscribe();

    if (clienteId === null) {
      return;
    }

    this.cargandoMascotas = true;
    this.mascotasSubscription = this.clinicaService.buscarMascotasPorCliente(clienteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.mascotas = respuesta.data;
          this.form.controls.mascotaId.enable();
          this.form.controls.medicoId.enable();
          this.cargandoMascotas = false;
        },
        error: (error: unknown) => {
          this.cargandoMascotas = false;
          this.mostrarError(error);
        }
      });
  }

  enviar(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }

    const { mascotaId, medicoId, fechaHora, motivo } = this.form.getRawValue();
    if (mascotaId === null || medicoId === null) {
      this.form.markAllAsTouched();
      return;
    }

    const cita: CitaRq = {
      mascotaId,
      medicoId,
      fechaHora: this.fechaLocalDateTime(fechaHora),
      motivo: motivo.trim()
    };

    this.guardando = true;
    this.clinicaService.crearCita(cita)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando = false;
          void Swal.fire({
            icon: 'success',
            title: 'Cita creada',
            text: 'La cita médica se registró correctamente.'
          });
          this.form.reset({
            clienteId: null,
            mascotaId: null,
            medicoId: null,
            fechaHora: '',
            motivo: ''
          });
          this.form.controls.mascotaId.disable();
          this.form.controls.medicoId.disable();
          this.mascotas = [];
        },
        error: (error: unknown) => {
          this.guardando = false;
          this.mostrarError(error);
        }
      });
  }

  nombreCliente(cliente: Cliente): string {
    return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
      `Cliente ${cliente.id ?? ''}`.trim();
  }

  nombreMedico(medico: Medico): string {
    return medico.nombreCompleto?.trim() ||
      `${medico.nombres ?? ''} ${medico.apellidos ?? ''}`.trim() ||
      medico.nombre?.trim() ||
      `Médico ${medico.medicoId ?? medico.id ?? ''}`.trim();
  }

  idMedico(medico: Medico): number | null {
    return medico.medicoId ?? medico.id ?? null;
  }

  private cargarClientes(): void {
    this.clinicaService.listarClientes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.clientes = respuesta.data;
        },
        error: (error: unknown) => this.mostrarError(error)
      });
  }

  private cargarMedicos(): void {
    this.clinicaService.listarMedicos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.medicos = respuesta.data;
        },
        error: (error: unknown) => this.mostrarError(error)
      });
  }

  private fechaLocalDateTime(valor: string): string {
    return valor.length === 16 ? `${valor}:00` : valor;
  }

  private formatoFechaLocal(fecha: Date): string {
    const dosDigitos = (valor: number): string => String(valor).padStart(2, '0');
    return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
      `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
  }

  private mostrarError(error: unknown): void {
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo completar la solicitud',
      text: this.mensajeError(error)
    });
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const respuesta: unknown = error.error;
      if (this.esErrorResponse(respuesta) && respuesta.message.trim()) {
        return respuesta.message;
      }
      if (error.status === 400) {
        return 'Los datos enviados no son válidos. Revisa la información e inténtalo de nuevo.';
      }
      if (error.status === 409) {
        return 'La solicitud entra en conflicto con un registro existente. Revisa la disponibilidad e inténtalo de nuevo.';
      }
    }

    return 'Ocurrió un error de comunicación con el servidor. Inténtalo de nuevo.';
  }

  private esErrorResponse(respuesta: unknown): respuesta is ErrorResponse {
    return typeof respuesta === 'object' &&
      respuesta !== null &&
      'status' in respuesta &&
      typeof respuesta.status === 'number' &&
      'error' in respuesta &&
      typeof respuesta.error === 'string' &&
      'message' in respuesta &&
      typeof respuesta.message === 'string';
  }
}
