export interface MetodoFichajeDTO {
  id?: number;
  codigoMetodo: string;
  nombre?: string | null;
  activo?: boolean | null;
  empresaId?: number | null;
}