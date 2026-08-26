import {
  Component,
  Input,
} from '@angular/core';

import type {
  MotivoSalida,
  TipoSalida,
} from '../../../core/fichaje/fichaje-types';

import type {
  ResumenSalidaDTO,
} from '../../../core/resumenes/resumen-types';

@Component({
  selector: 'app-resumen-salidas',
  imports: [],
  templateUrl: './resumen-salidas.html',
  styleUrl: './resumen-salidas.scss',
})
export class ResumenSalidas {

  @Input({ required: true })
  salidas: ResumenSalidaDTO[] = [];

  textoTipo(
    tipo: TipoSalida | null
  ): string {

    if (tipo === null) {
      return 'Salida';
    }

    switch (tipo) {

      case 'INTERMEDIA':
        return 'Salida temporal';

      case 'ORDINARIA':
        return 'Salida ordinaria';

      case 'ANTICIPADA':
        return 'Salida anticipada';

      case 'TRAS_HORAS_EXTRA':
        return 'Salida tras horas extra';
    }
  }

  textoMotivo(
    motivo: MotivoSalida | null
  ): string | null {

    if (motivo === null) {
      return null;
    }

    switch (motivo) {

      case 'JORNADA_PARTIDA':
        return 'Jornada partida';

      case 'MEDICO':
        return 'Médico';

      case 'ESPECIALISTA':
        return 'Especialista';

      case 'PERSONAL':
        return 'Personal';

      case 'LABORAL':
        return 'Laboral';

      case 'OTRO':
        return 'Otro';
    }
  }
}
