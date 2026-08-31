import {
  DOCUMENT,
} from '@angular/common';

import {
  inject,
  Injectable,
  signal,
} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {

  readonly oscuro = signal(false);

  private readonly document = inject(DOCUMENT);

  inicializar(
    usuarioUuid: string
  ): void {

    const temaGuardado =
      localStorage.getItem(
        this.obtenerClave(usuarioUuid)
      );

    const oscuro =
      temaGuardado !== null
        ? temaGuardado === 'dark'
        : window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;

    this.aplicar(
      oscuro,
      usuarioUuid
    );
  }

  alternar(
    usuarioUuid: string
  ): void {

    this.aplicar(
      !this.oscuro(),
      usuarioUuid
    );
  }

  private aplicar(
    oscuro: boolean,
    usuarioUuid: string
  ): void {

    this.oscuro.set(oscuro);

    this.document
      .documentElement
      .classList
      .toggle(
        'barru-dark',
        oscuro
      );

    localStorage.setItem(
      this.obtenerClave(usuarioUuid),
      oscuro
        ? 'dark'
        : 'light'
    );
  }

  private obtenerClave(
    usuarioUuid: string
  ): string {

    return `barru-theme-${usuarioUuid}`;
  }
}