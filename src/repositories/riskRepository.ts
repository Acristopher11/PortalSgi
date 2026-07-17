import { supabase } from '../lib/supabaseClient';
import type { Risk, RiskFormValues } from '../models/Risk';

const DEFAULT_ORG_ID = '1';

// Helper functions to map numbers back to choices
export const mapVpdToPeriodicidad = (val: number): string => {
  if (val === 3) return 'Permanente';
  if (val === 2) return 'Periódico';
  if (val === 0.5) return 'Ocasional';
  return 'No Determinado';
};
export const mapVoToOportunidad = (val: number): string => {
  if (val === 3) return 'Preventivo';
  if (val === 2) return 'Correctivo';
  if (val === 0.5) return 'Detectivo';
  return 'No Determinado';
};
export const mapVeToEjecucion = (val: number): string => {
  if (val === 3) return 'Automatizado';
  if (val === 2) return 'Semi Automatizado';
  if (val === 0.5) return 'Manual';
  return 'No Determinado';
};

function mapToRisk(row: any): Risk {
  const vp = Number(row.vp || 1);
  const vi = Number(row.vi || 1);
  const vnr = Number(row.vnr || (vp * vi));
  const vpd = Number(row.vpd || 0);
  const vo = Number(row.vo || 0);
  const ve = Number(row.ve || 0);
  const vcc = Number(row.vcc || ((vpd + vo + ve) / 3));
  const ver = Number(row.ver || (vnr - vcc));

  let level = 'Bajo';
  if (vnr >= 6) level = 'Alto';
  else if (vnr >= 4) level = 'Moderado';

  const probabilidad = (row.probabilidad || 1) as 1 | 2 | 3;
  const impacto = (row.impacto || 1) as 1 | 2 | 3;

  return {
    id: String(row.id),
    nombre: row.nombre || 'Sin nombre',
    descripcion: row.descripcion || '',
    probabilidad,
    impacto,
    responsable: row.responsable || 'Sin asignar',
    proceso_asociado: row.proceso_asociado || '',
    procesoId: row.proceso_id ? String(row.proceso_id) : undefined,
    estado: row.estado || 'No controlado',
    plan_mitigacion: row.plan_mitigacion || '',
    fecha_creacion: new Date(row.created_at || Date.now()),
    tipo_riesgo: row.tipo_riesgo || 'Operacional',
    nivel_riesgo: row.nivel_riesgo || level,
    exposicion_riesgo: row.exposicion_riesgo || ver,
    vp,
    vi,
    vnr,
    vpd,
    vo,
    ve,
    vcc,
    ver,
    responsables: row.responsables || '',
    pa_asoc: row.plan_mitigacion || '',
    control: row.control || '',
    periodicidad: row.periodicidad || '',
    oportunidad: row.oportunidad || '',
    ejecucion: row.ejecucion || '',
    fecha_implementacion: row.fecha_implementacion ? new Date(row.fecha_implementacion) : undefined,
  };
}

export async function getAllRisks(token?: string): Promise<Risk[]> {
  try {
    const { data, error } = await supabase
      .from('riesgos')
      .select('*')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('Error fetching risks from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToRisk);
  } catch (error) {
    console.error('Error fetching risks:', error);
    return [];
  }
}

export async function createRiskItem(values: RiskFormValues, token?: string): Promise<Risk> {
  const vnr = values.probabilidad * values.impacto;
  const vpd = values.vpd !== undefined ? values.vpd : 0;
  const vo = values.vo !== undefined ? values.vo : 0;
  const ve = values.ve !== undefined ? values.ve : 0;
  const vcc = (vpd + vo + ve) / 3;
  const ver = vnr - vcc;

  let level = 'Bajo';
  if (vnr >= 6) level = 'Alto';
  else if (vnr >= 4) level = 'Moderado';

  const { data, error } = await supabase
    .from('riesgos')
    .insert({
      nombre: values.nombre,
      descripcion: values.descripcion || '',
      probabilidad: values.probabilidad,
      impacto: values.impacto,
      responsable: values.responsable || 'Sin asignar',
      proceso_asociado: values.proceso_asociado || '',
      proceso_id: values.procesoId || null,
      estado: values.estado || 'No controlado',
      plan_mitigacion: values.plan_mitigacion || values.pa_asoc || '',
      tipo_riesgo: values.tipo_riesgo || 'Operacional',
      nivel_riesgo: level,
      exposicion_riesgo: ver,
      vp: values.probabilidad,
      vi: values.impacto,
      vnr,
      vpd,
      vo,
      ve,
      vcc,
      ver,
      responsables: values.responsable || '',
      control: values.control || '',
      periodicidad: mapVpdToPeriodicidad(vpd),
      oportunidad: mapVoToOportunidad(vo),
      ejecucion: mapVeToEjecucion(ve),
      organizacion_id: DEFAULT_ORG_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating risk:', error);
    throw error;
  }

  return mapToRisk(data);
}

export async function updateRiskItem(id: number | string, values: RiskFormValues, token?: string): Promise<void> {
  const vnr = values.probabilidad * values.impacto;
  const vpd = values.vpd !== undefined ? values.vpd : 0;
  const vo = values.vo !== undefined ? values.vo : 0;
  const ve = values.ve !== undefined ? values.ve : 0;
  const vcc = (vpd + vo + ve) / 3;
  const ver = vnr - vcc;

  let level = 'Bajo';
  if (vnr >= 6) level = 'Alto';
  else if (vnr >= 4) level = 'Moderado';

  const payload: any = {
    nombre: values.nombre,
    probabilidad: values.probabilidad,
    impacto: values.impacto,
    vp: values.probabilidad,
    vi: values.impacto,
    vnr,
    vpd,
    vo,
    ve,
    vcc,
    ver,
    tipo_riesgo: values.tipo_riesgo,
    estado: values.estado,
    responsable: values.responsable || 'Sin asignar',
    responsables: values.responsable || '',
    plan_mitigacion: values.plan_mitigacion || values.pa_asoc || '',
    control: values.control || '',
    periodicidad: mapVpdToPeriodicidad(vpd),
    oportunidad: mapVoToOportunidad(vo),
    ejecucion: mapVeToEjecucion(ve),
    nivel_riesgo: level,
    exposicion_riesgo: ver,
  };

  if (values.procesoId !== undefined) {
    payload.proceso_id = values.procesoId || null;
  }
  if (values.proceso_asociado !== undefined) {
    payload.proceso_asociado = values.proceso_asociado || '';
  }

  const { error } = await supabase
    .from('riesgos')
    .update(payload)
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('Error updating risk:', error);
    throw error;
  }
}

export async function deleteRiskItem(id: number | string, token?: string): Promise<void> {
  const { error } = await supabase
    .from('riesgos')
    .delete()
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('Error deleting risk:', error);
    throw error;
  }
}
