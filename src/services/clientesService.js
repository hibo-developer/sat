import { obtenerClienteSupabase } from './supabaseClient';

export async function listarClientes() {
  const supabase = obtenerClienteSupabase();

  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, direccion, telefono, email, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`No se pudieron obtener los clientes: ${error.message}`);
  }

  return data || [];
}

export async function crearCliente(payload) {
  const supabase = obtenerClienteSupabase();

  const { data, error } = await supabase.from('clientes').insert(payload).select().single();

  if (error) {
    throw new Error(`No se pudo crear el cliente: ${error.message}`);
  }

  return data;
}

export async function actualizarCliente(idCliente, payload) {
  const supabase = obtenerClienteSupabase();

  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', idCliente)
    .select()
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar el cliente: ${error.message}`);
  }

  return data;
}

export async function eliminarCliente(idCliente) {
  const supabase = obtenerClienteSupabase();

  const { error } = await supabase.from('clientes').delete().eq('id', idCliente);

  if (error) {
    throw new Error(`No se pudo eliminar el cliente: ${error.message}`);
  }
}
