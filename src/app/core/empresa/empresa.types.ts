export interface EmpresaDTO {
  id?: number;
  logoUrl?: string | null;

  nombre: string;
  limiteUsuarios: number;
  jornadaMinutos: number;

  pausaMinutos?: number | null;
  activa?: boolean | null;

  latitud: number;
  longitud: number;
  radioFichaje: number;
}