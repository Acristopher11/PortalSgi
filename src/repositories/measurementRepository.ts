import { supabase } from '../lib/supabaseClient';
import type { Measurement, MeasurementFormValues } from '../models/Measurement';

const DEFAULT_ORG_ID = '1';

function mapMonthNameToQuarter(monthName?: string): string {
  if (!monthName) return 'Q1';
  const clean = monthName.toLowerCase().trim();
  switch (clean) {
    case 'enero':
    case 'febrero':
    case 'marzo':
      return 'Q1';
    case 'abril':
    case 'mayo':
    case 'junio':
      return 'Q2';
    case 'julio':
    case 'agosto':
    case 'septiembre':
      return 'Q3';
    case 'octubre':
    case 'noviembre':
    case 'diciembre':
      return 'Q4';
    default:
      return 'Q1';
  }
}

function mapToMeasurement(row: any): Measurement {
  const monthName = row.mes || 'marzo';
  const quarter = row.trimestre || mapMonthNameToQuarter(monthName);
  
  let val: number | null = null;
  if (row.valor !== undefined && row.valor !== null) {
    val = parseFloat(row.valor);
  }
  
  return {
    id: String(row.id),
    kpi_id: String(row.indicador_id ?? '0'),
    quarter: quarter as Measurement['quarter'],
    year: Number(row.anio ?? 0),
    valor: val,
    comentarios: row.comentarios ?? '',
    fecha: new Date(row.fecha || row.created_at || Date.now()),
    recordedBy: row.autor ?? 'Desconocido',
  };
}

export async function getMeasurements(
  token?: string,
  kpiId?: string,
  year?: number
): Promise<Measurement[]> {
  try {
    let query = supabase
      .from('mediciones')
      .select('*')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (kpiId) {
      query = query.eq('indicador_id', kpiId);
    }
    if (year) {
      query = query.eq('anio', year);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching measurements from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToMeasurement);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return [];
  }
}

export async function createMeasurementItem(
  values: MeasurementFormValues,
  token?: string
): Promise<number> {
  const monthName = values.quarter === 'Q1' ? 'marzo' : values.quarter === 'Q2' ? 'junio' : values.quarter === 'Q3' ? 'septiembre' : 'diciembre';
  const isNA = values.comment.toUpperCase().trim() === 'N/A' || values.comment.toUpperCase().trim() === 'NA';
  const rawValue = isNA ? 1.0 : (values.value !== null ? values.value / 100 : 0);

  let autor = 'Usuario SGI';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
      autor = user.email;
    }
  } catch (e) {
    console.warn('Failed to retrieve current user auth info for measurement author', e);
  }

  const { data, error } = await supabase
    .from('mediciones')
    .insert({
      indicador_id: values.kpiId,
      mes: monthName,
      anio: values.year,
      valor: rawValue,
      comentarios: values.comment,
      trimestre: values.quarter,
      autor: autor,
      fecha: new Date().toISOString().split('T')[0],
      organizacion_id: DEFAULT_ORG_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating measurement:', error);
    throw error;
  }

  try {
    const { error: updateError } = await supabase
      .from('indicadores')
      .update({
        resultado_actual: rawValue,
      })
      .eq('id', values.kpiId)
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (updateError) {
      console.warn('Warning: Failed to update actual result in indicadores table:', updateError);
    }
  } catch (e) {
    console.error('Failed to update result on indicators:', e);
  }

  return Number(data.id);
}
