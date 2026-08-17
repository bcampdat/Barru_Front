import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { EmpresaService } from '../../../core/empresa/empresa-service';
import { EmpresaDTO } from '../../../core/empresa/empresa.types';

@Component({
  selector: 'app-formulario-empresa',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
  ],
  templateUrl: './formulario-empresa.html',
  styleUrl: './formulario-empresa.scss',
})
export class FormularioEmpresa implements OnInit {

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly logoActual = signal<string | null>(null);

  private empresaId: number | null = null;
  private logo: File | null = null;

  readonly formulario = new FormGroup({

    nombre: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(150),
      ],
    }),

    limiteUsuarios: new FormControl<number | null>(
      null,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(100000),
      ]
    ),

    jornadaHoras: new FormControl<number | null>(
      null,
      [
        Validators.min(0),
        Validators.max(24),
      ]
    ),

    jornadaMinutosResto: new FormControl<number | null>(
      0,
      [
        Validators.min(0),
        Validators.max(59),
      ]
    ),

    pausaHoras: new FormControl<number | null>(
      0,
      [
        Validators.min(0),
        Validators.max(24),
      ]
    ),

    pausaMinutosResto: new FormControl<number | null>(
      30,
      [
        Validators.min(0),
        Validators.max(59),
      ]
    ),

    latitud: new FormControl<number | null>(
      null,
      Validators.required
    ),

    longitud: new FormControl<number | null>(
      null,
      Validators.required
    ),

    radioFichaje: new FormControl<number | null>(
      30,
      [
        Validators.required,
        Validators.min(5),
        Validators.max(500),
      ]
    ),
  });

  constructor(
    private readonly empresaService: EmpresaService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    const empresaId = Number(id);

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
      this.error.set(
        'El identificador de la empresa no es válido.'
      );
      return;
    }

    this.empresaId = empresaId;
    this.cargarEmpresa(empresaId);
  }

  esEdicion(): boolean {
    return this.empresaId !== null;
  }

  seleccionarLogo(event: Event): void {

    const input = event.target as HTMLInputElement;

    this.logo = input.files?.[0] ?? null;
  }

  guardar(): void {

    this.error.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();

    const jornadaHoras =
      valores.jornadaHoras ?? 0;

    const jornadaMinutosResto =
      valores.jornadaMinutosResto ?? 0;

    const pausaHoras =
      valores.pausaHoras ?? 0;

    const pausaMinutosResto =
      valores.pausaMinutosResto ?? 0;

    if (
      !Number.isInteger(jornadaHoras) ||
      !Number.isInteger(jornadaMinutosResto) ||
      !Number.isInteger(pausaHoras) ||
      !Number.isInteger(pausaMinutosResto)
    ) {
      this.error.set(
        'Las horas y los minutos deben ser números enteros.'
      );
      return;
    }

    const jornadaMinutos =
      jornadaHoras * 60 +
      jornadaMinutosResto;

    const pausaMinutos =
      pausaHoras * 60 +
      pausaMinutosResto;

    if (
      jornadaMinutos < 1 ||
      jornadaMinutos > 1440
    ) {
      this.error.set(
        'La jornada debe estar comprendida entre 1 minuto y 24 horas.'
      );
      return;
    }

    if (pausaMinutos > 1440) {
      this.error.set(
        'La pausa no puede superar las 24 horas.'
      );
      return;
    }

    const empresa: EmpresaDTO = {
      nombre: valores.nombre.trim(),
      limiteUsuarios: valores.limiteUsuarios!,
      jornadaMinutos,
      pausaMinutos,
      latitud: valores.latitud!,
      longitud: valores.longitud!,
      radioFichaje: valores.radioFichaje!,
    };

    this.guardando.set(true);

    const peticion =
      this.empresaId === null
        ? this.empresaService.crearEmpresa(
            empresa,
            this.logo
          )
        : this.empresaService.modificarEmpresa(
            this.empresaId,
            empresa,
            this.logo
          );

    peticion
      .pipe(
        finalize(() =>
          this.guardando.set(false)
        )
      )
      .subscribe({

        next: () => {
          void this.router.navigate(['/empresas']);
        },

        error: (error: HttpErrorResponse) => {

          this.error.set(
            error.error?.message ??
            'No se ha podido guardar la empresa.'
          );
        },
      });
  }

  volver(): void {
    void this.router.navigate(['/empresas']);
  }

  private cargarEmpresa(id: number): void {

    this.cargando.set(true);

    this.empresaService
      .obtenerEmpresaPorId(id)
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({

        next: (empresa) => {

          const pausaMinutos =
            empresa.pausaMinutos ?? 30;

          this.logoActual.set(
            empresa.logoUrl ?? null
          );

          this.formulario.patchValue({
            nombre: empresa.nombre,
            limiteUsuarios: empresa.limiteUsuarios,

            jornadaHoras:
              Math.floor(
                empresa.jornadaMinutos / 60
              ),

            jornadaMinutosResto:
              empresa.jornadaMinutos % 60,

            pausaHoras:
              Math.floor(
                pausaMinutos / 60
              ),

            pausaMinutosResto:
              pausaMinutos % 60,

            latitud: empresa.latitud,
            longitud: empresa.longitud,
            radioFichaje: empresa.radioFichaje,
          });
        },

        error: (error: HttpErrorResponse) => {

          this.error.set(
            error.error?.message ??
            'No se ha podido cargar la empresa.'
          );
        },
      });
  }
}