import { useEffect, useState } from 'react';
import { CircleCheckBig, Clock3, Hammer, TriangleAlert, Wrench } from 'lucide-react';
import { ToastEstado } from '../components/ToastEstado';
import { useOrdenes } from '../hooks/useOrdenes';
import { useDebounce } from '../hooks/useDebounce';
import {
  obtenerClientes,
  obtenerEquiposPorCliente,
  obtenerTecnicosActivos,
} from '../services/catalogosService';
import { tieneConfiguracionSupabase } from '../services/supabaseClient';

const estilosEstado = {
  Pendiente: {
    icono: Clock3,
    clase: 'bg-amber-100 text-amber-800',
  },
  'En Proceso': {
    icono: Hammer,
    clase: 'bg-sky-100 text-sky-800',
  },
  Finalizado: {
    icono: CircleCheckBig,
    clase: 'bg-emerald-100 text-emerald-800',
  },
  Pausado: {
    icono: TriangleAlert,
    clase: 'bg-orange-100 text-orange-800',
  },
};

const FILTROS_ESTADO = ['Todas', 'Pendiente', 'En Proceso', 'Pausado', 'Finalizado'];
const OPCIONES_ESTADO_EDITABLE = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'pausado', label: 'Pausado' },
];

function FormularioNuevaOrden({ onCrear, accionEnCurso, onNotificar }) {
  const LIMITE_CATALOGO = 20;
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [cargandoEquipos, setCargandoEquipos] = useState(false);
  const [cargandoTecnicos, setCargandoTecnicos] = useState(false);
  const [hayMasClientes, setHayMasClientes] = useState(false);
  const [hayMasEquipos, setHayMasEquipos] = useState(false);
  const [hayMasTecnicos, setHayMasTecnicos] = useState(false);
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [paginaEquipos, setPaginaEquipos] = useState(1);
  const [paginaTecnicos, setPaginaTecnicos] = useState(1);
  const [formulario, setFormulario] = useState({
    cliente_id: '',
    equipo_id: '',
    tecnico_id: '',
    descripcion_averia: '',
    prioridad: 'media',
  });

  const [mensaje, setMensaje] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [busquedaEquipo, setBusquedaEquipo] = useState('');
  const [busquedaTecnico, setBusquedaTecnico] = useState('');

  const busquedaClienteDebounce = useDebounce(busquedaCliente, 250);
  const busquedaEquipoDebounce = useDebounce(busquedaEquipo, 250);
  const busquedaTecnicoDebounce = useDebounce(busquedaTecnico, 250);
  const cargandoCatalogos = cargandoClientes || cargandoEquipos || cargandoTecnicos;

  useEffect(() => {
    async function cargarClientes() {
      if (!tieneConfiguracionSupabase()) {
        setMensaje('Configura Supabase para habilitar el alta de órdenes con catálogos reales.');
        return;
      }

      setCargandoClientes(true);

      try {
        const respuesta = await obtenerClientes({
          busqueda: busquedaClienteDebounce,
          limite: LIMITE_CATALOGO,
          pagina: paginaClientes,
        });

        setClientes((previo) => (paginaClientes === 1 ? respuesta.items : [...previo, ...respuesta.items]));
        setHayMasClientes(respuesta.hayMas);
      } catch {
        setMensaje('No se pudieron cargar los clientes.');
      } finally {
        setCargandoClientes(false);
      }
    }

    cargarClientes();
  }, [busquedaClienteDebounce, paginaClientes]);

  useEffect(() => {
    async function cargarTecnicos() {
      if (!tieneConfiguracionSupabase()) {
        return;
      }

      setCargandoTecnicos(true);

      try {
        const respuesta = await obtenerTecnicosActivos({
          busqueda: busquedaTecnicoDebounce,
          limite: LIMITE_CATALOGO,
          pagina: paginaTecnicos,
        });

        setTecnicos((previo) => (paginaTecnicos === 1 ? respuesta.items : [...previo, ...respuesta.items]));
        setHayMasTecnicos(respuesta.hayMas);
      } catch {
        setMensaje('No se pudieron cargar los técnicos.');
      } finally {
        setCargandoTecnicos(false);
      }
    }

    cargarTecnicos();
  }, [busquedaTecnicoDebounce, paginaTecnicos]);

  useEffect(() => {
    async function cargarEquipos() {
      if (!formulario.cliente_id || !tieneConfiguracionSupabase()) {
        setEquipos([]);
        setHayMasEquipos(false);
        setBusquedaEquipo('');
        setFormulario((previo) => ({ ...previo, equipo_id: '' }));
        return;
      }

      setCargandoEquipos(true);

      try {
        const respuesta = await obtenerEquiposPorCliente(formulario.cliente_id, {
          busqueda: busquedaEquipoDebounce,
          limite: LIMITE_CATALOGO,
          pagina: paginaEquipos,
        });

        setEquipos((previo) => (paginaEquipos === 1 ? respuesta.items : [...previo, ...respuesta.items]));
        setHayMasEquipos(respuesta.hayMas);
      } catch {
        setEquipos([]);
        setMensaje('No se pudieron cargar los equipos del cliente seleccionado.');
      } finally {
        setCargandoEquipos(false);
      }
    }

    cargarEquipos();
  }, [formulario.cliente_id, busquedaEquipoDebounce, paginaEquipos]);

  function actualizarCampo(evento) {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setMensaje('');

    try {
      await onCrear({
        ...formulario,
        equipo_id: formulario.equipo_id || null,
        tecnico_id: formulario.tecnico_id || null,
      });

      setFormulario({
        cliente_id: '',
        equipo_id: '',
        tecnico_id: '',
        descripcion_averia: '',
        prioridad: 'media',
      });
      setBusquedaCliente('');
      setBusquedaEquipo('');
      setBusquedaTecnico('');
      setPaginaClientes(1);
      setPaginaEquipos(1);
      setPaginaTecnicos(1);
      setMensaje('Orden creada correctamente.');
      onNotificar({
        tipo: 'exito',
        titulo: 'Orden creada',
        descripcion: 'La orden se ha registrado y ya aparece en la lista.',
      });
    } catch (err) {
      setMensaje(err.message || 'No se pudo crear la orden. Revisa los datos obligatorios y vuelve a intentarlo.');
      onNotificar({
        tipo: 'error',
        titulo: 'No se pudo crear la orden',
        descripcion: err.message || 'Revisa los datos obligatorios y vuelve a intentarlo.',
      });
    }
  }

  return (
    <form
      onSubmit={enviarFormulario}
      className="space-y-3 rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta"
    >
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-marca-700" />
        <h3 className="text-base font-bold text-slate-800">Nueva Orden de Trabajo</h3>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-700">Cliente *</span>
        <input
          value={busquedaCliente}
          onChange={(evento) => {
            setPaginaClientes(1);
            setBusquedaCliente(evento.target.value);
          }}
          className="mb-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          placeholder="Buscar cliente por nombre"
          disabled={!tieneConfiguracionSupabase() || cargandoCatalogos}
        />
        <select
          required
          name="cliente_id"
          value={formulario.cliente_id}
          onChange={(evento) => {
            const clienteSeleccionado = clientes.find((cliente) => cliente.id === evento.target.value);
            setFormulario((previo) => ({
              ...previo,
              cliente_id: evento.target.value,
              equipo_id: '',
            }));
            setPaginaEquipos(1);
            setEquipos([]);
            setBusquedaEquipo('');
            if (clienteSeleccionado) {
              setBusquedaCliente(clienteSeleccionado.nombre);
            }
          }}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          disabled={!tieneConfiguracionSupabase() || cargandoCatalogos}
        >
          <option value="">Selecciona cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>
        {!!busquedaClienteDebounce && clientes.length === 0 && (
          <p className="mt-1 text-xs font-medium text-slate-500">No hay clientes que coincidan con la búsqueda.</p>
        )}
        {hayMasClientes && (
          <button
            type="button"
            onClick={() => setPaginaClientes((previo) => previo + 1)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
            disabled={cargandoClientes}
          >
            {cargandoClientes ? 'Cargando...' : 'Cargar más clientes'}
          </button>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-700">Equipo</span>
        <input
          value={busquedaEquipo}
          onChange={(evento) => {
            setPaginaEquipos(1);
            setBusquedaEquipo(evento.target.value);
          }}
          className="mb-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          placeholder="Buscar equipo por nombre, marca o modelo"
          disabled={!formulario.cliente_id || !tieneConfiguracionSupabase() || cargandoCatalogos}
        />
        <select
          name="equipo_id"
          value={formulario.equipo_id}
          onChange={(evento) => {
            const equipoSeleccionado = equipos.find((equipo) => equipo.id === evento.target.value);
            setFormulario((previo) => ({ ...previo, equipo_id: evento.target.value }));
            if (equipoSeleccionado) {
              const etiqueta = [equipoSeleccionado.nombre, equipoSeleccionado.marca, equipoSeleccionado.modelo]
                .filter(Boolean)
                .join(' ');
              setBusquedaEquipo(etiqueta);
            }
          }}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          disabled={!formulario.cliente_id || !tieneConfiguracionSupabase() || cargandoCatalogos}
        >
          <option value="">Sin equipo</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.nombre}
              {equipo.marca ? ` - ${equipo.marca}` : ''}
              {equipo.modelo ? ` ${equipo.modelo}` : ''}
            </option>
          ))}
        </select>
        {!!busquedaEquipoDebounce && equipos.length === 0 && (
          <p className="mt-1 text-xs font-medium text-slate-500">No hay equipos que coincidan con la búsqueda.</p>
        )}
        {hayMasEquipos && (
          <button
            type="button"
            onClick={() => setPaginaEquipos((previo) => previo + 1)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
            disabled={cargandoEquipos}
          >
            {cargandoEquipos ? 'Cargando...' : 'Cargar más equipos'}
          </button>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-700">Técnico *</span>
        <input
          value={busquedaTecnico}
          onChange={(evento) => {
            setPaginaTecnicos(1);
            setBusquedaTecnico(evento.target.value);
          }}
          className="mb-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          placeholder="Buscar técnico por nombre o especialidad"
          disabled={!tieneConfiguracionSupabase() || cargandoCatalogos}
        />
        <select
          required
          name="tecnico_id"
          value={formulario.tecnico_id}
          onChange={(evento) => {
            const tecnicoSeleccionado = tecnicos.find((tecnico) => tecnico.id === evento.target.value);
            setFormulario((previo) => ({ ...previo, tecnico_id: evento.target.value }));
            if (tecnicoSeleccionado) {
              const etiqueta = [tecnicoSeleccionado.nombre, tecnicoSeleccionado.especialidad]
                .filter(Boolean)
                .join(' ');
              setBusquedaTecnico(etiqueta);
            }
          }}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          disabled={!tieneConfiguracionSupabase() || cargandoCatalogos}
        >
          <option value="">Selecciona técnico</option>
          {tecnicos.map((tecnico) => (
            <option key={tecnico.id} value={tecnico.id}>
              {tecnico.nombre}
              {tecnico.especialidad ? ` (${tecnico.especialidad})` : ''}
            </option>
          ))}
        </select>
        {!!busquedaTecnicoDebounce && tecnicos.length === 0 && (
          <p className="mt-1 text-xs font-medium text-slate-500">No hay técnicos que coincidan con la búsqueda.</p>
        )}
        {hayMasTecnicos && (
          <button
            type="button"
            onClick={() => setPaginaTecnicos((previo) => previo + 1)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
            disabled={cargandoTecnicos}
          >
            {cargandoTecnicos ? 'Cargando...' : 'Cargar más técnicos'}
          </button>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-700">Descripción de la avería *</span>
        <textarea
          required
          name="descripcion_averia"
          value={formulario.descripcion_averia}
          onChange={actualizarCampo}
          rows={3}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          placeholder="Describe el problema detectado"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-700">Prioridad</span>
        <select
          name="prioridad"
          value={formulario.prioridad}
          onChange={actualizarCampo}
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
        disabled={accionEnCurso || !tieneConfiguracionSupabase() || cargandoCatalogos}
        className="w-full rounded-2xl bg-cotepa-rojo-500 px-4 py-4 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
      >
        {cargandoCatalogos ? 'Cargando catálogos...' : accionEnCurso ? 'Guardando...' : 'Crear Orden'}
      </button>

      {mensaje && <p className="text-xs font-semibold text-slate-600">{mensaje}</p>}
    </form>
  );
}

function TarjetaOrden({ orden, tecnicosActivos, accionEnCurso, onFinalizar, onActualizar, onNotificar }) {
  const { icono: IconoEstado, clase } = estilosEstado[orden.estado] || estilosEstado.Pendiente;
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [mostrarEdicion, setMostrarEdicion] = useState(false);
  const [tareasRealizadas, setTareasRealizadas] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [tiempoEmpleadoMinutos, setTiempoEmpleadoMinutos] = useState('60');
  const [mensajeEdicion, setMensajeEdicion] = useState('');
  const [formularioEdicion, setFormularioEdicion] = useState({
    tecnico_id: orden.tecnicoId || '',
    prioridad: orden.prioridad || 'media',
    estado: orden.estado === 'En Proceso' ? 'en_proceso' : orden.estado === 'Pausado' ? 'pausado' : 'pendiente',
  });

  useEffect(() => {
    setFormularioEdicion({
      tecnico_id: orden.tecnicoId || '',
      prioridad: orden.prioridad || 'media',
      estado: orden.estado === 'En Proceso' ? 'en_proceso' : orden.estado === 'Pausado' ? 'pausado' : 'pendiente',
    });
  }, [orden.estado, orden.prioridad, orden.tecnicoId]);

  async function enviarCierre(evento) {
    evento.preventDefault();
    try {
      await onFinalizar(orden.id, { tareasRealizadas, fotoUrl, tiempoEmpleadoMinutos });
      setMostrarCierre(false);
      setTareasRealizadas('');
      setFotoUrl('');
      setTiempoEmpleadoMinutos('60');
      onNotificar({
        tipo: 'exito',
        titulo: 'Orden finalizada',
        descripcion: `La orden de ${orden.equipo} se ha cerrado correctamente.`,
      });
    } catch (err) {
      onNotificar({
        tipo: 'error',
        titulo: 'No se pudo finalizar la orden',
        descripcion: err.message || 'Revisa los datos de cierre e inténtalo de nuevo.',
      });
    }
  }

  async function guardarEdicion(evento) {
    evento.preventDefault();
    setMensajeEdicion('');

    try {
      await onActualizar(orden.id, formularioEdicion);
      setMostrarEdicion(false);
      setMensajeEdicion('Orden actualizada correctamente.');
      onNotificar({
        tipo: 'exito',
        titulo: 'Orden actualizada',
        descripcion: 'Se han guardado el técnico, el estado y la prioridad.',
      });
    } catch (err) {
      setMensajeEdicion(err.message || 'No se pudo actualizar la orden.');
      onNotificar({
        tipo: 'error',
        titulo: 'No se pudo actualizar la orden',
        descripcion: err.message || 'Revisa los cambios y vuelve a intentarlo.',
      });
    }
  }

  return (
    <article className="rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {orden.numero_ticket ? `SAT-${orden.numero_ticket}` : orden.id}
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-800">{orden.equipo}</h3>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${clase}`}>
          <IconoEstado className="h-4 w-4" />
          {orden.estado}
        </span>
      </div>

      <div className="space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-slate-900">Cliente:</span> {orden.cliente}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Técnico:</span> {orden.tecnico || 'Sin técnico asignado'}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Avería:</span> {orden.descripcion}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-marca-50 px-3 py-2 text-xs font-semibold text-marca-700">
        <span>Prioridad: {orden.prioridad}</span>
        <span>{orden.fecha}</span>
      </div>

      {orden.estado === 'Finalizado' && (
        <div className="mt-3 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Tiempo empleado
              </p>
              <p className="text-sm font-bold text-emerald-950">
                {orden.tiempoEmpleadoMinutos ? `${orden.tiempoEmpleadoMinutos} min` : 'No registrado'}
              </p>
            </div>
            <div className="rounded-lg bg-white/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Coste materiales
              </p>
              <p className="text-sm font-bold text-emerald-950">
                {orden.costeMateriales > 0 ? `${orden.costeMateriales.toFixed(2)} €` : 'Sin coste'}
              </p>
            </div>
          </div>

          <p>
            <span className="font-semibold">Tareas realizadas:</span>{' '}
            {orden.tareasRealizadas || 'Sin detalle de cierre'}
          </p>
          {Array.isArray(orden.materiales) && orden.materiales.length > 0 && (
            <div>
              <p className="font-semibold">Materiales utilizados:</p>
              <ul className="mt-1 space-y-1">
                {orden.materiales.map((material) => (
                  <li key={material.id} className="rounded-lg bg-white/70 px-2 py-2 text-xs text-emerald-950">
                    {material.nombre_material} · {material.cantidad || 1} ud
                    {material.precio_unitario !== null && material.precio_unitario !== undefined
                      ? ` · ${material.precio_unitario} €`
                      : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {orden.fotoUrl && (
            <a
              href={orden.fotoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
            >
              Ver foto de cierre
            </a>
          )}
        </div>
      )}

      {orden.estado !== 'Finalizado' && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMostrarEdicion((previo) => !previo);
                setMensajeEdicion('');
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 active:scale-95"
            >
              {mostrarEdicion ? 'Cancelar edición' : 'Editar orden'}
            </button>

            <button
              type="button"
              onClick={() => setMostrarCierre((previo) => !previo)}
              className="w-full rounded-xl bg-cotepa-rojo-500 px-4 py-3 text-sm font-bold text-white active:scale-95"
            >
              {mostrarCierre ? 'Cancelar cierre' : 'Finalizar Orden'}
            </button>
          </div>

          {mostrarEdicion && (
            <form onSubmit={guardarEdicion} className="space-y-2 rounded-xl border border-marca-100 bg-marca-50 p-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Técnico *</span>
                <select
                  required
                  value={formularioEdicion.tecnico_id}
                  onChange={(evento) =>
                    setFormularioEdicion((previo) => ({ ...previo, tecnico_id: evento.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Selecciona técnico</option>
                  {tecnicosActivos.map((tecnico) => (
                    <option key={tecnico.id} value={tecnico.id}>
                      {tecnico.nombre}
                      {tecnico.especialidad ? ` (${tecnico.especialidad})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Estado</span>
                <select
                  value={formularioEdicion.estado}
                  onChange={(evento) =>
                    setFormularioEdicion((previo) => ({ ...previo, estado: evento.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {OPCIONES_ESTADO_EDITABLE.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Prioridad</span>
                <select
                  value={formularioEdicion.prioridad}
                  onChange={(evento) =>
                    setFormularioEdicion((previo) => ({ ...previo, prioridad: evento.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={accionEnCurso}
                className="w-full rounded-xl bg-marca-900 px-4 py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
              >
                {accionEnCurso ? 'Guardando cambios...' : 'Guardar cambios'}
              </button>

              {mensajeEdicion && <p className="text-xs font-semibold text-slate-600">{mensajeEdicion}</p>}
            </form>
          )}

          {mostrarCierre && (
            <form onSubmit={enviarCierre} className="space-y-2 rounded-xl border border-marca-100 bg-marca-50 p-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Tareas realizadas *</span>
                <textarea
                  required
                  rows={3}
                  value={tareasRealizadas}
                  onChange={(evento) => setTareasRealizadas(evento.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ej: limpieza de filtros y cambio de válvula"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">URL de foto</span>
                <input
                  value={fotoUrl}
                  onChange={(evento) => setFotoUrl(evento.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Tiempo empleado (min) *</span>
                <input
                  required
                  min="1"
                  type="number"
                  value={tiempoEmpleadoMinutos}
                  onChange={(evento) => setTiempoEmpleadoMinutos(evento.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <button
                type="submit"
                disabled={accionEnCurso}
                className="w-full rounded-xl bg-marca-900 px-4 py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
              >
                {accionEnCurso ? 'Cerrando...' : 'Confirmar Finalización'}
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}

export function ListaOrdenesView() {
  const [tecnicosActivos, setTecnicosActivos] = useState([]);
  const [toast, setToast] = useState(null);
  const {
    ordenes,
    ordenesFiltradas,
    cargando,
    error,
    accionEnCurso,
    resumenPorEstado,
    filtroEstado,
    setFiltroEstado,
    crearOrdenDesdeFormulario,
    finalizarOrden,
    actualizarOrden,
  } = useOrdenes();

  useEffect(() => {
    async function cargarTecnicosEdicion() {
      if (!tieneConfiguracionSupabase()) {
        setTecnicosActivos([]);
        return;
      }

      try {
        const respuesta = await obtenerTecnicosActivos({ limite: 100, pagina: 1 });
        setTecnicosActivos(respuesta.items);
      } catch {
        setTecnicosActivos([]);
      }
    }

    cargarTecnicosEdicion();
  }, []);

  function notificar(siguienteToast) {
    setToast({
      id: Date.now(),
      ...siguienteToast,
    });
  }

  if (cargando) {
    return <p className="text-sm font-semibold text-slate-600">Cargando órdenes...</p>;
  }

  return (
    <section className="space-y-4">
      <ToastEstado toast={toast} onClose={() => setToast(null)} />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <header className="rounded-2xl bg-marca-900 p-4 text-white shadow-lg">
        <h2 className="text-lg font-bold">Órdenes de Trabajo</h2>
        <p className="mt-1 text-sm text-slate-200">
          Consulta, crea y actualiza el estado de cada avería desde el móvil.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
          <div className="rounded-xl bg-white/10 p-2">
            <p className="text-slate-300">Pendientes</p>
            <p className="text-base text-white">{resumenPorEstado.Pendiente}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2">
            <p className="text-slate-300">En Proceso</p>
            <p className="text-base text-white">{resumenPorEstado['En Proceso']}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2">
            <p className="text-slate-300">Finalizadas</p>
            <p className="text-base text-white">{resumenPorEstado.Finalizado}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTROS_ESTADO.map((filtro) => (
            <button
              key={filtro}
              type="button"
              onClick={() => setFiltroEstado(filtro)}
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                filtroEstado === filtro ? 'bg-cotepa-rojo-500 text-white' : 'bg-white/10 text-white'
              }`}
            >
              {filtro}
            </button>
          ))}
        </div>
      </header>

      <FormularioNuevaOrden
        onCrear={crearOrdenDesdeFormulario}
        accionEnCurso={accionEnCurso}
        onNotificar={notificar}
      />

      <div className="space-y-3 pb-20">
        {ordenesFiltradas.map((orden) => (
          <TarjetaOrden
            key={orden.id}
            orden={orden}
            tecnicosActivos={tecnicosActivos}
            accionEnCurso={accionEnCurso}
            onFinalizar={finalizarOrden}
            onActualizar={actualizarOrden}
            onNotificar={notificar}
          />
        ))}
      </div>

      {!ordenesFiltradas.length && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-medium text-slate-600">
          <TriangleAlert className="h-4 w-4" />
          No hay órdenes disponibles para el filtro seleccionado.
        </div>
      )}
    </section>
  );
}
