
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitaService } from './cita.service';
import { MascotaService } from '../mascota/service/mascota.service';
import { MedicoServiceService } from '../medico/service/medico-service.service';
import { Mascota } from 'src/app/models/mascota';

@Component({
selector: 'app-cita',
standalone: true,
imports: [CommonModule, FormsModule],
templateUrl: './cita.component.html',
styleUrl: './cita.component.scss'
})
export class CitaComponent implements OnInit {
citas: any[] = [];
mascotas: Mascota[] = [];
medicos: any[] = [];

cargando = false;
guardando = false;
error = '';
mensaje = '';
editando = false;

formulario: any = {
    id: null,
    mascotaId: null,
    medicoId: null,
    fechaHora: '',
    motivo: ''
};

constructor(
    private citaService: CitaService,
    private mascotaService: MascotaService,
    private medicoService: MedicoServiceService
) {}

ngOnInit(): void {
    this.listarCitas();
    this.listarMascotas();
    this.listarMedicos();
}

listarCitas(): void {
    this.cargando = true;

    this.citaService.listarCitas().subscribe({
    next: (respuesta) => {
        this.citas = respuesta ?? [];
        this.cargando = false;
    },
    error: (err) => {
        console.error('Error al consultar las citas:', err);
        this.error = 'No fue posible cargar las citas.';
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
        console.error('Error al consultar las mascotas:', err);
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
        console.error('Error al consultar los médicos:', err);
        this.error = 'No fue posible cargar los médicos.';
    }
    });
}

guardarCita(): void {
    this.error = '';
    this.mensaje = '';

    if (
    !this.formulario.mascotaId ||
    !this.formulario.medicoId ||
    !this.formulario.fechaHora ||
    !this.formulario.motivo?.trim()
    ) {
    this.error = 'Completa todos los campos del formulario.';
    return;
    }

    const fechaHora = this.formulario.fechaHora.length === 16
    ? `${this.formulario.fechaHora}:00`
    : this.formulario.fechaHora;

    const cita = {
    id: this.formulario.id,
    mascotaId: Number(this.formulario.mascotaId),
    medicoId: Number(this.formulario.medicoId),
    fechaHora: fechaHora,
    motivo: this.formulario.motivo.trim()
    };

    this.guardando = true;

    const peticion = this.editando
    ? this.citaService.actualizarCita(cita)
    : this.citaService.crearCita(cita);

    peticion.subscribe({
    next: () => {
        this.mensaje = this.editando
        ? 'Cita actualizada correctamente.'
        : 'Cita creada correctamente.';

        this.guardando = false;
        this.cancelarEdicion();
        this.listarCitas();
    },
    error: (err) => {
        console.error('Error al guardar la cita:', err);

        this.error =
        err?.error?.message ||
        'No fue posible guardar la cita. Verifica los datos e inténtalo nuevamente.';

        this.guardando = false;
    }
    });
    }

editarCita(cita: any): void {
    this.formulario = {
    id: cita.id,
    mascotaId: cita.mascota?.mascotaId != null
        ? Number(cita.mascota.mascotaId)
        : null,
    medicoId: cita.medico?.id != null
        ? Number(cita.medico.id)
        : null,
    fechaHora: cita.fechaHora
        ? cita.fechaHora.slice(0, 16)
        : '',
    motivo: cita.motivo ?? ''
    };

    console.log('Cita seleccionada para editar:', cita);
    console.log('Identificador del médico:', this.formulario.medicoId);

    this.editando = true;
    this.error = '';
    this.mensaje = '';

    window.scrollTo({
    top: 0,
    behavior: 'smooth'
    });
}

cancelarEdicion(): void {
    this.formulario = {
    id: null,
    mascotaId: null,
    medicoId: null,
    fechaHora: '',
    motivo: ''
    };

    this.editando = false;
    this.error = '';
}
}
