import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-restablecer-password',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
  ],
  templateUrl: './restablecer-password.html',
  styleUrl: './restablecer-password.scss',
})
export class RestablecerPassword {

  readonly enviando = signal(false);
  readonly validandoEnlace = signal(true);
  readonly enlaceValido = signal(false);
  readonly bloqueado = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario;

  private readonly token: string;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {

    this.token =
      this.activatedRoute.snapshot.queryParamMap.get('token') ?? '';

    this.formulario = this.formBuilder.nonNullable.group({
      codigo: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{6}$/),
        ],
      ],
      nuevaPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
          ),
        ],
      ],
      confirmarPassword: [
        '',
        [
          Validators.required,
        ],
      ],
    });

    /*
     * El formulario permanece bloqueado hasta que
     * el backend confirme que el enlace es válido.
     */
    this.formulario.disable();

    if (!this.token) {

      this.validandoEnlace.set(false);

      this.error.set(
        'El enlace de recuperación no es válido.'
      );

      return;
    }

    this.validarEnlaceRecuperacion();
  }

  private validarEnlaceRecuperacion(): void {

    this.authService
      .validarEnlaceRecuperacion(this.token)
      .pipe(
        finalize(() =>
          this.validandoEnlace.set(false)
        )
      )
      .subscribe({

        next: () => {

          this.enlaceValido.set(true);
          this.formulario.enable();
        },

        error: (error: HttpErrorResponse) => {

          this.enlaceValido.set(false);

          this.error.set(
            error.error?.message ??
            'El enlace de recuperación no es válido.'
          );
        },
      });
  }

  restablecerPassword(): void {

    this.error.set(null);

    if (!this.token || !this.enlaceValido()) {

      this.error.set(
        'El enlace de recuperación no es válido.'
      );

      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.getRawValue();

    if (
      datos.nuevaPassword !==
      datos.confirmarPassword
    ) {

      this.error.set(
        'Las contraseñas no coinciden.'
      );

      return;
    }

    this.enviando.set(true);

    this.authService.restablecerPassword({
      token: this.token,
      codigo: datos.codigo,
      nuevaPassword: datos.nuevaPassword,
      confirmarPassword: datos.confirmarPassword,
    })
    .pipe(
      finalize(() =>
        this.enviando.set(false)
      )
    )
    .subscribe({

      next: () => {
        this.router.navigateByUrl('/login');
      },

      error: (error: HttpErrorResponse) => {

        const mensaje =
          error.error?.message ??
          'No se ha podido restablecer la contraseña.';

        this.error.set(mensaje);

        if (error.status === 403) {

          this.bloqueado.set(true);
          this.enlaceValido.set(false);
          this.formulario.disable();
        }

        /*
         * El enlace puede caducar mientras el usuario
         * está rellenando el formulario.
         */
        if (
          error.status === 401 &&
          (
            mensaje === 'La solicitud de recuperación ha expirado' ||
            mensaje === 'La solicitud de recuperación no es válida'
          )
        ) {

          this.enlaceValido.set(false);
          this.formulario.disable();
        }
      },
    });
  }

  codigoInvalido(): boolean {

    const control =
      this.formulario.controls.codigo;

    return control.invalid &&
      (control.dirty || control.touched);
  }

  passwordInvalida(): boolean {

    const control =
      this.formulario.controls.nuevaPassword;

    return control.invalid &&
      (control.dirty || control.touched);
  }

  confirmarPasswordInvalida(): boolean {

    const control =
      this.formulario.controls.confirmarPassword;

    return control.invalid &&
      (control.dirty || control.touched);
  }
}