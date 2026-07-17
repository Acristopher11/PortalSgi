import type { Risk as BaseRisk } from '../types';

export type Risk = BaseRisk;

export type RiskFormValues = {
  nombre: string;
  descripcion: string;
  probabilidad: 1 | 2 | 3; // 1: Baja, 2: Moderada, 3: Alta
  impacto: 1 | 2 | 3;      // 1: Bajo, 2: Moderado, 3: Alto
  responsable: string;
  proceso_asociado: string;
  estado?: string;
  tipo_riesgo?: string;
  plan_mitigacion?: string;
  procesoId?: string;
  // Campos de Control y Exposición adicionales
  vpd?: number;
  vo?: number;
  ve?: number;
  origen?: string;
  consecuencia?: string;
  control?: string;
  responsables?: string;
  pa_asoc?: string;
};
