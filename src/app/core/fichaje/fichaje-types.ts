export type TipoFichaje =
  | 'ENTRADA'
  | 'INICIO_PAUSA'
  | 'FIN_PAUSA'
  | 'SALIDA';

export type TipoSalida =
  | 'INTERMEDIA'
  | 'ORDINARIA'
  | 'ANTICIPADA'
  | 'TRAS_HORAS_EXTRA';

export type MotivoSalida =
  | 'JORNADA_PARTIDA'
  | 'MEDICO'
  | 'ESPECIALISTA'
  | 'PERSONAL'
  | 'LABORAL'
  | 'OTRO';

export interface FicharDTO {
  tipo: TipoFichaje;
  codigo?: string | null;
  lat?: number | null;
  lng?: number | null;
  finalizarJornada?: boolean | null;
  motivoSalida?: MotivoSalida | null;
}