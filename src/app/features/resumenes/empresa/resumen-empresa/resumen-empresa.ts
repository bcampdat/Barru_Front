import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  finalize,
  forkJoin,
  Observable,
} from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';

import { AuthService } from '../../../../core/auth/auth.service';
import { EmpresaService } from '../../../../core/empresa/empresa-service';
import { EmpresaDTO } from '../../../../core/empresa/empresa.types';
import { ResumenService } from '../../../../core/resumenes/resumen-service';
import {
  ResumenDiarioDTO,
  ResumenEmpresaDTO,
} from '../../../../core/resumenes/resumen-types';
import { UsuarioService } from '../../../../core/usuarios/usuario-service';
import { UserDTO } from '../../../../core/usuarios/usuario.types';

type ModoConsulta =
  | 'HOY'
  | 'FECHA'
  | 'RANGO'
  | 'HISTORICO';

@Component({
  selector: 'app-resumen-empresa',
  imports: [
    FormsModule,
    InputTextModule,
    MessageModule,
    TableModule,
  ],
  templateUrl: './resumen-empresa.html',
  styleUrl: './resumen-empresa.scss',
})
export class ResumenEmpresa implements OnInit {

  readonly empresas = signal<EmpresaDTO[]>([]);
  readonly trabajadores = signal<UserDTO[]>([]);

  readonly resumenEmpresa =
    signal<ResumenEmpresaDTO | null>(null);

  readonly historicoEmpresa =
    signal<ResumenEmpresaDTO[]>([]);

  readonly trabajadorSeleccionado =
    signal<UserDTO | null>(null);

  readonly resumenTrabajador =
    signal<ResumenDiarioDTO | null>(null);

  readonly historicoTrabajador =
    signal<ResumenDiarioDTO[]>([]);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly esAdmin = signal(false);

  readonly modoEmpresa =
    signal<ModoConsulta>('HOY');

  readonly modoTrabajador =
    signal<ModoConsulta>('HOY');

  readonly empresaId =
    signal<number | null>(null);

  fechaEmpresa = '';
  desdeEmpresa = '';
  hastaEmpresa = '';

  fechaTrabajador = '';
  desdeTrabajador = '';
  hastaTrabajador = '';

  constructor(
    private readonly authService: AuthService,
    private readonly empresaService: EmpresaService,
    private readonly usuarioService: UsuarioService,
    private readonly resumenService: ResumenService
  ) {}

