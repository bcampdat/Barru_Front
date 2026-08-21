import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ZonaAdminAcceso } from '../admin/acceso/zona-admin-acceso';

@Component({
  selector: 'app-inicio',
  imports: [
    ZonaAdminAcceso,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {

  readonly error = signal<string | null>(null);

  readonly mostrarAccesoAdmin = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  get nombreUsuario(): string {
    return this.authService.getSesion()?.nombre ?? 'Usuario';
  }

  get esAdminSistema(): boolean {
    return this.authService.getSesion()?.rol === 'ADMIN_SISTEMA';
  }

  irAPerfil(): void {
    void this.router.navigateByUrl('/perfil');
  }

  abrirZonaAdmin(): void {
    this.error.set(null);
    this.mostrarAccesoAdmin.set(true);
  }

  accesoAdminConcedido(): void {

    this.mostrarAccesoAdmin.set(false);

    void this.router.navigateByUrl('/admin');
  }

  accesoAdminDenegado(
    mensaje: string
  ): void {

    this.mostrarAccesoAdmin.set(false);

    this.error.set(
      mensaje
      || 'Acceso administrativo no autorizado.'
    );
  }

  cerrarAccesoAdmin(): void {

    this.mostrarAccesoAdmin.set(false);
  }

  cerrarSesion(): void {

    this.error.set(null);

    this.authService
      .logout()
      .subscribe({
        next: () => {

          void this.router.navigateByUrl(
            '/login'
          );
        },

        error: () => {
          this.error.set(
            'No se ha podido cerrar la sesión.'
          );
        },
      });
  }
}