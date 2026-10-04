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
        redirectTo: 'formula-medica',
        pathMatch: 'full'
      },
      {
        path: 'inicio/usuarios',
        component: UsuarioComponent
      },
      {
        path: 'inicio/mascotas',
        component: MascotaComponent
      },
      {
        path: 'formula-medica',
        loadComponent: () =>
          import('./views/formula-medica/formula-medica-list/formula-medica-list.component')
            .then(m => m.FormulaMedicaListComponent)
      },
      {
        path: 'formula-medica/nuevo',
        loadComponent: () =>
          import('./views/formula-medica/formula-medica-form/formula-medica-form.component')
            .then(m => m.FormulaMedicaFormComponent)
      },
      {
        path: 'formula-medica/editar/:id',
        loadComponent: () =>
          import('./views/formula-medica/formula-medica-form/formula-medica-form.component')
            .then(m => m.FormulaMedicaFormComponent)
      }
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