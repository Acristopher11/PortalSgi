import { supabase } from '../lib/supabaseClient';
import type { QualityObjective } from '../types';

const DEFAULT_ORG_ID = '1';

function mapToObjective(row: any): QualityObjective {
  return {
    id: String(row.id),
    codigo: row.codigo || '',
    nombre: row.nombre || '',
    meta: row.meta !== null && row.meta !== undefined ? Number(row.meta) : 90,
  };
}

export async function getAllObjetivos(token?: string): Promise<QualityObjective[]> {
  try {
    const { data, error } = await supabase
      .from('objetivos')
      .select('*')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('[objetivoRepository] Error fetching objectives from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToObjective);
  } catch (error) {
    console.error('[objetivoRepository] Error fetching objectives:', error);
    return [];
  }
}

export async function createObjetivoItem(values: Omit<QualityObjective, 'id'>, token?: string): Promise<QualityObjective> {
  const { data, error } = await supabase
    .from('objetivos')
    .insert({
      nombre: values.nombre,
      codigo: values.codigo,
      meta: values.meta ?? 90,
      organizacion_id: DEFAULT_ORG_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('[objetivoRepository] Error creating objective:', error);
    throw error;
  }

  return mapToObjective(data);
}

export async function updateObjetivoItem(id: number | string, values: Partial<QualityObjective>, token?: string): Promise<void> {
  const payload: any = {};
  if (values.nombre !== undefined) payload.nombre = values.nombre;
  if (values.codigo !== undefined) payload.codigo = values.codigo;
  if (values.meta !== undefined) payload.meta = values.meta;

  const { error } = await supabase
    .from('objetivos')
    .update(payload)
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('[objetivoRepository] Error updating objective:', error);
    throw error;
  }
}

export async function deleteObjetivoItem(id: number | string, token?: string): Promise<void> {
  const { error } = await supabase
    .from('objetivos')
    .delete()
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('[objetivoRepository] Error deleting objective:', error);
    throw error;
  }
}
