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

function formatearCoord(valor) {
  return Number.isFinite(Number(valor)) ? Number(valor).toFixed(5) : 'n/d';
}

function construirResumenGeolocalizacion(seguimientoTiempo) {
  if (!seguimientoTiempo || !seguimientoTiempo.inicioIso) {
    return null;
  }

  const lineas = ['Parte registrado desde movilidad'];
  lineas.push(`Inicio técnico: ${seguimientoTiempo.inicioIso}`);

  if (seguimientoTiempo.finIso) {
    lineas.push(`Fin técnico: ${seguimientoTiempo.finIso}`);
  }

  if (seguimientoTiempo.ubicacionInicio) {
    lineas.push(
      `Geo inicio: ${formatearCoord(seguimientoTiempo.ubicacionInicio.latitud)}, ${formatearCoord(seguimientoTiempo.ubicacionInicio.longitud)}`,
    );

    if (seguimientoTiempo.ubicacionInicio.nombreLugarCompleto || seguimientoTiempo.ubicacionInicio.nombreLugar) {
      lineas.push(
        `Lugar inicio: ${seguimientoTiempo.ubicacionInicio.nombreLugarCompleto || seguimientoTiempo.ubicacionInicio.nombreLugar}`,
      );
    }
  }

  if (seguimientoTiempo.ubicacionFin) {
    lineas.push(
      `Geo fin: ${formatearCoord(seguimientoTiempo.ubicacionFin.latitud)}, ${formatearCoord(seguimientoTiempo.ubicacionFin.longitud)}`,
    );

    if (seguimientoTiempo.ubicacionFin.nombreLugarCompleto || seguimientoTiempo.ubicacionFin.nombreLugar) {
      lineas.push(
        `Lugar fin: ${seguimientoTiempo.ubicacionFin.nombreLugarCompleto || seguimientoTiempo.ubicacionFin.nombreLugar}`,
      );
    }
  }

  if (Number.isFinite(Number(seguimientoTiempo.distanciaMetros))) {
    lineas.push(`Distancia geolocalizada: ${Math.round(Number(seguimientoTiempo.distanciaMetros))} m`);
  }

  if (Number.isFinite(Number(seguimientoTiempo.minutosGeo))) {
    lineas.push(`Tiempo por geolocalización: ${Math.round(Number(seguimientoTiempo.minutosGeo))} minutos`);
  }

  return lineas.join(' | ');
}

function resolverFechaIso(valor, fallback) {
  if (!valor) {
    return fallback;
  }

  const fecha = new Date(valor);
  if (!Number.isFinite(fecha.getTime())) {
    return fallback;
  }

  return fecha.toISOString();
}

function esDataUrlImagen(valor) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(valor || '');
}

async function subirFirmaClienteStorage(supabase, { firmaDataUrl, clienteId, tecnicoId }) {
  if (!esDataUrlImagen(firmaDataUrl)) {
    return firmaDataUrl;
  }

  let blobFirma;
  try {
    const respuesta = await fetch(firmaDataUrl);
    blobFirma = await respuesta.blob();
  } catch {
    throw new Error('No se pudo procesar la firma del cliente para subirla a Storage.');
  }

  const extension = blobFirma.type === 'image/jpeg' ? 'jpg' : 'png';
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const rutaArchivo = `${clienteId}/${tecnicoId}/${nombreArchivo}`;

  const { error: errorSubida } = await supabase.storage
    .from('firmas-clientes')
    .upload(rutaArchivo, blobFirma, {
      upsert: false,
      contentType: blobFirma.type || 'image/png',
      cacheControl: '3600',
    });

  if (errorSubida) {
    throw new Error(
      `No se pudo subir la firma del cliente a Storage. Verifica bucket/policies de firmas-clientes. (${errorSubida.message})`,
    );
  }

  const { data } = supabase.storage.from('firmas-clientes').getPublicUrl(rutaArchivo);
  return data?.publicUrl || null;
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
  const resumenGeo = construirResumenGeolocalizacion(payload.seguimientoTiempo);
  const firmaEntrada = limpiarTexto(payload.firma_url);
  const ahoraIso = new Date().toISOString();
  const fechaInicio = resolverFechaIso(payload.seguimientoTiempo?.inicioIso, ahoraIso);
  const fechaFin = resolverFechaIso(payload.seguimientoTiempo?.finIso, ahoraIso);

  if (!clienteId) {
    throw new Error('Debes seleccionar un cliente para registrar el parte.');
  }

  if (!tecnicoId) {
    throw new Error('Debes asignar un técnico para registrar el parte.');
  }

  if (!firmaEntrada) {
    throw new Error('La firma del cliente es obligatoria para registrar el parte.');
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

  const firmaUrl = await subirFirmaClienteStorage(supabase, {
    firmaDataUrl: firmaEntrada,
    clienteId,
    tecnicoId,
  });

  if (!firmaUrl) {
    throw new Error('No se pudo obtener la URL pública de la firma del cliente.');
  }

  const ordenPayload = {
    cliente_id: clienteId,
    equipo_id: equipoId,
    tecnico_id: tecnicoId,
    descripcion_averia: descripcionProblema,
    tareas_realizadas: resumenGeo || 'Parte registrado desde movilidad',
    tiempo_empleado_minutos: tiempoEmpleadoMinutos,
    estado: 'finalizado',
    prioridad,
    firma_url: firmaUrl,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
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
