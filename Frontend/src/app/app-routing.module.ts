import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { FormulaComponent } from './demo/pages/formula/formula.component';
import { HistoriaComponent } from './demo/pages/historia/historia.component';


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
      { path: 'citas', component: CitaComponent, data: { title: 'Citas' }},
      { path: 'formulas', component: FormulaComponent, data: { title: 'Formulas' }},
      { path: 'historias', component: HistoriaComponent, data: { title: 'Historias Clinicas' }}
      /* Inserte nuevos menus aqui */    
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
