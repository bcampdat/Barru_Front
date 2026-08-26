import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  SolicitudHorasExtraDTO,
} from './horas-extra-types';


@Injectable({
  providedIn: 'root',
})
export class HorasExtraService {

  private readonly apiUrl =
    '/api/horas-extra';


  constructor(
    private readonly http: HttpClient
  ) {}


  /*
   * =========================================================
   * TRABAJADOR
   * =========================================================
   */

  solicitar():
    Observable<SolicitudHorasExtraDTO> {

    return this.http.post<SolicitudHorasExtraDTO>(
      `${this.apiUrl}/mi-solicitud`,
      null
    );
  }


  obtenerMiSolicitudHoy():
    Observable<SolicitudHorasExtraDTO | null> {

    return this.http.get<SolicitudHorasExtraDTO | null>(
      `${this.apiUrl}/mi-solicitud/hoy`
    );
  }


  cancelar():
    Observable<SolicitudHorasExtraDTO> {

    return this.http.patch<SolicitudHorasExtraDTO>(
      `${this.apiUrl}/mi-solicitud/cancelar`,
      null
    );
  }


  /*
   * =========================================================
   * ENCARGADO
   * =========================================================
   */

  obtenerSolicitudesMiEmpresa():
    Observable<SolicitudHorasExtraDTO[]> {

    return this.http.get<SolicitudHorasExtraDTO[]>(
      `${this.apiUrl}/mi-empresa/solicitudes`
    );
  }


  autorizar(
    solicitudesIds: number[]
  ): Observable<SolicitudHorasExtraDTO[]> {

    return this.http.patch<SolicitudHorasExtraDTO[]>(
      `${this.apiUrl}/mi-empresa/autorizar`,
      solicitudesIds
    );
  }


  rechazar(
    solicitudesIds: number[]
  ): Observable<SolicitudHorasExtraDTO[]> {

    return this.http.patch<SolicitudHorasExtraDTO[]>(
      `${this.apiUrl}/mi-empresa/rechazar`,
      solicitudesIds
    );
  }

}