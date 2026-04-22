import { obtenerClienteSupabase } from './supabaseClient';

const DESCRIPCIONES_DEMO = new Set([
  'No enfria correctamente',
  'No alcanza temperatura de consigna',
  'Fuga de vapor en junta principal',
  'Prueba tiempo en columna',
]);

function crearSelloDemo() {
  const ahora = new Date();
  const pad = (valor) => String(valor).padStart(2, '0');

  return [
    ahora.getFullYear(),
    pad(ahora.getMonth() + 1),
    pad(ahora.getDate()),
    pad(ahora.getHours()),
    pad(ahora.getMinutes()),
    pad(ahora.getSeconds()),
  ].join('');
}

function esClienteDemo(nombre) {
  return (
    typeof nombre === 'string' &&
    (nombre.startsWith('Demo SAT - ') ||
      nombre.startsWith('Cliente Prueba SAT ') ||
      nombre.startsWith('Cliente Tiempo Columna '))
  );
}

function esTecnicoDemo(nombre) {
  return (
    typeof nombre === 'string' &&
    (nombre.startsWith('Demo SAT - ') ||
      nombre === 'Tecnico Prueba' ||
      nombre === 'Tecnico Tiempo Columna')
  );
}

function esEquipoDemo(equipo, demoClienteIds) {
  return (
    (typeof equipo.numero_serie === 'string' && equipo.numero_serie.startsWith('SAT-DEMO-')) ||
    equipo.nombre === 'Equipo Prueba' ||
    equipo.nombre === 'Equipo Tiempo Columna' ||
    demoClienteIds.has(equipo.cliente_id)
  );
}

export async function limpiarDatosDemoSat() {
  const supabase = obtenerClienteSupabase();

  const [clientesRsp, tecnicosRsp, equiposRsp, ordenesRsp] = await Promise.all([
    supabase.from('clientes').select('id, nombre'),
    supabase.from('tecnicos').select('id, nombre'),
    supabase.from('equipos').select('id, cliente_id, nombre, numero_serie'),
    supabase
      .from('ordenes_trabajo')
      .select('id, cliente_id, equipo_id, tecnico_id, descripcion_averia'),
  ]);

  for (const rsp of [clientesRsp, tecnicosRsp, equiposRsp, ordenesRsp]) {
    if (rsp.error) {
      throw new Error(`No se pudieron consultar los datos demo: ${rsp.error.message}`);
    }
  }

  const demoClientes = (clientesRsp.data || []).filter((cliente) => esClienteDemo(cliente.nombre));
  const demoClienteIds = new Set(demoClientes.map((cliente) => cliente.id));

  const demoTecnicos = (tecnicosRsp.data || []).filter((tecnico) => esTecnicoDemo(tecnico.nombre));
  const demoTecnicoIds = new Set(demoTecnicos.map((tecnico) => tecnico.id));

  const demoEquipos = (equiposRsp.data || []).filter((equipo) => esEquipoDemo(equipo, demoClienteIds));
  const demoEquipoIds = new Set(demoEquipos.map((equipo) => equipo.id));

  const demoOrdenes = (ordenesRsp.data || []).filter(
    (orden) =>
      demoClienteIds.has(orden.cliente_id) ||
      demoEquipoIds.has(orden.equipo_id) ||
      demoTecnicoIds.has(orden.tecnico_id) ||
      DESCRIPCIONES_DEMO.has(orden.descripcion_averia)
  );

  const demoOrdenIds = demoOrdenes.map((orden) => orden.id);
  const demoEquipoIdsArray = [...demoEquipoIds];
  const demoTecnicoIdsArray = [...demoTecnicoIds];
  const demoClienteIdsArray = [...demoClienteIds];

  if (demoOrdenIds.length > 0) {
    const materialesDelete = await supabase.from('materiales_orden').delete().in('orden_id', demoOrdenIds);
    if (materialesDelete.error) {
      throw new Error(`No se pudieron eliminar los materiales demo: ${materialesDelete.error.message}`);
    }

    const ordenesDelete = await supabase.from('ordenes_trabajo').delete().in('id', demoOrdenIds);
    if (ordenesDelete.error) {
      throw new Error(`No se pudieron eliminar las órdenes demo: ${ordenesDelete.error.message}`);
    }
  }

  if (demoEquipoIdsArray.length > 0) {
    const equiposDelete = await supabase.from('equipos').delete().in('id', demoEquipoIdsArray);
    if (equiposDelete.error) {
      throw new Error(`No se pudieron eliminar los equipos demo: ${equiposDelete.error.message}`);
    }
  }

  if (demoTecnicoIdsArray.length > 0) {
    const tecnicosDelete = await supabase.from('tecnicos').delete().in('id', demoTecnicoIdsArray);
    if (tecnicosDelete.error) {
      throw new Error(`No se pudieron eliminar los técnicos demo: ${tecnicosDelete.error.message}`);
    }
  }

  if (demoClienteIdsArray.length > 0) {
    const clientesDelete = await supabase.from('clientes').delete().in('id', demoClienteIdsArray);
    if (clientesDelete.error) {
      throw new Error(`No se pudieron eliminar los clientes demo: ${clientesDelete.error.message}`);
    }
  }

  return {
    clientes: demoClienteIdsArray.length,
    tecnicos: demoTecnicoIdsArray.length,
    equipos: demoEquipoIdsArray.length,
    ordenes: demoOrdenIds.length,
  };
}

