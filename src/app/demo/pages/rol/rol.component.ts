import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { RolService, Rol, Menu } from './service/rol.service';

/**
 * Pantalla de gestion de roles (perfiles).
 *
 * Permite crear y editar roles, y asignar los menus (modulos) que cada rol
 * puede ver mediante casillas de verificacion. De esta forma el administrador
 * configura los permisos desde la interfaz, sin modificar la base de datos.
 */
@Component({
  selector: 'app-rol',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rol.component.html',
  styleUrl: './rol.component.scss'
})
export class RolComponent implements OnInit {
  roles: Rol[] = [];
  menus: Menu[] = [];
  cargando = false;

  modalAbierto = false;
  modoEdicion = false;
  guardando = false;

  // Modelo del formulario
  perfilId?: number;
  nombre = '';
  activo = true;
  menusSeleccionados = new Set<number>();

  constructor(private rolService: RolService) {}

  ngOnInit(): void {
    this.cargarMenus();
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.cargando = true;
    this.rolService.listar().subscribe({
      next: (data) => {
        this.cargando = false;
        this.roles = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.manejarError(err, 'No fue posible cargar los roles');
      }
    });
  }

  cargarMenus(): void {
    this.rolService.listarMenus().subscribe({
      next: (data) => (this.menus = data),
      error: (err: HttpErrorResponse) => this.manejarError(err, 'No fue posible cargar los menus')
    });
  }

  nombreMenus(rol: Rol): string {
    const nombres = this.menus
      .filter((m) => rol.menuIds?.includes(m.menuId))
      .map((m) => m.title);
    return nombres.length ? nombres.join(', ') : 'Sin modulos asignados';
  }

  abrirCrear(): void {
    this.modoEdicion = false;
    this.perfilId = undefined;
    this.nombre = '';
    this.activo = true;
    this.menusSeleccionados = new Set<number>();
    this.modalAbierto = true;
  }

  abrirEditar(rol: Rol): void {
    this.modoEdicion = true;
    this.perfilId = rol.perfilId;
    this.nombre = rol.nombre;
    this.activo = rol.activo ?? true;
    this.menusSeleccionados = new Set<number>(rol.menuIds || []);
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  toggleMenu(menuId: number): void {
    if (this.menusSeleccionados.has(menuId)) {
      this.menusSeleccionados.delete(menuId);
    } else {
      this.menusSeleccionados.add(menuId);
    }
  }

  estaSeleccionado(menuId: number): boolean {
    return this.menusSeleccionados.has(menuId);
  }

  guardar(): void {
    if (!this.nombre.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atencion', text: 'El nombre del rol es obligatorio.' });
      return;
    }
    this.guardando = true;
    const data: Rol = {
      perfilId: this.perfilId,
      nombre: this.nombre.trim(),
      activo: this.activo,
      menuIds: Array.from(this.menusSeleccionados)
    };
    const peticion = this.modoEdicion ? this.rolService.actualizar(data) : this.rolService.guardar(data);
    peticion.subscribe({
      next: (resp) => {
        this.guardando = false;
        this.modalAbierto = false;
        Swal.fire({ icon: 'success', title: 'Listo', text: resp.message });
        this.cargarRoles();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.manejarError(err, 'No fue posible guardar el rol');
      }
    });
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || mensaje });
  }
}
