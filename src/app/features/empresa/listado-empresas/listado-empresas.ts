import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';

import { EmpresaService } from '../../../core/empresa/empresa-service';
import { EmpresaDTO } from '../../../core/empresa/empresa.types';

type FiltroEstado =
  'todas' |
  'activas' |
  'inactivas';

@Component({
  selector: 'app-listado-empresas',
  imports: [
    RouterLink,
    TableModule,
    MessageModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './listado-empresas.html',
  styleUrl: './listado-empresas.scss',
})
export class ListadoEmpresas implements OnInit {

  readonly empresas = signal<EmpresaDTO[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly filtroEstado =
    signal<FiltroEstado>('todas');

  constructor(
    private readonly empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  cargarEmpresas(
    filtro: FiltroEstado = 'todas'
  ): void {

    this.error.set(null);
    this.cargando.set(true);
    this.filtroEstado.set(filtro);

    let peticion: Observable<EmpresaDTO[]>;

    if (filtro === 'activas') {

      peticion =
        this.empresaService.obtenerEmpresasActivas();

    } else if (filtro === 'inactivas') {

      peticion =
        this.empresaService.obtenerEmpresasInactivas();

    } else {

      peticion =
        this.empresaService.obtenerTodasLasEmpresas();
    }

    peticion
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({

        next: (empresas) => {
          this.empresas.set(empresas);
        },

        error: (error: HttpErrorResponse) => {

          this.empresas.set([]);

          this.error.set(
            error.error?.message ??
            'No se ha podido cargar el listado de empresas.'
          );
        },
      });
  }

  cambiarEstado(
    empresa: EmpresaDTO
  ): void {

    if (empresa.id === undefined) {

      this.error.set(
        'La empresa no tiene un identificador válido.'
      );

      return;
    }

    this.error.set(null);
    this.cargando.set(true);

    const peticion =
      empresa.activa === true
        ? this.empresaService.desactivarEmpresa(empresa.id)
        : this.empresaService.activarEmpresa(empresa.id);

    peticion.subscribe({

      next: () => {
        this.cargarEmpresas(
          this.filtroEstado()
        );
      },

      error: (error: HttpErrorResponse) => {

        this.cargando.set(false);

        this.error.set(
          error.error?.message ??
          'No se ha podido cambiar el estado de la empresa.'
        );
      },
    });
  }

  formatearDuracion(
  minutos: number = 0
  ): string {

    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    if (horas === 0) {
      return `${minutosRestantes} min`;
    }

    if (minutosRestantes === 0) {
      return `${horas} h`;
    }

    return `${horas} h ${minutosRestantes} min`;
  }
}