import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { EmpresaDTO } from './empresa.types';

@Injectable({
  providedIn: 'root',
})
export class EmpresaService {

  private readonly apiUrl = '/api/empresas';

  constructor(
    private readonly http: HttpClient
  ) {}

  crearEmpresa(
    empresaDTO: EmpresaDTO,
    logo?: File | null
  ): Observable<EmpresaDTO> {

    const formData =
      this.crearFormData(
        empresaDTO,
        logo
      );

    return this.http.post<EmpresaDTO>(
      this.apiUrl,
      formData
    );
  }

  modificarEmpresa(
    id: number,
    empresaDTO: EmpresaDTO,
    logo?: File | null
  ): Observable<EmpresaDTO> {

    const formData =
      this.crearFormData(
        empresaDTO,
        logo
      );

    return this.http.put<EmpresaDTO>(
      `${this.apiUrl}/${id}`,
      formData
    );
  }

  obtenerEmpresaPorId(
    id: number
  ): Observable<EmpresaDTO> {

    return this.http.get<EmpresaDTO>(
      `${this.apiUrl}/${id}`
    );
  }

  obtenerTodasLasEmpresas():
    Observable<EmpresaDTO[]> {

    return this.http.get<EmpresaDTO[]>(
      this.apiUrl
    );
  }

  obtenerEmpresasActivas():
    Observable<EmpresaDTO[]> {

    return this.http.get<EmpresaDTO[]>(
      `${this.apiUrl}/activas`
    );
  }

  obtenerEmpresasInactivas():
    Observable<EmpresaDTO[]> {

    return this.http.get<EmpresaDTO[]>(
      `${this.apiUrl}/inactivas`
    );
  }

  buscarEmpresasPorNombre(
    nombre: string
  ): Observable<EmpresaDTO[]> {

    return this.http.get<EmpresaDTO[]>(
      `${this.apiUrl}/buscar`,
      {
        params: {
          nombre,
        },
      }
    );
  }

  activarEmpresa(
    id: number
  ): Observable<EmpresaDTO> {

    return this.http.patch<EmpresaDTO>(
      `${this.apiUrl}/${id}/activar`,
      null
    );
  }

  desactivarEmpresa(
    id: number
  ): Observable<EmpresaDTO> {

    return this.http.patch<EmpresaDTO>(
      `${this.apiUrl}/${id}/desactivar`,
      null
    );
  }

  private crearFormData(
    empresaDTO: EmpresaDTO,
    logo?: File | null
  ): FormData {

    const formData = new FormData();

    formData.append(
      'empresa',
      new Blob(
        [JSON.stringify(empresaDTO)],
        {
          type: 'application/json',
        }
      )
    );

    if (logo) {
      formData.append(
        'logo',
        logo
      );
    }

    return formData;
  }
}