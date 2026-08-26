import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    RouterLink,
    MessageModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  readonly enviando =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly formulario;

  constructor(
    private readonly formBuilder:
      FormBuilder,

    private readonly authService:
      AuthService,

    private readonly router:
      Router,

    private readonly route:
      ActivatedRoute
  ) {

    this.formulario =
      this.formBuilder
        .nonNullable
        .group({

          email: [
            '',
            [
              Validators.required,
              Validators.email,
            ],
          ],

          password: [
            '',
            [
              Validators.required,
            ],
          ],
        });
  }

  iniciarSesion(): void {

    this.error.set(null);

    if (
      this.formulario.invalid
    ) {

      this.formulario
        .markAllAsTouched();

      return;
    }

    this.enviando.set(true);

    this.authService
      .login(
        this.formulario
          .getRawValue()
      )
      .pipe(
        finalize(
          () =>
            this.enviando.set(false)
        )
      )
      .subscribe({

        next: respuesta => {

          if (
            respuesta.tipoToken
            === 'ACCESS'
          ) {

            this.router.navigateByUrl(
              this.obtenerDestinoTrasLogin()
            );

            return;
          }

          if (
            respuesta.tipoToken
            === 'FIRST_ACCESS'
          ) {

            this.router.navigateByUrl(
              '/primer-acceso'
            );

            return;
          }


          this.authService
            .limpiarSesion();

          this.error.set(
            'El tipo de sesión recibido no es válido.'
          );
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.error.set(
            error.error?.message
            ?? 'No se ha podido iniciar sesión.'
          );
        },
      });
  }

  emailInvalido(): boolean {

    const email =
      this.formulario
        .controls
        .email;

    return email.invalid
      && (
        email.dirty
        || email.touched
      );
  }

  passwordInvalida(): boolean {
    const password =
      this.formulario
        .controls
        .password;

    return password.invalid
      && (
        password.dirty
        || password.touched
      );
  }

  private obtenerDestinoTrasLogin():
    string {

    const returnUrl =
      this.route
        .snapshot
        .queryParamMap
        .get('returnUrl');


    if (
      returnUrl
      === '/notificaciones'
    ) {

      return '/notificaciones';
    }
    return '/inicio';
  }
}