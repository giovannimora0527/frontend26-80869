import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { FormulaMedicaComponent } from './demo/pages/formula-medica/formula-medica.component';
import { CitasContenedorComponent } from './demo/pages/cita/citas-contenedor.component';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { HistoriaComponent } from './demo/pages/historia/historia.component';
import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';
import { LoginComponent } from './demo/pages/login/login.component';
import { PerfilComponent } from './demo/pages/perfil/perfil.component';
import { InventarioComponent } from './demo/pages/inventario/inventario.component';
import { RolComponent } from './demo/pages/rol/rol.component';
import { authGuard } from './guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  { path: 'login', component: LoginComponent, data: { title: 'Login' } },
  {
    path: 'inicio',
    component: AdminComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    data: { title: 'Inicio' },
    children: [      
      { path: 'perfil', component: PerfilComponent, data: { title: 'Mi perfil' }},
      { path: 'inventario', component: InventarioComponent, data: { title: 'Inventario' }},
      { path: 'usuarios', component: UsuarioComponent, data: { title: 'Usuarios' }},
      { path: 'roles', component: RolComponent, data: { title: 'Roles' }},
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Mascotas' }},
      { path: 'medicos', component: MedicoComponent, data: { title: 'Medicos' }},
      /* Inserte nuevos menus aqui */    
      { path: 'formulas', component: FormulaMedicaComponent, data: { title: 'Formulas' }},
      { path: 'citas', component: CitasContenedorComponent, data: { title: 'Citas' }},
      { path: 'clientes', component: ClienteComponent, data: { title: 'Clientes' }},
      { path: 'historias', component: HistoriaComponent, data: { title: 'Historias' }},
      { path: 'especializaciones', component: EspecializacionComponent, data: { title: 'Especializaciones' }}
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
