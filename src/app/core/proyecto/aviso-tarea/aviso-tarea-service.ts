import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AvisoTarea } from './aviso-tarea-types';

@Injectable({
  providedIn: 'root'
})
export class AvisoTareaService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/avisos-tarea';

  obtenerMisAvisos(): Observable<AvisoTarea[]> {

    return this.http.get<AvisoTarea[]>(
      this.apiUrl
    );
  }

  obtenerMisAvisosNoLeidos(): Observable<AvisoTarea[]> {

    return this.http.get<AvisoTarea[]>(
      `${this.apiUrl}/no-leidos`
    );
  }

  marcarComoLeido(
    avisoId: number
  ): Observable<AvisoTarea> {

    return this.http.patch<AvisoTarea>(
      `${this.apiUrl}/${avisoId}/leer`,
      null
    );
  }
}