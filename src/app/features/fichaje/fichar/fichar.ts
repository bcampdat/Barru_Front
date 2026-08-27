import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../../core/auth/auth.service';
import { FichajeService } from '../../../core/fichaje/fichaje-service';
import {
  FicharDTO,
  MotivoSalida,
  TipoFichaje,
} from '../../../core/fichaje/fichaje-types';
import { SalidaService } from '../../../core/fichaje/salida-service';
import { ResumenService } from '../../../core/resumenes/resumen-service';
import {
  ResumenDiarioDTO,
  SituacionJornada,
} from '../../../core/resumenes/resumen-types';


interface Ubicacion {
  lat: number | null;
  lng: number | null;
}

interface FichajePendiente {
  tipo: TipoFichaje;
  finalizarJornada: boolean;
  motivoSalida: MotivoSalida | null;
}

interface OpcionMotivoSalida {
  valor: MotivoSalida;
  texto: string;
}

type ModoSalida =
  | 'INTERMEDIA'
  | 'FINALIZAR'
  | null;


@Component({
  selector: 'app-fichar',
  imports: [
    FormsModule,
    DialogModule,
    MessageModule,
  ],
  templateUrl: './fichar.html',
  styleUrl: './fichar.scss',
})
export class Fichar
implements OnInit, OnDestroy {

  private readonly authService =
    inject(AuthService);

  private readonly fichajeService =
    inject(FichajeService);

  private readonly salidaService =
    inject(SalidaService);

  private readonly resumenService =
    inject(ResumenService);

  private readonly router =
    inject(Router);


  readonly resumen =
    signal<ResumenDiarioDTO | null>(null);

  readonly cargando =
    signal(false);

  readonly fichando =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly mensaje =
    signal<string | null>(null);

  readonly ubicacionRequerida =
    signal(false);

  readonly avisoUbicacion =
    signal<string | null>(null);

  readonly dialogoSalidaVisible =
    signal(false);

  readonly dialogoMotivoVisible =
    signal(false);

  readonly modoSalida =
    signal<ModoSalida>(null);

  readonly motivoSalidaSeleccionado =
    signal<MotivoSalida | null>(null);

  readonly motivosSalida:
    readonly OpcionMotivoSalida[] = [
      {
        valor: 'JORNADA_PARTIDA',
        texto: 'Jornada partida',
      },
      {
        valor: 'MEDICO',
        texto: 'Médico',
      },
      {
        valor: 'ESPECIALISTA',
        texto: 'Especialista',
      },
      {
        valor: 'PERSONAL',
        texto: 'Personal',
      },
      {
        valor: 'LABORAL',
        texto: 'Laboral',
      },
      {
        valor: 'OTRO',
        texto: 'Otro',
      },
    ];

  private readonly ahora =
    signal(Date.now());

  private reloj:
    ReturnType<typeof setInterval> | null =
      null;

  private sincronizadoEn =
    Date.now();

  private baseTrabajado = 0;
  private basePausa = 0;
  private baseJornada = 0;
  private baseRestante = 0;
  private basePausaDisponible = 0;
  private baseExtra = 0;

  private fichajePendiente:
    FichajePendiente | null =
      null;


  ngOnInit(): void {
    this.cargarResumenHoy();
    this.iniciarReloj();
  }


  ngOnDestroy(): void {

    if (this.reloj !== null) {
      clearInterval(this.reloj);
    }
  }


  /* FICHAJES */

  registrarEntrada(): void {

    void this.registrarFichaje(
      'ENTRADA'
    );
  }


  registrarPausa(): void {

    void this.registrarFichaje(
      'INICIO_PAUSA'
    );
  }


  registrarReanudacion(): void {

    void this.registrarFichaje(
      'FIN_PAUSA'
    );
  }


  registrarSalida(): void {

    if (this.accionesBloqueadas()) {
      return;
    }

    this.error.set(null);
    this.mensaje.set(null);

    this.limpiarSeleccionSalida();

    this.dialogoSalidaVisible.set(
      true
    );
  }


  seguirTrabajando(): void {
    this.cerrarDialogosSalida();
  }


  seleccionarSalidaIntermedia(): void {

    this.dialogoSalidaVisible.set(
      false
    );

    this.modoSalida.set(
      'INTERMEDIA'
    );

    this.motivoSalidaSeleccionado.set(
      null
    );

    this.dialogoMotivoVisible.set(
      true
    );
  }


  finalizarJornada(): void {

    this.dialogoSalidaVisible.set(
      false
    );

    const datos =
      this.salidaService
        .prepararFinalizacion(
          this.resumen(),
          null
        );

    if (datos !== null) {

      this.ejecutarSalida(
        datos.finalizarJornada,
        datos.motivoSalida
      );

      return;
    }

    this.modoSalida.set(
      'FINALIZAR'
    );

    this.motivoSalidaSeleccionado.set(
      null
    );

    this.dialogoMotivoVisible.set(
      true
    );
  }


  confirmarMotivoSalida(): void {

    const motivo =
      this.motivoSalidaSeleccionado();

    const modo =
      this.modoSalida();

    if (
      motivo === null
      ||
      modo === null
    ) {
      return;
    }

    const datos =
      modo === 'INTERMEDIA'
        ? this.salidaService
            .prepararSalidaIntermedia(
              motivo
            )
        : this.salidaService
            .prepararFinalizacion(
              this.resumen(),
              motivo
            );

    if (datos === null) {
      return;
    }

    this.cerrarDialogosSalida();

    this.ejecutarSalida(
      datos.finalizarJornada,
      datos.motivoSalida
    );
  }


  cancelarMotivoSalida(): void {
    this.cerrarDialogosSalida();
  }


  actualizarMotivoSalida(
    motivo: MotivoSalida | null
  ): void {

    this.motivoSalidaSeleccionado.set(
      motivo
    );
  }


  motivosSalidaDisponibles():
    readonly OpcionMotivoSalida[] {

    if (
      this.modoSalida()
      !== 'FINALIZAR'
    ) {
      return this.motivosSalida;
    }

    return this.motivosSalida.filter(
      motivo =>
        motivo.valor !==
        'JORNADA_PARTIDA'
    );
  }


  private ejecutarSalida(
    finalizarJornada: boolean,
    motivoSalida: MotivoSalida | null
  ): void {

    void this.registrarFichaje(
      'SALIDA',
      finalizarJornada,
      motivoSalida
    );
  }


  private cerrarDialogosSalida(): void {

    this.dialogoSalidaVisible.set(
      false
    );

    this.dialogoMotivoVisible.set(
      false
    );

    this.limpiarSeleccionSalida();
  }


  private limpiarSeleccionSalida(): void {

    this.modoSalida.set(null);

    this.motivoSalidaSeleccionado.set(
      null
    );
  }


  /* GPS */

  reintentarFichaje(): void {

    const pendiente =
      this.fichajePendiente;

    if (!pendiente) {
      return;
    }

    void this.registrarFichaje(
      pendiente.tipo,
      pendiente.finalizarJornada,
      pendiente.motivoSalida
    );
  }


  /* ESTADO */

  estadoTexto(): string {

    switch (this.situacion()) {

      case 'TRABAJANDO':
        return 'Trabajando';

      case 'EN_PAUSA':
        return 'En pausa';

      case 'JORNADA_COMPLETADA':
        return 'Jornada completada';

      case 'ESPERANDO_AUTORIZACION_HORAS_EXTRA':
        return 'Esperando autorización de horas extra';

      case 'HORAS_EXTRA':
        return 'Horas extra';

      case 'FINALIZADA':
        return 'Fin de jornada';

      default:
        return 'Sin iniciar';
    }
  }


  tiempoTranscurrido(): string {

    return this.formatear(
      this.segundosTrabajados()
      + this.segundosPausa()
    );
  }


  tiempoTrabajado(): string {

    return this.formatear(
      this.segundosTrabajados()
    );
  }


  tiempoPausa(): string {

    return this.formatear(
      this.segundosPausa()
    );
  }


  tiempoJornada(): string {

    return this.formatear(
      this.baseJornada
    );
  }


  tiempoRestante(): string {

    let segundos =
      this.baseRestante;

    if (
      this.situacion()
      === 'TRABAJANDO'
    ) {
      segundos -=
        this.segundosDesdeSincronizacion();
    }

    return this.formatear(
      segundos
    );
  }


  tiempoPausaRestante(): string {

    let segundos =
      this.basePausaDisponible;

    if (
      this.situacion()
      === 'EN_PAUSA'
    ) {
      segundos -=
        this.segundosDesdeSincronizacion();
    }

    return this.formatear(
      segundos
    );
  }


  tiempoExtra(): string {

    let segundos =
      this.baseExtra;

    if (
      this.situacion()
      === 'HORAS_EXTRA'
    ) {
      segundos +=
        this.segundosDesdeSincronizacion();
    }

    return this.formatear(
      segundos
    );
  }


  progresoJornada(): number {

    if (this.baseJornada === 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.floor(
        (
          this.segundosTrabajados()
          / this.baseJornada
        ) * 100
      )
    );
  }


  mostrarEntrada(): boolean {

    return this.situacion()
      === 'SIN_INICIAR';
  }


  mostrarAccionesTrabajo(): boolean {

    const estado =
      this.situacion();

    return estado === 'TRABAJANDO'
      || estado === 'HORAS_EXTRA';
  }


  mostrarFinalizarJornada(): boolean {

    return this.situacion()
      === 'JORNADA_COMPLETADA';
  }


  mostrarReanudar(): boolean {

    return this.situacion()
      === 'EN_PAUSA';
  }


  accionesBloqueadas(): boolean {

    return this.cargando()
      || this.fichando();
  }


  /* RESUMEN */

  private cargarResumenHoy(
    conservarTiempo = false
  ): void {

    this.cargando.set(true);
    this.error.set(null);

    this.resumenService
      .obtenerMiResumenHoy()
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: resumen => {

          this.aplicarResumen(
            resumen,
            conservarTiempo
          );
        },

        error: error => {

          if (
            error instanceof HttpErrorResponse
            &&
            error.status === 404
          ) {
            this.reiniciar();
            return;
          }

          this.error.set(
            this.mensajeError(
              error,
              'No se ha podido cargar la jornada.'
            )
          );
        },
      });
  }


  /* REGISTRO CENTRAL */

  private async registrarFichaje(
    tipo: TipoFichaje,
    finalizarJornada = false,
    motivoSalida: MotivoSalida | null = null
  ): Promise<void> {

    if (this.accionesBloqueadas()) {
      return;
    }

    this.fichando.set(true);

    this.error.set(null);
    this.mensaje.set(null);

    const ubicacion =
      await this.obtenerUbicacion();

    const esSalida =
      tipo === 'SALIDA';

    const salidaFinal =
      esSalida
      && finalizarJornada;

    const datos: FicharDTO = {
      tipo,
      lat: ubicacion.lat,
      lng: ubicacion.lng,
      codigo: null,

      finalizarJornada:
        esSalida
          ? finalizarJornada
          : null,

      motivoSalida:
        esSalida
          ? motivoSalida
          : null,
    };

    this.fichajeService
      .fichar(datos)
      .pipe(
        finalize(() =>
          this.fichando.set(false)
        )
      )
      .subscribe({
        next: () => {

          this.ubicacionRequerida.set(
            false
          );

          this.avisoUbicacion.set(
            null
          );

          this.fichajePendiente =
            null;

          if (salidaFinal) {

            this.cerrarSesionTrasFinalizar();

            return;
          }

          this.mensaje.set(
            'Fichaje registrado correctamente.'
          );

          this.cargarResumenHoy(
            true
          );
        },

        error: error => {

          const mensaje =
            this.mensajeError(
              error,
              'No se ha podido realizar el fichaje.'
            );

          if (
            this.esErrorGps(
              mensaje
            )
          ) {

            this.ubicacionRequerida.set(
              true
            );

            this.avisoUbicacion.set(
              'Necesitas permitir el acceso a la ubicación '
              + 'para realizar este fichaje. '
              + 'Activa el permiso y vuelve a intentarlo.'
            );

            this.fichajePendiente = {
              tipo,
              finalizarJornada,
              motivoSalida,
            };

            return;
          }

          this.error.set(
            mensaje
          );
        },
      });
  }


  private cerrarSesionTrasFinalizar(): void {

    this.authService
      .logout()
      .subscribe({
        next: () => {

          void this.router.navigateByUrl(
            '/login'
          );
        },

        error: () => {

          /*
           * La SALIDA ya está registrada.
           * Solo ha fallado el logout.
           */
          this.cargarResumenHoy(
            true
          );

          this.error.set(
            'La jornada ha finalizado correctamente, '
            + 'pero no se ha podido cerrar la sesión.'
          );
        },
      });
  }


  /* SINCRONIZACIÓN */

  private aplicarResumen(
    resumen: ResumenDiarioDTO,
    conservarTiempo: boolean
  ): void {

    const trabajado =
      this.aSegundos(
        resumen.minutosTrabajados
      );

    const pausa =
      this.aSegundos(
        resumen.minutosPausa
      );

    if (conservarTiempo) {

      this.baseTrabajado =
        Math.max(
          trabajado,
          this.segundosTrabajados()
        );

      this.basePausa =
        Math.max(
          pausa,
          this.segundosPausa()
        );

    } else {

      this.baseTrabajado =
        trabajado;

      this.basePausa =
        pausa;
    }

    this.baseJornada =
      this.aSegundos(
        resumen.minutosJornada
      );

    this.baseRestante =
      this.aSegundos(
        resumen.minutosRestantes
      );

    this.basePausaDisponible =
      this.aSegundos(
        resumen.minutosPausaDisponibles
      );

    this.baseExtra =
      this.aSegundos(
        resumen.minutosExtra
      );

    this.resumen.set(
      resumen
    );

    this.sincronizadoEn =
      Date.now();

    this.ahora.set(
      this.sincronizadoEn
    );
  }


  private reiniciar(): void {

    this.resumen.set(null);

    this.baseTrabajado = 0;
    this.basePausa = 0;
    this.baseJornada = 0;
    this.baseRestante = 0;
    this.basePausaDisponible = 0;
    this.baseExtra = 0;

    this.sincronizadoEn =
      Date.now();

    this.ahora.set(
      this.sincronizadoEn
    );
  }


  private iniciarReloj(): void {

    this.reloj =
      setInterval(
        () =>
          this.ahora.set(
            Date.now()
          ),
        1000
      );
  }


  private segundosTrabajados(): number {

    let segundos =
      this.baseTrabajado;

    const estado =
      this.situacion();

    if (
      estado === 'TRABAJANDO'
      ||
      estado === 'HORAS_EXTRA'
    ) {
      segundos +=
        this.segundosDesdeSincronizacion();
    }

    return segundos;
  }


  private segundosPausa(): number {

    let segundos =
      this.basePausa;

    if (
      this.situacion()
      === 'EN_PAUSA'
    ) {
      segundos +=
        this.segundosDesdeSincronizacion();
    }

    return segundos;
  }


  private segundosDesdeSincronizacion():
    number {

    return Math.max(
      0,
      Math.floor(
        (
          this.ahora()
          - this.sincronizadoEn
        ) / 1000
      )
    );
  }


  private situacion():
    SituacionJornada {

    const estado =
      this.resumen()?.situacion;

    switch (estado) {

      case 'TRABAJANDO':
      case 'EN_PAUSA':
      case 'JORNADA_COMPLETADA':
      case 'ESPERANDO_AUTORIZACION_HORAS_EXTRA':
      case 'HORAS_EXTRA':
      case 'FINALIZADA':
        return estado;

      default:
        return 'SIN_INICIAR';
    }
  }


  private aSegundos(
    minutos: number | null | undefined
  ): number {

    return Math.max(
      0,
      minutos ?? 0
    ) * 60;
  }


  /* GEOLOCALIZACIÓN */

  private obtenerUbicacion():
    Promise<Ubicacion> {

    if (!navigator.geolocation) {

      return Promise.resolve({
        lat: null,
        lng: null,
      });
    }

    return new Promise(resolve => {

      navigator.geolocation
        .getCurrentPosition(
          posicion => {

            resolve({
              lat:
                posicion.coords.latitude,
              lng:
                posicion.coords.longitude,
            });
          },

          () => {

            resolve({
              lat: null,
              lng: null,
            });
          },

          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          }
        );
    });
  }


  private esErrorGps(
    mensaje: string
  ): boolean {

    const texto =
      mensaje.toLowerCase();

    return texto.includes(
      'geolocalización'
    )
      ||
      texto.includes(
        'geolocalizacion'
      );
  }


  /* UTILIDADES */

  private formatear(
    segundosTotales: number
  ): string {

    const total =
      Math.max(
        0,
        Math.floor(
          segundosTotales
        )
      );

    const horas =
      Math.floor(
        total / 3600
      );

    const minutos =
      Math.floor(
        (total % 3600) / 60
      );

    const segundos =
      total % 60;

    return [
      horas,
      minutos,
      segundos,
    ]
      .map(valor =>
        String(valor)
          .padStart(
            2,
            '0'
          )
      )
      .join(':');
  }


  private mensajeError(
    error: unknown,
    fallback: string
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

    return fallback;
  }

}