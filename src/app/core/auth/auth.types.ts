export interface AuthDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string | null;
  tipoToken: string;
  expiraEn: number;
  usuarioUuid: string;
  nombre: string;
  rol: string;
  cambioPasswordObligatorio: boolean;
}

export interface PrimerAccesoDTO {
  nuevaPassword: string;
  confirmarPassword: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface SolicitarRecuperacionDTO {
  email: string;
}

export interface RestablecerPasswordDTO {
  token: string;
  codigo: string;
  nuevaPassword: string;
  confirmarPassword: string;
}
