export interface RegistroWebAuthnDTO {
  credential: unknown;
  label: string;
}

export interface AdminSistemaDTO {
  uuid: string;
  nombre: string;
  apellidos: string;
  email: string;
  estado: string;
}