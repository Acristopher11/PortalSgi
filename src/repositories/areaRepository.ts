import { supabase } from '../lib/supabaseClient';
import type { Area } from '../types';

const DEFAULT_ORG_ID = '1';

function mapNivelToFrontend(nivel: string | null): any {
  if (!nivel) return undefined;
  switch (nivel) {
    case 'Seccion': return 'Sección';
    case 'Division': return 'División';
    case 'Departamento': return 'Departamento';
    case 'Direccion': return 'Dirección';
    case 'Area': return 'Área';
    default: return nivel;
  }
}

function mapNivelToDb(nivel: string | null | undefined): 'Seccion' | 'Division' | 'Departamento' | 'Direccion' | 'Area' | null {
  if (!nivel) return null;
  switch (nivel) {
    case 'Sección': return 'Seccion';
    case 'División': return 'Division';
    case 'Departamento': return 'Departamento';
    case 'Dirección': return 'Direccion';
    case 'Área': return 'Area';
    default: {
      if (['Seccion', 'Division', 'Departamento', 'Direccion', 'Area'].includes(nivel)) {
        return nivel as any;
      }
      return null;
    }
  }
}

export async function getAllAreas(token?: string): Promise<Area[]> {
  try {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('[areaRepository] Error fetching areas from Supabase:', error);
      return [];
    }

    const rows = data || [];
    const rowMap = new Map(rows.map(r => [String(r.id), r]));

    return rows.map(row => {
      let dependenciaNombre: string | undefined = undefined;
      if (row.dependencia_id) {
        const parent = rowMap.get(String(row.dependencia_id));
        if (parent) {
          dependenciaNombre = parent.nombre;
        }
      }

      return {
        id: String(row.id),
        nombre: row.nombre || '',
        codigo: row.codigo || '',
        responsable: row.responsable || 'Sin asignar',
        responsableEmail: row.responsable_email || undefined,
        nivel: mapNivelToFrontend(row.nivel),
        dependencia: dependenciaNombre,
        dependenciaId: row.dependencia_id ? String(row.dependencia_id) : undefined,
      };
    });
  } catch (error) {
    console.error('[areaRepository] Error fetching areas:', error);
    return [];
  }
}

export async function getAreaById(id: string, token?: string): Promise<Area | undefined> {
  const areas = await getAllAreas(token);
  return areas.find(a => a.id === id);
}

export async function getAreasByNivel(nivel: string, token?: string): Promise<Area[]> {
  const areas = await getAllAreas(token);
  return areas.filter(a => a.nivel?.toLowerCase() === nivel.toLowerCase());
}

export async function updateArea(
  id: string,
  values: { nivel?: string; dependenciaId?: string; responsable?: string; responsableEmail?: string },
  token?: string
): Promise<void> {
  const payload: any = {};
  if (values.nivel !== undefined) {
    payload.nivel = mapNivelToDb(values.nivel);
  }
  if (values.dependenciaId !== undefined) {
    payload.dependencia_id = values.dependenciaId ? String(values.dependenciaId) : null;
  }
  if (values.responsableEmail !== undefined) {
    payload.responsable_email = values.responsableEmail || null;
  }
  if (values.responsable !== undefined) {
    payload.responsable = values.responsable || null;
  }

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from('areas')
      .update(payload)
      .eq('id', String(id))
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('[areaRepository] Error updating area:', error);
      throw error;
    }
  }
}
