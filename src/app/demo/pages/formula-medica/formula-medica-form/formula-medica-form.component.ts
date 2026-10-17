import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Cita } from 'src/app/models/cita';
import { Cliente } from 'src/app/models/cliente';
import { FormulaDetalle, FormulaRq } from 'src/app/models/formula-medica';
import { Mascota } from 'src/app/models/mascota';
import { Medicamento } from 'src/app/models/medicamento';
import { Medico } from 'src/app/models/medico';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { mensajeDeError } from 'src/app/utils/api-error';
import { hoy } from 'src/app/utils/fechas';
import { noEnBlanco } from 'src/app/utils/validadores';
import { CitaService } from '../../cita/service/cita.service';
import { ClienteService } from '../../cliente/service/cliente.service';
import { MascotaService } from '../../mascota/service/mascota.service';
import { MedicamentoService } from '../../medicamento/service/medicamento.service';
import { MedicoServiceService } from '../../medico/service/medico-service.service';
import { FormulaMedicaService } from '../service/formula-medica.service';

/**
 * Formulario reactivo para crear o editar una fórmula médica.
 * Al crear: Cliente → Mascota del cliente → Cita de esa mascota (combos dependientes).
 * Al editar solo cambian medicamento, fecha de emisión, dosis, frecuencia, duración e indicaciones.
 */
@Component({
  selector: 'app-formula-medica-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formula-medica-form.component.html',
  styleUrls: ['./formula-medica-form.component.scss']
})
export class FormulaMedicaFormComponent implements OnInit {
  /** Formulario reactivo. */
  form!: FormGroup;
  /** true cuando se edita una fórmula existente. */
  esEdicion = false;
  /** Id de la fórmula que se edita. */
  formulaId: number | null = null;
  /** Detalle de la fórmula en edición (solo lectura de cita, mascota y veterinario). */
  detalle: FormulaDetalle | null = null;
  /** Evita envíos dobles. */
  guardando = false;
  /** Clientes para el combo. */
  clientes: Cliente[] = [];
  /** Mascotas del cliente elegido. */
  mascotas: Mascota[] = [];
  /** Citas de la mascota elegida (sin las canceladas). */
  citas: Cita[] = [];
  /** Veterinarios para el combo. */
  medicos: Medico[] = [];
  /** Medicamentos para el combo. */
  medicamentos: Medicamento[] = [];
  /** Fecha mínima de emisión: la fecha de la cita elegida. */
  fechaMinima = '';

  /**
   * @param router Navegación.
   * @param route Ruta activa (id al editar).
   * @param formulaService Servicio de fórmulas.
   * @param citaService Servicio de citas.
   * @param clienteService Servicio de clientes.
   * @param mascotaService Servicio de mascotas.
   * @param medicoService Servicio de veterinarios.
   * @param medicamentoService Servicio de medicamentos.
   * @param notificacion Mensajes al usuario.
   * @param formBuilder Constructor de formularios reactivos.
   * @param destroyRef Referencia para cancelar suscripciones.
   */
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly formulaService: FormulaMedicaService,
    private readonly citaService: CitaService,
    private readonly clienteService: ClienteService,
    private readonly mascotaService: MascotaService,
    private readonly medicoService: MedicoServiceService,
    private readonly medicamentoService: MedicamentoService,
    private readonly notificacion: NotificacionService,
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {}