  ngOnInit(): void {
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

  seleccionarEmpresa(
    empresaId: number | null
  ): void {
    this.empresaId.set(empresaId);
    this.limpiarEmpresa();

    if (empresaId === null) {
      return;
    }

    this.cargarContextoEmpresa(
      empresaId
    );
  }

  seleccionarTrabajador(
    trabajador: UserDTO
  ): void {
    if (!trabajador.uuid) {
      return;
    }

    this.trabajadorSeleccionado.set(
      trabajador
    );

    this.limpiarConsultaTrabajador();
    this.consultarTrabajadorHoy();
  }

  consultarEmpresaHoy(): void {
    const empresaId =
      this.empresaId();

    if (empresaId === null) {
      return;
    }

    this.prepararConsultaEmpresa('HOY');

    this.obtenerResumenEmpresaHoy(
      empresaId
    )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: resumen => {
          this.resumenEmpresa.set(
            resumen
          );
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarEmpresaFecha(): void {
    const empresaId =
      this.empresaId();

    if (empresaId === null) {
      return;
    }

    if (!this.fechaEmpresa) {
      this.error.set(
        'Selecciona una fecha.'
      );
      return;
    }

    this.prepararConsultaEmpresa(
      'FECHA'
    );

    this.obtenerResumenEmpresaFecha(
      empresaId,
      this.fechaEmpresa
    )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: resumen => {
          this.resumenEmpresa.set(
            resumen
          );
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarEmpresaRango(): void {
    const empresaId =
      this.empresaId();

    if (empresaId === null) {
      return;
    }

    if (
      !this.desdeEmpresa ||
      !this.hastaEmpresa
    ) {
      this.error.set(
        'Selecciona la fecha inicial y la fecha final.'
      );
      return;
    }

    if (
      this.desdeEmpresa >
      this.hastaEmpresa
    ) {
      this.error.set(
        'La fecha inicial no puede ser posterior a la fecha final.'
      );
      return;
    }

    this.prepararConsultaEmpresa(
      'RANGO'
    );

    this.obtenerHistoricoEmpresaRango(
      empresaId,
      this.desdeEmpresa,
      this.hastaEmpresa
    )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: historico => {
          this.historicoEmpresa.set(
            historico
          );
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarEmpresaHistorico(): void {
    const empresaId =
      this.empresaId();

    if (empresaId === null) {
      return;
    }

    this.prepararConsultaEmpresa(
      'HISTORICO'
    );

    this.obtenerHistoricoEmpresa(
      empresaId
    )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: historico => {
          this.historicoEmpresa.set(
            historico
          );
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarTrabajadorHoy(): void {
    const uuid =
      this.obtenerUuidTrabajador();

    if (!uuid) {
      return;
    }

    this.prepararConsultaTrabajador(
      'HOY'
    );

    this.resumenService
      .obtenerResumenTrabajadorHoy(
        uuid
      )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: resumen => {
          this.resumenTrabajador.set(
            resumen
          );
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarTrabajadorFecha(): void {
    const uuid =
      this.obtenerUuidTrabajador();

    if (!uuid) {
      return;
    }

    if (!this.fechaTrabajador) {
      this.error.set(
        'Selecciona una fecha.'
      );
      return;
    }

    this.prepararConsultaTrabajador(
      'FECHA'
    );

    this.resumenService
      .obtenerResumenTrabajadorPorFecha(
        uuid,
        this.fechaTrabajador
      )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: resumen => {
          this.resumenTrabajador.set(
            resumen
          );
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarTrabajadorRango(): void {
    const uuid =
      this.obtenerUuidTrabajador();

    if (!uuid) {
      return;
    }

    if (
      !this.desdeTrabajador ||
      !this.hastaTrabajador
    ) {
      this.error.set(
        'Selecciona la fecha inicial y la fecha final.'
      );
      return;
    }

    if (
      this.desdeTrabajador >
      this.hastaTrabajador
    ) {
      this.error.set(
        'La fecha inicial no puede ser posterior a la fecha final.'
      );
      return;
    }

    this.prepararConsultaTrabajador(
      'RANGO'
    );

    this.resumenService
      .obtenerHistoricoTrabajadorPorRango(
        uuid,
        this.desdeTrabajador,
        this.hastaTrabajador
      )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: historico => {
          this.historicoTrabajador.set(
            historico
          );
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  consultarTrabajadorHistorico(): void {
    const uuid =
      this.obtenerUuidTrabajador();

    if (!uuid) {
      return;
    }

    this.prepararConsultaTrabajador(
      'HISTORICO'
    );

    this.resumenService
      .obtenerHistoricoTrabajador(
        uuid
      )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: historico => {
          this.historicoTrabajador.set(
            historico
          );
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
      .subscribe({
        next: usuario => {
          const empresaId =
            usuario.empresaId;

          if (empresaId == null) {
            this.cargando.set(false);

            this.error.set(
              'El usuario no tiene una empresa asociada.'
            );
            return;
          }

          this.empresaId.set(
            empresaId
          );

          this.cargarContextoEmpresa(
            empresaId
          );
        },
        error: error => {
          this.cargando.set(false);
          this.mostrarError(error);
        },
      });
  }

  private cargarContextoEmpresa(
    empresaId: number
  ): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      resumen:
        this.obtenerResumenEmpresaHoy(
          empresaId
        ),

      trabajadores:
        this.usuarioService
          .listarPorEmpresa(
            empresaId
          ),
    })
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: respuesta => {
          this.resumenEmpresa.set(
            respuesta.resumen
          );

          this.trabajadores.set(
            respuesta.trabajadores
          );

          this.modoEmpresa.set(
            'HOY'
          );
        },
        error: error => {
          this.mostrarError(error);
        },
      });
  }

  private obtenerResumenEmpresaHoy(
    empresaId: number
  ): Observable<ResumenEmpresaDTO> {
    return this.esAdmin()
      ? this.resumenService
          .obtenerResumenEmpresaHoy(
            empresaId
          )
      : this.resumenService
          .obtenerResumenMiEmpresaHoy();
  }

  private obtenerResumenEmpresaFecha(
    empresaId: number,
    fecha: string
  ): Observable<ResumenEmpresaDTO> {
    return this.esAdmin()
      ? this.resumenService
          .obtenerResumenEmpresaPorFecha(
            empresaId,
            fecha
          )
      : this.resumenService
          .obtenerResumenMiEmpresaPorFecha(
            fecha
          );
  }

  private obtenerHistoricoEmpresa(
    empresaId: number
  ): Observable<ResumenEmpresaDTO[]> {
    return this.esAdmin()
      ? this.resumenService
          .obtenerHistoricoEmpresa(
            empresaId
          )
      : this.resumenService
          .obtenerHistoricoMiEmpresa();
  }

  private obtenerHistoricoEmpresaRango(
    empresaId: number,
    desde: string,
    hasta: string
  ): Observable<ResumenEmpresaDTO[]> {
    return this.esAdmin()
      ? this.resumenService
          .obtenerHistoricoEmpresaPorRango(
            empresaId,
            desde,
            hasta
          )
      : this.resumenService
          .obtenerHistoricoMiEmpresaPorRango(
            desde,
            hasta
          );
  }

  private obtenerUuidTrabajador():
    string | null {
    return this.trabajadorSeleccionado()
      ?.uuid ?? null;
  }

  private prepararConsultaEmpresa(
    modo: ModoConsulta
  ): void {
    this.error.set(null);

    this.resumenEmpresa.set(null);
    this.historicoEmpresa.set([]);

    this.modoEmpresa.set(modo);
    this.cargando.set(true);
  }

  private prepararConsultaTrabajador(
    modo: ModoConsulta
  ): void {
    this.error.set(null);

    this.resumenTrabajador.set(null);
    this.historicoTrabajador.set([]);

    this.modoTrabajador.set(modo);
    this.cargando.set(true);
  }

  private limpiarEmpresa(): void {
    this.error.set(null);

    this.resumenEmpresa.set(null);
    this.historicoEmpresa.set([]);

    this.trabajadores.set([]);
    this.trabajadorSeleccionado.set(null);

    this.resumenTrabajador.set(null);
    this.historicoTrabajador.set([]);

    this.fechaEmpresa = '';
    this.desdeEmpresa = '';
    this.hastaEmpresa = '';

    this.fechaTrabajador = '';
    this.desdeTrabajador = '';
    this.hastaTrabajador = '';

    this.modoEmpresa.set('HOY');
    this.modoTrabajador.set('HOY');
  }

  private limpiarConsultaTrabajador(): void {
    this.error.set(null);

    this.resumenTrabajador.set(null);
    this.historicoTrabajador.set([]);

    this.fechaTrabajador = '';
    this.desdeTrabajador = '';
    this.hastaTrabajador = '';

    this.modoTrabajador.set('HOY');
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