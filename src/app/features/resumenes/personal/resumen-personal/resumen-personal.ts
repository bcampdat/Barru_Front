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

import {
  DescargaPdfService,
  DescargaPdfSolicitud,
} from '../../../../core/descargas/descarga-pdf-service';
import { ResumenService } from '../../../../core/resumenes/resumen-service';
import { ResumenDiarioDTO } from '../../../../core/resumenes/resumen-types';

type ModoConsulta =
  | 'HOY'
  | 'FECHA'
  | 'RANGO'
  | 'HISTORICO';

@Component({
  selector: 'app-resumen-personal',
  imports: [
    FormsModule,
    MessageModule,
    TableModule,
  ],
  templateUrl: './resumen-personal.html',
  styleUrl: './resumen-personal.scss',
})
export class ResumenPersonal implements OnInit {

  readonly resumen =
    signal<ResumenDiarioDTO | null>(null);

  readonly historico =
    signal<ResumenDiarioDTO[]>([]);

  readonly cargando =
    signal(false);

  readonly descargando =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly modo =
    signal<ModoConsulta>('HOY');

  fecha = '';
  desde = '';
  hasta = '';

  constructor(
    private readonly resumenService: ResumenService,
    private readonly descargaPdfService: DescargaPdfService
  ) {}

  ngOnInit(): void {
    this.consultarHoy();
  }

  consultarHoy(): void {
    this.prepararConsulta('HOY');

    this.resumenService
      .obtenerMiResumenHoy()
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
    if (!this.fecha) {
      this.error.set(
        'Selecciona una fecha.'
      );
      return;
    }

    this.prepararConsulta('FECHA');

    this.resumenService
      .obtenerMiResumenPorFecha(
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
      .obtenerMiHistoricoPorRango(
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
    this.prepararConsulta('HISTORICO');

    this.resumenService
      .obtenerMiHistorico()
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

  descargarPdf(): void {
    this.error.set(null);

    const solicitud =
      this.crearSolicitudDescarga();

    if (!solicitud) {
      return;
    }

    this.descargando.set(true);

    this.descargaPdfService
      .descargar(solicitud)
      .pipe(
        finalize(() =>
          this.descargando.set(false)
        )
      )
      .subscribe({
        error: error => {
          this.mostrarErrorDescarga(error);
        },
      });
  }

  puedeDescargar(): boolean {
    if (
      this.cargando()
      || this.descargando()
    ) {
      return false;
    }

    switch (this.modo()) {

      case 'HOY':
      case 'FECHA':
        return this.resumen() !== null;

      case 'RANGO':
        return this.historico().length > 0;

      case 'HISTORICO':
        return false;
    }
  }

  private crearSolicitudDescarga():
    DescargaPdfSolicitud | null {

    switch (this.modo()) {

      case 'HOY': {
        const fecha =
          this.obtenerFechaResumenIso();

        if (!fecha) {
          this.error.set(
            'No hay un resumen disponible para descargar.'
          );
          return null;
        }

        return {
          tipoDocumento: 'RESUMEN',
          ambito: 'PERSONAL',
          periodo: 'DIA',
          fecha,
        };
      }

      case 'FECHA': {
        if (
          !this.fecha
          || !this.resumen()
        ) {
          this.error.set(
            'Consulta primero una fecha para poder descargarla.'
          );
          return null;
        }

        return {
          tipoDocumento: 'RESUMEN',
          ambito: 'PERSONAL',
          periodo: 'DIA',
          fecha: this.fecha,
        };
      }

      case 'RANGO': {
        if (
          !this.desde
          || !this.hasta
          || this.historico().length === 0
        ) {
          this.error.set(
            'Consulta primero un periodo con datos para poder descargarlo.'
          );
          return null;
        }

        return {
          tipoDocumento: 'RESUMEN',
          ambito: 'PERSONAL',
          periodo: 'RANGO',
          desde: this.desde,
          hasta: this.hasta,
        };
      }

      case 'HISTORICO':
        this.error.set(
          'La descarga del histórico completo no está disponible.'
        );
        return null;
    }
  }

  private obtenerFechaResumenIso():
    string | null {

    const resumenActual =
      this.resumen();

    if (!resumenActual?.fecha) {
      return null;
    }

    const partes =
      resumenActual.fecha.split('/');

    if (partes.length !== 3) {
      return null;
    }

    const [
      dia,
      mes,
      anio,
    ] = partes;

    if (!dia || !mes || !anio) {
      return null;
    }

    return `${anio}-${mes}-${dia}`;
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

  private mostrarError(
    error: unknown
  ): void {

    if (error instanceof HttpErrorResponse) {
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

    if (!(error instanceof HttpErrorResponse)) {
      this.error.set(
        'No se ha podido descargar el PDF.'
      );
      return;
    }

    if (error.error instanceof Blob) {
      this.leerErrorBlob(
        error.error
      );
      return;
    }

    this.error.set(
      error.error?.message
      ?? 'No se ha podido descargar el PDF.'
    );
  }

  private leerErrorBlob(
    error: Blob
  ): void {

    error.text()
      .then(texto => {

        try {
          const respuesta =
            JSON.parse(texto) as {
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
      })
      .catch(() => {
        this.error.set(
          'No se ha podido descargar el PDF.'
        );
      });
  }
}