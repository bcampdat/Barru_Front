export interface AuditoriaDTO {

  fechaHora: string;

  usuarioActorNombre: string | null;

  usuarioActorRolNombre: string | null;

  usuarioNombre: string | null;

  usuarioRolNombre: string | null;

  empresaNombre: string | null;

  accion: string;

  entidadDescripcion: string | null;

  resultado: string;

  detalle: string | null;

}

export interface AuditoriaFiltros {

  usuarioActorUuid?: string | null;

  usuarioUuid?: string | null;

  desde?: string | null;

  hasta?: string | null;

  accion?: string | null;

  resultado?: string | null;

  tipoEntidad?: string | null;

  usuarioActorRolNombre?: string | null;

  page?: number;

  size?: number;

  sort?: string | null;

}

export interface PaginaAuditoriaDTO {

  content: AuditoriaDTO[];

  page: {

    size: number;

    number: number;

    totalElements: number;

    totalPages: number;

  };

}