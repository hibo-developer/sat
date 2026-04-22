const PRIORIDADES_VALIDAS = new Set(['baja', 'media', 'alta', 'urgente']);

export function limpiarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function validarPrioridad(prioridad) {
  const prioridadLimpia = limpiarTexto(prioridad).toLowerCase();

  if (!PRIORIDADES_VALIDAS.has(prioridadLimpia)) {
    throw new Error('La prioridad indicada no es válida.');
  }

  return prioridadLimpia;
}

export function validarTextoRequerido(valor, etiqueta, minimo = 3) {
  const texto = limpiarTexto(valor);

  if (!texto) {
    throw new Error(`${etiqueta} es obligatorio.`);
  }

  if (texto.length < minimo) {
    throw new Error(`${etiqueta} debe tener al menos ${minimo} caracteres.`);
  }

  return texto;
}

export function validarMinutos(valor, etiqueta = 'El tiempo empleado') {
  const numero = Number.parseInt(valor, 10);

  if (!Number.isFinite(numero) || numero <= 0) {
    throw new Error(`${etiqueta} debe ser un número de minutos mayor que cero.`);
  }

  return numero;
}

export function validarUrlOpcional(valor, etiqueta = 'La URL indicada') {
  const texto = limpiarTexto(valor);

  if (!texto) {
    return null;
  }

  try {
    const url = new URL(texto);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error();
    }
    return url.toString();
  } catch {
    throw new Error(`${etiqueta} no tiene un formato válido.`);
  }
}

export function normalizarDescripcion(valor) {
  return limpiarTexto(valor).toLowerCase().replace(/\s+/g, ' ');
}