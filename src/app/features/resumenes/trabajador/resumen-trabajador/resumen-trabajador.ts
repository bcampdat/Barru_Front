import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  Input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';

import {
  DescargaPdfService,
  DescargaPdfSolicitud,
} from '../../../../core/descargas/descarga-pdf-service';
import { ResumenService } from '../../../../core/resumenes/resumen-service';
import { ResumenDiarioDTO } from '../../../../core/resumenes/resumen-types';
import { ResumenSalidas } from '../../resumen-salidas/resumen-salidas';
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
    ResumenSalidas,
  ],
  templateUrl: './resumen-trabajador.html',
  styleUrl: './resumen-trabajador.scss',
})
export class ResumenTrabajador
implements OnChanges {

  @Input({ required: true })
  trabajador!: UserDTO;

  readonly resumen =
    signal<ResumenDiarioDTO | null>(null);

  readonly historico =
    signal<ResumenDiarioDTO[]>([]);

  readonly cargando = signal(false);
  readonly descargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly modo =
    signal<ModoConsulta>('HOY');

  fecha = '';
  desde = '';
  hasta = '';

  constructor(
    private readonly resumenService: ResumenService,
    private readonly descargaPdfService: DescargaPdfService
  ) {}

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['trabajador'] &&
      this.trabajador?.uuid
    ) {
      this.limpiarConsulta();
      this.consultarHoy();
    }
  }

  consultarHoy(): void {
    this.consultar('HOY');
  }

  consultarFecha(): void {
    this.consultar('FECHA');
  }

  consultarRango(): void {
    this.consultar('RANGO');
  }

  consultarHistorico(): void {
    this.consultar('HISTORICO');
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
        error: error =>
          this.mostrarErrorDescarga(
            error
          ),
      });
  }

  puedeDescargar(): boolean {
    if (
      this.cargando() ||
      this.descargando()
    ) {
      return false;
    }

    if (
      this.modo() === 'HOY' ||
      this.modo() === 'FECHA'
    ) {
      return this.resumen() !== null;
    }

    if (this.modo() === 'RANGO') {
      return this.historico().length > 0;
    }

    return false;
  }

  private consultar(
    modo: ModoConsulta
  ): void {

    const uuid =
      this.trabajador.uuid;

    if (!uuid) {
      this.error.set(
        'El trabajador seleccionado no es válido.'
      );
      return;
    }

    if (
      modo === 'FECHA' &&
      !this.fecha
    ) {
      this.error.set(
        'Selecciona una fecha.'
      );
      return;
    }

    if (
      modo === 'RANGO' &&
      !this.validarRango()
    ) {
      return;
    }

    this.prepararConsulta(modo);

    switch (modo) {

      case 'HOY':
        this.ejecutarConsulta(
          this.resumenService
            .obtenerResumenTrabajadorHoy(
              uuid
            ),
          resumen =>
            this.resumen.set(
              resumen
            )
        );
        break;

      case 'FECHA':
        this.ejecutarConsulta(
          this.resumenService
            .obtenerResumenTrabajadorPorFecha(
              uuid,
              this.fecha
            ),
          resumen =>
            this.resumen.set(
              resumen
            )
        );
        break;

      case 'RANGO':
        this.ejecutarConsulta(
          this.resumenService
            .obtenerHistoricoTrabajadorPorRango(
              uuid,
              this.desde,
              this.hasta
            ),
          historico =>
            this.historico.set(
              historico
            )
        );
        break;

      case 'HISTORICO':
        this.ejecutarConsulta(
          this.resumenService
            .obtenerHistoricoTrabajador(
              uuid
            ),
          historico =>
            this.historico.set(
              historico
            )
        );
        break;
    }
  }

  private crearSolicitudDescarga():
    DescargaPdfSolicitud | null {

    const usuarioUuid =
      this.trabajador.uuid;

    if (!usuarioUuid) {
      return null;
    }

    switch (this.modo()) {

      case 'HOY': {
        const fecha =
          this.fechaDtoAIso(
            this.resumen()?.fecha
          );

        if (!fecha) {
          this.error.set(
            'No hay un resumen disponible para descargar.'
          );
          return null;
        }

        return {
          tipoDocumento: 'RESUMEN',
          ambito: 'TRABAJADOR',
          periodo: 'DIA',
          usuarioUuid,
          fecha,
        };
      }

      case 'FECHA':
        if (
          !this.fecha ||
          !this.resumen()
        ) {
          this.error.set(
            'Consulta primero una fecha para poder descargarla.'
          );
          return null;
        }

        return {
          tipoDocumento: 'RESUMEN',
          ambito: 'TRABAJADOR',
          periodo: 'DIA',
          usuarioUuid,
          fecha: this.fecha,
        };

      case 'RANGO':
        if (
          !this.desde ||
          !this.hasta ||
          this.historico().length === 0
        ) {
          this.error.set(
            'Consulta primero un periodo con datos para poder descargarlo.'
          );
          return null;
        }

        return {
          tipoDocumento: 'RESUMEN',
          ambito: 'TRABAJADOR',
          periodo: 'RANGO',
          usuarioUuid,
          desde: this.desde,
          hasta: this.hasta,
        };

      case 'HISTORICO':
        return null;
    }
  }

  private ejecutarConsulta<T>(
    peticion: Observable<T>,
    guardar: (resultado: T) => void
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
          this.mostrarError(error),
      });
  }

  private validarRango(): boolean {
    if (!this.desde || !this.hasta) {
      this.error.set(
        'Selecciona la fecha inicial y la fecha final.'
      );
      return false;
    }

    if (this.desde > this.hasta) {
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
    this.resumen.set(null);
    this.historico.set([]);

    this.modo.set(modo);
    this.cargando.set(true);
  }

  private limpiarConsulta(): void {
    this.error.set(null);
    this.resumen.set(null);
    this.historico.set([]);

    this.fecha = '';
    this.desde = '';
    this.hasta = '';

    this.modo.set('HOY');
  }

  private fechaDtoAIso(
    fecha: string | undefined
  ): string | null {

    if (!fecha) {
      return null;
    }

    const partes = fecha.split('/');

    if (partes.length !== 3) {
      return null;
    }

    const [dia, mes, anio] = partes;

    return dia && mes && anio
      ? `${anio}-${mes}-${dia}`
      : null;
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
      void this.leerErrorBlob(
        error.error
      );
      return;
    }

    this.error.set(
      error.error?.message ??
      'No se ha podido descargar el PDF.'
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
        respuesta.message ??
        'No se ha podido descargar el PDF.'
      );
    } catch {
      this.error.set(
        'No se ha podido descargar el PDF.'
      );
    }
  }
}