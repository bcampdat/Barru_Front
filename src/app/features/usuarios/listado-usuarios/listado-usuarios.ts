import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Observable,
  finalize,
  forkJoin,
  switchMap,
} from 'rxjs';

import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';

import { AuthService } from '../../../core/auth/auth.service';
import { EmpresaService } from '../../../core/empresa/empresa-service';
import { EmpresaDTO } from '../../../core/empresa/empresa.types';
import { MetodoFichajeService } from '../../../core/metodos/metodo-fichaje-service';
import { MetodoFichajeDTO } from '../../../core/metodos/metodo-fichaje.types';
import { UsuarioService } from '../../../core/usuarios/usuario-service';
import {
  EstadoUsuario,
  RolAsignableDTO,
  UserDTO,
} from '../../../core/usuarios/usuario.types';

type AccionUsuario =
  | 'ACTIVAR'
  | 'INACTIVAR'
  | 'BLOQUEAR'
  | 'DESBLOQUEAR';

interface ConfiguracionAccion {
  header: string;
  verbo: string;
  boton: string;
  icono: string;
  exito: string;
}

const ACCIONES: Record<AccionUsuario, ConfiguracionAccion> = {
  ACTIVAR: {
    header: 'Activar usuario',
    verbo: 'activar',
    boton: 'Activar',
    icono: 'pi pi-check-circle',
    exito: 'Usuario activado correctamente.',
  },
  INACTIVAR: {
    header: 'Inactivar usuario',
    verbo: 'inactivar',
    boton: 'Inactivar',
    icono: 'pi pi-exclamation-triangle',
    exito: 'Usuario inactivado correctamente.',
  },
  BLOQUEAR: {
    header: 'Bloquear usuario',
    verbo: 'bloquear',
    boton: 'Bloquear',
    icono: 'pi pi-lock',
    exito: 'Usuario bloqueado correctamente.',
  },
  DESBLOQUEAR: {
    header: 'Desbloquear usuario',
    verbo: 'desbloquear',
    boton: 'Desbloquear',
    icono: 'pi pi-unlock',
    exito: 'Usuario desbloqueado correctamente.',
  },
};

@Component({
  selector: 'app-listado-usuarios',
  imports: [
    FormsModule,
    ConfirmDialogModule,
    InputTextModule,
    MessageModule,
    TableModule,
  ],
  providers: [
    ConfirmationService,
  ],
  templateUrl: './listado-usuarios.html',
  styleUrl: './listado-usuarios.scss',
})
export class ListadoUsuarios implements OnInit {

  readonly empresas =
    signal<EmpresaDTO[]>([]);

  readonly usuarios =
    signal<UserDTO[]>([]);

  readonly roles =
    signal<RolAsignableDTO[]>([]);

  readonly metodos =
    signal<MetodoFichajeDTO[]>([]);

  readonly cargando =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly exito =
    signal<string | null>(null);

  readonly esAdmin =
    signal(false);

  readonly estadoSeleccionado =
    signal<EstadoUsuario>('ACTIVO');

  readonly estados:
    readonly EstadoUsuario[] = [
      'PENDIENTE',
      'ACTIVO',
      'INACTIVO',
      'BLOQUEADO',
    ];

