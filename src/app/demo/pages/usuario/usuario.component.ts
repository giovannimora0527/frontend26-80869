import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { Usuario } from 'src/app/models/usuario';
import { UsuarioService } from './service/usuario.service';

@Component({
  selector: 'app-usuario',
  standalone: true,
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit {
  usuarios: Usuario[] = [];
  cargando = false;
  error = '';

  constructor(private readonly servicio: UsuarioService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (this.cargando) return;

    this.cargando = true;
    this.error = '';

    this.servicio.getUsuarios()
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: usuarios => this.usuarios = usuarios,
        error: () => this.error = 'No se pudieron cargar los usuarios.'
      });
  }
}