import { obtenerClienteSupabase } from './supabaseClient';

export async function listarTecnicos() {
  const supabase = obtenerClienteSupabase();

  const { data, error } = await supabase
    .from('tecnicos')
    .select('id, nombre, especialidad, activo')
    .order('nombre', { ascending: true });

  if (error) {
    throw new Error(`No se pudieron obtener los técnicos: ${error.message}`);
  }

  return data || [];
}

export async function crearTecnico(payload) {
  const supabase = obtenerClienteSupabase();

  const { data, error } = await supabase.from('tecnicos').insert(payload).select().single();

  if (error) {
    throw new Error(`No se pudo crear el técnico: ${error.message}`);
  }

  return data;
}

export async function actualizarTecnico(idTecnico, payload) {
  const supabase = obtenerClienteSupabase();

  const { data, error } = await supabase
    .from('tecnicos')
    .update(payload)
    .eq('id', idTecnico)
    .select()
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar el técnico: ${error.message}`);
  }

  return data;
}

export async function eliminarTecnico(idTecnico) {
  const supabase = obtenerClienteSupabase();

  const { error } = await supabase.from('tecnicos').delete().eq('id', idTecnico);

  if (error) {
    throw new Error(`No se pudo eliminar el técnico: ${error.message}`);
  }
}
