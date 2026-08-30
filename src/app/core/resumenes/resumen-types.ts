import type {
  MotivoSalida,
  TipoFichaje,
  TipoSalida,
} from '../fichaje/fichaje-types';


export type SituacionJornada =
  | 'SIN_INICIAR'
  | 'TRABAJANDO'
  | 'EN_PAUSA'
  | 'JORNADA_COMPLETADA'
  | 'ESPERANDO_AUTORIZACION_HORAS_EXTRA'
  | 'HORAS_EXTRA'
  | 'FINALIZADA';


export type TipoIncidenciaEmpresa =
  | 'SALIDA'
  | 'JORNADA_INCOMPLETA';


export interface ResumenSalidaDTO {

  hora: string;

  tipoSalida: TipoSalida | null;

  motivoSalida: MotivoSalida | null;

}


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

  salidas: ResumenSalidaDTO[];

  ultimaActualizacion: string;

}

/*
 * Incidencia global de una empresa.
 */
export interface IncidenciaEmpresaDTO {

  usuarioUuid: string | null;

  nombreTrabajador: string;

  tipoIncidencia: TipoIncidenciaEmpresa;

  hora: string | null;

  tipoFichaje: TipoFichaje;

  tipoSalida: TipoSalida | null;

  motivoSalida: MotivoSalida | null;

}


export interface ResumenEmpresaDTO {

  empresaId: number;

  nombreEmpresa: string;

  fecha: string;

  /*
   * Situación de la plantilla.
   */
  totalTrabajadores: number;

  trabajadoresConFichaje: number;

  trabajadoresSinFichaje: number;

  trabajadoresTrabajando: number;

  trabajadoresEnPausa: number;

  trabajadoresFinalizados: number;

  trabajadoresConHorasExtra: number;

  /*
   * Totales acumulados.   
   */
  minutosTrabajados: number;

  minutosPausa: number;

  minutosExtra: number;

  tiempoTrabajado: string;

  tiempoPausa: string;

  tiempoExtra: string;

  /*
   * Indicadores operativos
   * para la visión actual de empresa.
   */
  minutosMediosTrabajados: number;

  minutosMediosRestantes: number;

  minutosMediosPausa: number;

  progresoMedioJornada: number;

  tiempoMedioTrabajado: string;

  tiempoMedioRestante: string;

  tiempoMedioPausa: string;

  /*
   * Seguimiento y control.
   */
  totalIncidencias: number;

  incidencias: IncidenciaEmpresaDTO[];

  totalNotificaciones: number;

  ultimaActualizacion: string;

}