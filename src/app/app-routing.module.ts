import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { RazaComponent } from './demo/pages/raza/raza.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { HistoriaMedicaComponent } from './demo/pages/historia-medica/historia-medica.component';
import { AnotacionHistoriaComponent } from './demo/pages/anotacion-historia/anotacion-historia.component';
import { MedicamentoComponent } from './demo/pages/medicamento/medicamento.component';
import { FormulaMedicaComponent } from './demo/pages/formula-medica/formula-medica.component';


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
      // Administración
      { path: 'usuarios', component: UsuarioComponent, data: { title: 'Usuarios' }},
      // Clientes y mascotas
      { path: 'clientes', component: ClienteComponent, data: { title: 'Clientes' }},
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Mascotas' }},
      { path: 'razas', component: RazaComponent, data: { title: 'Razas' }},
      // Personal médico
      { path: 'medicos', component: MedicoComponent, data: { title: 'Médicos' }},
      { path: 'especializaciones', component: EspecializacionComponent, data: { title: 'Especializaciones' }},
      // Atención clínica
      { path: 'citas', component: CitaComponent, data: { title: 'Citas' }},
      { path: 'historias-medicas', component: HistoriaMedicaComponent, data: { title: 'Historias médicas' }},
      { path: 'anotaciones-historia', component: AnotacionHistoriaComponent, data: { title: 'Anotaciones de historia' }},
      // Farmacia
      { path: 'medicamentos', component: MedicamentoComponent, data: { title: 'Medicamentos' }},
      { path: 'formulas-medicas', component: FormulaMedicaComponent, data: { title: 'Fórmulas médicas' }}
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
