import { HttpErrorResponse } from '@angular/common/http';

import {
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';

import { finalize } from 'rxjs';

import {
  HorasExtraService,
} from '../../core/fichaje/horas-extras/horas-extra.service';

import {
  SolicitudHorasExtraDTO,
} from '../../core/fichaje/horas-extras/horas-extra-types';


@Component({
  selector: 'app-notificaciones',

  imports: [],

  templateUrl: './notificaciones.html',
})
export class Notificaciones
implements OnInit, OnDestroy {

  readonly solicitudes =
    signal<SolicitudHorasExtraDTO[]>([]);

  readonly seleccionadas =
    signal<number[]>([]);

  readonly cargando =
    signal(false);

  readonly procesando =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly mensaje =
    signal<string | null>(null);


  private intervalo:
    ReturnType<typeof setInterval> | null =
      null;


  constructor(
    private readonly horasExtraService:
      HorasExtraService
  ) {}


  ngOnInit(): void {

    this.cargarSolicitudes();

    /*
     * Las solicitudes pueden:
     *
     * - aparecer;
     * - ser resueltas por otro encargado;
     * - caducar.
     *
     * Se refrescan periódicamente mientras
     * esta pantalla permanece abierta.
     */
    this.intervalo =
      setInterval(
        () =>
          this.cargarSolicitudes(),
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
  }


  /*
   * =========================================================
   * CARGA
   * =========================================================
   */

  cargarSolicitudes(): void {

    if (
      this.cargando()
      || this.procesando()
    ) {
      return;
    }

    this.cargando.set(true);

    this.error.set(null);

    this.horasExtraService
      .obtenerSolicitudesMiEmpresa()
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({

        next: solicitudes => {

          this.solicitudes.set(
            solicitudes
          );

          /*
           * Si una solicitud ha sido resuelta
           * por otro encargado o ha caducado,
           * deja también de estar seleccionada.
           */
          this.limpiarSeleccionInvalida(
            solicitudes
          );
        },

        error: error => {

          this.error.set(
            this.obtenerMensajeError(
              error,
              'No se han podido cargar las solicitudes de horas extra.'
            )
          );
        },
      });
  }


  /*
   * =========================================================
   * SELECCIÓN
   * =========================================================
   */

  estaSeleccionada(
    solicitudId: number
  ): boolean {

    return this.seleccionadas()
      .includes(
        solicitudId
      );
  }


  alternarSeleccion(
    solicitudId: number
  ): void {

    if (this.procesando()) {
      return;
    }

    const actuales =
      this.seleccionadas();

    if (
      actuales.includes(
        solicitudId
      )
    ) {

      this.seleccionadas.set(
        actuales.filter(
          id =>
            id !== solicitudId
        )
      );

      return;
    }

    this.seleccionadas.set([
      ...actuales,
      solicitudId,
    ]);
  }


  seleccionarTodas(): void {

    if (this.procesando()) {
      return;
    }

    const solicitudes =
      this.solicitudes();

    if (solicitudes.length === 0) {

      this.seleccionadas.set([]);

      return;
    }

    if (
      this.seleccionadas().length
      === solicitudes.length
    ) {

      this.seleccionadas.set([]);

      return;
    }

    this.seleccionadas.set(
      solicitudes.map(
        solicitud =>
          solicitud.id
      )
    );
  }


  todasSeleccionadas(): boolean {

    const solicitudes =
      this.solicitudes();

    return solicitudes.length > 0
      && this.seleccionadas().length
        === solicitudes.length;
  }


  haySeleccionadas(): boolean {

    return this.seleccionadas()
      .length > 0;
  }


  /*
   * =========================================================
   * RESOLUCIÓN MÚLTIPLE
   * =========================================================
   */

  autorizarSeleccionadas(): void {

    this.resolver(
      this.seleccionadas(),
      'AUTORIZAR'
    );
  }


  rechazarSeleccionadas(): void {

    this.resolver(
      this.seleccionadas(),
      'RECHAZAR'
    );
  }


  /*
   * =========================================================
   * RESOLUCIÓN INDIVIDUAL
   * =========================================================
   */

  autorizar(
    solicitudId: number
  ): void {

    this.resolver(
      [solicitudId],
      'AUTORIZAR'
    );
  }


  rechazar(
    solicitudId: number
  ): void {

    this.resolver(
      [solicitudId],
      'RECHAZAR'
    );
  }


  /*
   * =========================================================
   * RESOLUCIÓN CENTRAL
   * =========================================================
   */

  private resolver(
    solicitudesIds: number[],
    accion: 'AUTORIZAR' | 'RECHAZAR'
  ): void {

    if (
      this.procesando()
      || solicitudesIds.length === 0
    ) {
      return;
    }

    this.error.set(null);

    this.mensaje.set(null);

    this.procesando.set(true);

    const operacion =
      accion === 'AUTORIZAR'
        ? this.horasExtraService
            .autorizar(
              solicitudesIds
            )
        : this.horasExtraService
            .rechazar(
              solicitudesIds
            );

    operacion
      .pipe(
        finalize(() =>
          this.procesando.set(false)
        )
      )
      .subscribe({

        next: () => {

          this.seleccionadas.set([]);

          this.mensaje.set(
            accion === 'AUTORIZAR'
              ? 'Solicitudes autorizadas correctamente.'
              : 'Solicitudes rechazadas correctamente.'
          );

          /*
           * Volvemos a consultar al backend.
           *
           * Así también recogemos posibles
           * cambios realizados simultáneamente
           * por otros encargados.
           */
          this.cargarSolicitudes();
        },

        error: error => {

          this.error.set(
            this.obtenerMensajeError(
              error,
              accion === 'AUTORIZAR'
                ? 'No se han podido autorizar las solicitudes.'
                : 'No se han podido rechazar las solicitudes.'
            )
          );

          /*
           * Puede haber ocurrido un conflicto
           * porque otro encargado haya resuelto
           * alguna solicitud.
           *
           * Refrescamos para mostrar
           * el estado real del servidor.
           */
          this.cargarSolicitudes();
        },
      });
  }


  /*
   * =========================================================
   * AUXILIARES
   * =========================================================
   */

  private limpiarSeleccionInvalida(
    solicitudes:
      SolicitudHorasExtraDTO[]
  ): void {

    const idsDisponibles =
      new Set(
        solicitudes.map(
          solicitud =>
            solicitud.id
        )
      );

    this.seleccionadas.set(
      this.seleccionadas()
        .filter(
          id =>
            idsDisponibles.has(
              id
            )
        )
    );
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