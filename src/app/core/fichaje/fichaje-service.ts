// core/fichaje/fichaje.service.ts

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { FicharDTO } from './fichaje-types';

@Injectable({
  providedIn: 'root',
})
export class FichajeService {

  private readonly apiUrl = '/api/fichajes';

  constructor(
    private readonly http: HttpClient
  ) {}

  fichar(datos: FicharDTO): Observable<void> {
    return this.http.post<void>(
      this.apiUrl,
      datos
    );
  }
}