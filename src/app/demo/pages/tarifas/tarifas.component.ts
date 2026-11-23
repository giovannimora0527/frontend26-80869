import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface ServicioTarifado {
  id: number;
  especialidad: string;
  nombreServicio: string;
  activo: boolean;
}

interface Vigencia {
  id: number;
  vigenteDesde: string;
  valorBase: number;
  porcentajeIva: number;
  usuario: string;
  fechaRegistro: string;
  motivo: string;
}

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tarifas.component.html'
})
export class TarifasComponent implements OnInit {
  servicios: ServicioTarifado[] = [];
  historial: Vigencia[] = [];
  servicioId: number | null = null;

  fecha = '';
  valor: number | null = null;
  iva: number | null = null;
  motivo = '';

  ocupado = false;
  historialCargado = false;
  error = '';
  mensaje = '';

  constructor(private readonly backend: BackendService) {}

  ngOnInit(): void {
    void this.cargarServicios();
  }

  get servicioActivo(): boolean {
    return this.servicios.some(s => s.id === this.servicioId && s.activo);
  }

  async cargarServicios(): Promise<void> {
    if (this.ocupado) return;
    this.ocupado = true;
    this.error = '';

    try {
      this.servicios = await firstValueFrom(
        this.backend.get<ServicioTarifado[]>(
          environment.apiUrlAuth, 'tarifas', 'servicios'
        )
      );
    } catch (fallo) {
      this.error = this.textoError(fallo, 'No se pudieron cargar los servicios.');
    } finally {
      this.ocupado = false;
    }
  }

  async seleccionarServicio(id: number | null): Promise<void> {
    this.servicioId = id;
    this.historial = [];
    this.historialCargado = false;
    this.error = '';
    this.mensaje = '';
    this.fecha = '';
    this.valor = null;
    this.iva = null;
    this.motivo = '';

    if (id !== null) await this.cargarHistorial(id);
  }

  async cargarHistorial(id: number): Promise<void> {
    this.ocupado = true;
    this.historialCargado = false;
    this.error = '';

    try {
      this.historial = await firstValueFrom(
        this.backend.get<Vigencia[]>(
          environment.apiUrlAuth, 'tarifas', 'servicios/' + id + '/vigencias'
        )
      );
      this.historialCargado = true;
    } catch (fallo) {
      this.error = this.textoError(fallo, 'No se pudo consultar el historial.');
    } finally {
      this.ocupado = false;
    }
  }

  async guardar(formulario: NgForm): Promise<void> {
    const id = this.servicioId;
    if (this.ocupado || id === null || !this.servicioActivo) return;

    this.error = '';
    this.mensaje = '';
    const motivo = this.motivo.trim();

    if (formulario.invalid || this.valor === null || this.iva === null || !motivo) {
      formulario.control.markAllAsTouched();
      this.error = 'Completa la fecha, el valor base, el IVA y el motivo.';
      return;
    }

    const datos = {
      vigenteDesde: this.fecha,
      valorBase: this.valor,
      porcentajeIva: this.iva,
      motivo
    };

    this.ocupado = true;
    try {
      await firstValueFrom(
        this.backend.post<void>(
          environment.apiUrlAuth, 'tarifas', 'servicios/' + id + '/vigencias', datos
        )
      );
    } catch (fallo) {
      this.error = this.textoError(fallo, 'No se pudo verificar el registro de la tarifa.');
      return;
    } finally {
      this.ocupado = false;
    }

    formulario.resetForm();
    this.fecha = '';
    this.valor = null;
    this.iva = null;
    this.motivo = '';
    this.mensaje = 'La nueva tarifa quedó registrada.';
    await this.cargarHistorial(id);
  }

  private textoError(fallo: unknown, mensaje: string): string {
    return (fallo as { error?: { message?: string } }).error?.message || mensaje;
  }
}