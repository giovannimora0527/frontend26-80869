
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { FormulaMedicaComponent } from './demo/pages/formula-medica/formula-medica.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { HistoriaMedicaComponent } from './demo/pages/historia-medica/historia-medica.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'inicio',
    component: AdminComponent,
    data: { title: 'Inicio' },
    children: [
      {
        path: 'usuarios',
        component: UsuarioComponent,
        data: { title: 'Usuarios' }
      },
      {
        path: 'mascotas',
        component: MascotaComponent,
        data: { title: 'Mascotas' }
      },
      {
        path: 'formulas',
        component: FormulaMedicaComponent,
        data: { title: 'Fórmulas Médicas' }
      },
      {
        path: 'citas',
        component: CitaComponent,
        data: { title: 'Citas' }
      },
      {
        path: 'historias-clinicas',
        component: HistoriaMedicaComponent,
        data: { title: 'Historias Clínicas' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'inicio'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
