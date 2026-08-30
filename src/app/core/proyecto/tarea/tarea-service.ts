import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Tarea } from './tarea-types';

export interface CrearTareaRequest {
  nombre: string;
  notas?: string | null;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  fechaLimite: string;
  usuarioAsignadoUuid?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TareaService {

  private readonly apiUrl = '/api/tareas';

  constructor(
    private readonly http: HttpClient
  ) {}

  crearTarea(
    proyectoId: number,
    tarea: CrearTareaRequest
  ): Observable<Tarea> {

    return this.http.post<Tarea>(
      `${this.apiUrl}/proyecto/${proyectoId}`,
      tarea
    );
  }

  asignarTarea(
    tareaId: number,
    usuarioUuid: string
  ): Observable<Tarea> {

    const params =
      new HttpParams()
        .set(
          'usuarioUuid',
          usuarioUuid
        );

    return this.http.patch<Tarea>(
      `${this.apiUrl}/${tareaId}/asignar`,
      null,
      {
        params
      }
    );
  }

  obtenerTarea(
    tareaId: number
  ): Observable<Tarea> {

    return this.http.get<Tarea>(
      `${this.apiUrl}/${tareaId}`
    );
  }

  obtenerTareasProyecto(
    proyectoId: number
  ): Observable<Tarea[]> {

    return this.http.get<Tarea[]>(
      `${this.apiUrl}/proyecto/${proyectoId}`
    );
  }

  obtenerTareasEmpresa():
    Observable<Tarea[]> {

    return this.http.get<Tarea[]>(
      `${this.apiUrl}/empresa`
    );
  }

  obtenerMisTareas():
    Observable<Tarea[]> {

    return this.http.get<Tarea[]>(
      `${this.apiUrl}/mias`
    );
  }

  iniciarTarea(
    tareaId: number
  ): Observable<Tarea> {

    return this.http.patch<Tarea>(
      `${this.apiUrl}/${tareaId}/iniciar`,
      null
    );
  }

  pausarTarea(
    tareaId: number
  ): Observable<Tarea> {

    return this.http.patch<Tarea>(
      `${this.apiUrl}/${tareaId}/pausar`,
      null
    );
  }

  finalizarTarea(
    tareaId: number
  ): Observable<Tarea> {

    return this.http.patch<Tarea>(
      `${this.apiUrl}/${tareaId}/finalizar`,
      null
    );
  }

  guardarAclaracion(
    tareaId: number,
    aclaracion: string
  ): Observable<Tarea> {

    const params =
      new HttpParams()
        .set(
          'aclaracion',
          aclaracion
        );

    return this.http.patch<Tarea>(
      `${this.apiUrl}/${tareaId}/aclaracion`,
      null,
      {
        params
      }
    );
  }
}