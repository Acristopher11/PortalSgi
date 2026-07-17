import type { KPI as BaseKPI } from '../types';

export interface KPI extends BaseKPI {
  frequency?: 'monthly' | 'quarterly' | 'annual';
}

export type KPIFormValues = {
  nombre: string;
  descripcion: string;
  meta: number;
  unidad: string;
  frecuencia: 'monthly' | 'quarterly' | 'annual';
  area: string; // Used as processId in current implementation
};

export type KPIStatus = 'on_track' | 'at_risk' | 'off_track' | 'no_data';

export type KPIWithStatus = KPI & {
  status: KPIStatus;
  currentValue: number | null;
};
