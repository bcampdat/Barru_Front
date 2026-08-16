import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-recuperar-password',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
  ],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.scss',
})
export class RecuperarPassword {

  readonly enviando = signal(false);
  readonly completado = signal(false);

  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly formulario;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService
  ) {

    this.formulario = this.formBuilder.nonNullable.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
        ],
      ],
    });
  }

  solicitarRecuperacion(): void {

    this.error.set(null);
    this.exito.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);

    this.authService
      .solicitarRecuperacion(
        this.formulario.getRawValue()
      )
      .pipe(
        finalize(() =>
          this.enviando.set(false)
        )
      )
      .subscribe({
        next: () => {

          this.completado.set(true);

          this.exito.set(
            'Si el correo está registrado y puede recuperar la contraseña, recibirás las instrucciones por correo electrónico y el código de verificación.'
          );

          this.formulario.disable();
        },

        error: (error: HttpErrorResponse) => {

          this.error.set(
            error.error?.message ??
            'No se ha podido solicitar la recuperación de contraseña.'
          );
        },
      });
  }

  emailInvalido(): boolean {

    const control =
      this.formulario.controls.email;

    return control.invalid &&
      (control.dirty || control.touched);
  }
}
