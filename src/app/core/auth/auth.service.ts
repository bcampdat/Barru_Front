import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  AuthDTO,
  AuthResponseDTO,
  PrimerAccesoDTO,
  RestablecerPasswordDTO,
  SolicitarRecuperacionDTO,
} from './auth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly apiUrl = '/api/auth';

  private accessToken: string | null = null;
  private sesion: AuthResponseDTO | null = null;

  constructor(private readonly http: HttpClient) {}

  csrf(): Observable<void> {
    return this.http.get<void>(
      `${this.apiUrl}/csrf`
    );
  }

  login(authDTO: AuthDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(
      `${this.apiUrl}/login`,
      authDTO
    ).pipe(
      tap(respuesta => this.guardarSesion(respuesta))
    );
  }

  primerAcceso(
    primerAccesoDTO: PrimerAccesoDTO
  ): Observable<void> {

    return this.http.post<void>(
      `${this.apiUrl}/primer-acceso`,
      primerAccesoDTO
    ).pipe(
      tap(() => this.limpiarSesion())
    );
  }

  refresh(): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(
      `${this.apiUrl}/refresh`,
      null
    ).pipe(
      tap(respuesta => this.guardarSesion(respuesta))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/logout`,
      null
    ).pipe(
      tap(() => this.limpiarSesion())
    );
  }

  solicitarRecuperacion(
    solicitudDTO: SolicitarRecuperacionDTO
  ): Observable<void> {

    return this.http.post<void>(
      `${this.apiUrl}/recuperar-password`,
      solicitudDTO
    );
  }

  validarEnlaceRecuperacion(
    token: string
  ): Observable<void> {

    return this.http.get<void>(
      `${this.apiUrl}/validar-recuperacion`,
      {
        params: {
          token,
        },
      }
    );
  }

  restablecerPassword(
    restablecerDTO: RestablecerPasswordDTO
  ): Observable<void> {

    return this.http.post<void>(
      `${this.apiUrl}/restablecer-password`,
      restablecerDTO
    );
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getSesion(): AuthResponseDTO | null {
    return this.sesion;
  }

  estaAutenticado(): boolean {
    return this.accessToken !== null;
  }

  limpiarSesion(): void {
    this.accessToken = null;
    this.sesion = null;
  }

  private guardarSesion(
    respuesta: AuthResponseDTO
  ): void {

    this.accessToken = respuesta.accessToken;
    this.sesion = respuesta;
  }
}