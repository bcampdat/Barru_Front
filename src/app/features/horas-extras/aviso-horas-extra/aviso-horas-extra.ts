import { HttpErrorResponse } from '@angular/common/http';

import {
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
} from '@angular/router';

import {
  filter,
  finalize,
  Subscription,
} from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';

import {
  HorasExtraService,
} from '../../../core/fichaje/horas-extras/horas-extra.service';

import {
  SolicitudHorasExtraDTO,
} from '../../../core/fichaje/horas-extras/horas-extra-types';

import { ResumenService } from '../../../core/resumenes/resumen-service';

import {
  ResumenDiarioDTO,
} from '../../../core/resumenes/resumen-types';


@Component({
  selector: 'app-aviso-horas-extra',

  templateUrl: './aviso-horas-extra.html',
})
export class AvisoHorasExtra
implements OnInit, OnDestroy {

  readonly resumen =
    signal<ResumenDiarioDTO | null>(null);

  readonly solicitud =
    signal<SolicitudHorasExtraDTO | null>(null);

  readonly procesando =
    signal(false);

  readonly error =
    signal<string | null>(null);


  private consultando = false;

  private intervalo:
    ReturnType<typeof setInterval> | null =
      null;

  private readonly suscripciones =
    new Subscription();


  constructor(
    private readonly authService: AuthService,
    private readonly resumenService: ResumenService,
    private readonly horasExtraService: HorasExtraService,
    private readonly router: Router
  ) {}


  ngOnInit(): void {

    /*
     * Comprobación inicial.
     */
    this.actualizarEstado();


    /*
     * Al cambiar de página se vuelve
     * a comprobar inmediatamente.
     *
     * De esta forma el aviso pertenece
     * a la aplicación y no a una página
     * concreta.
     */
    this.suscripciones.add(

      this.router.events
        .pipe(
          filter(
            evento =>
              evento instanceof NavigationEnd
          )
        )
        .subscribe(() =>
          this.actualizarEstado()
        )
    );


    /*
     * Mientras el usuario permanezca
     * dentro de Barru comprobamos:
     *
     * - finalización de jornada;
     * - autorización;
     * - rechazo;
     * - cancelación;
     * - caducidad.
     */
    this.intervalo =
      setInterval(
        () =>
          this.actualizarEstado(),
        15000
      );
  }


  ngOnDestroy(): void {

    if (this.intervalo !== null) {

      clearInterval(
        this.intervalo
      );

      this.intervalo =
        null;
    }

    this.suscripciones.unsubscribe();
  }


  /* VISIBILIDAD */

  mostrarAviso(): boolean {

    const resumen =
      this.resumen();

    if (!resumen) {
      return false;
    }

    /*
     * Jornada terminada:
     * no queda ninguna actuación pendiente.
     */
    if (
      resumen.situacion ===
      'FINALIZADA'
    ) {
      return false;
    }

    /*
     * Acaba de completar la jornada
     * y todavía no ha solicitado
     * horas extra.
     */
    if (
      resumen.requiereConfirmacionHorasExtra
    ) {
      return true;
    }

    /*
     * Si existe solicitud, el aviso
     * muestra su estado actual.
     */
    return this.solicitud() !== null;
  }


  /* TRABAJADOR */

  continuarTrabajando(): void {

    if (this.procesando()) {
      return;
    }

    this.error.set(null);

    this.procesando.set(true);

    this.horasExtraService
      .solicitar()
      .pipe(
        finalize(() =>
          this.procesando.set(false)
        )
      )
      .subscribe({

        next: solicitud => {

          this.solicitud.set(
            solicitud
          );

          /*
           * Refrescamos también el resumen
           * para obtener inmediatamente:
           *
           * ESPERANDO_AUTORIZACION_HORAS_EXTRA
           */
          this.actualizarEstado();
        },

        error: error => {

          this.error.set(
            this.obtenerMensajeError(
              error,
              'No se ha podido solicitar la autorización de horas extra.'
            )
          );
        },
      });
  }


  /*
   * El aviso global no replica
   * la lógica de SALIDA.
   *
   * La finalización real continúa
   * realizándose desde el flujo
   * existente de fichaje.
   */
  finalizarJornada(): void {

    void this.router.navigateByUrl(
      '/fichar'
    );
  }


  /*
   * El trabajador puede abandonar
   * voluntariamente la espera.
   *
   * Primero cancela la solicitud
   * y después accede al flujo normal
   * de salida.
   */
  cancelarYFinalizar(): void {

    if (this.procesando()) {
      return;
    }

    this.error.set(null);

    this.procesando.set(true);

    this.horasExtraService
      .cancelar()
      .pipe(
        finalize(() =>
          this.procesando.set(false)
        )
      )
      .subscribe({

        next: solicitud => {

          this.solicitud.set(
            solicitud
          );

          void this.router.navigateByUrl(
            '/fichar'
          );
        },

        error: error => {

          this.error.set(
            this.obtenerMensajeError(
              error,
              'No se ha podido cancelar la solicitud de horas extra.'
            )
          );
        },
      });
  }


  /*
   * =========================================================
   * ACTUALIZACIÓN GLOBAL
   * =========================================================
   */

  private actualizarEstado(): void {

    /*
     * No hacemos llamadas:
     *
     * - sin sesión;
     * - con FIRST_ACCESS;
     * - como ADMIN_SISTEMA.
     */
    if (!this.puedeConsultar()) {

      this.limpiarEstado();

      return;
    }

    /*
     * Evita solapar peticiones si una
     * consulta tarda más que el intervalo.
     */
    if (this.consultando) {
      return;
    }

    this.consultando = true;

    this.resumenService
      .obtenerMiResumenHoy()
      .subscribe({

        next: resumen => {

          this.resumen.set(
            resumen
          );

          /*
           * Jornada completamente finalizada.
           */
          if (
            resumen.situacion ===
            'FINALIZADA'
          ) {

            this.solicitud.set(null);

            this.consultando = false;

            return;
          }

          /*
           * En una jornada ordinaria que todavía
           * no ha alcanzado su final no existe
           * ninguna actuación de horas extra.
           *
           * Evitamos una segunda llamada HTTP
           * innecesaria.
           */
          if (
            !resumen.requiereConfirmacionHorasExtra
            &&
            resumen.situacion !==
              'JORNADA_COMPLETADA'
            &&
            resumen.situacion !==
              'ESPERANDO_AUTORIZACION_HORAS_EXTRA'
            &&
            resumen.situacion !==
              'HORAS_EXTRA'
          ) {

            this.solicitud.set(null);

            this.consultando = false;

            return;
          }

          /*
           * En los estados relacionados con
           * horas extra necesitamos conocer
           * el estado de la solicitud.
           */
          this.cargarSolicitud();
        },

        error: error => {

          this.consultando = false;

          /*
           * Antes del primer fichaje puede no
           * existir todavía resumen diario.
           *
           * Eso no es un error visual.
           */
          if (
            error instanceof HttpErrorResponse
            &&
            error.status === 404
          ) {

            this.limpiarEstado();
          }

          /*
           * Esta consulta es automática.
           * No mostramos un aviso global
           * por un fallo puntual de refresco.
           */
        },
      });
  }


  private cargarSolicitud(): void {

    this.horasExtraService
      .obtenerMiSolicitudHoy()
      .subscribe({

        next: solicitud => {

          this.solicitud.set(
            solicitud
          );

          this.consultando = false;
        },

        error: () => {

          /*
           * Un fallo puntual del polling
           * no debe interrumpir la página
           * que el usuario está utilizando.
           */
          this.consultando = false;
        },
      });
  }


  /*
   * =========================================================
   * SEGURIDAD DE PRESENTACIÓN
   * =========================================================
   */

  private puedeConsultar(): boolean {

    if (
      !this.authService
        .estaAutenticado()
    ) {
      return false;
    }

    const sesion =
      this.authService.getSesion();

    if (!sesion) {
      return false;
    }

    /*
     * El token de primer acceso no puede
     * entrar en el flujo operativo.
     */
    if (
      sesion.tipoToken !==
      'ACCESS'
    ) {
      return false;
    }

    /*
     * Tanto EMPLEADO como ENCARGADO
     * pueden tener jornada propia.
     *
     * ADMIN_SISTEMA queda fuera.
     */
    return (
      sesion.rol === 'EMPLEADO'
      ||
      sesion.rol === 'ENCARGADO'
    );
  }


  private limpiarEstado(): void {

    this.resumen.set(null);

    this.solicitud.set(null);

    this.error.set(null);
  }


  private obtenerMensajeError(
    error: unknown,
    mensajePorDefecto: string
  ): string {

    if (
      error instanceof HttpErrorResponse
      &&
      error.error
      &&
      typeof error.error === 'object'
      &&
      'message' in error.error
      &&
      typeof error.error.message ===
        'string'
    ) {

      return error.error.message;
    }

    return mensajePorDefecto;
  }

}