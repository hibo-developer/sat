import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente de Supabase centralizado para usar en servicios del dominio.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function tieneConfiguracionSupabase() {
  return Boolean(supabase);
}

export function obtenerClienteSupabase() {
  if (!supabase) {
    throw new Error(
      'Falta configurar Supabase. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
    );
  }

  return supabase;
}
