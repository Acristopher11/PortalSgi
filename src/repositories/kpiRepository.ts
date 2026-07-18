import { supabase } from '../lib/supabaseClient';
import type { KPI, KPIFormValues } from '../models/KPI';

const DEFAULT_ORG_ID = '1';

function calculateKPIStatus(actual: number | null, meta: number | null): 'on_track' | 'at_risk' | 'off_track' | 'no_data' {
  if (actual === null || actual === undefined) return 'no_data';
  if (!meta || meta === 0) return 'off_track';
  const cumplimiento = (actual / meta) * 100;
  if (cumplimiento >= 90) return 'on_track';
  if (cumplimiento >= 70) return 'at_risk';
  return 'off_track';
}

function mapToKPI(row: any): KPI {
  let meta = row.meta || 0;
  let actual = row.resultado_actual || 0;

  // Adapt to potential 0-1 scale mapping from SharePoint history
  if (meta > 0 && meta <= 1) {
    meta = meta * 100;
  }
  if (actual > 0 && actual <= 1) {
    actual = actual * 100;
  }

  const processObj = row.procesos;
  const areaName = processObj ? (processObj.nombre || processObj.codigo) : 'General';

  const dbMediciones = row.mediciones || [];
  const mappedMediciones = dbMediciones.map((m: any) => {
    let mVal = m.valor !== null ? Number(m.valor) : null;
    if (mVal !== null && mVal > 0 && mVal <= 1) {
      mVal = mVal * 100;
    }
    return {
      id: String(m.id),
      kpi_id: String(m.indicador_id),
      valor: mVal,
      fecha: new Date(m.fecha || m.created_at || Date.now()),
      comentarios: m.comentarios,
      mes: m.mes,
      anio: m.anio,
      trimestre: m.trimestre,
    };
  });

  return {
    id: String(row.id),
    nombre: row.nombre ?? '',
    descripcion: row.descripcion ?? '',
    meta: meta,
    valor_actual: actual,
    unidad: row.unidad || '%',
    responsable: row.responsable || 'Sin asignar',
    area: areaName,
    fecha_ultima_actualizacion: new Date(row.updated_at || row.created_at || Date.now()),
    estado: calculateKPIStatus(actual, meta),
    tendencia: 'stable',
    frequency: 'quarterly',
    processId: row.proceso_id ? String(row.proceso_id) : undefined,
    periodicidad: row.periodicidad || 'Trimestral',
    mediciones: mappedMediciones,
  };
}

export async function getAllKPIs(token?: string): Promise<KPI[]> {
  try {
    const { data, error } = await supabase
      .from('indicadores')
      .select('*, procesos(nombre, codigo), mediciones(*)')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('Error fetching KPIs from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToKPI);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return [];
  }
}

export async function createKPIItem(values: KPIFormValues, token?: string): Promise<KPI> {
  const meta = values.meta > 1 ? values.meta / 100 : values.meta;
  
  const { data, error } = await supabase
    .from('indicadores')
    .insert({
      nombre: values.nombre,
      descripcion: values.descripcion,
      meta: meta,
      unidad: values.unidad || '%',
      proceso_id: values.area ? String(values.area) : null,
      periodicidad: values.frecuencia === 'monthly' ? 'Mensual' : values.frecuencia === 'annual' ? 'Anual' : 'Trimestral',
      organizacion_id: DEFAULT_ORG_ID,
    })
    .select('*, procesos(nombre, codigo)')
    .single();

  if (error) {
    console.error('Error creating KPI:', error);
    throw error;
  }

  return mapToKPI(data);
}

export async function updateKPIItem(id: number | string, values: KPIFormValues, token?: string): Promise<void> {
  const meta = values.meta > 1 ? values.meta / 100 : values.meta;
  
  const { error } = await supabase
    .from('indicadores')
    .update({
      nombre: values.nombre,
      descripcion: values.descripcion,
      meta: meta,
      unidad: values.unidad || '%',
      proceso_id: values.area ? String(values.area) : null,
      periodicidad: values.frecuencia === 'monthly' ? 'Mensual' : values.frecuencia === 'annual' ? 'Anual' : 'Trimestral',
    })
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('Error updating KPI:', error);
    throw error;
  }
}

export async function deleteKPIItem(id: number | string, token?: string): Promise<void> {
  const { error } = await supabase
    .from('indicadores')
    .delete()
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('Error deleting KPI:', error);
    throw error;
  }
}
