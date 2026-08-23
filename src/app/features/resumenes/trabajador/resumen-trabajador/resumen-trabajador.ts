import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';

import { AuthService } from '../../../../core/auth/auth.service';
import { EmpresaService } from '../../../../core/empresa/empresa-service';
import { EmpresaDTO } from '../../../../core/empresa/empresa.types';
import { ResumenService } from '../../../../core/resumenes/resumen-service';
import { ResumenDiarioDTO } from '../../../../core/resumenes/resumen-types';
import { UsuarioService } from '../../../../core/usuarios/usuario-service';
import { UserDTO } from '../../../../core/usuarios/usuario.types';

type ModoConsulta =
  | 'HOY'
  | 'FECHA'
  | 'RANGO'
  | 'HISTORICO';

@Component({
  selector: 'app-resumen-trabajador',
  imports: [
    FormsModule,
    MessageModule,
    TableModule,
  ],
  templateUrl: './resumen-trabajador.html',
  styleUrl: './resumen-trabajador.scss',
})
export class ResumenTrabajador implements OnInit {

  readonly empresas = signal<EmpresaDTO[]>([]);
  readonly trabajadores = signal<UserDTO[]>([]);

  readonly resumen =
    signal<ResumenDiarioDTO | null>(null);

  readonly historico =
    signal<ResumenDiarioDTO[]>([]);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly esAdmin = signal(false);

  readonly modo =
    signal<ModoConsulta>('HOY');

  empresaId: number | null = null;
  usuarioUuid: string | null = null;

  fecha = '';
  desde = '';
  hasta = '';

  constructor(
    private readonly authService: AuthService,
    private readonly empresaService: EmpresaService,
    private readonly usuarioService: UsuarioService,
    private readonly resumenService: ResumenService
  ) {}

  ngOnInit(): void {
    const sesion = this.authService.getSesion();

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

  seleccionarEmpresa(): void {
    this.usuarioUuid = null;
    this.trabajadores.set([]);

    this.limpiarConsulta();

    if (this.empresaId === null) {
      return;
    }

    this.cargarTrabajadores(
      this.empresaId
    );
  }

  seleccionarTrabajador(): void {
    this.limpiarConsulta();

    if (this.usuarioUuid !== null) {
      this.consultarHoy();
    }
  }

  consultarHoy(): void {
    const uuid = this.usuarioUuid;

    if (!uuid) {
      this.error.set(
        'Selecciona un trabajador.'
      );
      return;
    }

    this.prepararConsulta('HOY');

    this.resumenService
      .obtenerResumenTrabajadorHoy(uuid)
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: resumen => {
          this.resumen.set(resumen);
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarFecha(): void {
    const uuid = this.usuarioUuid;

    if (!uuid) {
      this.error.set(
        'Selecciona un trabajador.'
      );
      return;
    }

    if (!this.fecha) {
      this.error.set(
        'Selecciona una fecha.'
      );
      return;
    }

    this.prepararConsulta('FECHA');

    this.resumenService
      .obtenerResumenTrabajadorPorFecha(
        uuid,
        this.fecha
      )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: resumen => {
          this.resumen.set(resumen);
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarRango(): void {
    const uuid = this.usuarioUuid;

    if (!uuid) {
      this.error.set(
        'Selecciona un trabajador.'
      );
      return;
    }

    if (!this.desde || !this.hasta) {
      this.error.set(
        'Selecciona la fecha inicial y la fecha final.'
      );
      return;
    }

    if (this.desde > this.hasta) {
      this.error.set(
        'La fecha inicial no puede ser posterior a la fecha final.'
      );
      return;
    }

    this.prepararConsulta('RANGO');

    this.resumenService
      .obtenerHistoricoTrabajadorPorRango(
        uuid,
        this.desde,
        this.hasta
      )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: historico => {
          this.historico.set(historico);
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarHistorico(): void {
    const uuid = this.usuarioUuid;

    if (!uuid) {
      this.error.set(
        'Selecciona un trabajador.'
      );
      return;
    }

    this.prepararConsulta('HISTORICO');

    this.resumenService
      .obtenerHistoricoTrabajador(uuid)
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: historico => {
          this.historico.set(historico);
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  private inicializarAdmin(): void {
    this.cargando.set(true);

    this.empresaService
      .obtenerTodasLasEmpresas()
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: empresas => {
          this.empresas.set(empresas);
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  private inicializarEncargado(
    usuarioUuid: string
  ): void {
    this.cargando.set(true);

    this.usuarioService
      .buscarPorUuid(usuarioUuid)
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: usuario => {
          const empresaId =
            usuario.empresaId;

          if (empresaId == null) {
            this.error.set(
              'El usuario no tiene una empresa asociada.'
            );
            return;
          }

          this.empresaId = empresaId;

          this.cargarTrabajadores(
            empresaId
          );
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  private cargarTrabajadores(
    empresaId: number
  ): void {
    this.cargando.set(true);

    this.usuarioService
      .listarPorEmpresa(empresaId)
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: trabajadores => {
          this.trabajadores.set(
            trabajadores.filter(
              trabajador =>
                trabajador.uuid !== null &&
                trabajador.uuid !== undefined
            )
          );
        },
        error: error => {
          this.trabajadores.set([]);
          this.mostrarError(error);
        },
      });
  }

  private prepararConsulta(
    modo: ModoConsulta
  ): void {
    this.error.set(null);
    this.resumen.set(null);
    this.historico.set([]);

    this.modo.set(modo);
    this.cargando.set(true);
  }

  private limpiarConsulta(): void {
    this.error.set(null);
    this.resumen.set(null);
    this.historico.set([]);
    this.modo.set('HOY');
  }

  private mostrarError(
    error: unknown
  ): void {
    if (error instanceof HttpErrorResponse) {
      this.error.set(
        error.error?.message ??
        'No se ha podido consultar el resumen.'
      );
      return;
    }

    this.error.set(
      'No se ha podido consultar el resumen.'
    );
  }
}