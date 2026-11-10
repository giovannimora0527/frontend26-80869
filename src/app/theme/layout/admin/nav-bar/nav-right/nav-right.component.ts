// angular import
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

// bootstrap import
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from 'src/app/demo/pages/login/service/auth.service';
import { getJwtPayload } from 'src/app/utils/jwt.util';

/**
 * Barra superior derecha.
 *
 * Muestra la informacion del usuario autenticado (leida del token JWT) y
 * ofrece accesos directos a la pantalla de perfil y al cierre de sesion.
 */
@Component({
  selector: 'app-nav-right',
  imports: [SharedModule, RouterModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  providers: [NgbDropdownConfig]
})
export class NavRightComponent {
  username = '';
  rol = '';
  email = '';

  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
    const config = inject(NgbDropdownConfig);
    config.placement = 'bottom-right';

    try {
      const payload = getJwtPayload();
      if (payload) {
        this.username = payload.username;
        this.rol = payload.rol;
        this.email = payload.email;
      }
    } catch {
      this.username = '';
    }
  }

  irAPerfil(): void {
    this.router.navigate(['/inicio/perfil']);
  }

  cerrarSesion(): void {
    this.authService.cerrarSesionServidor().subscribe({
      next: () => this.finalizarSesion(),
      error: () => this.finalizarSesion()
    });
  }

  private finalizarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
