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

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly modo =
    signal<ModoConsulta>('HOY');

  fecha = '';
  desde = '';
  hasta = '';

  constructor(
    private readonly resumenService: ResumenService
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
      .obtenerMiResumenPorFecha(this.fecha)
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
