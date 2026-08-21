import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

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

@Component({
  selector: 'app-formulario-usuario',
  imports: [
    FormsModule,
    InputTextModule,
    MessageModule,
  ],
  templateUrl: './formulario-usuario.html',
  styleUrl: './formulario-usuario.scss',
})
export class FormularioUsuario implements OnInit {

  readonly empresas = signal<EmpresaDTO[]>([]);
  readonly roles = signal<RolAsignableDTO[]>([]);
  readonly metodos = signal<MetodoFichajeDTO[]>([]);

  readonly cargando = signal(false);
  readonly cargandoMetodos = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly esAdmin = signal(false);
  readonly esEdicion = signal(false);

  readonly rolesFormulario = computed(() =>
    this.roles().filter(rol => rol.nombre !== 'ADMIN_SISTEMA')
  );

  uuid: string | null = null;

  nombre = '';
  apellidos = '';
  email = '';
  fotoPerfil: string | null = null;

  empresaId: number | null = null;
  rolId: number | null = null;
  metodoFichajeId: number | null = null;

  private empresaOrigen: number | null = null;
  private estadoOrigen: EstadoUsuario = 'ACTIVO';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly empresaService: EmpresaService,
    private readonly usuarioService: UsuarioService,
    private readonly metodoFichajeService: MetodoFichajeService
  ) {}

  ngOnInit(): void {
    this.uuid = this.route.snapshot.paramMap.get('uuid');
    this.esEdicion.set(this.uuid !== null);

    this.cargarContextoOrigen();

    const sesion = this.authService.getSesion();

    if (!sesion) {
      return;
    }

    this.esAdmin.set(sesion.rol === 'ADMIN_SISTEMA');

    if (this.esAdmin()) {
      this.inicializarAdmin();
      return;
    }

    this.inicializarEncargado(sesion.usuarioUuid);
  }

  cambiarEmpresa(): void {
    this.error.set(null);
    this.metodoFichajeId = null;

    if (this.empresaId === null) {
      this.metodos.set([]);
      return;
    }

    this.cargarMetodos(this.empresaId);
  }

  guardar(): void {
    this.error.set(null);

    if (this.empresaId === null || this.rolId === null) {
      this.error.set('Empresa y rol son obligatorios.');
      return;
    }

    const usuario: UserDTO = {
      nombre: this.nombre.trim(),
      apellidos: this.apellidos.trim(),
      fotoPerfil: this.fotoPerfil,
      email: this.email.trim(),
      empresaId: this.empresaId,
      rolId: this.rolId,
      metodoFichajeId: this.metodoFichajeId,
    };

    const uuid = this.uuid;
    const esNuevo = uuid === null;

    const operacion = esNuevo
      ? this.usuarioService.crear(usuario)
      : this.usuarioService.modificar(uuid, usuario);

    this.guardando.set(true);

    operacion
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          this.volverAlListado(
            esNuevo ? 'PENDIENTE' : this.estadoOrigen,
            this.empresaId
          );
        },
        error: error => this.mostrarError(error),
      });
  }

  cancelar(): void {
    this.volverAlListado(
      this.estadoOrigen,
      this.empresaOrigen
    );
  }

  private inicializarAdmin(): void {
    this.cargando.set(true);

    const uuid = this.uuid;

    forkJoin({
      empresas: this.empresaService.obtenerTodasLasEmpresas(),
      roles: this.usuarioService.listarRolesAsignables(),
      usuario:
        uuid === null
          ? of<UserDTO | null>(null)
          : this.usuarioService.buscarPorUuid(uuid),
    })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: respuesta => {
          this.empresas.set(respuesta.empresas);
          this.roles.set(respuesta.roles);

          if (respuesta.usuario !== null) {
            this.aplicarUsuario(respuesta.usuario);
            return;
          }

          if (this.empresaId !== null) {
            this.cargarMetodos(this.empresaId);
          }
        },
        error: error => this.mostrarError(error),
      });
  }

  private inicializarEncargado(uuidAutenticado: string): void {
    this.cargando.set(true);

    const uuid = this.uuid;

    forkJoin({
      roles: this.usuarioService.listarRolesAsignables(),
      autenticado: this.usuarioService.buscarPorUuid(uuidAutenticado),
      usuario:
        uuid === null
          ? of<UserDTO | null>(null)
          : this.usuarioService.buscarPorUuid(uuid),
    })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: respuesta => {
          this.roles.set(respuesta.roles);

          const empresaId = respuesta.autenticado.empresaId;

          if (empresaId == null) {
            this.error.set(
              'El usuario no tiene una empresa asociada.'
            );
            return;
          }

          this.empresaId = empresaId;
          this.empresaOrigen ??= empresaId;

          if (respuesta.usuario !== null) {
            this.aplicarUsuario(respuesta.usuario);
            return;
          }

          this.cargarMetodos(empresaId);
        },
        error: error => this.mostrarError(error),
      });
  }

  private aplicarUsuario(usuario: UserDTO): void {
    this.nombre = usuario.nombre;
    this.apellidos = usuario.apellidos;
    this.email = usuario.email;
    this.fotoPerfil = usuario.fotoPerfil ?? null;

    this.empresaId = usuario.empresaId ?? null;
    this.rolId = usuario.rolId;
    this.metodoFichajeId = usuario.metodoFichajeId ?? null;

    this.empresaOrigen ??= this.empresaId;

    if (this.empresaId !== null) {
      this.cargarMetodos(this.empresaId);
    }
  }

  private cargarMetodos(empresaId: number): void {
    this.cargandoMetodos.set(true);

    this.metodoFichajeService
      .listarPorEmpresa(empresaId)
      .pipe(finalize(() => this.cargandoMetodos.set(false)))
      .subscribe({
        next: metodos => this.metodos.set(metodos),
        error: error => {
          this.metodos.set([]);
          this.mostrarError(error);
        },
      });
  }

  private cargarContextoOrigen(): void {
    const empresa = this.route.snapshot.queryParamMap.get('empresaId');

    if (empresa !== null) {
      const empresaId = Number(empresa);

      if (Number.isInteger(empresaId) && empresaId > 0) {
        this.empresaOrigen = empresaId;

        if (!this.esEdicion()) {
          this.empresaId = empresaId;
        }
      }
    }

    const estado = this.route.snapshot.queryParamMap.get('estado');

    if (
      estado === 'PENDIENTE' ||
      estado === 'ACTIVO' ||
      estado === 'INACTIVO' ||
      estado === 'BLOQUEADO'
    ) {
      this.estadoOrigen = estado;
    }
  }

  private volverAlListado(
    estado: EstadoUsuario,
    empresaId: number | null
  ): void {
    if (empresaId === null) {
      void this.router.navigate(
        ['/usuarios'],
        { queryParams: { estado } }
      );
      return;
    }

    void this.router.navigate(
      ['/usuarios'],
      {
        queryParams: {
          empresaId,
          estado,
        },
      }
    );
  }

  private mostrarError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.error.set(
        error.error?.message ??
        'No se ha podido completar la operación.'
      );
      return;
    }

    this.error.set('No se ha podido completar la operación.');
  }
}