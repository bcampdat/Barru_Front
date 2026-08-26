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
 * Incidencia incluida en el resumen
 * global de una empresa.
 */
export interface IncidenciaEmpresaDTO {

  usuarioUuid: string | null;

  nombreTrabajador: string;

  tipoIncidencia: TipoIncidenciaEmpresa;

  /*
   * Hora del fichaje real relacionado
   * con la incidencia.
   */
  hora: string | null;

  /*
   * Tipo real del fichaje.
   *
   * Para una jornada incompleta puede ser:
   * ENTRADA, INICIO_PAUSA o FIN_PAUSA.
   */
  tipoFichaje: TipoFichaje;

  /*
   * Solo existe cuando la incidencia
   * procede realmente de una SALIDA.
   */
  tipoSalida: TipoSalida | null;

  /*
   * Solo existe cuando la salida
   * tiene un motivo asociado.
   */
  motivoSalida: MotivoSalida | null;

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

  incidencias: IncidenciaEmpresaDTO[];

  totalNotificaciones: number;

  ultimaActualizacion: string;

}