  empresaId: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly empresaService: EmpresaService,
    private readonly usuarioService: UsuarioService,
    private readonly metodoFichajeService: MetodoFichajeService,
    private readonly confirmationService: ConfirmationService
  ) {}


  ngOnInit(): void {

    this.restaurarEstado();

    const sesion =
      this.authService.getSesion();

    if (!sesion) {
      return;
    }

    this.esAdmin.set(
      sesion.rol === 'ADMIN_SISTEMA'
    );

    if (this.esAdmin()) {

      this.inicializarAdmin();

      return;
    }

    this.inicializarEncargado(
      sesion.usuarioUuid
    );
  }


  volver(): void {

    void this.router.navigateByUrl(
      '/inicio'
    );
  }


  seleccionarEmpresa(): void {

    this.limpiarMensajes();

    if (this.empresaId === null) {

      this.usuarios.set([]);
      this.metodos.set([]);

      return;
    }

    this.cargarDatosEmpresa(
      this.empresaId
    );
  }


  seleccionarEstado(
    estado: EstadoUsuario
  ): void {

    if (
      estado ===
      this.estadoSeleccionado()
    ) {
      return;
    }

    this.estadoSeleccionado.set(
      estado
    );

    this.limpiarMensajes();

    if (this.empresaId !== null) {

      this.cargarUsuarios(
        this.empresaId
      );
    }
  }


  nuevoUsuario(): void {

    if (this.empresaId === null) {
      return;
    }

    void this.router.navigate(
      ['/usuarios/nuevo'],
      {
        queryParams: {
          empresaId: this.empresaId,
          estado: this.estadoSeleccionado(),
        },
      }
    );
  }


  modificarUsuario(
    usuario: UserDTO
  ): void {

    if (
      !usuario.uuid
      ||
      this.empresaId === null
    ) {
      return;
    }

    void this.router.navigate(
      [
        '/usuarios',
        usuario.uuid,
        'editar',
      ],
      {
        queryParams: {
          empresaId: this.empresaId,
          estado: this.estadoSeleccionado(),
        },
      }
    );
  }


  confirmarCambio(
    usuario: UserDTO,
    accion: AccionUsuario
  ): void {

    const uuid =
      usuario.uuid;

    if (!uuid) {
      return;
    }

    const config =
      ACCIONES[accion];

    const nombreCompleto =
      `${usuario.nombre} ${usuario.apellidos}`;

    this.confirmationService.confirm({
      header: config.header,
      message:
        `¿Quieres ${config.verbo} a ${nombreCompleto}?`,
      icon: config.icono,
      acceptLabel: config.boton,
      rejectLabel: 'Cancelar',
      accept: () =>
        this.cambiarEstado(
          uuid,
          accion
        ),
    });
  }


  confirmarEliminacion(
    usuario: UserDTO
  ): void {

    const uuid =
      usuario.uuid;

    if (!uuid) {
      return;
    }

    const nombreCompleto =
      `${usuario.nombre} ${usuario.apellidos}`;

    this.confirmationService.confirm({
      header: 'Eliminar usuario pendiente',
      message:
        `¿Quieres eliminar definitivamente a ${nombreCompleto}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () =>
        this.eliminarPendiente(
          uuid
        ),
    });
  }


  nombreRol(
    rolId: number
  ): string {

    return this.roles()
      .find(
        rol =>
          rol.id === rolId
      )
      ?.nombre ?? '—';
  }


  nombreMetodo(
    metodoId:
      number
      | null
      | undefined
  ): string {

    if (metodoId == null) {
      return 'Sin asignar';
    }

    return this.metodos()
      .find(
        metodo =>
          metodo.id === metodoId
      )
      ?.nombre ?? '—';
  }


  etiquetaEstado(
    estado: EstadoUsuario
  ): string {

    switch (estado) {

      case 'PENDIENTE':
        return 'Pendiente';

      case 'ACTIVO':
        return 'Activo';

      case 'INACTIVO':
        return 'Inactivo';

      case 'BLOQUEADO':
        return 'Bloqueado';
    }
  }


  private inicializarAdmin(): void {

    this.cargando.set(true);

    forkJoin({
      empresas:
        this.empresaService
          .obtenerTodasLasEmpresas(),

      roles:
        this.usuarioService
          .listarRolesAsignables(),
    })
      .subscribe({

        next: respuesta => {

          this.empresas.set(
            respuesta.empresas
          );

          this.roles.set(
            respuesta.roles
          );

          this.cargando.set(false);

          const empresaId =
            this.obtenerEmpresaRuta();

          if (
            empresaId !== null
            &&
            respuesta.empresas.some(
              empresa =>
                empresa.id === empresaId
            )
          ) {

            this.empresaId =
              empresaId;

            this.cargarDatosEmpresa(
              empresaId
            );
          }
        },

        error: error => {

          this.cargando.set(false);

          this.mostrarError(
            error
          );
        },
      });
  }


  private inicializarEncargado(
    uuid: string
  ): void {

    this.cargando.set(true);

    forkJoin({
      usuario:
        this.usuarioService
          .buscarPorUuid(uuid),

      roles:
        this.usuarioService
          .listarRolesAsignables(),
    })
      .subscribe({

        next: respuesta => {

          this.roles.set(
            respuesta.roles
          );

          const empresaId =
            respuesta.usuario.empresaId;

          if (empresaId == null) {

            this.cargando.set(false);

            this.error.set(
              'El usuario no tiene una empresa asociada.'
            );

            return;
          }

          this.empresaId =
            empresaId;

          this.cargando.set(false);

          this.cargarDatosEmpresa(
            empresaId
          );
        },

        error: error => {

          this.cargando.set(false);

          this.mostrarError(
            error
          );
        },
      });
  }


  private cargarDatosEmpresa(
    empresaId: number
  ): void {

    this.cargando.set(true);

    this.limpiarMensajes();

    forkJoin({
      usuarios:
        this.usuarioService
          .listarPorEmpresaYEstado(
            empresaId,
            this.estadoSeleccionado()
          ),

      metodos:
        this.metodoFichajeService
          .listarPorEmpresa(
            empresaId
          ),
    })
      .pipe(
        finalize(
          () =>
            this.cargando.set(false)
        )
      )
      .subscribe({

        next: respuesta => {

          this.usuarios.set(
            respuesta.usuarios
          );

          this.metodos.set(
            respuesta.metodos
          );
        },

        error: error => {

          this.usuarios.set([]);
          this.metodos.set([]);

          this.mostrarError(
            error
          );
        },
      });
  }


  private cargarUsuarios(
    empresaId: number
  ): void {

    this.cargando.set(true);

    this.limpiarMensajes();

    this.usuarioService
      .listarPorEmpresaYEstado(
        empresaId,
        this.estadoSeleccionado()
      )
      .pipe(
        finalize(
          () =>
            this.cargando.set(false)
        )
      )
      .subscribe({

        next: usuarios => {

          this.usuarios.set(
            usuarios
          );
        },

        error: error => {

          this.usuarios.set([]);

          this.mostrarError(
            error
          );
        },
      });
  }


  private cambiarEstado(
    uuid: string,
    accion: AccionUsuario
  ): void {

    const empresaId =
      this.empresaId;

    if (empresaId === null) {
      return;
    }

    const config =
      ACCIONES[accion];

    this.cargando.set(true);

    this.limpiarMensajes();

    this.obtenerOperacionEstado(
      uuid,
      accion
    )
      .pipe(
        switchMap(
          () =>
            this.usuarioService
              .listarPorEmpresaYEstado(
                empresaId,
                this.estadoSeleccionado()
              )
        ),
        finalize(
          () =>
            this.cargando.set(false)
        )
      )
      .subscribe({

        next: usuarios => {

          this.usuarios.set(
            usuarios
          );

          this.exito.set(
            config.exito
          );
        },

        error: error => {

          this.mostrarError(
            error
          );
        },
      });
  }


  private eliminarPendiente(
    uuid: string
  ): void {

    const empresaId =
      this.empresaId;

    if (empresaId === null) {
      return;
    }

    this.cargando.set(true);

    this.limpiarMensajes();

    this.usuarioService
      .eliminarPendiente(
        uuid
      )
      .pipe(
        switchMap(
          () =>
            this.usuarioService
              .listarPorEmpresaYEstado(
                empresaId,
                'PENDIENTE'
              )
        ),
        finalize(
          () =>
            this.cargando.set(false)
        )
      )
      .subscribe({

        next: usuarios => {

          this.usuarios.set(
            usuarios
          );

          this.exito.set(
            'Usuario pendiente eliminado correctamente.'
          );
        },

        error: error => {

          this.mostrarError(
            error
          );
        },
      });
  }


  private obtenerOperacionEstado(
    uuid: string,
    accion: AccionUsuario
  ): Observable<UserDTO> {

    switch (accion) {

      case 'ACTIVAR':
        return this.usuarioService
          .activar(uuid);

      case 'INACTIVAR':
        return this.usuarioService
          .inactivar(uuid);

      case 'BLOQUEAR':
        return this.usuarioService
          .bloquear(uuid);

      case 'DESBLOQUEAR':
        return this.usuarioService
          .desbloquear(uuid);
    }
  }


  private restaurarEstado(): void {

    const estado =
      this.route.snapshot
        .queryParamMap
        .get('estado');

    if (
      estado === 'PENDIENTE'
      ||
      estado === 'ACTIVO'
      ||
      estado === 'INACTIVO'
      ||
      estado === 'BLOQUEADO'
    ) {

      this.estadoSeleccionado.set(
        estado
      );
    }
  }


  private obtenerEmpresaRuta():
    number | null {

    const valor =
      this.route.snapshot
        .queryParamMap
        .get('empresaId');

    if (valor === null) {
      return null;
    }

    const empresaId =
      Number(valor);

    return (
      Number.isInteger(
        empresaId
      )
      &&
      empresaId > 0
    )
      ? empresaId
      : null;
  }


  private limpiarMensajes(): void {

    this.error.set(null);

    this.exito.set(null);
  }


  private mostrarError(
    error: unknown
  ): void {

    if (
      error instanceof HttpErrorResponse
    ) {

      this.error.set(
        error.error?.message
        ??
        'No se ha podido completar la operación.'
      );

      return;
    }

    this.error.set(
      'No se ha podido completar la operación.'
    );
  }

}