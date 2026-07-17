import { supabase } from '../lib/supabaseClient';
import type { GlossaryTerm } from '../types';

const DEFAULT_ORG_ID = '1';

function mapToGlossaryTerm(row: any): GlossaryTerm {
  const processObj = row.procesos;
  const procesoAsociado = processObj ? (processObj.nombre || processObj.codigo) : undefined;
  
  return {
    id: String(row.id),
    termino: row.termino || '',
    definicion: row.definicion || '',
    procesoId: row.proceso_id ? String(row.proceso_id) : undefined,
    procesoAsociado,
  };
}

export async function getAllGlossaryTerms(token?: string): Promise<GlossaryTerm[]> {
  try {
    const { data, error } = await supabase
      .from('glosario')
      .select('*, procesos(nombre, codigo)')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('Error fetching glossary terms from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToGlossaryTerm);
  } catch (error) {
    console.error('Error fetching glossary terms:', error);
    return [];
  }
}

export async function createGlossaryTermItem(
  values: { termino: string; definicion: string; procesoId?: string },
  token?: string
): Promise<GlossaryTerm> {
  const { data, error } = await supabase
    .from('glosario')
    .insert({
      termino: values.termino,
      definicion: values.definicion,
      proceso_id: values.procesoId || null,
      organizacion_id: DEFAULT_ORG_ID,
    })
    .select('*, procesos(nombre, codigo)')
    .single();

  if (error) {
    console.error('Error creating glossary term:', error);
    throw error;
  }

  return mapToGlossaryTerm(data);
}

export async function updateGlossaryTermItem(
  id: number | string,
  values: { termino: string; definicion: string; procesoId?: string },
  token?: string
): Promise<void> {
  const { error } = await supabase
    .from('glosario')
    .update({
      termino: values.termino,
      definicion: values.definicion,
      proceso_id: values.procesoId || null,
    })
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('Error updating glossary term:', error);
    throw error;
  }
}

export async function deleteGlossaryTermItem(id: number | string, token?: string): Promise<void> {
  const { error } = await supabase
    .from('glosario')
    .delete()
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (error) {
    console.error('Error deleting glossary term:', error);
    throw error;
  }
}
