import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  EstadoUsuario,
  PerfilDTO,
  RolAsignableDTO,
  UserDTO,
} from './usuario.types';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private readonly apiUrl = '/api/usuarios';

  constructor(
    private readonly http: HttpClient
  ) {}

  crear(
    usuario: UserDTO
  ): Observable<UserDTO> {

    return this.http.post<UserDTO>(
      this.apiUrl,
      usuario
    );
  }

  buscarPorUuid(
    uuid: string
  ): Observable<UserDTO> {

    return this.http.get<UserDTO>(
      `${this.apiUrl}/${uuid}`
    );
  }

  listarPorEmpresa(
    empresaId: number
  ): Observable<UserDTO[]> {

    return this.http.get<UserDTO[]>(
      `${this.apiUrl}/empresa/${empresaId}`
    );
  }

  listarPorEmpresaYEstado(
    empresaId: number,
    estado: EstadoUsuario
  ): Observable<UserDTO[]> {

    return this.http.get<UserDTO[]>(
      `${this.apiUrl}/empresa/${empresaId}/estado`,
      {
        params: {
          estado,
        },
      }
    );
  }

  modificar(
    uuid: string,
    usuario: UserDTO
  ): Observable<UserDTO> {

    return this.http.put<UserDTO>(
      `${this.apiUrl}/${uuid}`,
      usuario
    );
  }

  activar(
    uuid: string
  ): Observable<UserDTO> {

    return this.http.patch<UserDTO>(
      `${this.apiUrl}/${uuid}/activar`,
      null
    );
  }

  inactivar(
    uuid: string
  ): Observable<UserDTO> {

    return this.http.patch<UserDTO>(
      `${this.apiUrl}/${uuid}/inactivar`,
      null
    );
  }

  bloquear(
    uuid: string
  ): Observable<UserDTO> {

    return this.http.patch<UserDTO>(
      `${this.apiUrl}/${uuid}/bloquear`,
      null
    );
  }

  desbloquear(
    uuid: string
  ): Observable<UserDTO> {

    return this.http.patch<UserDTO>(
      `${this.apiUrl}/${uuid}/desbloquear`,
      null
    );
  }

  obtenerPerfil():
    Observable<PerfilDTO> {

    return this.http.get<PerfilDTO>(
      `${this.apiUrl}/perfil`
    );
  }

  modificarPerfil(
    perfil: PerfilDTO,
    foto?: File | null
  ): Observable<PerfilDTO> {

    const formData = new FormData();

    formData.append(
      'perfil',
      new Blob(
        [JSON.stringify(perfil)],
        {
          type: 'application/json',
        }
      )
    );

    if (foto) {
      formData.append('foto', foto);
    }

    return this.http.put<PerfilDTO>(
      `${this.apiUrl}/perfil`,
      formData
    );
  }
  listarRolesAsignables():
    Observable<RolAsignableDTO[]> {

    return this.http.get<RolAsignableDTO[]>(
        `${this.apiUrl}/roles-asignables`
    );
  }

}