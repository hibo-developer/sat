const ORDENES_MOCK = [
  {
    id: 'OT-1024',
    cliente: 'Panadería San Miguel',
    equipo: 'Horno convector HN-900',
    descripcion: 'No alcanza temperatura estable y marca error E12.',
    estado: 'Pendiente',
    prioridad: 'Alta',
    fecha: '22/04/2026',
  },
  {
    id: 'OT-1025',
    cliente: 'Clínica Nova',
    equipo: 'Autoclave AC-210',
    descripcion: 'Fuga de vapor en junta principal durante ciclo.',
    estado: 'En Proceso',
    prioridad: 'Media',
    fecha: '22/04/2026',
  },
  {
    id: 'OT-1026',
    cliente: 'Hotel Bahía Centro',
    equipo: 'Lavadora industrial LI-45',
    descripcion: 'Vibración excesiva y ruido metálico al centrifugar.',
    estado: 'Finalizado',
    prioridad: 'Baja',
    fecha: '21/04/2026',
  },
];

export function obtenerOrdenes() {
  return Promise.resolve(ORDENES_MOCK);
}
