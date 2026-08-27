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

import { DialogModule } from 'primeng/dialog';

import { AuthService } from '../../../core/auth/auth.service';
import { FichajeService } from '../../../core/fichaje/fichaje-service';
import { HorasExtraService } from '../../../core/fichaje/horas-extras/horas-extra.service';
import { SolicitudHorasExtraDTO } from '../../../core/fichaje/horas-extras/horas-extra-types';
import { ResumenService } from '../../../core/resumenes/resumen-service';
import { ResumenDiarioDTO } from '../../../core/resumenes/resumen-types';


@Component({
  selector: 'app-aviso-horas-extra',
  imports: [
    DialogModule,
  ],
  templateUrl: './aviso-horas-extra.html',
})
export class AvisoHorasExtra
implements OnInit, OnDestroy {

  private static readonly POLLING_MS = 15000;
  private static readonly CUENTA_ATRAS_MS = 1000;
  private static readonly MARGEN_FIN_MS = 2000;
  private static readonly REINTENTO_FIN_MS = 5000;

  readonly resumen =
    signal<ResumenDiarioDTO | null>(null);

  readonly solicitud =
    signal<SolicitudHorasExtraDTO | null>(null);

  readonly procesando =
    signal(false);

  readonly error =
    signal<string | null>(null);

  private readonly ahora =
    signal(Date.now());

  private consultando = false;
  private ocultarParaFinalizar = false;
  private caducidadComprobada = false;

  private polling:
    ReturnType<typeof setInterval> | null =
      null;

  private cuentaAtras:
    ReturnType<typeof setInterval> | null =
      null;

  private temporizadorFin:
    ReturnType<typeof setTimeout> | null =
      null;

  private readonly suscripciones =
    new Subscription();


  constructor(
    private readonly authService: AuthService,
    private readonly fichajeService: FichajeService,
    private readonly resumenService: ResumenService,
    private readonly horasExtraService: HorasExtraService,
    private readonly router: Router
  ) {}


  ngOnInit(): void {

    this.actualizarEstado();

    this.suscripciones.add(
      this.router.events
        .pipe(
          filter(
            evento =>
              evento instanceof NavigationEnd
          )
        )
        .subscribe(evento => {

          if (
            !evento.urlAfterRedirects
              .startsWith('/fichar')
          ) {
            this.ocultarParaFinalizar =
              false;
          }

          this.actualizarEstado();
        })
    );

    this.suscripciones.add(
      this.fichajeService
        .fichajeRegistrado$
        .subscribe(() =>
          this.actualizarEstado()
        )
    );
  }


  ngOnDestroy(): void {

    this.detenerSeguimientoSolicitud();
    this.detenerTemporizadorFin();

    this.suscripciones.unsubscribe();
  }


  /* VISIBILIDAD */

  mostrarAviso(): boolean {

    if (
      this.esEncargado()
      &&
      this.esRutaNotificaciones()
    ) {
      return false;
    }

    if (this.ocultarParaFinalizar) {
      return false;
    }

    const resumen =
      this.resumen();

    if (!resumen) {
      return false;
    }

    if (
      resumen.situacion === 'FINALIZADA'
      ||
      resumen.situacion === 'HORAS_EXTRA'
      ||
      this.solicitud()?.estado === 'AUTORIZADA'
    ) {
      return false;
    }

    return (
      this.solicitud() !== null
      ||
      Boolean(
        resumen.requiereConfirmacionHorasExtra
      )
    );
  }


  mostrarGestionSolicitudes(): boolean {

    return this.esEncargado();
  }


  /* CUENTA ATRÁS */

  tiempoRestanteSolicitud(): string {

    const limite =
      this.obtenerFechaLimite();

    if (limite === null) {
      return '--:--';
    }

    const total =
      Math.max(
        0,
        Math.ceil(
          (
            limite
            - this.ahora()
          ) / 1000
        )
      );

    const minutos =
      Math.floor(
        total / 60
      );

    const segundos =
      total % 60;

    return (
      String(minutos)
        .padStart(2, '0')
      +
      ':'
      +
      String(segundos)
        .padStart(2, '0')
    );
  }


  /* ACCIONES */

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

          this.aplicarSolicitud(
            solicitud
          );

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


  cancelarSolicitud(): void {

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
        next: solicitud =>
          this.aplicarSolicitud(
            solicitud
          ),

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


  finalizarJornada(): void {

    this.ocultarParaFinalizar =
      true;

    if (
      this.router.url
        .startsWith('/fichar')
    ) {
      return;
    }

    void this.router.navigateByUrl(
      '/fichar'
    );
  }


  gestionarSolicitudes(): void {

    if (!this.esEncargado()) {
      return;
    }

    void this.router.navigateByUrl(
      '/notificaciones'
    );
  }


  /* ESTADO */

  private actualizarEstado(): void {

    if (!this.puedeConsultar()) {
      this.limpiarEstado();
      return;
    }

    if (this.consultando) {
      return;
    }

    this.consultando = true;

    this.detenerTemporizadorFin();

    this.resumenService
      .obtenerMiResumenHoy()
      .subscribe({
        next: resumen => {

          this.resumen.set(
            resumen
          );

          switch (resumen.situacion) {

            case 'FINALIZADA':
            case 'HORAS_EXTRA':
              this.limpiarSeguimientoJornada();
              break;

            case 'TRABAJANDO':
              this.limpiarSolicitud();
              this.programarFinJornada(
                resumen
              );
              break;

            case 'EN_PAUSA':
            case 'SIN_INICIAR':
              this.limpiarSolicitud();
              break;

            case 'JORNADA_COMPLETADA':
            case 'ESPERANDO_AUTORIZACION_HORAS_EXTRA':
              this.cargarSolicitud();
              return;

            default:
              this.limpiarSolicitud();
          }

          this.consultando = false;
        },

        error: error => {

          this.consultando = false;

          if (
            error instanceof HttpErrorResponse
            &&
            error.status === 404
          ) {
            this.limpiarEstado();
          }
        },
      });
  }


  private cargarSolicitud(): void {

    this.horasExtraService
      .obtenerMiSolicitudHoy()
      .subscribe({
        next: solicitud => {

          this.aplicarSolicitud(
            solicitud
          );

          this.consultando = false;
        },

        error: () => {
          this.consultando = false;
        },
      });
  }


  private aplicarSolicitud(
    solicitud: SolicitudHorasExtraDTO | null
  ): void {

    this.solicitud.set(
      solicitud
    );

    if (
      solicitud?.estado === 'SOLICITADA'
    ) {
      this.iniciarSeguimientoSolicitud();
      return;
    }

    this.detenerSeguimientoSolicitud();
  }


  private limpiarSolicitud(): void {

    this.solicitud.set(null);
    this.detenerSeguimientoSolicitud();
  }


  private limpiarSeguimientoJornada(): void {

    this.limpiarSolicitud();

    this.ocultarParaFinalizar =
      false;
  }


  /* FIN DE JORNADA */

  private programarFinJornada(
    resumen: ResumenDiarioDTO
  ): void {

    const minutos =
      Math.max(
        0,
        resumen.minutosRestantes ?? 0
      );

    const espera =
      minutos > 0
        ? (
          minutos * 60000
          + AvisoHorasExtra.MARGEN_FIN_MS
        )
        : AvisoHorasExtra.REINTENTO_FIN_MS;

    this.temporizadorFin =
      setTimeout(
        () => {

          this.temporizadorFin =
            null;

          this.actualizarEstado();
        },
        espera
      );
  }


  private detenerTemporizadorFin(): void {

    if (this.temporizadorFin === null) {
      return;
    }

    clearTimeout(
      this.temporizadorFin
    );

    this.temporizadorFin =
      null;
  }


  /* SOLICITUD PENDIENTE */

  private iniciarSeguimientoSolicitud(): void {

    this.iniciarPolling();
    this.iniciarCuentaAtras();
  }


  private iniciarPolling(): void {

    if (this.polling !== null) {
      return;
    }

    this.polling =
      setInterval(
        () =>
          this.comprobarSolicitudPendiente(),
        AvisoHorasExtra.POLLING_MS
      );
  }


  private iniciarCuentaAtras(): void {

    if (this.cuentaAtras !== null) {
      return;
    }

    this.caducidadComprobada =
      false;

    this.ahora.set(
      Date.now()
    );

    this.cuentaAtras =
      setInterval(
        () => {

          this.ahora.set(
            Date.now()
          );

          this.comprobarCaducidad();
        },
        AvisoHorasExtra.CUENTA_ATRAS_MS
      );
  }


  private comprobarCaducidad(): void {

    if (
      this.caducidadComprobada
      ||
      this.consultando
    ) {
      return;
    }

    const limite =
      this.obtenerFechaLimite();

    if (
      limite === null
      ||
      Date.now() < limite
    ) {
      return;
    }

    this.caducidadComprobada =
      true;

    this.comprobarSolicitudPendiente();
  }


  private comprobarSolicitudPendiente(): void {

    if (!this.puedeConsultar()) {
      this.detenerSeguimientoSolicitud();
      return;
    }

    if (this.consultando) {
      return;
    }

    this.consultando = true;

    this.horasExtraService
      .obtenerMiSolicitudHoy()
      .subscribe({
        next: solicitud => {

          this.consultando = false;

          this.aplicarSolicitud(
            solicitud
          );

          if (
            solicitud?.estado !== 'SOLICITADA'
          ) {
            this.actualizarEstado();
          }
        },

        error: () => {
          this.consultando = false;
        },
      });
  }


  private detenerSeguimientoSolicitud(): void {

    if (this.polling !== null) {
      clearInterval(
        this.polling
      );

      this.polling = null;
    }

    if (this.cuentaAtras !== null) {
      clearInterval(
        this.cuentaAtras
      );

      this.cuentaAtras = null;
    }

    this.caducidadComprobada =
      false;
  }


  private obtenerFechaLimite():
    number | null {

    const fecha =
      this.solicitud()?.fechaLimite;

    if (!fecha) {
      return null;
    }

    const valor =
      new Date(fecha)
        .getTime();

    return Number.isNaN(valor)
      ? null
      : valor;
  }


  /* SESIÓN */

  private esEncargado(): boolean {

    const sesion =
      this.authService.getSesion();

    return (
      sesion?.tipoToken === 'ACCESS'
      &&
      sesion.rol === 'ENCARGADO'
    );
  }


  private esRutaNotificaciones(): boolean {

    return this.router.url
      .startsWith('/notificaciones');
  }


  private puedeConsultar(): boolean {

    if (
      !this.authService
        .estaAutenticado()
    ) {
      return false;
    }

    const sesion =
      this.authService.getSesion();

    return (
      sesion?.tipoToken === 'ACCESS'
      &&
      (
        sesion.rol === 'EMPLEADO'
        ||
        sesion.rol === 'ENCARGADO'
      )
    );
  }


  private limpiarEstado(): void {

    this.detenerSeguimientoSolicitud();
    this.detenerTemporizadorFin();

    this.consultando = false;
    this.ocultarParaFinalizar = false;

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
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return mensajePorDefecto;
  }

}