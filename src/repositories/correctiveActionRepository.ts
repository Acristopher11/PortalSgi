import { supabase } from '../lib/supabaseClient';
import type { CorrectiveAction } from '../types';

const DEFAULT_ORG_ID = '1';

function mapToCorrectiveAction(row: any): CorrectiveAction {
  const processObj = row.procesos;
  const procesoAsociado = processObj ? (processObj.nombre || processObj.codigo) : row.proceso_asociado;
  
  return {
    id: String(row.id),
    nombre: row.nombre || '',
    procesoId: row.proceso_id ? String(row.proceso_id) : undefined,
    procesoAsociado: procesoAsociado || '',
    origen: row.origen || '',
    hallazgo: row.hallazgo || '',
    acciones: row.acciones || '',
    responsable: row.responsable || '',
    fechaCompromiso: row.fecha_compromiso || undefined,
    fechaSeguimiento: row.fecha_seguimiento || undefined,
    fechaImplementacion: row.fecha_implementacion || undefined,
    fechaVerificacion: row.fecha_verificacion || undefined,
    estado: row.estado || 'Abierta',
    categorizacion: row.categorizacion || '',
    norma: row.norma || '',
    requisitos: row.requisitos || '',
  };
}

export async function getAllCorrectiveActions(token?: string): Promise<CorrectiveAction[]> {
  try {
    const { data, error } = await supabase
      .from('acciones_correctivas')
      .select('*, procesos(nombre, codigo)')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('Error fetching corrective actions from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToCorrectiveAction);
  } catch (error) {
    console.error('Error fetching corrective actions:', error);
    return [];
  }
}

export async function createCorrectiveActionItem(values: any, token?: string): Promise<CorrectiveAction> {
  const { data, error } = await supabase
    .from('acciones_correctivas')
    .insert({
      nombre: values.nombre,
      proceso_id: values.procesoId || null,
      proceso_asociado: values.procesoAsociado || null,
      origen: values.origen,
      hallazgo: values.hallazgo,
      acciones: values.acciones,
      responsable: values.responsable,
      fecha_compromiso: values.fechaCompromiso || null,
      fecha_seguimiento: values.fechaSeguimiento || null,
      fecha_implementacion: values.fechaImplementacion || null,
      fecha_verificacion: values.fechaVerificacion || null,
      estado: values.estado || 'Abierta',
      categorizacion: values.categorizacion || null,
      norma: values.norma || null,
      requisitos: values.requisitos || null,
      organizacion_id: DEFAULT_ORG_ID,
    })
    .select('*, procesos(nombre, codigo)')
    .single();

  if (error) {
    console.error('Error creating corrective action:', error);
    throw error;
  }

  return mapToCorrectiveAction(data);
}

export async function updateCorrectiveActionItem(id: number | string, values: any, token?: string): Promise<void> {
  const { error } = await supabase
    .from('acciones_correctivas')
    .update({
      nombre: values.nombre,
      proceso_id: values.procesoId || null,
      proceso_asociado: values.procesoAsociado || null,
      origen: values.origen,
      hallazgo: values.hallazgo,
      acciones: values.acciones,
      responsable: values.responsable,
      fecha_compromiso: values.fechaCompromiso || null,
      fecha_seguimiento: values.fechaSeguimiento || null,
      fecha_implementacion: values.fechaImplementacion || null,
      fecha_verificacion: values.fechaVerificacion || null,
      estado: values.estado || 'Abierta',
      categorizacion: values.categorizacion || null,
      norma: values.norma || null,
      requisitos: values.requisitos || null,
    })
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('Error updating corrective action:', error);
    throw error;
  }
}

export async function deleteCorrectiveActionItem(id: number | string, token?: string): Promise<void> {
  const { error } = await supabase
    .from('acciones_correctivas')
    .delete()
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('Error deleting corrective action:', error);
    throw error;
  }
}
