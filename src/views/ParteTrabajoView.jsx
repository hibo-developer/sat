import { useEffect, useState } from 'react';
import {
  obtenerClientes,
  obtenerEquiposPorCliente,
  obtenerTecnicosActivos,
} from '../services/catalogosService';
import { crearParteTrabajo } from '../services/parteTrabajoService';
import { tieneConfiguracionSupabase } from '../services/supabaseClient';

const FORM_INICIAL = {
  cliente_id: '',
  equipo_id: '',
  tecnico_id: '',
  descripcion_problema: '',
  materialesTexto: '',
  tiempo_empleado: '60',
  prioridad: 'media',
};

export function ParteTrabajoView() {
  const [formulario, setFormulario] = useState(FORM_INICIAL);
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarCatalogos() {
      if (!tieneConfiguracionSupabase()) {
        setCargando(false);
        return;
      }

      setCargando(true);
      setError('');

      try {
        const [clientesRsp, tecnicosRsp] = await Promise.all([
          obtenerClientes({ limite: 100, pagina: 1 }),
          obtenerTecnicosActivos({ limite: 100, pagina: 1 }),
        ]);

        setClientes(clientesRsp.items);
        setTecnicos(tecnicosRsp.items);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los catálogos del parte de trabajo.');
      } finally {
        setCargando(false);
      }
    }

    cargarCatalogos();
  }, []);

  useEffect(() => {
    async function cargarEquipos() {
      if (!formulario.cliente_id || !tieneConfiguracionSupabase()) {
        setEquipos([]);
        setFormulario((prev) => ({ ...prev, equipo_id: '' }));
        return;
      }

      try {
        const equiposRsp = await obtenerEquiposPorCliente(formulario.cliente_id, {
          limite: 100,
          pagina: 1,
        });
        setEquipos(equiposRsp.items);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los equipos del cliente.');
      }
    }

    cargarEquipos();
  }, [formulario.cliente_id]);

  async function enviarParte(evento) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje('');
    setError('');

    try {
      await crearParteTrabajo({
        ...formulario,
        equipo_id: formulario.equipo_id || null,
        tecnico_id: formulario.tecnico_id || null,
      });

      setMensaje('Parte de trabajo registrado correctamente.');
      setFormulario(FORM_INICIAL);
      setEquipos([]);
    } catch (err) {
      setError(err.message || 'No se pudo registrar el parte de trabajo.');
    } finally {
      setGuardando(false);
    }
  }

  if (!tieneConfiguracionSupabase()) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        Configura Supabase en `.env` para usar el formulario de parte de trabajo.
      </section>
    );
  }

  return (
    <section className="space-y-4 pb-20">
      <header className="rounded-2xl bg-marca-900 p-4 text-white shadow-lg">
        <h2 className="text-lg font-bold">Parte de Trabajo</h2>
        <p className="mt-1 text-sm text-slate-200">Registro técnico para cierre operativo de averías.</p>
      </header>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {mensaje && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {mensaje}
        </p>
      )}

      <form onSubmit={enviarParte} className="space-y-3 rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta">
        <h2 className="text-lg font-bold text-marca-900">Detalle del parte</h2>
        <p className="text-xs text-slate-600">
          En materiales usa una línea por material con formato: nombre;cantidad;precio
        </p>
        <p className="text-xs text-slate-500">
          El parte queda finalizado al guardarlo, así que necesita técnico y tiempo empleado válidos.
        </p>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Cliente *</span>
          <select
            required
            value={formulario.cliente_id}
            onChange={(e) =>
              setFormulario((prev) => ({ ...prev, cliente_id: e.target.value, equipo_id: '' }))
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            disabled={cargando}
          >
            <option value="">Selecciona cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Equipo</span>
          <select
            value={formulario.equipo_id}
            onChange={(e) => setFormulario((prev) => ({ ...prev, equipo_id: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            disabled={!formulario.cliente_id}
          >
            <option value="">Sin equipo</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Técnico *</span>
          <select
            required
            value={formulario.tecnico_id}
            onChange={(e) => setFormulario((prev) => ({ ...prev, tecnico_id: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="">Selecciona técnico</option>
            {tecnicos.map((tecnico) => (
              <option key={tecnico.id} value={tecnico.id}>
                {tecnico.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Descripción del problema *</span>
          <textarea
            required
            rows={4}
            value={formulario.descripcion_problema}
            onChange={(e) => setFormulario((prev) => ({ ...prev, descripcion_problema: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            placeholder="Describe la avería reportada"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Materiales utilizados</span>
          <textarea
            rows={4}
            value={formulario.materialesTexto}
            onChange={(e) => setFormulario((prev) => ({ ...prev, materialesTexto: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            placeholder={"Ejemplo:\nGas R32;1;45.5\nFiltro;2;12"}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Tiempo empleado (min) *</span>
          <input
            required
            min="1"
            type="number"
            value={formulario.tiempo_empleado}
            onChange={(e) => setFormulario((prev) => ({ ...prev, tiempo_empleado: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Prioridad</span>
          <select
            value={formulario.prioridad}
            onChange={(e) => setFormulario((prev) => ({ ...prev, prioridad: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={guardando || cargando}
          className="w-full rounded-2xl bg-cotepa-rojo-500 px-4 py-4 text-sm font-bold text-white disabled:opacity-60"
        >
          {guardando ? 'Guardando parte...' : 'Registrar parte de trabajo'}
        </button>
      </form>
    </section>
  );
}
