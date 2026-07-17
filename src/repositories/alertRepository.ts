import { supabase } from '../lib/supabaseClient';
import type { NotificationAlert } from '../types';

const DEFAULT_ORG_ID = '1';

function mapToNotificationAlert(row: any): NotificationAlert {
  return {
    id: String(row.id),
    usuario: row.usuario || '',
    mensaje: row.mensaje || '',
    leida: !!row.leida,
    fecha: new Date(row.created_at || Date.now()),
    link: row.link || undefined,
  };
}

export async function getUserAlerts(email: string, token?: string): Promise<NotificationAlert[]> {
  try {
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .eq('usuario', email)
      .eq('organizacion_id', DEFAULT_ORG_ID)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching alerts from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToNotificationAlert);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

export async function createAlert(
  alert: Omit<NotificationAlert, 'id' | 'fecha' | 'leida'>,
  token?: string
): Promise<NotificationAlert> {
  try {
    const { data, error } = await supabase
      .from('alertas')
      .insert({
        usuario: alert.usuario,
        mensaje: alert.mensaje,
        leida: false,
        link: alert.link || null,
        organizacion_id: DEFAULT_ORG_ID,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapToNotificationAlert(data);
  } catch (error) {
    console.error('Error creating alert:', error);
    return {
      id: String(Date.now()),
      usuario: alert.usuario,
      mensaje: alert.mensaje,
      leida: false,
      fecha: new Date(),
      link: alert.link,
    };
  }
}

export async function markAlertRead(id: string | number, token?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('alertas')
      .update({ leida: true })
      .eq('id', String(id))
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error marking alert as read:', error);
    throw error;
  }
}

export async function markAllAlertsRead(email: string, token?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('alertas')
      .update({ leida: true })
      .eq('usuario', email)
      .eq('leida', false)
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    throw error;
  }
}