export async function cargarDatosDemoSat() {
  const supabase = obtenerClienteSupabase();
  const sello = crearSelloDemo();

  await limpiarDatosDemoSat();

  const clientesInsert = await supabase
    .from('clientes')
    .insert([
      {
        nombre: `Demo SAT - Panaderia Centro ${sello}`,
        direccion: 'Calle Mayor 12, Madrid',
        telefono: '910000111',
        email: 'panaderia.demo@sat.local',
      },
      {
        nombre: `Demo SAT - Clinica Norte ${sello}`,
        direccion: 'Avenida Europa 50, Madrid',
        telefono: '910000222',
        email: 'clinica.demo@sat.local',
      },
    ])
    .select();

  if (clientesInsert.error) {
    throw new Error(`No se pudieron crear los clientes demo: ${clientesInsert.error.message}`);
  }

  const tecnicosInsert = await supabase
    .from('tecnicos')
    .insert([
      { nombre: 'Demo SAT - Laura Gomez', especialidad: 'Refrigeracion', activo: true },
      { nombre: 'Demo SAT - Carlos Ruiz', especialidad: 'Electromecanica', activo: true },
    ])
    .select();

  if (tecnicosInsert.error) {
    throw new Error(`No se pudieron crear los técnicos demo: ${tecnicosInsert.error.message}`);
  }

  const clientes = clientesInsert.data || [];
  const tecnicos = tecnicosInsert.data || [];

  const equiposInsert = await supabase
    .from('equipos')
    .insert([
      {
        cliente_id: clientes[0].id,
        nombre: 'Horno Convencional',
        marca: 'BakerPro',
        modelo: 'BP-900',
        numero_serie: `SAT-DEMO-${sello}-001`,
        ultima_revision: new Date().toISOString().slice(0, 10),
      },
      {
        cliente_id: clientes[1].id,
        nombre: 'Autoclave',
        marca: 'MediSteam',
        modelo: 'MS-210',
        numero_serie: `SAT-DEMO-${sello}-002`,
        ultima_revision: new Date().toISOString().slice(0, 10),
      },
    ])
    .select();

  if (equiposInsert.error) {
    throw new Error(`No se pudieron crear los equipos demo: ${equiposInsert.error.message}`);
  }

  const equipos = equiposInsert.data || [];

  const ordenesInsert = await supabase
    .from('ordenes_trabajo')
    .insert([
      {
        cliente_id: clientes[0].id,
        equipo_id: equipos[0].id,
        tecnico_id: tecnicos[0].id,
        descripcion_averia: 'No alcanza temperatura de consigna',
        estado: 'pendiente',
        prioridad: 'alta',
        fecha_inicio: new Date().toISOString(),
      },
      {
        cliente_id: clientes[1].id,
        equipo_id: equipos[1].id,
        tecnico_id: tecnicos[1].id,
        descripcion_averia: 'Fuga de vapor en junta principal',
        tareas_realizadas: 'Sustitucion de junta, prueba de estanqueidad y calibracion final',
        tiempo_empleado_minutos: 95,
        estado: 'finalizado',
        prioridad: 'media',
        foto_url: 'https://example.com/demo-cierre.jpg',
        fecha_inicio: new Date().toISOString(),
        fecha_fin: new Date().toISOString(),
      },
    ])
    .select();

  if (ordenesInsert.error) {
    throw new Error(`No se pudieron crear las órdenes demo: ${ordenesInsert.error.message}`);
  }

  const ordenes = ordenesInsert.data || [];
  const ordenFinalizada = ordenes.find((orden) => orden.estado === 'finalizado');

  if (ordenFinalizada) {
    const materialesInsert = await supabase.from('materiales_orden').insert([
      {
        orden_id: ordenFinalizada.id,
        nombre_material: 'Junta alta temperatura',
        cantidad: 2,
        precio_unitario: 12.75,
      },
      {
        orden_id: ordenFinalizada.id,
        nombre_material: 'Kit limpieza esterilizador',
        cantidad: 1,
        precio_unitario: 18.5,
      },
    ]);

    if (materialesInsert.error) {
      throw new Error(`No se pudieron crear los materiales demo: ${materialesInsert.error.message}`);
    }
  }

  return {
    clientes: clientes.length,
    tecnicos: tecnicos.length,
    equipos: equipos.length,
    ordenes: ordenes.length,
  };
}