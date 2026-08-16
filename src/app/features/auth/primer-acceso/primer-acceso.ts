import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-primer-acceso',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './primer-acceso.html',
  styleUrl: './primer-acceso.scss',
})
export class PrimerAcceso {

  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {

    this.formulario = this.formBuilder.nonNullable.group({
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
  }

  cambiarPassword(): void {

    this.error.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.getRawValue();

    if (
      datos.nuevaPassword
      !== datos.confirmarPassword
    ) {
      this.error.set(
        'Las contraseñas no coinciden.'
      );
      return;
    }

    this.enviando.set(true);

    this.authService
      .primerAcceso(datos)
      .pipe(
        finalize(() => this.enviando.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/login');
        },

        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.error?.message
            ?? 'No se ha podido completar el primer acceso.'
          );
        },
      });
  }

  nuevaPasswordInvalida(): boolean {

    const password =
      this.formulario.controls.nuevaPassword;

    return password.invalid
        && (password.dirty || password.touched);
  }

  confirmarPasswordInvalida(): boolean {

    const confirmar =
      this.formulario.controls.confirmarPassword;

    return confirmar.invalid
        && (confirmar.dirty || confirmar.touched);
  }
}