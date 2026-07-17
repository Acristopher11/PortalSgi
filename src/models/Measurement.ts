import type { KPIMeasurement as BaseKPIMeasurement } from '../types';

export interface Measurement extends BaseKPIMeasurement {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  recordedBy: string;
}

export type MeasurementFormValues = {
  kpiId: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  value: number;
  comment: string;
};
