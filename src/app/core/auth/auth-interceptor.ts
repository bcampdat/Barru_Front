import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';

import { AuthService } from './auth.service';
import { AuthResponseDTO } from './auth.types';

let refreshEnCurso$: Observable<AuthResponseDTO> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  /*
   * El refresh utiliza la cookie HttpOnly.
   * No necesita enviar el ACCESS caducado.
   */
  const esPeticionRefresh =
    req.url.includes('/api/auth/refresh');

  const request = accessToken && !esPeticionRefresh
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {

      if (
        error.status !== 401
        || !accessToken
        || noPermiteRefresh(req.url)
      ) {
        return throwError(() => error);
      }

      return obtenerRefresh(authService).pipe(
        switchMap(() => {

          const nuevoAccessToken =
            authService.getAccessToken();

          if (!nuevoAccessToken) {
            return throwError(() => error);
          }

          const requestRenovado =
            req.clone({
              setHeaders: {
                Authorization:
                  `Bearer ${nuevoAccessToken}`,
              },
            });

          return next(requestRenovado);
        })
      );
    })
  );
};

function obtenerRefresh(
  authService: AuthService
): Observable<AuthResponseDTO> {

  if (!refreshEnCurso$) {

    refreshEnCurso$ =
      authService.refresh().pipe(

        catchError(error => {
          authService.limpiarSesion();

          return throwError(
            () => error
          );
        }),

        finalize(() => {
          refreshEnCurso$ = null;
        }),

        shareReplay({
          bufferSize: 1,
          refCount: false,
        })
      );
  }

  return refreshEnCurso$;
}

function noPermiteRefresh(
  url: string
): boolean {

  return url.includes('/api/auth/login')
    || url.includes('/api/auth/refresh')
    || url.includes('/api/auth/primer-acceso')
    || url.includes('/api/auth/logout')
    || url.includes('/api/auth/recuperar-password')
    || url.includes('/api/auth/restablecer-password')
    || url.includes('/api/auth/validar-recuperacion');
}
