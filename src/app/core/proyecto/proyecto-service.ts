import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CrearProyectoRequest,
  Proyecto
} from './proyecto-types';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/proyectos';

  crearProyecto(
    proyecto: CrearProyectoRequest
  ): Observable<Proyecto> {

    return this.http.post<Proyecto>(
      this.apiUrl,
      proyecto
    );
  }

  obtenerProyectosEmpresa(): Observable<Proyecto[]> {

    return this.http.get<Proyecto[]>(
      this.apiUrl
    );
  }

  obtenerProyecto(
    proyectoId: number
  ): Observable<Proyecto> {

    return this.http.get<Proyecto>(
      `${this.apiUrl}/${proyectoId}`
    );
  }

  ampliarFechaFinEstimada(
    proyectoId: number,
    nuevaFecha: string
  ): Observable<Proyecto> {

    const params = new HttpParams()
      .set('nuevaFecha', nuevaFecha);

    return this.http.patch<Proyecto>(
      `${this.apiUrl}/${proyectoId}/fecha-fin-estimada`,
      null,
      { params }
    );
  }

  finalizarProyecto(
    proyectoId: number
  ): Observable<Proyecto> {

    return this.http.patch<Proyecto>(
      `${this.apiUrl}/${proyectoId}/finalizar`,
      null
    );
  }
}