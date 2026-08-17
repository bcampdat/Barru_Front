import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { MetodoFichajeDTO } from './metodo-fichaje.types';

@Injectable({
  providedIn: 'root',
})
export class MetodoFichajeService {

  private readonly apiUrl =
    '/api/metodos-fichaje';

  constructor(
    private readonly http: HttpClient
  ) {}

  listarDisponibles():
    Observable<MetodoFichajeDTO[]> {

    return this.http.get<MetodoFichajeDTO[]>(
      `${this.apiUrl}/disponibles`
    );
  }

  listarPorEmpresa(
    empresaId: number
  ): Observable<MetodoFichajeDTO[]> {

    return this.http.get<MetodoFichajeDTO[]>(
      `${this.apiUrl}/empresa/${empresaId}`
    );
  }

  listarActivosPorEmpresa(
    empresaId: number
  ): Observable<MetodoFichajeDTO[]> {

    return this.http.get<MetodoFichajeDTO[]>(
      `${this.apiUrl}/empresa/${empresaId}/activos`
    );
  }

  listarInactivosPorEmpresa(
    empresaId: number
  ): Observable<MetodoFichajeDTO[]> {

    return this.http.get<MetodoFichajeDTO[]>(
      `${this.apiUrl}/empresa/${empresaId}/inactivos`
    );
  }

  asignar(
    codigoMetodo: string,
    empresaId: number
  ): Observable<MetodoFichajeDTO> {

    return this.http.post<MetodoFichajeDTO>(
      this.apiUrl,
      {
        codigoMetodo,
        empresaId,
      }
    );
  }

  activar(
    id: number
  ): Observable<MetodoFichajeDTO> {

    return this.http.patch<MetodoFichajeDTO>(
      `${this.apiUrl}/${id}/activar`,
      null
    );
  }

  desactivar(
    id: number
  ): Observable<MetodoFichajeDTO> {

    return this.http.patch<MetodoFichajeDTO>(
      `${this.apiUrl}/${id}/desactivar`,
      null
    );
  }
}
