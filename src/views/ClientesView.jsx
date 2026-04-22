import { useEffect, useMemo, useState } from 'react';
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  listarClientes,
} from '../services/clientesService';
import {
  actualizarTecnico,
  crearTecnico,
  eliminarTecnico,
  listarTecnicos,
} from '../services/tecnicosService';
import {
  actualizarEquipo,
  crearEquipo,
  eliminarEquipo,
  listarEquipos,
} from '../services/equiposService';
import { tieneConfiguracionSupabase } from '../services/supabaseClient';

const FORM_CLIENTE_INICIAL = {
  nombre: '',
  direccion: '',
  telefono: '',
  email: '',
};

const FORM_TECNICO_INICIAL = {
  nombre: '',
  especialidad: '',
  activo: true,
};

const FORM_EQUIPO_INICIAL = {
  cliente_id: '',
  nombre: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  ultima_revision: '',
};

export function ClientesView() {
  const [tabActiva, setTabActiva] = useState('clientes');
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [clienteForm, setClienteForm] = useState(FORM_CLIENTE_INICIAL);
  const [clienteEditandoId, setClienteEditandoId] = useState('');

  const [tecnicoForm, setTecnicoForm] = useState(FORM_TECNICO_INICIAL);
  const [tecnicoEditandoId, setTecnicoEditandoId] = useState('');

  const [equipoForm, setEquipoForm] = useState(FORM_EQUIPO_INICIAL);
  const [equipoEditandoId, setEquipoEditandoId] = useState('');
  const [busquedaEquipo, setBusquedaEquipo] = useState('');

  const sinConfiguracion = useMemo(() => !tieneConfiguracionSupabase(), []);
  const equiposFiltrados = useMemo(() => {
    const termino = busquedaEquipo.trim().toLowerCase();

    if (!termino) {
      return equipos;
    }

    return equipos.filter((equipo) => {
      const cliente = (equipo.clientes && equipo.clientes.nombre ? equipo.clientes.nombre : '').toLowerCase();
      const nombre = (equipo.nombre || '').toLowerCase();
      const marca = (equipo.marca || '').toLowerCase();
      const modelo = (equipo.modelo || '').toLowerCase();
      const serie = (equipo.numero_serie || '').toLowerCase();

      return (
        cliente.includes(termino) ||
        nombre.includes(termino) ||
        marca.includes(termino) ||
        modelo.includes(termino) ||
        serie.includes(termino)
      );
    });
  }, [equipos, busquedaEquipo]);

  async function recargarDatos() {
    if (sinConfiguracion) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');

    try {
      const [datosClientes, datosTecnicos, datosEquipos] = await Promise.all([
        listarClientes(),
        listarTecnicos(),
        listarEquipos(),
      ]);
      setClientes(datosClientes);
      setTecnicos(datosTecnicos);
      setEquipos(datosEquipos);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar clientes, técnicos y equipos.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    recargarDatos();
  }, []);

  function limpiarFormCliente() {
    setClienteForm(FORM_CLIENTE_INICIAL);
    setClienteEditandoId('');
  }

  function limpiarFormTecnico() {
    setTecnicoForm(FORM_TECNICO_INICIAL);
    setTecnicoEditandoId('');
  }

  function limpiarFormEquipo() {
    setEquipoForm(FORM_EQUIPO_INICIAL);
    setEquipoEditandoId('');
  }

  async function guardarCliente(evento) {
    evento.preventDefault();
    setMensaje('');
    setError('');

    try {
      if (clienteEditandoId) {
        await actualizarCliente(clienteEditandoId, clienteForm);
        setMensaje('Cliente actualizado correctamente.');
      } else {
        await crearCliente(clienteForm);
        setMensaje('Cliente creado correctamente.');
      }
      limpiarFormCliente();
      await recargarDatos();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el cliente.');
    }
  }

  async function borrarCliente(idCliente) {
    setMensaje('');
    setError('');

    try {
      await eliminarCliente(idCliente);
      setMensaje('Cliente eliminado correctamente.');
      if (clienteEditandoId === idCliente) {
        limpiarFormCliente();
      }
      await recargarDatos();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el cliente.');
    }
  }

  async function guardarTecnico(evento) {
    evento.preventDefault();
    setMensaje('');
    setError('');

    try {
      if (tecnicoEditandoId) {
        await actualizarTecnico(tecnicoEditandoId, tecnicoForm);
        setMensaje('Técnico actualizado correctamente.');
      } else {
        await crearTecnico(tecnicoForm);
        setMensaje('Técnico creado correctamente.');
      }
      limpiarFormTecnico();
      await recargarDatos();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el técnico.');
    }
  }

  async function borrarTecnico(idTecnico) {
    setMensaje('');
    setError('');

    try {
      await eliminarTecnico(idTecnico);
      setMensaje('Técnico eliminado correctamente.');
      if (tecnicoEditandoId === idTecnico) {
        limpiarFormTecnico();
      }
      await recargarDatos();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el técnico.');
    }
  }

  async function guardarEquipo(evento) {
    evento.preventDefault();
    setMensaje('');
    setError('');

    try {
      const payload = {
        cliente_id: equipoForm.cliente_id,
        nombre: equipoForm.nombre,
        marca: equipoForm.marca || null,
        modelo: equipoForm.modelo || null,
        numero_serie: equipoForm.numero_serie || null,
        ultima_revision: equipoForm.ultima_revision || null,
      };

      if (equipoEditandoId) {
        await actualizarEquipo(equipoEditandoId, payload);
        setMensaje('Equipo actualizado correctamente.');
      } else {
        await crearEquipo(payload);
        setMensaje('Equipo creado correctamente.');
      }

      limpiarFormEquipo();
      await recargarDatos();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el equipo.');
    }
  }

  async function borrarEquipo(idEquipo) {
    setMensaje('');
    setError('');

    try {
      await eliminarEquipo(idEquipo);
      setMensaje('Equipo eliminado correctamente.');
      if (equipoEditandoId === idEquipo) {
        limpiarFormEquipo();
      }
      await recargarDatos();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el equipo.');
    }
  }

  if (sinConfiguracion) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        Configura Supabase en `.env` para habilitar el CRUD de clientes y técnicos.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-marca-900 p-4 text-white shadow-lg">
        <h2 className="text-lg font-bold">Catálogos SAT</h2>
        <p className="mt-1 text-sm text-slate-200">Gestión de clientes, técnicos y equipos en entorno COTEPA.</p>
      </header>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-marca-100 bg-marca-50 p-1">
        <button
          type="button"
          onClick={() => setTabActiva('clientes')}
          className={`rounded-xl px-3 py-3 text-sm font-bold ${
            tabActiva === 'clientes' ? 'bg-cotepa-rojo-500 text-white shadow' : 'text-marca-700'
          }`}
        >
          Clientes
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('tecnicos')}
          className={`rounded-xl px-3 py-3 text-sm font-bold ${
            tabActiva === 'tecnicos' ? 'bg-cotepa-rojo-500 text-white shadow' : 'text-marca-700'
          }`}
        >
          Técnicos
        </button>
        <button
          type="button"
          onClick={() => setTabActiva('equipos')}
          className={`rounded-xl px-3 py-3 text-sm font-bold ${
            tabActiva === 'equipos' ? 'bg-cotepa-rojo-500 text-white shadow' : 'text-marca-700'
          }`}
        >
          Equipos
        </button>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {mensaje && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {mensaje}
        </p>
      )}

      {tabActiva === 'clientes' && (
        <>
          <form onSubmit={guardarCliente} className="space-y-3 rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta">
            <h3 className="text-base font-bold text-slate-800">
              {clienteEditandoId ? 'Editar cliente' : 'Nuevo cliente'}
            </h3>

            <input
              required
              value={clienteForm.nombre}
              onChange={(e) => setClienteForm((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Nombre del cliente"
            />
            <input
              value={clienteForm.direccion}
              onChange={(e) => setClienteForm((p) => ({ ...p, direccion: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Dirección"
            />
            <input
              value={clienteForm.telefono}
              onChange={(e) => setClienteForm((p) => ({ ...p, telefono: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Teléfono"
            />
            <input
              type="email"
              value={clienteForm.email}
              onChange={(e) => setClienteForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Email"
            />

            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-cotepa-rojo-500 px-4 py-3 text-sm font-bold text-white" type="submit">
                {clienteEditandoId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-700"
                type="button"
                onClick={limpiarFormCliente}
              >
                Limpiar
              </button>
            </div>
          </form>

          <div className="space-y-2 pb-20">
            {cargando && <p className="text-sm font-semibold text-slate-600">Cargando clientes...</p>}
            {!cargando &&
              clientes.map((cliente) => (
                <article key={cliente.id} className="rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta">
                  <p className="text-sm font-bold text-slate-800">{cliente.nombre}</p>
                  <p className="text-xs text-slate-600">{cliente.telefono || 'Sin teléfono'} · {cliente.email || 'Sin email'}</p>
                  <p className="mt-1 text-xs text-slate-500">{cliente.direccion || 'Sin dirección'}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-marca-50 px-3 py-2 text-xs font-bold text-marca-700"
                      onClick={() => {
                        setClienteEditandoId(cliente.id);
                        setClienteForm({
                          nombre: cliente.nombre || '',
                          direccion: cliente.direccion || '',
                          telefono: cliente.telefono || '',
                          email: cliente.email || '',
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700"
                      onClick={() => borrarCliente(cliente.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </>
      )}

      {tabActiva === 'tecnicos' && (
        <>
          <form onSubmit={guardarTecnico} className="space-y-3 rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta">
            <h3 className="text-base font-bold text-slate-800">
              {tecnicoEditandoId ? 'Editar técnico' : 'Nuevo técnico'}
            </h3>

            <input
              required
              value={tecnicoForm.nombre}
              onChange={(e) => setTecnicoForm((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Nombre del técnico"
            />
            <input
              value={tecnicoForm.especialidad}
              onChange={(e) => setTecnicoForm((p) => ({ ...p, especialidad: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Especialidad"
            />

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={tecnicoForm.activo}
                onChange={(e) => setTecnicoForm((p) => ({ ...p, activo: e.target.checked }))}
              />
              Técnico activo
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-cotepa-rojo-500 px-4 py-3 text-sm font-bold text-white" type="submit">
                {tecnicoEditandoId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-700"
                type="button"
                onClick={limpiarFormTecnico}
              >
                Limpiar
              </button>
            </div>
          </form>

          <div className="space-y-2 pb-20">
            {cargando && <p className="text-sm font-semibold text-slate-600">Cargando técnicos...</p>}
            {!cargando &&
              tecnicos.map((tecnico) => (
                <article key={tecnico.id} className="rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta">
                  <p className="text-sm font-bold text-slate-800">{tecnico.nombre}</p>
                  <p className="text-xs text-slate-600">
                    {tecnico.especialidad || 'Sin especialidad'} · {tecnico.activo ? 'Activo' : 'Inactivo'}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-marca-50 px-3 py-2 text-xs font-bold text-marca-700"
                      onClick={() => {
                        setTecnicoEditandoId(tecnico.id);
                        setTecnicoForm({
                          nombre: tecnico.nombre || '',
                          especialidad: tecnico.especialidad || '',
                          activo: Boolean(tecnico.activo),
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700"
                      onClick={() => borrarTecnico(tecnico.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </>
      )}

      {tabActiva === 'equipos' && (
        <>
          <form onSubmit={guardarEquipo} className="space-y-3 rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta">
            <h3 className="text-base font-bold text-slate-800">
              {equipoEditandoId ? 'Editar equipo' : 'Nuevo equipo'}
            </h3>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Cliente *</span>
              <select
                required
                value={equipoForm.cliente_id}
                onChange={(e) => setEquipoForm((p) => ({ ...p, cliente_id: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Selecciona cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </label>

            <input
              required
              value={equipoForm.nombre}
              onChange={(e) => setEquipoForm((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Nombre del equipo"
            />
            <input
              value={equipoForm.marca}
              onChange={(e) => setEquipoForm((p) => ({ ...p, marca: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Marca"
            />
            <input
              value={equipoForm.modelo}
              onChange={(e) => setEquipoForm((p) => ({ ...p, modelo: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Modelo"
            />
            <input
              value={equipoForm.numero_serie}
              onChange={(e) => setEquipoForm((p) => ({ ...p, numero_serie: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Número de serie"
            />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Última revisión</span>
              <input
                type="date"
                value={equipoForm.ultima_revision}
                onChange={(e) => setEquipoForm((p) => ({ ...p, ultima_revision: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-cotepa-rojo-500 px-4 py-3 text-sm font-bold text-white" type="submit">
                {equipoEditandoId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-700"
                type="button"
                onClick={limpiarFormEquipo}
              >
                Limpiar
              </button>
            </div>
          </form>

          <div className="space-y-2 pb-20">
            <input
              value={busquedaEquipo}
              onChange={(e) => setBusquedaEquipo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              placeholder="Buscar por cliente, nombre, marca, modelo o serie"
            />
            {cargando && <p className="text-sm font-semibold text-slate-600">Cargando equipos...</p>}
            {!cargando &&
              equiposFiltrados.map((equipo) => (
                <article key={equipo.id} className="rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta">
                  <p className="text-sm font-bold text-slate-800">{equipo.nombre}</p>
                  <p className="text-xs text-slate-600">
                    {(equipo.clientes && equipo.clientes.nombre) || 'Cliente no disponible'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {equipo.marca || 'Sin marca'} · {equipo.modelo || 'Sin modelo'} · {equipo.numero_serie || 'Sin serie'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Última revisión: {equipo.ultima_revision || 'No registrada'}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-marca-50 px-3 py-2 text-xs font-bold text-marca-700"
                      onClick={() => {
                        setEquipoEditandoId(equipo.id);
                        setEquipoForm({
                          cliente_id: equipo.cliente_id || '',
                          nombre: equipo.nombre || '',
                          marca: equipo.marca || '',
                          modelo: equipo.modelo || '',
                          numero_serie: equipo.numero_serie || '',
                          ultima_revision: equipo.ultima_revision || '',
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700"
                      onClick={() => borrarEquipo(equipo.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            {!cargando && busquedaEquipo.trim() && equiposFiltrados.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                No hay equipos que coincidan con la búsqueda.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
