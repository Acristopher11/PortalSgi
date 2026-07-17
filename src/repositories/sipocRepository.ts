import { supabase } from '../lib/supabaseClient';
import type { SIPOCItem } from '../types';

const DEFAULT_ORG_ID = '1';

function mapToSIPOCItem(row: any): SIPOCItem {
  return {
    id: String(row.id),
    actividad: row.actividad || '',
    procesoId: String(row.proceso_id || ''),
    proveedores: row.proveedores || '',
    insumos: row.insumos || '',
    productos: row.productos || '',
    cliente: row.cliente || '',
  };
}

export async function getSipocByProcessId(processId: string, token?: string): Promise<SIPOCItem[]> {
  try {
    const { data, error } = await supabase
      .from('sipoc')
      .select('*')
      .eq('proceso_id', processId)
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('Error fetching SIPOC items from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToSIPOCItem);
  } catch (error) {
    console.error('Error fetching SIPOC items:', error);
    return [];
  }
}

export async function createSipocItem(
  values: { actividad: string; procesoId: string; proveedores?: string; insumos?: string; productos?: string; cliente?: string },
  token?: string
): Promise<SIPOCItem> {
  const { data, error } = await supabase
    .from('sipoc')
    .insert({
      actividad: values.actividad,
      proceso_id: values.procesoId,
      proveedores: values.proveedores || '',
      insumos: values.insumos || '',
      productos: values.productos || '',
      cliente: values.cliente || '',
      organizacion_id: DEFAULT_ORG_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating SIPOC item:', error);
    throw error;
  }

  return mapToSIPOCItem(data);
}

export async function updateSipocItem(
  id: string,
  values: Partial<{ actividad: string; proveedores: string; insumos: string; productos: string; cliente: string }>,
  token?: string
): Promise<void> {
  const payload: Record<string, any> = {};
  if (values.actividad !== undefined) payload.actividad = values.actividad;
  if (values.proveedores !== undefined) payload.proveedores = values.proveedores;
  if (values.insumos !== undefined) payload.insumos = values.insumos;
  if (values.productos !== undefined) payload.productos = values.productos;
  if (values.cliente !== undefined) payload.cliente = values.cliente;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from('sipoc')
      .update(payload)
      .eq('id', String(id))
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('Error updating SIPOC item:', error);
      throw error;
    }
  }
}

export async function deleteSipocItem(id: string, token?: string): Promise<void> {
  const { error } = await supabase
    .from('sipoc')
    .delete()
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('Error deleting SIPOC item:', error);
    throw error;
  }
}
