import { obtenerClienteSupabase } from './supabaseClient';
import {
  limpiarTexto,
  validarMinutos,
  validarPrioridad,
  validarTextoRequerido,
} from './satValidation';

function parsearMateriales(textoMateriales) {
  if (!textoMateriales.trim()) {
    return [];
  }

  return textoMateriales
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea, indice) => {
      const [nombre, cantidadRaw, precioRaw] = linea.split(';').map((v) => (v || '').trim());

      if (!nombre) {
        throw new Error(`El material de la línea ${indice + 1} no tiene nombre.`);
      }

      if (cantidadRaw && (!Number.isFinite(Number.parseInt(cantidadRaw, 10)) || Number.parseInt(cantidadRaw, 10) <= 0)) {
        throw new Error(`La cantidad del material en la línea ${indice + 1} debe ser mayor que cero.`);
      }

      if (precioRaw && !Number.isFinite(Number.parseFloat(precioRaw))) {
        throw new Error(`El precio del material en la línea ${indice + 1} no es válido.`);
      }

      const cantidad = cantidadRaw ? Number.parseInt(cantidadRaw, 10) : 1;
      const precio = precioRaw ? Number.parseFloat(precioRaw) : null;

      return {
        nombre_material: nombre,
        cantidad,
        precio_unitario: precio,
      };
    });
}

export async function crearParteTrabajo(payload) {
  const supabase = obtenerClienteSupabase();
  const clienteId = limpiarTexto(payload.cliente_id);
  const equipoId = limpiarTexto(payload.equipo_id) || null;
  const tecnicoId = limpiarTexto(payload.tecnico_id);
  const descripcionProblema = validarTextoRequerido(payload.descripcion_problema, 'La descripción del problema', 8);
  const prioridad = validarPrioridad(payload.prioridad || 'media');
  const materiales = parsearMateriales(payload.materialesTexto || '');
  const tiempoEmpleadoMinutos = validarMinutos(payload.tiempo_empleado);

  if (!clienteId) {
    throw new Error('Debes seleccionar un cliente para registrar el parte.');
  }

  if (!tecnicoId) {
    throw new Error('Debes asignar un técnico para registrar el parte.');
  }

  const [clienteRsp, tecnicoRsp, equipoRsp] = await Promise.all([
    supabase.from('clientes').select('id').eq('id', clienteId).maybeSingle(),
    supabase.from('tecnicos').select('id, activo').eq('id', tecnicoId).maybeSingle(),
    equipoId
      ? supabase.from('equipos').select('id, cliente_id').eq('id', equipoId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (clienteRsp.error) {
    throw new Error(`No se pudo validar el cliente del parte: ${clienteRsp.error.message}`);
  }

  if (!clienteRsp.data) {
    throw new Error('El cliente seleccionado para el parte no existe.');
  }

  if (tecnicoRsp.error) {
    throw new Error(`No se pudo validar el técnico del parte: ${tecnicoRsp.error.message}`);
  }

  if (!tecnicoRsp.data) {
    throw new Error('El técnico seleccionado para el parte no existe.');
  }

  if (!tecnicoRsp.data.activo) {
    throw new Error('El técnico seleccionado está inactivo.');
  }

  if (equipoRsp.error) {
    throw new Error(`No se pudo validar el equipo del parte: ${equipoRsp.error.message}`);
  }

  if (equipoId && !equipoRsp.data) {
    throw new Error('El equipo seleccionado para el parte no existe.');
  }

  if (equipoRsp.data && equipoRsp.data.cliente_id !== clienteId) {
    throw new Error('El equipo seleccionado no pertenece al cliente del parte.');
  }

  const ordenPayload = {
    cliente_id: clienteId,
    equipo_id: equipoId,
    tecnico_id: tecnicoId,
    descripcion_averia: descripcionProblema,
    tareas_realizadas: 'Parte registrado desde movilidad',
    tiempo_empleado_minutos: tiempoEmpleadoMinutos,
    estado: 'finalizado',
    prioridad,
    fecha_inicio: new Date().toISOString(),
    fecha_fin: new Date().toISOString(),
  };

  const { data: orden, error: errorOrden } = await supabase
    .from('ordenes_trabajo')
    .insert(ordenPayload)
    .select()
    .single();

  if (errorOrden) {
    throw new Error(`No se pudo registrar el parte de trabajo: ${errorOrden.message}`);
  }

  if (materiales.length > 0) {
    const payloadMateriales = materiales.map((material) => ({
      orden_id: orden.id,
      ...material,
    }));

    const { error: errorMateriales } = await supabase.from('materiales_orden').insert(payloadMateriales);

    if (errorMateriales) {
      throw new Error(`El parte se creó, pero falló el guardado de materiales: ${errorMateriales.message}`);
    }
  }

  return orden;
}
