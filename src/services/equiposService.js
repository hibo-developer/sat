import { obtenerClienteSupabase } from './supabaseClient';

export async function listarEquipos() {
  const supabase = obtenerClienteSupabase();

  const { data, error } = await supabase
    .from('equipos')
    .select('id, cliente_id, nombre, marca, modelo, numero_serie, ultima_revision, clientes ( nombre )')
    .order('nombre', { ascending: true });

  if (error) {
    throw new Error(`No se pudieron obtener los equipos: ${error.message}`);
  }

  return data || [];
}

export async function crearEquipo(payload) {
  const supabase = obtenerClienteSupabase();

  const { data, error } = await supabase.from('equipos').insert(payload).select().single();

  if (error) {
    throw new Error(`No se pudo crear el equipo: ${error.message}`);
  }

  return data;
}

export async function actualizarEquipo(idEquipo, payload) {
  const supabase = obtenerClienteSupabase();

  const { data, error } = await supabase
    .from('equipos')
    .update(payload)
    .eq('id', idEquipo)
    .select()
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar el equipo: ${error.message}`);
  }

  return data;
}

export async function eliminarEquipo(idEquipo) {
  const supabase = obtenerClienteSupabase();

  const { error } = await supabase.from('equipos').delete().eq('id', idEquipo);

  if (error) {
    throw new Error(`No se pudo eliminar el equipo: ${error.message}`);
  }
}
