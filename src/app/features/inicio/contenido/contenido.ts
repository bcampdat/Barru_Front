import {
  Component,
  signal,
} from '@angular/core';

import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

import { ThemeService } from '../../../core/theme/theme-service';

import { ZonaAdminAcceso } from '../../admin/acceso/zona-admin-acceso';

@Component({
  selector: 'app-contenido',
  imports: [
    ZonaAdminAcceso,
  ],
  templateUrl: './contenido.html',
  styleUrl: './contenido.scss',
})
export class Contenido {

  readonly error = signal<string | null>(null);

  readonly mostrarAccesoAdmin = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly themeService: ThemeService,
    private readonly router: Router
  ) {}

  get nombreUsuario(): string {

    return this.authService
      .getSesion()
      ?.nombre ?? 'Usuario';
  }

  get esAdminSistema(): boolean {

    return this.authService
      .getSesion()
      ?.rol === 'ADMIN_SISTEMA';
  }

  get esEncargado(): boolean {

    return this.authService
      .getSesion()
      ?.rol === 'ENCARGADO';
  }

  get temaOscuro(): boolean {

    return this.themeService.oscuro();
  }

  irAFichar(): void {

    void this.router.navigateByUrl(
      '/fichar'
    );
  }

  abrirZonaAdmin(): void {

    this.error.set(null);

    this.mostrarAccesoAdmin.set(true);
  }

  accesoAdminConcedido(): void {

    this.mostrarAccesoAdmin.set(false);

    void this.router.navigateByUrl(
      '/admin'
    );
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
}