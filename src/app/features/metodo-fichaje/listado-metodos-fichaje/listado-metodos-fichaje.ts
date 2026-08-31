import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';

import { EmpresaService } from '../../../core/empresa/empresa-service';
import { EmpresaDTO } from '../../../core/empresa/empresa.types';
import { MetodoFichajeService } from '../../../core/metodos/metodo-fichaje-service';
import { MetodoFichajeDTO } from '../../../core/metodos/metodo-fichaje.types';

type FiltroEstado =
  'todos' |
  'activos' |
  'inactivos';

@Component({
  selector: 'app-listado-metodos-fichaje',
  imports: [
    FormsModule,
    MessageModule,
    TableModule,
    ConfirmDialogModule,
  ],
  providers: [
    ConfirmationService,
  ],
  templateUrl: './listado-metodos-fichaje.html',
  styleUrl: './listado-metodos-fichaje.scss',
})
export class ListadoMetodosFichaje implements OnInit {

  readonly empresas = signal<EmpresaDTO[]>([]);
  readonly disponibles = signal<MetodoFichajeDTO[]>([]);
  readonly metodos = signal<MetodoFichajeDTO[]>([]);

  readonly cargando = signal(false);
  readonly procesando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  empresaId: number | null = null;
  codigoMetodo = '';
  filtroEstado: FiltroEstado = 'todos';

  constructor(
    private readonly empresaService: EmpresaService,
    private readonly metodoFichajeService: MetodoFichajeService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {

    this.cargando.set(true);

    forkJoin({
      empresas:
        this.empresaService.obtenerTodasLasEmpresas(),
      disponibles:
        this.metodoFichajeService.listarDisponibles(),
    })
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({

        next: (respuesta) => {
          this.empresas.set(respuesta.empresas);
          this.disponibles.set(respuesta.disponibles);
        },

        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.error?.message ??
            'No se han podido cargar los datos.'
          );
        },
      });
  }

  seleccionarEmpresa(): void {

    this.codigoMetodo = '';
    this.filtroEstado = 'todos';
    this.exito.set(null);

    if (this.empresaId === null) {
      this.metodos.set([]);
      return;
    }

    this.cargarMetodos();
  }

  confirmarAsignacion(): void {

    const empresaId = this.empresaId;

    if (empresaId === null || !this.codigoMetodo) {
      return;
    }

    const empresa = this.empresas().find(
      item => item.id === empresaId
    );

    const metodo = this.disponibles().find(
      item => item.codigoMetodo === this.codigoMetodo
    );

    const nombreEmpresa =
      empresa?.nombre ?? 'la empresa seleccionada';

    const nombreMetodo =
      metodo?.nombre ?? this.codigoMetodo;

    this.confirmationService.confirm({
      header: 'Confirmar asignación',
      message:
        `¿Quieres asignar ${nombreMetodo} a ${nombreEmpresa}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Asignar',
      rejectLabel: 'Cancelar',
      accept: () => this.asignar(),
    });
  }

  asignar(): void {

    const empresaId = this.empresaId;

    if (empresaId === null || !this.codigoMetodo) {
      return;
    }

    this.error.set(null);
    this.exito.set(null);
    this.procesando.set(true);

    this.metodoFichajeService
      .asignar(
        this.codigoMetodo,
        empresaId
      )
      .pipe(
        finalize(() =>
          this.procesando.set(false)
        )
      )
      .subscribe({

        next: () => {
          this.codigoMetodo = '';

          this.exito.set(
            'Método de fichaje asignado correctamente.'
          );

          this.cargarMetodos();
        },

        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.error?.message ??
            'No se ha podido asignar el método de fichaje.'
          );
        },
      });
  }

  cambiarEstado(
    metodo: MetodoFichajeDTO
  ): void {

    if (metodo.id === undefined) {
      this.error.set(
        'El método de fichaje no tiene un identificador válido.'
      );
      return;
    }

    const activar =
      metodo.activo !== true;

    this.error.set(null);
    this.exito.set(null);
    this.procesando.set(true);

    const peticion =
      activar
        ? this.metodoFichajeService.activar(metodo.id)
        : this.metodoFichajeService.desactivar(metodo.id);

    peticion
      .pipe(
        finalize(() =>
          this.procesando.set(false)
        )
      )
      .subscribe({

        next: () => {

          this.exito.set(
            activar
              ? 'Método de fichaje activado correctamente.'
              : 'Método de fichaje desactivado correctamente.'
          );

          this.cargarMetodos();
        },

        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.error?.message ??
            'No se ha podido cambiar el estado del método.'
          );
        },
      });
  }

  metodosVisibles(): MetodoFichajeDTO[] {

    if (this.filtroEstado === 'activos') {
      return this.metodos().filter(
        metodo => metodo.activo === true
      );
    }

    if (this.filtroEstado === 'inactivos') {
      return this.metodos().filter(
        metodo => metodo.activo === false
      );
    }

    return this.metodos();
  }

  metodosDisponibles(): MetodoFichajeDTO[] {

    const codigosAsignados =
      new Set(
        this.metodos().map(
          metodo =>
            metodo.codigoMetodo.toUpperCase()
        )
      );

    return this.disponibles().filter(
      metodo =>
        !codigosAsignados.has(
          metodo.codigoMetodo.toUpperCase()
        )
    );
  }

  private cargarMetodos(): void {

    const empresaId = this.empresaId;

    if (empresaId === null) {
      return;
    }

    this.error.set(null);
    this.cargando.set(true);

    this.metodoFichajeService
      .listarPorEmpresa(empresaId)
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({

        next: (metodos) => {
          this.metodos.set(metodos);
        },

        error: (error: HttpErrorResponse) => {

          this.metodos.set([]);

          this.error.set(
            error.error?.message ??
            'No se han podido cargar los métodos de fichaje.'
          );
        },
      });
  }
}