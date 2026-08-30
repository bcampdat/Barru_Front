export type EstadoTarea =
  | 'SIN_INICIAR'
  | 'INICIADA'
  | 'PAUSA'
  | 'FINALIZADA';

export type PrioridadTarea =
  | 'ALTA'
  | 'MEDIA'
  | 'BAJA';

export interface Tarea {
  id: number;
  nombre: string;
  notas: string | null;
  aclaracionTrabajador: string | null;
  prioridad: PrioridadTarea;
  estado: EstadoTarea;
  fechaLimite: string;
  fechaAsignacion: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  proyectoId: number;
  proyectoNombre: string;
  usuarioAsignadoUuid: string | null;
}