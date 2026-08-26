import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, Observable } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';

import { AuthService } from '../../../../core/auth/auth.service';
import {
  DescargaPdfService,
  DescargaPdfSolicitud,
} from '../../../../core/descargas/descarga-pdf-service';
import { EmpresaService } from '../../../../core/empresa/empresa-service';
import { EmpresaDTO } from '../../../../core/empresa/empresa.types';

import type {
  MotivoSalida,
  TipoFichaje,
  TipoSalida,
} from '../../../../core/fichaje/fichaje-types';

import { ResumenService } from '../../../../core/resumenes/resumen-service';
import {
  ResumenEmpresaDTO,
  TipoIncidenciaEmpresa,
} from '../../../../core/resumenes/resumen-types';
import { UsuarioService } from '../../../../core/usuarios/usuario-service';
import { UserDTO } from '../../../../core/usuarios/usuario.types';
import { ResumenTrabajador } from '../../trabajador/resumen-trabajador/resumen-trabajador';


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
    ResumenTrabajador,
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

  readonly cargando = signal(false);
  readonly descargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly esAdmin = signal(false);

  readonly modoEmpresa =
    signal<ModoConsulta>('HOY');

  readonly empresaId =
    signal<number | null>(null);

  fechaEmpresa = '';
  desdeEmpresa = '';
  hastaEmpresa = '';


  constructor(
    private readonly authService: AuthService,
    private readonly empresaService: EmpresaService,
    private readonly usuarioService: UsuarioService,
    private readonly resumenService: ResumenService,
    private readonly descargaPdfService: DescargaPdfService
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

    this.empresaId.set(
      empresaId
    );

    this.limpiarEmpresa();

    if (empresaId !== null) {

      this.cargarContextoEmpresa(
        empresaId
      );
    }
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
  }


  consultarEmpresaHoy(): void {

    this.consultarEmpresa(
      'HOY'
    );
  }


  consultarEmpresaFecha(): void {

    this.consultarEmpresa(
      'FECHA'
    );
  }


  consultarEmpresaRango(): void {

    this.consultarEmpresa(
      'RANGO'
    );
  }


  consultarEmpresaHistorico(): void {

    this.consultarEmpresa(
      'HISTORICO'
    );
  }


  /*
   * Texto visible del tipo general
   * de incidencia.
   */
  textoTipoIncidencia(
    tipo: TipoIncidenciaEmpresa
  ): string {

    switch (tipo) {

      case 'SALIDA':
        return 'Salida';

      case 'JORNADA_INCOMPLETA':
        return 'Jornada incompleta';
    }
  }


  /*
   * Texto visible del último fichaje
   * real relacionado con la incidencia.
   */
  textoTipoFichaje(
    tipo: TipoFichaje
  ): string {

    switch (tipo) {

      case 'ENTRADA':
        return 'Entrada';

      case 'INICIO_PAUSA':
        return 'Inicio de pausa';

      case 'FIN_PAUSA':
        return 'Fin de pausa';

      case 'SALIDA':
        return 'Salida';
    }
  }


  /*
   * Texto visible de la clasificación
   * de una salida.
   *
   * No decide qué es una incidencia.
   * Esa regla pertenece al backend.
   */
  textoTipoSalida(
    tipo: TipoSalida | null
  ): string {

    if (tipo === null) {
      return 'Sin clasificación de salida';
    }

    switch (tipo) {

      case 'INTERMEDIA':
        return 'Salida intermedia';

      case 'ORDINARIA':
        return 'Salida ordinaria';

      case 'ANTICIPADA':
        return 'Salida anticipada';

      case 'TRAS_HORAS_EXTRA':
        return 'Salida tras horas extra';
    }
  }


  /*
   * Texto visible del motivo declarado
   * por el trabajador.
   */
  textoMotivoSalida(
    motivo: MotivoSalida | null
  ): string {

    if (motivo === null) {
      return 'Sin motivo indicado';
    }

    switch (motivo) {

      case 'JORNADA_PARTIDA':
        return 'Jornada partida';

      case 'MEDICO':
        return 'Médico';

      case 'ESPECIALISTA':
        return 'Especialista';

      case 'PERSONAL':
        return 'Personal';

      case 'LABORAL':
        return 'Laboral';

      case 'OTRO':
        return 'Otro';
    }
  }


  descargarPdfEmpresa(): void {

    this.error.set(null);

    const solicitud =
      this.crearSolicitudDescarga();

    if (!solicitud) {
      return;
    }

    this.descargando.set(true);

    this.descargaPdfService
      .descargar(
        solicitud
      )
      .pipe(
        finalize(() =>
          this.descargando.set(false)
        )
      )
      .subscribe({
        error: error =>
          this.mostrarErrorDescarga(
            error
          ),
      });
  }


  puedeDescargarEmpresa(): boolean {

    if (
      this.cargando()
      || this.descargando()
    ) {

      return false;
    }

    if (
      this.modoEmpresa() === 'HOY'
      || this.modoEmpresa() === 'FECHA'
    ) {

      return this.resumenEmpresa()
        !== null;
    }

    if (
      this.modoEmpresa()
        === 'RANGO'
    ) {

      return this.historicoEmpresa()
        .length > 0;
    }

    return false;
  }


  private consultarEmpresa(
    modo: ModoConsulta
  ): void {

    const empresaId =
      this.empresaId();

    if (empresaId === null) {
      return;
    }

    if (
      modo === 'FECHA'
      && !this.fechaEmpresa
    ) {

      this.error.set(
        'Selecciona una fecha.'
      );

      return;
    }

    if (
      modo === 'RANGO'
      && !this.validarRango()
    ) {

      return;
    }

    this.prepararConsulta(
      modo
    );

    switch (modo) {

      case 'HOY':

        this.ejecutarConsulta(
          this.obtenerResumenEmpresaHoy(
            empresaId
          ),
          resumen =>
            this.resumenEmpresa.set(
              resumen
            )
        );

        break;

      case 'FECHA':

        this.ejecutarConsulta(
          this.obtenerResumenEmpresaFecha(
            empresaId,
            this.fechaEmpresa
          ),
          resumen =>
            this.resumenEmpresa.set(
              resumen
            )
        );

        break;

      case 'RANGO':

        this.ejecutarConsulta(
          this.obtenerHistoricoEmpresaRango(
            empresaId,
            this.desdeEmpresa,
            this.hastaEmpresa
          ),
          historico =>
            this.historicoEmpresa.set(
              historico
            )
        );

        break;

      case 'HISTORICO':

        this.ejecutarConsulta(
          this.obtenerHistoricoEmpresa(
            empresaId
          ),
          historico =>
            this.historicoEmpresa.set(
              historico
            )
        );

        break;
    }
  }


  private crearSolicitudDescarga():
    DescargaPdfSolicitud | null {

    const empresaId =
      this.empresaId();

    if (empresaId === null) {
      return null;
    }

    const datosEmpresa =
      this.esAdmin()
        ? { empresaId }
        : {};

    switch (
      this.modoEmpresa()
    ) {

      case 'HOY': {

        const fecha =
          this.fechaDtoAIso(
            this.resumenEmpresa()
              ?.fecha
          );

        if (!fecha) {

          this.error.set(
            'No hay un resumen disponible para descargar.'
          );

          return null;
        }

        return {
          tipoDocumento: 'RESUMEN',
          ambito: 'EMPRESA',
          periodo: 'DIA',
          fecha,
          ...datosEmpresa,
        };
      }

      case 'FECHA':

        if (
          !this.fechaEmpresa
          || !this.resumenEmpresa()
        ) {

          this.error.set(
            'Consulta primero una fecha para poder descargarla.'
          );

          return null;
        }

        return {
          tipoDocumento: 'RESUMEN',
          ambito: 'EMPRESA',
          periodo: 'DIA',
          fecha: this.fechaEmpresa,
          ...datosEmpresa,
        };

      case 'RANGO':

        if (
          !this.desdeEmpresa
          || !this.hastaEmpresa
          || this.historicoEmpresa()
            .length === 0
        ) {

          this.error.set(
            'Consulta primero un periodo con datos para poder descargarlo.'
          );

          return null;
        }

        return {
          tipoDocumento: 'RESUMEN',
          ambito: 'EMPRESA',
          periodo: 'RANGO',
          desde: this.desdeEmpresa,
          hasta: this.hastaEmpresa,
          ...datosEmpresa,
        };

      case 'HISTORICO':
        return null;
    }
  }


  private inicializarAdmin(): void {

    this.cargando.set(true);

    this.ejecutarConsulta(
      this.empresaService
        .obtenerTodasLasEmpresas(),
      empresas =>
        this.empresas.set(
          empresas
        )
    );
  }


  private inicializarEncargado(
    usuarioUuid: string
  ): void {

    this.cargando.set(true);

    this.usuarioService
      .buscarPorUuid(
        usuarioUuid
      )
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

          this.mostrarError(
            error
          );
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

        error: error =>
          this.mostrarError(
            error
          ),
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


  private ejecutarConsulta<T>(
    peticion: Observable<T>,
    guardar: (
      resultado: T
    ) => void
  ): void {

    peticion
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: guardar,

        error: error =>
          this.mostrarError(
            error
          ),
      });
  }


  private validarRango(): boolean {

    if (
      !this.desdeEmpresa
      || !this.hastaEmpresa
    ) {

      this.error.set(
        'Selecciona la fecha inicial y la fecha final.'
      );

      return false;
    }

    if (
      this.desdeEmpresa
      > this.hastaEmpresa
    ) {

      this.error.set(
        'La fecha inicial no puede ser posterior a la fecha final.'
      );

      return false;
    }

    return true;
  }


  private prepararConsulta(
    modo: ModoConsulta
  ): void {

    this.error.set(null);

    this.resumenEmpresa.set(
      null
    );

    this.historicoEmpresa.set(
      []
    );

    this.modoEmpresa.set(
      modo
    );

    this.cargando.set(
      true
    );
  }


  private limpiarEmpresa(): void {

    this.error.set(null);

    this.resumenEmpresa.set(
      null
    );

    this.historicoEmpresa.set(
      []
    );

    this.trabajadores.set(
      []
    );

    this.trabajadorSeleccionado.set(
      null
    );

    this.fechaEmpresa = '';
    this.desdeEmpresa = '';
    this.hastaEmpresa = '';

    this.modoEmpresa.set(
      'HOY'
    );
  }


  private fechaDtoAIso(
    fecha: string | undefined
  ): string | null {

    if (!fecha) {
      return null;
    }

    const partes =
      fecha.split('/');

    if (
      partes.length !== 3
    ) {

      return null;
    }

    const [
      dia,
      mes,
      anio,
    ] = partes;

    return dia && mes && anio
      ? `${anio}-${mes}-${dia}`
      : null;
  }


  private mostrarError(
    error: unknown
  ): void {

    if (
      error
      instanceof HttpErrorResponse
    ) {

      this.error.set(
        error.error?.message
        ?? 'No se ha podido consultar el resumen.'
      );

      return;
    }

    this.error.set(
      'No se ha podido consultar el resumen.'
    );
  }


  private mostrarErrorDescarga(
    error: unknown
  ): void {

    if (
      !(
        error
        instanceof HttpErrorResponse
      )
    ) {

      this.error.set(
        'No se ha podido descargar el PDF.'
      );

      return;
    }

    if (
      error.error
      instanceof Blob
    ) {

      void this.leerErrorBlob(
        error.error
      );

      return;
    }

    this.error.set(
      error.error?.message
      ?? 'No se ha podido descargar el PDF.'
    );
  }


  private async leerErrorBlob(
    blob: Blob
  ): Promise<void> {

    try {

      const respuesta =
        JSON.parse(
          await blob.text()
        ) as {
          message?: string;
        };

      this.error.set(
        respuesta.message
        ?? 'No se ha podido descargar el PDF.'
      );

    } catch {

      this.error.set(
        'No se ha podido descargar el PDF.'
      );
    }
  }
}