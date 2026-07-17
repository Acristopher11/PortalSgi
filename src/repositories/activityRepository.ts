import { supabase } from '../lib/supabaseClient';
import type { ProcessActivity } from '../types';

const DEFAULT_ORG_ID = '1';

function mapToProcessActivity(row: any): ProcessActivity {
  return {
    id: String(row.id),
    procesoId: String(row.proceso_id || ''),
    entrada: row.entrada || '',
    actividad: row.actividad || '',
    descripcion: row.descripcion || '',
    salida: row.salida || '',
    responsable: row.responsable || '',
  };
}

export async function getActivitiesByProcessId(processId: string, token?: string): Promise<ProcessActivity[]> {
  try {
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('proceso_id', processId)
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('[activityRepository] Error fetching activities:', error);
      return [];
    }

    return (data || []).map(mapToProcessActivity);
  } catch (error) {
    console.error('[activityRepository] Error fetching activities:', error);
    return [];
  }
}

export async function createActivityItem(
  values: Omit<ProcessActivity, 'id'>,
  token?: string
): Promise<ProcessActivity> {
  const { data, error } = await supabase
    .from('actividades')
    .insert({
      proceso_id: values.procesoId,
      actividad: values.actividad,
      descripcion: values.descripcion || '',
      entrada: values.entrada || '',
      salida: values.salida || '',
      responsable: values.responsable || '',
      organizacion_id: DEFAULT_ORG_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('[activityRepository] Error creating activity:', error);
    throw error;
  }

  return mapToProcessActivity(data);
}

export async function updateActivityItem(
  id: string | number,
  values: Partial<Omit<ProcessActivity, 'id' | 'procesoId'>>,
  token?: string
): Promise<void> {
  const payload: any = {};
  if (values.actividad !== undefined) payload.actividad = values.actividad;
  if (values.entrada !== undefined) payload.entrada = values.entrada;
  if (values.salida !== undefined) payload.salida = values.salida;
  if (values.responsable !== undefined) payload.responsable = values.responsable;
  if (values.descripcion !== undefined) payload.descripcion = values.descripcion;

  const { error } = await supabase
    .from('actividades')
    .update(payload)
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('[activityRepository] Error updating activity:', error);
    throw error;
  }
}

export async function deleteActivityItem(id: string | number, token?: string): Promise<void> {
  const { error } = await supabase
    .from('actividades')
    .delete()
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('[activityRepository] Error deleting activity:', error);
    throw error;
  }
}
