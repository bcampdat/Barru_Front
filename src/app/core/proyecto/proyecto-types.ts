export interface Proyecto {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFinEstimada: string;
  fechaFin: string | null;
  empresaId: number;
}

export interface CrearProyectoRequest {
  nombre: string;
  fechaInicio: string;
  fechaFinEstimada: string;
}