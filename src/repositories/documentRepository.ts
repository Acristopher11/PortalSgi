import { supabase } from '../lib/supabaseClient';
import type { DocumentItem } from '../types';

const DEFAULT_ORG_ID = '1';

function mapToDocumentItem(row: any): DocumentItem {
  if (!row) return {} as any;
  const processObj = row.procesos;
  const procesoAsociado = processObj ? (processObj.nombre || processObj.codigo) : undefined;
  const publicUrl = row.storage_path
    ? supabase.storage.from('documentos').getPublicUrl(row.storage_path).data.publicUrl
    : '';

  return {
    id: String(row.id),
    nombre: row.nombre || 'Sin nombre',
    codigo: row.codigo || '',
    version: Number(row.version || 1),
    fechaPublicacion: new Date(row.fecha_publicacion || row.created_at || Date.now()),
    procesoId: row.proceso_id ? String(row.proceso_id) : undefined,
    procesoAsociado,
    tipoDocumento: row.tipo_documento || undefined,
    link: publicUrl,
    fullPath: row.storage_path || '',
    esCarpeta: !!row.es_carpeta,
  };
}

export async function getAllDocuments(token?: string): Promise<DocumentItem[]> {
  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('*, procesos(nombre, codigo)')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('[documentRepository] Error fetching documents from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToDocumentItem);
  } catch (error) {
    console.error('[documentRepository] Error fetching documents:', error);
    return [];
  }
}

export async function uploadDocumentItem(
  file: File,
  metadata: { codigo: string; version: number; procesoId?: string },
  token?: string
): Promise<DocumentItem> {
  const folder = metadata.procesoId ? `${metadata.procesoId}/` : '';
  const storagePath = `${folder}${Date.now()}_${file.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documentos')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('[documentRepository] Error uploading file to Supabase Storage:', uploadError);
    throw uploadError;
  }

  const { data: insertData, error: insertError } = await supabase
    .from('documentos')
    .insert({
      nombre: file.name,
      codigo: metadata.codigo,
      version: metadata.version,
      fecha_publicacion: new Date().toISOString(),
      proceso_id: metadata.procesoId || null,
      tipo_documento: null,
      storage_path: storagePath,
      es_carpeta: false,
      organizacion_id: DEFAULT_ORG_ID
    })
    .select('*, procesos(nombre, codigo)')
    .single();

  if (insertError) {
    console.error('[documentRepository] Error inserting document metadata:', insertError);
    throw insertError;
  }

  return mapToDocumentItem(insertData);
}

export async function updateDocumentItem(
  id: string | number,
  metadata: { codigo: string; version: number; procesoId?: string },
  token?: string
): Promise<void> {
  const payload: Record<string, any> = {
    codigo: metadata.codigo,
    version: metadata.version,
    fecha_publicacion: new Date().toISOString(),
  };

  if (metadata.procesoId) {
    payload.proceso_id = String(metadata.procesoId);
  } else {
    payload.proceso_id = null;
  }

  const { error } = await supabase
    .from('documentos')
    .update(payload)
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('[documentRepository] Error updating document:', error);
    throw error;
  }
}

export async function deleteDocumentItem(id: number | string, token?: string): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('documentos')
    .select('storage_path')
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID)
    .single();

  if (fetchError || !data) {
    console.error('[documentRepository] Error fetching document to delete:', fetchError);
    return;
  }

  if (data.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('documentos')
      .remove([data.storage_path]);
    if (storageError) {
      console.warn('[documentRepository] Warning: failed to delete file from storage:', storageError);
    }
  }

  const { error: dbError } = await supabase
    .from('documentos')
    .delete()
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (dbError) {
    console.error('[documentRepository] Error deleting document metadata:', dbError);
    throw dbError;
  }
}
