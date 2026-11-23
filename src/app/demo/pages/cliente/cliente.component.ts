import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { Cliente } from 'src/app/models/cliente';
import { ClienteService } from './service/cliente.service';

@Component({
  selector: 'app-cliente',
  standalone: true,
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class ClienteComponent implements OnInit {
  clientes: Cliente[] = [];
  cargando = false;
  error = '';

  constructor(private readonly servicio: ClienteService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (this.cargando) return;
    this.cargando = true;
    this.error = '';

    this.servicio.listarClientes()
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: clientes => this.clientes = clientes,
        error: () => this.error = 'No se pudieron cargar los clientes.'
      });
  }
}