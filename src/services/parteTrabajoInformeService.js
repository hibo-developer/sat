import { jsPDF } from 'jspdf';
import { obtenerClienteSupabase } from './supabaseClient';

const DESTINO_SAT = 'sat@cotepa.com';

function valorTexto(valor, fallback = 'N/D') {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  return texto || fallback;
}

function formatearFecha(valor) {
  if (!valor) {
    return 'N/D';
  }

  const fecha = new Date(valor);
  if (!Number.isFinite(fecha.getTime())) {
    return String(valor);
  }

  return fecha.toLocaleString('es-ES');
}

function materialesDesdeTexto(texto) {
  if (!texto || !texto.trim()) {
    return [];
  }

  return texto
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const [nombre, cantidad, precio] = linea.split(';').map((v) => (v || '').trim());
      return {
        nombre: nombre || 'Material',
        cantidad: cantidad || '1',
        precio: precio || 'N/D',
      };
    });
}

function agregarLinea(doc, texto, estado, opciones = {}) {
  const { size = 11, espacio = 6 } = opciones;
  doc.setFontSize(size);

  const lineas = doc.splitTextToSize(texto, 180);
  lineas.forEach((linea) => {
    if (estado.y > 280) {
      doc.addPage();
      estado.y = 20;
    }

    doc.text(linea, 15, estado.y);
    estado.y += espacio;
  });
}

function crearPdfInforme({ parte, formulario, seguimientoTiempo, clienteNombre, equipoNombre, tecnicoNombre, firmaUrl }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const estado = { y: 18 };
  const materiales = materialesDesdeTexto(formulario.materialesTexto);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Informe de Parte de Trabajo SAT', 15, estado.y);
  estado.y += 8;

  doc.setFont('helvetica', 'normal');
  agregarLinea(doc, `ID Parte: ${valorTexto(parte.id)}`, estado);
  agregarLinea(doc, `Fecha informe: ${formatearFecha(new Date().toISOString())}`, estado);
  agregarLinea(doc, `Cliente: ${clienteNombre}`, estado);
  agregarLinea(doc, `Equipo: ${equipoNombre}`, estado);
  agregarLinea(doc, `Tecnico: ${tecnicoNombre}`, estado);
  agregarLinea(doc, `Prioridad: ${valorTexto(formulario.prioridad)}`, estado);
  agregarLinea(doc, `Tiempo empleado (min): ${valorTexto(String(formulario.tiempo_empleado))}`, estado);

  estado.y += 3;
  doc.setFont('helvetica', 'bold');
  agregarLinea(doc, 'Descripcion del problema:', estado);
  doc.setFont('helvetica', 'normal');
  agregarLinea(doc, valorTexto(formulario.descripcion_problema), estado);

  estado.y += 3;
  doc.setFont('helvetica', 'bold');
  agregarLinea(doc, 'Control de tiempos y geolocalizacion:', estado);
  doc.setFont('helvetica', 'normal');
  agregarLinea(doc, `Inicio: ${formatearFecha(seguimientoTiempo?.inicioIso)}`, estado);
  agregarLinea(
    doc,
    `Lugar inicio: ${valorTexto(seguimientoTiempo?.ubicacionInicio?.nombreLugarCompleto || seguimientoTiempo?.ubicacionInicio?.nombreLugar)}`,
    estado,
  );
  agregarLinea(doc, `Fin: ${formatearFecha(seguimientoTiempo?.finIso)}`, estado);
  agregarLinea(
    doc,
    `Lugar fin: ${valorTexto(seguimientoTiempo?.ubicacionFin?.nombreLugarCompleto || seguimientoTiempo?.ubicacionFin?.nombreLugar)}`,
    estado,
  );
  agregarLinea(doc, `Distancia geo (m): ${valorTexto(seguimientoTiempo?.distanciaMetros ? String(seguimientoTiempo.distanciaMetros) : '', 'N/D')}`, estado);
  agregarLinea(doc, `Tiempo geo (min): ${valorTexto(seguimientoTiempo?.minutosGeo ? String(seguimientoTiempo.minutosGeo) : '', 'N/D')}`, estado);

  estado.y += 3;
  doc.setFont('helvetica', 'bold');
  agregarLinea(doc, 'Materiales usados:', estado);
  doc.setFont('helvetica', 'normal');

  if (materiales.length === 0) {
    agregarLinea(doc, 'Sin materiales declarados.', estado);
  } else {
    materiales.forEach((material, index) => {
      agregarLinea(
        doc,
        `${index + 1}. ${material.nombre} | Cantidad: ${material.cantidad} | Precio: ${material.precio}`,
        estado,
      );
    });
  }

  estado.y += 3;
  doc.setFont('helvetica', 'bold');
  agregarLinea(doc, 'Firma del cliente (URL):', estado);
  doc.setFont('helvetica', 'normal');
  agregarLinea(doc, valorTexto(firmaUrl), estado);

  const nombreArchivo = `informe-parte-${parte.id || Date.now()}.pdf`;
  const pdfBlob = doc.output('blob');

  return { pdfBlob, nombreArchivo };
}

