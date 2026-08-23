export type TipoFichaje =
  | 'ENTRADA'
  | 'INICIO_PAUSA'
  | 'FIN_PAUSA'
  | 'SALIDA';

export interface FicharDTO {
  tipo: TipoFichaje;
  codigo?: string | null;
  lat?: number | null;
  lng?: number | null;
  finalizarJornada?: boolean | null;
}