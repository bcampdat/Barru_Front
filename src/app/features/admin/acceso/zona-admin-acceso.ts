import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Output,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ZonaAdminService } from '../../../core/admin/zona-admin.service';

type CredencialConJson = Credential & {
  toJSON(): unknown;
};

@Component({
  selector: 'app-zona-admin-acceso',
  imports: [],
  templateUrl: './zona-admin-acceso.html',
  styleUrl: './zona-admin-acceso.scss',
})
export class ZonaAdminAcceso {

  @Output()
  readonly accesoConcedido =
    new EventEmitter<void>();

  @Output()
  readonly accesoDenegado =
    new EventEmitter<string>();

  @Output()
  readonly cerrado =
    new EventEmitter<void>();

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly zonaAdminService:
      ZonaAdminService
  ) {}

  async acceder(): Promise<void> {

    if (this.cargando()) {
      return;
    }

    this.error.set(null);
    this.cargando.set(true);

    try {

      this.validarWebAuthn();

      const necesitaRegistro =
        await firstValueFrom(
          this.zonaAdminService
            .necesitaRegistro()
        );

      if (necesitaRegistro) {
        await this.registrar();
      } else {
        await this.autenticar();
      }

      this.accesoConcedido.emit();

    } catch (error) {

      const mensaje =
        this.obtenerMensajeError(error);

      if (
        error instanceof HttpErrorResponse
        && (
          error.status === 401
          || error.status === 403
        )
      ) {

        this.accesoDenegado.emit(
          mensaje
        );

        return;
      }

      this.error.set(
        mensaje
      );

    } finally {

      this.cargando.set(false);
    }
  }

  cerrar(): void {

    if (this.cargando()) {
      return;
    }

    this.error.set(null);
    this.cerrado.emit();
  }

  private async registrar(): Promise<void> {

    const opciones =
      await firstValueFrom(
        this.zonaAdminService
          .iniciarRegistro()
      );

    const publicKeyCredential =
      (window as any).PublicKeyCredential;

    const publicKey =
      publicKeyCredential
        .parseCreationOptionsFromJSON(
          opciones
        );

    const credencial =
      await navigator.credentials.create({
        publicKey,
      });

    if (!credencial) {

      throw new Error(
        'No se ha podido crear la credencial WebAuthn.'
      );
    }

    const credencialJson =
      credencial as CredencialConJson;

    if (
      typeof credencialJson.toJSON !==
      'function'
    ) {

      throw new TypeError(
        'La credencial WebAuthn no es válida.'
      );
    }

    await firstValueFrom(
      this.zonaAdminService
        .completarRegistro({
          credential:
            credencialJson.toJSON(),
          label: 'Barru',
        })
    );
  }

  private async autenticar(): Promise<void> {

    const opciones =
      await firstValueFrom(
        this.zonaAdminService
          .iniciarAutenticacion()
      );

    const publicKeyCredential =
      (window as any).PublicKeyCredential;

    const publicKey =
      publicKeyCredential
        .parseRequestOptionsFromJSON(
          opciones
        );

    const credencial =
      await navigator.credentials.get({
        publicKey,
      });

    if (!credencial) {

      throw new Error(
        'No se ha podido verificar la credencial WebAuthn.'
      );
    }

    const credencialJson =
      credencial as CredencialConJson;

    if (
      typeof credencialJson.toJSON !==
      'function'
    ) {

      throw new TypeError(
        'La credencial WebAuthn no es válida.'
      );
    }

    await firstValueFrom(
      this.zonaAdminService
        .completarAutenticacion(
          credencialJson.toJSON()
        )
    );
  }

  private validarWebAuthn(): void {

    const publicKeyCredential =
      (window as any).PublicKeyCredential;

    if (
      !publicKeyCredential
      || !navigator.credentials
    ) {

      throw new Error(
        'Este navegador no permite utilizar WebAuthn.'
      );
    }

    if (
      typeof publicKeyCredential
        .parseCreationOptionsFromJSON
        !== 'function'
      || typeof publicKeyCredential
        .parseRequestOptionsFromJSON
        !== 'function'
    ) {

      throw new TypeError(
        'Este navegador no dispone del soporte WebAuthn necesario.'
      );
    }
  }

  private obtenerMensajeError(
    error: unknown
  ): string {

    if (
      error instanceof HttpErrorResponse
      && typeof error.error?.message ===
        'string'
    ) {

      return error.error.message;
    }

    if (error instanceof DOMException) {

      if (
        error.name ===
        'NotAllowedError'
      ) {

        return 'La verificación WebAuthn se ha cancelado o no hay una credencial disponible.';
      }

      return 'No se ha podido completar la verificación WebAuthn.';
    }

    if (error instanceof Error) {

      return error.message;
    }

    return 'No se ha podido acceder a la zona administrativa.';
  }
}