async function subirPdfInforme({ pdfBlob, nombreArchivo, clienteId }) {
  const supabase = obtenerClienteSupabase();
  const ruta = `${clienteId}/${nombreArchivo}`;

  const { error: errorSubida } = await supabase.storage
    .from('informes-partes')
    .upload(ruta, pdfBlob, {
      upsert: false,
      contentType: 'application/pdf',
      cacheControl: '3600',
    });

  if (errorSubida) {
    throw new Error(
      `No se pudo subir el PDF a Storage. Verifica bucket/policies de informes-partes. (${errorSubida.message})`,
    );
  }

  const { data } = supabase.storage.from('informes-partes').getPublicUrl(ruta);
  return data?.publicUrl || null;
}

async function enviarCorreoInforme({ pdfUrl, parteId }) {
  const asunto = `Informe parte de trabajo ${parteId}`;
  const cuerpo = [
    'Adjuntamos el informe del parte de trabajo generado desde SAT Movil.',
    '',
    `Parte: ${parteId}`,
    `PDF: ${pdfUrl}`,
  ].join('\n');

  const endpoint = import.meta.env.VITE_SAT_MAIL_ENDPOINT;

  if (!endpoint) {
    throw new Error(
      'Falta configurar VITE_SAT_MAIL_ENDPOINT para enviar el informe automaticamente a sat@cotepa.com.',
    );
  }

  const token = import.meta.env.VITE_SAT_MAIL_TOKEN;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['x-mail-token'] = token;
  }

  const respuesta = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      to: DESTINO_SAT,
      subject: asunto,
      text: cuerpo,
      pdfUrl,
      parteId,
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`El endpoint de correo respondió ${respuesta.status}.`);
  }

  return { metodo: 'endpoint' };
}

export async function generarYEnviarInformeParte({
  parte,
  formulario,
  seguimientoTiempo,
  clienteNombre,
  equipoNombre,
  tecnicoNombre,
  firmaUrl,
}) {
  const { pdfBlob, nombreArchivo } = crearPdfInforme({
    parte,
    formulario,
    seguimientoTiempo,
    clienteNombre,
    equipoNombre,
    tecnicoNombre,
    firmaUrl,
  });

  const pdfUrl = await subirPdfInforme({
    pdfBlob,
    nombreArchivo,
    clienteId: formulario.cliente_id,
  });

  if (!pdfUrl) {
    throw new Error('No se pudo obtener la URL pública del informe PDF.');
  }

  const envio = await enviarCorreoInforme({
    pdfUrl,
    parteId: parte.id || 'sin-id',
  });

  return {
    pdfUrl,
    destino: DESTINO_SAT,
    metodoEnvio: envio.metodo,
  };
}
