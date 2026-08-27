import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {
  Observable,
  Subject,
  tap,
} from 'rxjs';

import { FicharDTO } from './fichaje-types';


@Injectable({
  providedIn: 'root',
})
export class FichajeService {

  private readonly apiUrl =
    '/api/fichajes';


  private readonly fichajeRegistradoSubject =
    new Subject<void>();


  readonly fichajeRegistrado$ =
    this.fichajeRegistradoSubject
      .asObservable();


  constructor(
    private readonly http: HttpClient
  ) {}


  fichar(
    datos: FicharDTO
  ): Observable<void> {

    return this.http
      .post<void>(
        this.apiUrl,
        datos
      )
      .pipe(
        tap(() =>
          this.fichajeRegistradoSubject
            .next()
        )
      );
  }

}
