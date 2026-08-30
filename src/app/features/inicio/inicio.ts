import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

import { AvisoTareaService } from '../../core/proyecto/aviso-tarea/aviso-tarea-service';

import { ZonaAdminAcceso } from '../admin/acceso/zona-admin-acceso';

@Component({
  selector: 'app-inicio',
  imports: [
    ZonaAdminAcceso,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio implements OnInit {

  readonly error = signal<string | null>(null);

  readonly mostrarAccesoAdmin = signal(false);

  readonly avisosTareaPendientes = signal(0);

  constructor(
    private readonly authService: AuthService,
    private readonly avisoTareaService: AvisoTareaService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {

    if (this.puedeUsarTareas) {
      this.cargarAvisosTareaPendientes();
    }
  }

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

  get puedeUsarTareas(): boolean {

    const rol =
      this.authService
        .getSesion()
        ?.rol;

    return rol === 'EMPLEADO'
      || rol === 'ENCARGADO';
  }

  irAPerfil(): void {

    void this.router.navigateByUrl(
      '/perfil'
    );
  }

  irANotificaciones(): void {

    void this.router.navigateByUrl(
      '/notificaciones'
    );
  }

  irAMisTareas(): void {

    void this.router.navigateByUrl(
      '/mis-tareas'
    );
  }

  irAAvisosTarea(): void {

    void this.router.navigateByUrl(
      '/avisos-tarea'
    );
  }

  irAPanelProyectos(): void {

    void this.router.navigateByUrl(
      '/panel-proyectos'
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

  private cargarAvisosTareaPendientes(): void {

    this.avisoTareaService
      .obtenerMisAvisosNoLeidos()
      .subscribe({

        next: (avisos) => {

          this.avisosTareaPendientes.set(
            avisos.length
          );
        },

        error: () => {

          /*
           * No bloqueamos Inicio si falla
           * únicamente la consulta de avisos.
           */
          this.avisosTareaPendientes.set(0);
        },
      });
  }
}