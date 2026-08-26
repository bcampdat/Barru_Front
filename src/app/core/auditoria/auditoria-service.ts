import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AuditoriaFiltros,
  PaginaAuditoriaDTO,
} from './auditoria-types';


@Injectable({
  providedIn: 'root',
})
export class AuditoriaService {

  private readonly apiUrl =
    '/api/auditorias';


  constructor(
    private readonly http: HttpClient
  ) {}


  /*
   * ADMIN_SISTEMA.
   *
   * Consulta global de toda la aplicación.
   */
  consultarGlobal(
    filtros: AuditoriaFiltros = {}
  ): Observable<PaginaAuditoriaDTO> {

    return this.http.get<PaginaAuditoriaDTO>(
      `${this.apiUrl}/global`,
      {
        params:
          this.crearParametros(
            filtros
          ),
      }
    );
  }


  /*
   * ADMIN_SISTEMA.
   *
   * Consulta limitada a la empresa
   * seleccionada.
   */
  consultarPorEmpresa(
    empresaId: number,
    filtros: AuditoriaFiltros = {}
  ): Observable<PaginaAuditoriaDTO> {

    return this.http.get<PaginaAuditoriaDTO>(
      `${this.apiUrl}/empresa/${empresaId}`,
      {
        params:
          this.crearParametros(
            filtros
          ),
      }
    );
  }


  /*
   * ENCARGADO.
   *
   * El identificador de empresa no sale
   * del frontend.
   *
   * El backend obtiene la empresa desde
   * el usuario autenticado.
   */
  consultarMiEmpresa(
    filtros: AuditoriaFiltros = {}
  ): Observable<PaginaAuditoriaDTO> {

    return this.http.get<PaginaAuditoriaDTO>(
      `${this.apiUrl}/mi-empresa`,
      {
        params:
          this.crearParametros(
            filtros
          ),
      }
    );
  }


  private crearParametros(
    filtros: AuditoriaFiltros
  ): HttpParams {

    let params =
      new HttpParams();


    params =
      this.anadirParametro(
        params,
        'usuarioActorUuid',
        filtros.usuarioActorUuid
      );

    params =
      this.anadirParametro(
        params,
        'usuarioUuid',
        filtros.usuarioUuid
      );

    params =
      this.anadirParametro(
        params,
        'desde',
        filtros.desde
      );

    params =
      this.anadirParametro(
        params,
        'hasta',
        filtros.hasta
      );

    params =
      this.anadirParametro(
        params,
        'accion',
        filtros.accion
      );

    params =
      this.anadirParametro(
        params,
        'resultado',
        filtros.resultado
      );

    params =
      this.anadirParametro(
        params,
        'tipoEntidad',
        filtros.tipoEntidad
      );

    params =
      this.anadirParametro(
        params,
        'usuarioActorRolNombre',
        filtros.usuarioActorRolNombre
      );


    if (
      filtros.page !== undefined
    ) {

      params =
        params.set(
          'page',
          filtros.page.toString()
        );
    }


    if (
      filtros.size !== undefined
    ) {

      params =
        params.set(
          'size',
          filtros.size.toString()
        );
    }


    params =
      this.anadirParametro(
        params,
        'sort',
        filtros.sort
      );


    return params;
  }

  private anadirParametro(
  params: HttpParams,
  nombre: string,
  valor: string | null | undefined
    ): HttpParams {

    if (!valor?.trim()) {
        return params;
    }

    return params.set(
        nombre,
        valor.trim()
    );
  }
}
