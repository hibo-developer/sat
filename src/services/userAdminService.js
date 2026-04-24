import { obtenerClienteSupabase } from './supabaseClient';

const ROLES_PERMITIDOS = new Set(['admin', 'oficina', 'tecnico']);

function limpiarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validarRol(rol) {
  const rolLimpio = limpiarTexto(rol).toLowerCase();

  if (!ROLES_PERMITIDOS.has(rolLimpio)) {
    throw new Error('El rol seleccionado no es valido.');
  }

  return rolLimpio;
}

async function invocarAdminUsers(action, payload = {}) {
  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: {
      action,
      payload,
    },
  });

  if (error) {
    throw new Error(error.message || 'No se pudo completar la operacion de usuarios.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function listarUsuariosSat() {
  const respuesta = await invocarAdminUsers('list');
  return Array.isArray(respuesta?.users) ? respuesta.users : [];
}

export async function crearUsuarioSat(payload) {
  const email = limpiarTexto(payload.email).toLowerCase();
  const password = limpiarTexto(payload.password);
  const rol = validarRol(payload.rol);
  const nombreVisible = limpiarTexto(payload.nombre_visible) || null;
  const tecnicoNombre = rol === 'tecnico' ? limpiarTexto(payload.tecnico_nombre) || null : null;
  const tecnicoEspecialidad = rol === 'tecnico' ? limpiarTexto(payload.tecnico_especialidad) || null : null;

  if (!email) {
    throw new Error('El email del usuario es obligatorio.');
  }

  if (!password || password.length < 6) {
    throw new Error('La contrasena inicial debe tener al menos 6 caracteres.');
  }

  const respuesta = await invocarAdminUsers('create', {
    email,
    password,
    rol,
    nombre_visible: nombreVisible,
    tecnico_nombre: tecnicoNombre,
    tecnico_especialidad: tecnicoEspecialidad,
  });

  return respuesta?.user || null;
}

export async function actualizarUsuarioSat(userId, payload) {
  const id = limpiarTexto(userId);
  const rol = validarRol(payload.rol);
  const email = limpiarTexto(payload.email).toLowerCase() || null;
  const password = limpiarTexto(payload.password) || null;
  const nombreVisible = limpiarTexto(payload.nombre_visible) || null;
  const tecnicoNombre = rol === 'tecnico' ? limpiarTexto(payload.tecnico_nombre) || null : null;
  const tecnicoEspecialidad = rol === 'tecnico' ? limpiarTexto(payload.tecnico_especialidad) || null : null;

  if (!id) {
    throw new Error('El usuario que intentas actualizar no es valido.');
  }

  if (password && password.length < 6) {
    throw new Error('La nueva contrasena debe tener al menos 6 caracteres.');
  }

  const respuesta = await invocarAdminUsers('update', {
    user_id: id,
    email,
    password,
    rol,
    nombre_visible: nombreVisible,
    tecnico_nombre: tecnicoNombre,
    tecnico_especialidad: tecnicoEspecialidad,
  });

  return respuesta?.user || null;
}

export async function eliminarUsuarioSat(userId) {
  const id = limpiarTexto(userId);

  if (!id) {
    throw new Error('El usuario que intentas eliminar no es valido.');
  }

  await invocarAdminUsers('delete', {
    user_id: id,
  });
}
