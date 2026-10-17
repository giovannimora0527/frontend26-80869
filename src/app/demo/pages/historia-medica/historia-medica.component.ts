
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  HistoriaMedicaService
} from './historia-medica.service';

import { MascotaService } from '../mascota/service/mascota.service';
import {
  MedicoServiceService
} from '../medico/service/medico-service.service';

import { Mascota } from 'src/app/models/mascota';

@Component({
  selector: 'app-historia-medica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historia-medica.component.html',
  styleUrl: './historia-medica.component.scss'
})
export class HistoriaMedicaComponent implements OnInit {

  historias: any[] = [];
  mascotas: Mascota[] = [];
  medicos: any[] = [];
  anotaciones: any[] = [];

  historiaSeleccionada: any = null;

  mascotaId: number | null = null;
  medicoId: number | null = null;
  descripcion = '';

  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';

  constructor(
    private historiaService: HistoriaMedicaService,
    private mascotaService: MascotaService,
    private medicoService: MedicoServiceService
  ) {}

  ngOnInit(): void {
    this.listarHistorias();
    this.listarMascotas();
    this.listarMedicos();
  }

  listarHistorias(): void {
    this.cargando = true;
    this.error = '';

    this.historiaService.listarHistorias().subscribe({
      next: (respuesta) => {
        this.historias = respuesta ?? [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al consultar historias:', err);
        this.error = 'No fue posible cargar las historias clínicas.';
        this.cargando = false;
      }
    });
  }

  listarMascotas(): void {
    this.mascotaService.listarMascotas().subscribe({
      next: (respuesta) => {
        this.mascotas = respuesta ?? [];
      },
      error: (err) => {
        console.error('Error al consultar mascotas:', err);
        this.error = 'No fue posible cargar las mascotas.';
      }
    });
  }

  listarMedicos(): void {
    this.medicoService.listarMedicos().subscribe({
      next: (respuesta) => {
        this.medicos = respuesta ?? [];
      },
      error: (err) => {
        console.error('Error al consultar médicos:', err);
        this.error = 'No fue posible cargar los médicos.';
      }
    });
  }

  crearHistoria(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.mascotaId) {
      this.error = 'Selecciona una mascota.';
      return;
    }

    this.guardando = true;

    this.historiaService.crearHistoria({
      mascotaId: Number(this.mascotaId)
    }).subscribe({
      next: () => {
        this.mensaje = 'Historia clínica creada correctamente.';
        this.mascotaId = null;
        this.guardando = false;
        this.listarHistorias();
      },
      error: (err) => {
        console.error('Error al crear historia:', err);
        this.error =
          err?.error?.message ||
          'No fue posible crear la historia clínica.';
        this.guardando = false;
      }
    });
  }

  verAnotaciones(historia: any): void {
    this.historiaSeleccionada = historia;
    this.anotaciones = [];
    this.error = '';
    this.mensaje = '';

    this.historiaService.listarAnotaciones(
      Number(historia.id)
    ).subscribe({
      next: (respuesta) => {
        this.anotaciones = respuesta ?? [];
      },
      error: (err) => {
        console.error('Error al consultar anotaciones:', err);
        this.error = 'No fue posible cargar las anotaciones.';
      }
    });
  }

  crearAnotacion(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.historiaSeleccionada) {
      this.error = 'Selecciona una historia clínica.';
      return;
    }

    if (!this.medicoId || !this.descripcion.trim()) {
      this.error = 'Selecciona un médico y escribe la descripción.';
      return;
    }

    const mascotaId =
      this.historiaSeleccionada.mascota?.mascotaId;

    if (!mascotaId) {
      this.error = 'No se encontró la mascota de esta historia.';
      return;
    }

    this.guardando = true;

    this.historiaService.crearAnotacion({
      mascotaId: Number(mascotaId),
      historiaId: Number(this.historiaSeleccionada.id),
      medicoId: Number(this.medicoId),
      descripcion: this.descripcion.trim()
    }).subscribe({
      next: () => {
        this.mensaje = 'Anotación médica registrada correctamente.';
        this.descripcion = '';
        this.medicoId = null;
        this.guardando = false;

        this.verAnotaciones(this.historiaSeleccionada);
      },
      error: (err) => {
        console.error('Error al crear anotación:', err);
        this.error =
          err?.error?.message ||
          'No fue posible registrar la anotación.';
        this.guardando = false;
      }
    });
  }
}
