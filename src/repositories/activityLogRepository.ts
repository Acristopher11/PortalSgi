import { supabase } from '../lib/supabaseClient';
import type { ActivityLog } from '../types';

const DEFAULT_ORG_ID = '1';

function mapToActivityLog(row: any): ActivityLog {
  return {
    id: String(row.id),
    usuario: row.usuario || 'Desconocido',
    accion: row.accion || 'Acción',
    elemento: row.elemento || 'General',
    detalle: row.detalle || '',
    fecha: new Date(row.created_at || Date.now()),
  };
}

export async function getAllLogs(token?: string): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('bitacora')
      .select('id, usuario, accion, elemento, detalle, created_at')
      .eq('organizacion_id', DEFAULT_ORG_ID)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      console.error('Error fetching activity logs from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToActivityLog);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}

export async function createLogItem(
  log: Omit<ActivityLog, 'id' | 'fecha'>,
  token?: string
): Promise<ActivityLog> {
  try {
    const { data, error } = await supabase
      .from('bitacora')
      .insert({
        usuario: log.usuario,
        accion: log.accion,
        elemento: log.elemento,
        detalle: log.detalle,
        organizacion_id: DEFAULT_ORG_ID,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapToActivityLog(data);
  } catch (error) {
    console.error('Error creating activity log item:', error);
    return {
      id: String(Date.now()),
      usuario: log.usuario,
      accion: log.accion,
      elemento: log.elemento,
      detalle: log.detalle,
      fecha: new Date(),
    };
  }
}
