import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'citas',
        pathMatch: 'full'
      },
      // Pantalla de bienvenida (la dibuja el layout cuando la URL es /inicio).
      { path: 'inicio', pathMatch: 'full', children: [] },
      {
        path: 'inicio/usuarios',
        component: UsuarioComponent
      },
      {
        path: 'inicio/mascotas',
        component: MascotaComponent
      },
      {
        path: 'citas',
        loadComponent: () =>
          import('./demo/pages/cita/cita.component').then(m => m.CitaComponent)
      },
      {
        path: 'historias-clinicas',
        loadComponent: () =>
          import('./demo/pages/historia-clinica/historia-clinica.component').then(m => m.HistoriaClinicaComponent)
      },
      {
        path: 'formulas-medicas',
        loadComponent: () =>
          import('./demo/pages/formula-medica/formula-medica.component').then(m => m.FormulaMedicaComponent)
      },
      // Compatibilidad con la ruta anterior del módulo de fórmulas.
      {
        path: 'formula-medica',
        redirectTo: 'formulas-medicas',
        pathMatch: 'full'
      },
      { path: '**', redirectTo: 'citas' }
    ]
  },
  {
    path: '',
    component: GuestComponent,
    children: [
      // Aquí van las rutas públicas (login, registro, etc.) si las tienes
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}