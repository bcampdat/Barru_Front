import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ZonaAdminService } from '../../../core/admin/zona-admin.service';
import { AdminSistemaDTO } from '../../../core/admin/zona-admin.types';
import { ZonaAdminAcceso } from '../acceso/zona-admin-acceso';

@Component({
  selector: 'app-zona-admin-gestion',
  imports: [
    FormsModule,
    ZonaAdminAcceso,
  ],
  templateUrl: './zona-admin-gestion.html',
  styleUrl: './zona-admin-gestion.scss',
})
export class ZonaAdminGestion implements OnInit {

  readonly accesoConcedido = signal(false);
  readonly comprobandoContexto = signal(true);

  readonly administradores =
    signal<AdminSistemaDTO[]>([]);

  readonly error =
    signal<string | null>(null);

  readonly mensaje =
    signal<string | null>(null);

  readonly cargando =
    signal(false);

  readonly creando =
    signal(false);

  readonly accionEnCurso =
    signal<string | null>(null);

  nombre = '';
  apellidos = '';
  email = '';

  constructor(
    private readonly zonaAdminService: ZonaAdminService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.comprobarContexto();
  }

  confirmarAcceso(): void {

    this.error.set(null);
    this.mensaje.set(null);
    this.accesoConcedido.set(true);

    this.cargarAdministradores();
  }

  denegarAcceso(
    mensaje: string
  ): void {

    this.accesoConcedido.set(false);
    this.mensaje.set(null);
    this.error.set(mensaje);
  }

  crearAdministrador(): void {

    const nombre =
      this.nombre.trim();

    const apellidos =
      this.apellidos.trim();

    const email =
      this.email.trim();

    if (
      !nombre
      || !apellidos
      || !email
    ) {

      this.error.set(
        'Nombre, apellidos y email son obligatorios.'
      );

      return;
    }

    this.error.set(null);
    this.mensaje.set(null);
    this.creando.set(true);

    this.zonaAdminService
      .crearAdministrador({
        nombre,
        apellidos,
        email,
      })
      .subscribe({
        next: administrador => {

          this.administradores.update(
            administradores => [
              ...administradores,
              administrador,
            ]
          );

          this.nombre = '';
          this.apellidos = '';
          this.email = '';

          this.mensaje.set(
            'Administrador creado correctamente.'
          );

          this.creando.set(false);
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.mostrarError(
            error,
            'No se ha podido crear el administrador.'
          );

          this.creando.set(false);
        },
      });
  }

  activar(
    uuid: string
  ): void {

    this.error.set(null);
    this.mensaje.set(null);
    this.accionEnCurso.set(uuid);

    this.zonaAdminService
      .activar(uuid)
      .subscribe({
        next: administrador => {

          this.actualizarAdministrador(
            administrador
          );

          this.mensaje.set(
            'Administrador activado correctamente.'
          );

          this.accionEnCurso.set(null);
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.mostrarError(
            error,
            'No se ha podido activar el administrador.'
          );

          this.accionEnCurso.set(null);
        },
      });
  }

  inactivar(
    uuid: string
  ): void {

    this.error.set(null);
    this.mensaje.set(null);
    this.accionEnCurso.set(uuid);

    this.zonaAdminService
      .inactivar(uuid)
      .subscribe({
        next: administrador => {

          this.actualizarAdministrador(
            administrador
          );

          this.mensaje.set(
            'Administrador inactivado correctamente.'
          );

          this.accionEnCurso.set(null);
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.mostrarError(
            error,
            'No se ha podido inactivar el administrador.'
          );

          this.accionEnCurso.set(null);
        },
      });
  }

  bloquear(
    uuid: string
  ): void {

    this.error.set(null);
    this.mensaje.set(null);
    this.accionEnCurso.set(uuid);

    this.zonaAdminService
      .bloquear(uuid)
      .subscribe({
        next: administrador => {

          this.actualizarAdministrador(
            administrador
          );

          this.mensaje.set(
            'Administrador bloqueado correctamente.'
          );

          this.accionEnCurso.set(null);
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.mostrarError(
            error,
            'No se ha podido bloquear el administrador.'
          );

          this.accionEnCurso.set(null);
        },
      });
  }

  desbloquear(
    uuid: string
  ): void {

    this.error.set(null);
    this.mensaje.set(null);
    this.accionEnCurso.set(uuid);

    this.zonaAdminService
      .desbloquear(uuid)
      .subscribe({
        next: administrador => {

          this.actualizarAdministrador(
            administrador
          );

          this.mensaje.set(
            'Administrador desbloqueado correctamente.'
          );

          this.accionEnCurso.set(null);
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.mostrarError(
            error,
            'No se ha podido desbloquear el administrador.'
          );

          this.accionEnCurso.set(null);
        },
      });
  }

  eliminarCredencialesWebAuthn(
    uuid: string
  ): void {

    const confirmar =
      window.confirm(
        '¿Restablecer las credenciales WebAuthn de este administrador? Deberá registrarlas de nuevo en su próximo acceso a la zona administrativa.'
      );

    if (!confirmar) {
      return;
    }

    this.error.set(null);
    this.mensaje.set(null);
    this.accionEnCurso.set(uuid);

    this.zonaAdminService
      .eliminarCredencialesWebAuthn(uuid)
      .subscribe({
        next: () => {

          this.mensaje.set(
            'Credenciales WebAuthn restablecidas. El administrador deberá registrarlas de nuevo en su próximo acceso.'
          );

          this.accionEnCurso.set(null);
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.mostrarError(
            error,
            'No se han podido restablecer las credenciales WebAuthn.'
          );

          this.accionEnCurso.set(null);
        },
      });
  }

  salir(): void {

    this.error.set(null);
    this.mensaje.set(null);
    this.cargando.set(true);

    this.zonaAdminService
      .salir()
      .subscribe({
        next: () => {

          this.accesoConcedido.set(false);

          void this.router.navigateByUrl(
            '/inicio'
          );
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.mostrarError(
            error,
            'No se ha podido cerrar el acceso administrativo.'
          );

          this.cargando.set(false);
        },
      });
  }

  private comprobarContexto(): void {

    this.zonaAdminService
      .listarAdministradores()
      .subscribe({
        next: administradores => {

          this.administradores.set(
            administradores
          );

          this.accesoConcedido.set(true);
          this.comprobandoContexto.set(false);
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.accesoConcedido.set(false);
          this.comprobandoContexto.set(false);

          if (error.status === 403) {
            return;
          }

          this.mostrarError(
            error,
            'No se ha podido comprobar el acceso administrativo.'
          );
        },
      });
  }

  private cargarAdministradores(): void {

    this.zonaAdminService
      .listarAdministradores()
      .subscribe({
        next: administradores => {

          this.administradores.set(
            administradores
          );
        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.mostrarError(
            error,
            'No se han podido cargar los administradores.'
          );
        },
      });
  }

  private actualizarAdministrador(
    administradorActualizado:
      AdminSistemaDTO
  ): void {

    this.administradores.update(
      administradores =>
        administradores.map(
          administrador =>
            administrador.uuid ===
            administradorActualizado.uuid
              ? administradorActualizado
              : administrador
        )
    );
  }

  private mostrarError(
    error: HttpErrorResponse,
    mensajeDefecto: string
  ): void {

    this.mensaje.set(null);

    this.error.set(
      typeof error.error?.message ===
        'string'
        ? error.error.message
        : mensajeDefecto
    );
  }
}