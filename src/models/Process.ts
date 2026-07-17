import type { Process as BaseProcess } from '../types';

export type Process = BaseProcess;

export type ProcessFormValues = {
  codigo: string;
  nombre: string;
  descripcion: string;
  alcance: string;
  responsable: string;
  area: string;
  areaId?: string | number;   // ID numérico del área en SharePoint (para sgi_AreaLookupId)
  tipoProceso?: string;
  estado?: string;
  objetivosIds?: number[];
};
