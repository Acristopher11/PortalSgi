import { supabase } from '../lib/supabaseClient';
import type { Process, ProcessFormValues } from '../models/Process';

const DEFAULT_ORG_ID = '1';

function mapToProcess(row: any): Process {
  if (!row) {
    return {
      id: '',
      nombre: 'Error al mapear item vacío',
      codigo: 'ERR',
      descripcion: '',
      alcance: '',
      responsable: 'Sin asignar',
      responsableEmails: [],
      area: 'General',
      estado: 'inactivo',
      fecha_creacion: new Date(),
      tipoProceso: 'Operativo',
      objetivosIds: [],
    };
  }

  const estadoValue = row.estado || 'activo';
  const mappedEstado = estadoValue === 'inactivo' ? 'inactivo' as const : estadoValue === 'en_revision' ? 'en_revision' as const : 'activo' as const;

  return {
    id: String(row.id),
    nombre: row.nombre || '',
    codigo: row.codigo || '',
    descripcion: row.descripcion || '',
    alcance: row.alcance || '',
    responsable: row.responsable || 'Sin asignar',
    responsableEmails: row.responsable_emails || [],
    area: row.area || 'General',
    estado: mappedEstado,
    fecha_creacion: new Date(row.created_at || Date.now()),
    tipoProceso: row.tipo_proceso || 'Operativo',
    objetivosIds: row.objetivo_ids || [],
  };
}

export async function getAllProcesses(token?: string): Promise<Process[]> {
  try {
    const { data, error } = await supabase
      .from('procesos')
      .select('*')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('[processRepository] Error fetching processes from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToProcess);
  } catch (err) {
    console.error('[processRepository] Could not fetch processes:', err);
    return [];
  }
}

export async function createProcessItem(values: ProcessFormValues, token?: string): Promise<Process> {
  let resolvedArea = values.area || 'General';
  
  if (values.areaId) {
    try {
      const { data: areaData } = await supabase
        .from('areas')
        .select('nombre')
        .eq('id', String(values.areaId))
        .eq('organizacion_id', DEFAULT_ORG_ID)
        .single();
      if (areaData && areaData.nombre) {
        resolvedArea = areaData.nombre;
      }
    } catch (e) {
      console.warn('Failed to resolve area name for process create', e);
    }
  }

  const emails = values.responsable
    ? values.responsable
        .split(/[,;]/)
        .map((e: string) => e.trim().toLowerCase())
        .filter((e: string) => e.includes('@') && e.length > 3)
    : [];

  const mappedEstado = values.estado === 'inactivo' ? 'inactivo' : values.estado === 'en_revision' ? 'en_revision' : 'activo';

  const { data, error } = await supabase
    .from('procesos')
    .insert({
      nombre: values.nombre,
      codigo: values.codigo,
      descripcion: values.descripcion || '',
      alcance: values.alcance || '',
      responsable: values.responsable || 'Sin asignar',
      responsable_emails: emails,
      area: resolvedArea,
      estado: mappedEstado,
      tipo_proceso: values.tipoProceso || 'Operativo',
      objetivo_ids: values.objetivosIds || [],
      organizacion_id: DEFAULT_ORG_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('[processRepository] Error creating process:', error);
    throw error;
  }

  return mapToProcess(data);
}

export async function updateProcessItem(id: number | string, values: ProcessFormValues, token?: string): Promise<void> {
  const payload: any = {};
  if (values.nombre !== undefined) payload.nombre = values.nombre;
  if (values.codigo !== undefined) payload.codigo = values.codigo;
  if (values.descripcion !== undefined) payload.descripcion = values.descripcion;
  if (values.alcance !== undefined) payload.alcance = values.alcance;
  if (values.tipoProceso !== undefined) payload.tipo_proceso = values.tipoProceso;
  if (values.estado !== undefined) {
    payload.estado = values.estado === 'inactivo' ? 'inactivo' : values.estado === 'en_revision' ? 'en_revision' : 'activo';
  }
  if (values.objetivosIds !== undefined) payload.objetivo_ids = values.objetivosIds;

  if (values.areaId !== undefined) {
    if (values.areaId) {
      try {
        const { data: areaData } = await supabase
          .from('areas')
          .select('nombre')
          .eq('id', String(values.areaId))
          .eq('organizacion_id', DEFAULT_ORG_ID)
          .single();
        if (areaData && areaData.nombre) {
          payload.area = areaData.nombre;
        }
      } catch (e) {
        console.warn('Failed to resolve area name for process update', e);
      }
    } else {
      payload.area = values.area || 'General';
    }
  } else if (values.area !== undefined) {
    payload.area = values.area;
  }

  if (values.responsable !== undefined) {
    payload.responsable = values.responsable || 'Sin asignar';
    const emails = values.responsable
      ? values.responsable
          .split(/[,;]/)
          .map((e: string) => e.trim().toLowerCase())
          .filter((e: string) => e.includes('@') && e.length > 3)
      : [];
    payload.responsable_emails = emails;
  }

  const { error } = await supabase
    .from('procesos')
    .update(payload)
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('[processRepository] Error updating process:', error);
    throw error;
  }
}

export async function deleteProcessItem(id: number | string, token?: string): Promise<void> {
  const { error } = await supabase
    .from('procesos')
    .delete()
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('[processRepository] Error deleting process:', error);
    throw error;
  }
}
