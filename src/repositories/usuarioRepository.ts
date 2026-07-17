import { supabase } from '../lib/supabaseClient';
import type { SgiUsuario } from '../types';

const DEFAULT_ORG_ID = '1';

function mapToSgiUsuario(row: any): SgiUsuario {
  const areaObj = row.areas;
  return {
    id: String(row.id),
    nombre: row.nombre || '',
    email: row.email || '',
    rol: row.rol || 'Usuario',
    roles: row.roles || [row.rol || 'Usuario'],
    areaId: row.area_id ? String(row.area_id) : undefined,
    areaNombre: areaObj ? areaObj.nombre : undefined,
    activo: !!row.activo,
  };
}

export async function getAllUsuarios(token?: string): Promise<SgiUsuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, areas(nombre)')
      .eq('organizacion_id', DEFAULT_ORG_ID);

    if (error) {
      console.error('[usuarioRepository] Error fetching users from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToSgiUsuario);
  } catch (error) {
    console.error('[usuarioRepository] Error in getAllUsuarios:', error);
    return [];
  }
}

export async function getUsuariosByRol(rol: SgiUsuario['rol'], token?: string): Promise<SgiUsuario[]> {
  const users = await getAllUsuarios(token);
  return users.filter(u => u.rol === rol);
}

export async function upsertUsuario(
  usuario: Omit<SgiUsuario, 'id' | 'areaNombre'> & { id?: string },
  token?: string
): Promise<SgiUsuario> {
  try {
    const payload = {
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      roles: usuario.roles || [usuario.rol],
      area_id: usuario.areaId ? String(usuario.areaId) : null,
      activo: usuario.activo,
      organizacion_id: DEFAULT_ORG_ID,
    };

    let result;
    if (usuario.id && !usuario.id.startsWith('dyn-')) {
      const { data, error } = await supabase
        .from('usuarios')
        .upsert({ id: usuario.id, ...payload })
        .select('*, areas(nombre)')
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data: existing } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', usuario.email)
        .eq('organizacion_id', DEFAULT_ORG_ID)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('id', existing.id)
          .select('*, areas(nombre)')
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('usuarios')
          .insert(payload)
          .select('*, areas(nombre)')
          .single();
        if (error) throw error;
        result = data;
      }
    }
    return mapToSgiUsuario(result);
  } catch (error) {
    console.error('[usuarioRepository] Error upserting user:', error);
    throw error;
  }
}

export async function searchSharePointUsers(query: string, token?: string): Promise<{ email: string; name: string }[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('email, nombre')
      .eq('organizacion_id', DEFAULT_ORG_ID)
      .or(`nombre.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(50);

    if (error) {
      console.error('[usuarioRepository] Error searching users in Supabase:', error);
      const all = await getAllUsuarios(token);
      const q = query.toLowerCase();
      return all
        .filter(u => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        .map(u => ({ email: u.email, name: u.nombre }));
    }

    return (data || []).map(u => ({
      email: u.email,
      name: u.nombre
    }));
  } catch (err) {
    console.error('[usuarioRepository] Error in searchSharePointUsers:', err);
    return [];
  }
}
