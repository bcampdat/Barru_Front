export type EstadoUsuario =
  'PENDIENTE' |
  'ACTIVO' |
  'INACTIVO' |
  'BLOQUEADO';

export interface UserDTO {
  uuid?: string | null;
  nombre: string;
  apellidos: string;
  fotoPerfil?: string | null;
  email: string;
  empresaId?: number | null;
  rolId: number;
  metodoFichajeId?: number | null;
}

export interface PerfilDTO {
  nombre: string;
  apellidos: string;
  email: string;
  fotoPerfil?: string | null;
}

export interface RolAsignableDTO {
  id: number;
  nombre: string;
}