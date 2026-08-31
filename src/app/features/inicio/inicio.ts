import {
  Component,
  HostListener,
  OnInit,
  signal,
} from '@angular/core';

import {
  Router,
  RouterOutlet,
} from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

import { ThemeService } from '../../core/theme/theme-service';

import { AvisoTareaService } from '../../core/proyecto/aviso-tarea/aviso-tarea-service';

import { ZonaAdminAcceso } from '../admin/acceso/zona-admin-acceso';

@Component({
  selector: 'app-inicio',
  imports: [
    ZonaAdminAcceso,
    RouterOutlet,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio implements OnInit {

  readonly error = signal<string | null>(null);

  readonly mostrarAccesoAdmin = signal(false);

  readonly avisosTareaPendientes = signal(0);

  readonly menuRecogido = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly avisoTareaService: AvisoTareaService,
    private readonly themeService: ThemeService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {

    this.actualizarMenuResponsive();

    const sesion =
      this.authService.getSesion();

    if (sesion) {
      this.themeService.inicializar(
        sesion.usuarioUuid
      );
    }

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

  get puedeGestionar(): boolean {

    return this.esAdminSistema
      || this.esEncargado;
  }

  get temaOscuro(): boolean {

    return this.themeService.oscuro();
  }

  @HostListener('window:resize')
  actualizarMenuResponsive(): void {

    this.menuRecogido.set(
      window.innerWidth <= 760
    );
  }

  alternarMenu(): void {

    this.menuRecogido.update(
      recogido => !recogido
    );
  }

  alternarTema(): void {

    const sesion =
      this.authService.getSesion();

    if (!sesion) {
      return;
    }

    this.themeService.alternar(
      sesion.usuarioUuid
    );
  }

  irAFichar(): void {

    void this.router.navigateByUrl(
      '/fichar'
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

  irAMiResumen(): void {

    void this.router.navigateByUrl(
      '/resumenes/mio'
    );
  }

  irAPanelProyectos(): void {

    void this.router.navigateByUrl(
      '/panel-proyectos'
    );
  }

  irANotificaciones(): void {

    void this.router.navigateByUrl(
      '/notificaciones'
    );
  }

  irAUsuarios(): void {

    void this.router.navigateByUrl(
      '/usuarios'
    );
  }

  irAResumenEmpresa(): void {

    void this.router.navigateByUrl(
      '/resumenes/empresa'
    );
  }

  irAAuditoria(): void {

    void this.router.navigateByUrl(
      '/auditoria'
    );
  }

  irAEmpresas(): void {

    void this.router.navigateByUrl(
      '/empresas'
    );
  }

  irAMetodosFichaje(): void {

    void this.router.navigateByUrl(
      '/metodos-fichaje'
    );
  }

  irAPerfil(): void {

    void this.router.navigateByUrl(
      '/perfil'
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

        next: avisos => {

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