export type EstadoSolicitudHorasExtra =
  | 'SOLICITADA'
  | 'AUTORIZADA'
  | 'RECHAZADA'
  | 'CANCELADA'
  | 'CADUCADA';


export interface SolicitudHorasExtraDTO {

  id: number;

  usuarioUuid: string;

  nombreTrabajador: string;

  fecha: string;

  estado: EstadoSolicitudHorasExtra;

  fechaSolicitud: string;

  fechaLimite: string;

  fechaResolucion: string | null;

  resueltaPorUuid: string | null;

  nombreEncargado: string | null;

}
