import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { FormulaMedicaComponent } from './demo/pages/formula-medica/formula-medica.component';
import { FormulaMedicaFormComponent } from './demo/pages/formula-medica/formula-medica-form/formula-medica-form.component';

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
      { path: 'usuarios', component: UsuarioComponent, data: { title: 'Usuarios' }},
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Mascotas' }},
      /* Inserte nuevos menus aqui */ 
      { path: 'formulas-medicas', component: FormulaMedicaComponent, data: { title: 'Fórmulas Médicas' } },  
      { path: 'formulas-medicas', component: FormulaMedicaComponent, data: { title: 'Fórmulas Médicas' } },
      { path: 'formulas-medicas/nuevo', component: FormulaMedicaFormComponent, data: { title: 'Nueva Fórmula Médica' } },
      { path: 'formulas-medicas/editar/:id', component: FormulaMedicaFormComponent, data: { title: 'Editar Fórmula Médica' } }, 
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
