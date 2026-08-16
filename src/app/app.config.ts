import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

import { provideRouter } from '@angular/router';

import {
  catchError,
  of,
  switchMap,
} from 'rxjs';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        authInterceptor,
      ])
    ),

    provideAppInitializer(() => {

      const authService = inject(AuthService);

      return authService
        .csrf()
        .pipe(
          switchMap(() =>
            authService
              .refresh()
              .pipe(
                catchError(() => {
                  authService.limpiarSesion();
                  return of(null);
                })
              )
          )
        );
    }),

    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
  ],
};