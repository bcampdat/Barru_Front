import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AdminSistemaDTO,
  RegistroWebAuthnDTO,
} from './zona-admin.types';

@Injectable({
  providedIn: 'root',
})
export class ZonaAdminService {

  private readonly acceso =
    '/api/admin/acceso';

  private readonly gestion =
    '/api/admin/gestion';

  constructor(
    private readonly http: HttpClient
  ) {}

  necesitaRegistro(): Observable<boolean> {

    return this.http.get<boolean>(
      `${this.acceso}/necesita-registro`,
      {
        withCredentials: true,
      }
    );
  }

  iniciarRegistro(): Observable<unknown> {

    return this.http.post<unknown>(
      `${this.acceso}/registro/opciones`,
      null,
      {
        withCredentials: true,
      }
    );
  }

  completarRegistro(
    registro: RegistroWebAuthnDTO
  ): Observable<void> {

    return this.http.post<void>(
      `${this.acceso}/registro/completar`,
      registro,
      {
        withCredentials: true,
      }
    );
  }

  iniciarAutenticacion(): Observable<unknown> {

    return this.http.post<unknown>(
      `${this.acceso}/autenticacion/opciones`,
      null,
      {
        withCredentials: true,
      }
    );
  }

  completarAutenticacion(
    credential: unknown
  ): Observable<void> {

    return this.http.post<void>(
      `${this.acceso}/autenticacion/completar`,
      credential,
      {
        withCredentials: true,
      }
    );
  }

  salir(): Observable<void> {

    return this.http.post<void>(
      `${this.acceso}/salir`,
      null,
      {
        withCredentials: true,
      }
    );
  }

  listarAdministradores():
      Observable<AdminSistemaDTO[]> {

    return this.http.get<AdminSistemaDTO[]>(
      this.gestion,
      {
        withCredentials: true,
      }
    );
  }

  crearAdministrador(
    administrador: Pick<
      AdminSistemaDTO,
      'nombre' | 'apellidos' | 'email'
    >
  ): Observable<AdminSistemaDTO> {

    return this.http.post<AdminSistemaDTO>(
      this.gestion,
      administrador,
      {
        withCredentials: true,
      }
    );
  }

  activar(
    uuid: string
  ): Observable<AdminSistemaDTO> {

    return this.http.patch<AdminSistemaDTO>(
      `${this.gestion}/${uuid}/activar`,
      null,
      {
        withCredentials: true,
      }
    );
  }

  inactivar(
    uuid: string
  ): Observable<AdminSistemaDTO> {

    return this.http.patch<AdminSistemaDTO>(
      `${this.gestion}/${uuid}/inactivar`,
      null,
      {
        withCredentials: true,
      }
    );
  }

  bloquear(
    uuid: string
  ): Observable<AdminSistemaDTO> {

    return this.http.patch<AdminSistemaDTO>(
      `${this.gestion}/${uuid}/bloquear`,
      null,
      {
        withCredentials: true,
      }
    );
  }

  desbloquear(
    uuid: string
  ): Observable<AdminSistemaDTO> {

    return this.http.patch<AdminSistemaDTO>(
      `${this.gestion}/${uuid}/desbloquear`,
      null,
      {
        withCredentials: true,
      }
    );
  }

  eliminarCredencialesWebAuthn(
    uuid: string
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.gestion}/${uuid}/credenciales-webauthn`,
      {
        withCredentials: true,
      }
    );
  }
}