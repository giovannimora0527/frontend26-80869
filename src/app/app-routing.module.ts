import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MascotaComponent } from './demo/pages/mascota/mascota.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { FormulaDetalleComponent } from './demo/pages/formula-detalle/formula-detalle.component';
import { InventarioComponent } from './demo/pages/inventario/inventario.component';
import { ServicioComponent } from './demo/pages/servicio/servicio.component';
import { FacturacionComponent } from './demo/pages/facturacion/facturacion.component';
import { DespachoComponent } from './demo/pages/despacho/despacho.component';
import { ReporteComponent } from './demo/pages/reporte/reporte.component';
import { AgendaComponent } from './demo/pages/agenda/agenda.component';
import { AtencionComponent } from './demo/pages/atencion/atencion.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { ClienteComponent } from './demo/pages/cliente/cliente.component';
import { MedicamentoComponent } from './demo/pages/medicamento/medicamento.component';
import { HistoriaComponent } from './demo/pages/historia/historia.component';
import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';
import { LoginComponent } from './demo/pages/login/login.component';
import { RegistroComponent } from './demo/pages/registro/registro.component';
import { RecuperarComponent } from './demo/pages/recuperar/recuperar.component';
import { PerfilComponent } from './demo/pages/perfil/perfil.component';
import { authGuard, guestGuard, menuGuard } from './guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },  
  { path: 'login', component: LoginComponent, canActivate: [guestGuard], data: { title: 'Iniciar sesión' } },
  { path: 'registro', component: RegistroComponent, canActivate: [guestGuard], data: { title: 'Crear cuenta' } },
  { path: 'recuperar', component: RecuperarComponent, canActivate: [guestGuard], data: { title: 'Recuperar contraseña' } },
  {
    path: 'inicio',
    component: AdminComponent,
    canActivate: [authGuard],
    canActivateChild: [menuGuard],
    data: { title: 'Inicio' },
    children: [      
      { path: 'perfil', component: PerfilComponent, data: { title: 'Mi perfil' }},
      { path: 'usuarios', component: UsuarioComponent, data: { title: 'Usuarios' }},
      { path: 'mascotas', component: MascotaComponent, data: { title: 'Mascotas' }},
      { path: 'medicos', component: MedicoComponent, data: { title: 'Medicos' }},
      /* Inserte nuevos menus aqui */    
      { path: 'formulas', component: FormulaDetalleComponent, data: { title: 'Formulas' }},
      { path: 'inventario', component: InventarioComponent, data: { title: 'Inventario' }},
      { path: 'servicios', component: ServicioComponent, data: { title: 'Servicios y tarifas' }},
      { path: 'facturacion', component: FacturacionComponent, data: { title: 'Facturación' }},
      { path: 'despacho', component: DespachoComponent, data: { title: 'Despacho de fórmulas' }},
      { path: 'reportes', component: ReporteComponent, data: { title: 'Reportes' }},
      { path: 'agenda', component: AgendaComponent, data: { title: 'Calendario de citas' }},
      { path: 'atencion/:citaId', component: AtencionComponent, data: { title: 'Atención médica' }},
      { path: 'citas', component: CitaComponent, data: { title: 'Citas' }},
      { path: 'clientes', component: ClienteComponent, data: { title: 'Clientes' }},
      { path: 'medicamentos', component: MedicamentoComponent, data: { title: 'Medicamentos' }},
      { path: 'historias', component: HistoriaComponent, data: { title: 'Historias' }},
      { path: 'especializaciones', component: EspecializacionComponent, data: { title: 'Especializaciones' }}
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
