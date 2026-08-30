export type TipoAvisoTarea =
  | 'TAREA_ASIGNADA'
  | 'TAREA_FINALIZADA'
  | 'TAREA_RETRASADA';

export interface AvisoTarea {

  id: number;

  tipo: TipoAvisoTarea;

  leido: boolean;

  fechaCreacion: string;

  usuarioUuid: string;

  tareaId: number;

  tareaNombre: string;

  proyectoId: number;

  proyectoNombre: string;
}