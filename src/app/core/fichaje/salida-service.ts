import { Injectable } from '@angular/core';

import {
  MotivoSalida,
} from './fichaje-types';

import {
  ResumenDiarioDTO,
} from '../resumenes/resumen-types';

export interface DatosSalida {
  finalizarJornada: boolean;
  motivoSalida: MotivoSalida | null;
}

@Injectable({
  providedIn: 'root',
})
export class SalidaService {

  /*
   * Determina si el cierre de jornada
   * necesita que el trabajador indique
   * un motivo.
   *
   * La clasificación definitiva
   * ANTICIPADA / ORDINARIA corresponde
   * siempre al backend.
   */
  requiereMotivoParaFinalizar(
    resumen: ResumenDiarioDTO | null
  ): boolean {

    if (!resumen) {
      return false;
    }

    return Math.max(
      0,
      resumen.minutosRestantes ?? 0
    ) > 0;
  }

  /*
   * Prepara una salida que no cierra
   * definitivamente la jornada.
   *
   * Ejemplo:
   * jornada partida o salida temporal.
   */
  prepararSalidaIntermedia(
    motivoSalida: MotivoSalida
  ): DatosSalida {

    return {
      finalizarJornada: false,
      motivoSalida,
    };
  }

  /*
   * Prepara el cierre de la jornada.
   *
   * Si todavía queda tiempo pendiente,
   * el motivo debe venir informado.
   */
  prepararFinalizacion(
    resumen: ResumenDiarioDTO | null,
    motivoSalida: MotivoSalida | null
  ): DatosSalida | null {

    const requiereMotivo =
      this.requiereMotivoParaFinalizar(
        resumen
      );

    if (
      requiereMotivo
      && motivoSalida === null
    ) {
      return null;
    }

    return {
      finalizarJornada: true,
      motivoSalida:
        requiereMotivo
          ? motivoSalida
          : null,
    };
  }
}