  /** Crea el formulario, carga los combos y, si hay id en la ruta, la fórmula a editar. */
  ngOnInit(): void {
    this.form = this.formBuilder.group({
      clienteId: [null, Validators.required],
      mascotaId: [null, Validators.required],
      citaId: [null, Validators.required],
      medicoId: [null, Validators.required],
      medicamentoId: [null, Validators.required],
      fechaEmision: [hoy(), Validators.required],
      dosis: ['', [Validators.required, noEnBlanco(), Validators.maxLength(255)]],
      frecuencia: ['', [Validators.required, noEnBlanco(), Validators.maxLength(100)]],
      duracionDias: [null, [Validators.required, Validators.min(1), Validators.max(365)]],
      indicaciones: ['', [Validators.required, noEnBlanco()]]
    });

    this.medicamentoService.listarMedicamentos().subscribe({ next: (d) => (this.medicamentos = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.formulaId = Number(id);
      this.cargarParaEdicion(this.formulaId);
      return;
    }

    this.clienteService.listarClientes().subscribe({ next: (d) => (this.clientes = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
    this.medicoService.listarMedicos().subscribe({ next: (d) => (this.medicos = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });

    // Combos dependientes: Cliente → Mascotas del cliente → Citas de la mascota.
    this.form.controls['clienteId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((clienteId: number | null) => {
      this.form.controls['mascotaId'].reset(null);
      this.mascotas = [];
      if (clienteId) {
        this.mascotaService.listarPorCliente(Number(clienteId)).subscribe({
          next: (d) => (this.mascotas = d),
          error: (e) => this.notificacion.error(mensajeDeError(e))
        });
      }
    });
    this.form.controls['mascotaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((mascotaId: number | null) => {
      this.form.controls['citaId'].reset(null);
      this.citas = [];
      this.fechaMinima = '';
      if (mascotaId) {
        this.citaService.listar({ mascotaId: Number(mascotaId), page: 0, size: 100, sortBy: 'fechaHora', sortDir: 'desc' }).subscribe({
          next: (d) => (this.citas = d.content.filter((c) => c.estado !== 'CANCELADA')),
          error: (e) => this.notificacion.error(mensajeDeError(e))
        });
      }
    });
    // Al elegir la cita se hereda el veterinario y se fija la fecha mínima de emisión.
    this.form.controls['citaId'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((citaId: number | null) => {
      const cita = this.citas.find((c) => c.id === Number(citaId));
      if (cita) {
        this.fechaMinima = cita.fecha;
        this.form.patchValue({ medicoId: cita.medicoId, fechaEmision: cita.fecha > hoy() ? cita.fecha : hoy() });
      }
    });
  }

  /**
   * Carga la fórmula y bloquea los campos que no se pueden editar.
   *
   * @param id Id de la fórmula.
   */
  private cargarParaEdicion(id: number): void {
    ['clienteId', 'mascotaId', 'citaId', 'medicoId'].forEach((campo) => {
      this.form.controls[campo].clearValidators();
      this.form.controls[campo].updateValueAndValidity({ emitEvent: false });
    });
    this.formulaService.consultar(id).subscribe({
      next: (datos) => {
        this.detalle = datos;
        this.fechaMinima = datos.citaFechaHora.substring(0, 10);
        this.form.patchValue({
          medicamentoId: datos.medicamentoId,
          fechaEmision: datos.fechaEmision,
          dosis: datos.dosis,
          frecuencia: datos.frecuencia,
          duracionDias: datos.duracionDias,
          indicaciones: datos.indicaciones
        });
        if (!datos.activo) {
          this.form.disable();
        }
      },
      error: (error) => {
        this.notificacion.error(mensajeDeError(error));
        void this.router.navigate(['/inicio/formulas-medicas']);
      }
    });
  }

  /** @returns Controles del formulario para la plantilla. */
  get f(): { [clave: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Valida el formulario y crea o actualiza la fórmula. */
  guardar(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = (this.form as FormGroup).getRawValue();
    if (this.fechaMinima && v.fechaEmision < this.fechaMinima) {
      this.notificacion.error('La fecha de emisión no puede ser anterior a la fecha de la consulta.');
      return;
    }
    const rq: FormulaRq = {
      medicamentoId: Number(v.medicamentoId),
      fechaEmision: v.fechaEmision,
      dosis: String(v.dosis).trim(),
      frecuencia: String(v.frecuencia).trim(),
      duracionDias: Number(v.duracionDias),
      indicaciones: String(v.indicaciones).trim()
    };
    if (!this.esEdicion) {
      rq.citaId = Number(v.citaId);
      rq.mascotaId = Number(v.mascotaId);
      rq.medicoId = Number(v.medicoId);
    }
    this.guardando = true;
    const solicitud = this.esEdicion && this.formulaId
      ? this.formulaService.actualizar(this.formulaId, rq)
      : this.formulaService.crear(rq);
    solicitud.subscribe({
      next: () => {
        this.guardando = false;
        this.notificacion.exito(this.esEdicion ? 'La fórmula fue actualizada correctamente.' : 'La fórmula fue creada correctamente.');
        void this.router.navigate(['/inicio/formulas-medicas']);
      },
      error: (error) => {
        this.guardando = false;
        this.notificacion.error(mensajeDeError(error));
      }
    });
  }

  /** Vuelve al listado sin guardar. */
  cancelar(): void {
    void this.router.navigate(['/inicio/formulas-medicas']);
  }
}
