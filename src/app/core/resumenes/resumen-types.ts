export type SituacionJornada =
  | 'SIN_INICIAR'
  | 'TRABAJANDO'
  | 'EN_PAUSA'
  | 'JORNADA_COMPLETADA'
  | 'HORAS_EXTRA'
  | 'FINALIZADA';

export interface ResumenDiarioDTO {

  fecha: string;

  minutosTrabajados: number;
  minutosJornada: number;
  minutosRestantes: number;

  minutosPausa: number;
  minutosPausaDisponibles: number;

  minutosExtra: number;

  tiempoTrabajado: string;
  tiempoJornada: string;
  tiempoRestante: string;

  tiempoPausa: string;
  tiempoPausaDisponible: string;

  tiempoExtra: string;

  situacion: SituacionJornada;

  requiereConfirmacionHorasExtra: boolean;

  ultimaActualizacion: string;
}


export interface ResumenEmpresaDTO {

  empresaId: number;
  nombreEmpresa: string;

  fecha: string;

  totalTrabajadores: number;

  trabajadoresConFichaje: number;
  trabajadoresSinFichaje: number;

  trabajadoresTrabajando: number;
  trabajadoresEnPausa: number;
  trabajadoresFinalizados: number;

  trabajadoresConHorasExtra: number;

  minutosTrabajados: number;
  minutosPausa: number;
  minutosExtra: number;

  tiempoTrabajado: string;
  tiempoPausa: string;
  tiempoExtra: string;

  totalIncidencias: number;
  totalNotificaciones: number;

  ultimaActualizacion: string;
}