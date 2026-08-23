import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ResumenDiarioDTO,
  ResumenEmpresaDTO,
} from './resumen-types';

@Injectable({
  providedIn: 'root',
})
export class ResumenService {

  private readonly apiUrl = '/api/resumenes';

  constructor(
    private readonly http: HttpClient
  ) {}


  // =====================================================
  // RESUMEN PERSONAL
  // EMPLEADO / ENCARGADO
  // =====================================================

  obtenerMiResumenHoy(): Observable<ResumenDiarioDTO> {

    return this.http.get<ResumenDiarioDTO>(
      `${this.apiUrl}/mi-resumen/hoy`
    );
  }


  obtenerMiResumenPorFecha(
    fecha: string
  ): Observable<ResumenDiarioDTO> {

    const params = new HttpParams()
      .set('fecha', fecha);

    return this.http.get<ResumenDiarioDTO>(
      `${this.apiUrl}/mi-resumen`,
      { params }
    );
  }


  obtenerMiHistorico(): Observable<ResumenDiarioDTO[]> {

    return this.http.get<ResumenDiarioDTO[]>(
      `${this.apiUrl}/mi-historico`
    );
  }


  obtenerMiHistoricoPorRango(
    desde: string,
    hasta: string
  ): Observable<ResumenDiarioDTO[]> {

    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    return this.http.get<ResumenDiarioDTO[]>(
      `${this.apiUrl}/mi-historico/rango`,
      { params }
    );
  }


  // =====================================================
  // RESUMEN DE UN TRABAJADOR
  // ENCARGADO / ADMIN_SISTEMA
  // =====================================================

  obtenerResumenTrabajadorHoy(
    usuarioUuid: string
  ): Observable<ResumenDiarioDTO> {

    return this.http.get<ResumenDiarioDTO>(
      `${this.apiUrl}/trabajadores/${usuarioUuid}/hoy`
    );
  }


  obtenerResumenTrabajadorPorFecha(
    usuarioUuid: string,
    fecha: string
  ): Observable<ResumenDiarioDTO> {

    const params = new HttpParams()
      .set('fecha', fecha);

    return this.http.get<ResumenDiarioDTO>(
      `${this.apiUrl}/trabajadores/${usuarioUuid}`,
      { params }
    );
  }


  obtenerHistoricoTrabajador(
    usuarioUuid: string
  ): Observable<ResumenDiarioDTO[]> {

    return this.http.get<ResumenDiarioDTO[]>(
      `${this.apiUrl}/trabajadores/${usuarioUuid}/historico`
    );
  }


  obtenerHistoricoTrabajadorPorRango(
    usuarioUuid: string,
    desde: string,
    hasta: string
  ): Observable<ResumenDiarioDTO[]> {

    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    return this.http.get<ResumenDiarioDTO[]>(
      `${this.apiUrl}/trabajadores/${usuarioUuid}/historico/rango`,
      { params }
    );
  }


  // =====================================================
  // RESUMEN DE MI EMPRESA
  // ENCARGADO
  // =====================================================

  obtenerResumenMiEmpresaHoy():
    Observable<ResumenEmpresaDTO> {

    return this.http.get<ResumenEmpresaDTO>(
      `${this.apiUrl}/mi-empresa/hoy`
    );
  }


  obtenerResumenMiEmpresaPorFecha(
    fecha: string
  ): Observable<ResumenEmpresaDTO> {

    const params = new HttpParams()
      .set('fecha', fecha);

    return this.http.get<ResumenEmpresaDTO>(
      `${this.apiUrl}/mi-empresa`,
      { params }
    );
  }


  obtenerHistoricoMiEmpresa():
    Observable<ResumenEmpresaDTO[]> {

    return this.http.get<ResumenEmpresaDTO[]>(
      `${this.apiUrl}/mi-empresa/historico`
    );
  }


  obtenerHistoricoMiEmpresaPorRango(
    desde: string,
    hasta: string
  ): Observable<ResumenEmpresaDTO[]> {

    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    return this.http.get<ResumenEmpresaDTO[]>(
      `${this.apiUrl}/mi-empresa/historico/rango`,
      { params }
    );
  }


  // =====================================================
  // RESUMEN DE EMPRESA SELECCIONADA
  // ADMIN_SISTEMA
  // =====================================================

  obtenerResumenEmpresaHoy(
    empresaId: number
  ): Observable<ResumenEmpresaDTO> {

    return this.http.get<ResumenEmpresaDTO>(
      `${this.apiUrl}/empresas/${empresaId}/hoy`
    );
  }


  obtenerResumenEmpresaPorFecha(
    empresaId: number,
    fecha: string
  ): Observable<ResumenEmpresaDTO> {

    const params = new HttpParams()
      .set('fecha', fecha);

    return this.http.get<ResumenEmpresaDTO>(
      `${this.apiUrl}/empresas/${empresaId}`,
      { params }
    );
  }


  obtenerHistoricoEmpresa(
    empresaId: number
  ): Observable<ResumenEmpresaDTO[]> {

    return this.http.get<ResumenEmpresaDTO[]>(
      `${this.apiUrl}/empresas/${empresaId}/historico`
    );
  }


  obtenerHistoricoEmpresaPorRango(
    empresaId: number,
    desde: string,
    hasta: string
  ): Observable<ResumenEmpresaDTO[]> {

    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    return this.http.get<ResumenEmpresaDTO[]>(
      `${this.apiUrl}/empresas/${empresaId}/historico/rango`,
      { params }
    );
  }
}