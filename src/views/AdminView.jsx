import { useEffect, useState } from 'react';
import { DatabaseZap, Eraser, RefreshCw, ShieldUser } from 'lucide-react';
import { cargarDatosDemoSat, limpiarDatosDemoSat } from '../services/demoDataService';
import { tieneConfiguracionSupabase } from '../services/supabaseClient';
import { listarTecnicos } from '../services/tecnicosService';
import {
  actualizarUsuarioSat,
  crearUsuarioSat,
  eliminarUsuarioSat,
  listarUsuariosSat,
} from '../services/userAdminService';

const FORM_USUARIO_INICIAL = {
  email: '',
  password: '',
  rol: 'tecnico',
  nombre_visible: '',
  tecnico_nombre: '',
  tecnico_especialidad: '',
};

export function AdminView() {
  const [trabajando, setTrabajando] = useState(false);
  const [confirmandoLimpieza, setConfirmandoLimpieza] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [errorUsuarios, setErrorUsuarios] = useState('');
  const [mensajeUsuarios, setMensajeUsuarios] = useState('');
  const [usuarioEditandoId, setUsuarioEditandoId] = useState('');
  const [formUsuario, setFormUsuario] = useState(FORM_USUARIO_INICIAL);

  useEffect(() => {
    async function inicializarGestionUsuarios() {
      setCargandoUsuarios(true);
      setErrorUsuarios('');

      try {
        const usuariosCargados = await listarUsuariosSat();

        setUsuarios(usuariosCargados);
      } catch (err) {
        setErrorUsuarios(err.message || 'No se pudo cargar la gestion de usuarios.');
      } finally {
        setCargandoUsuarios(false);
      }
    }

    if (tieneConfiguracionSupabase()) {
      inicializarGestionUsuarios();
    }
  }, []);

  async function ejecutarAccion(accion) {
    setTrabajando(true);
    setError('');
    setMensaje('');

    try {
      const resultado = await accion();
      setMensaje(
        `Clientes: ${resultado.clientes} · Técnicos: ${resultado.tecnicos} · Equipos: ${resultado.equipos} · Órdenes: ${resultado.ordenes}`
      );
    } catch (err) {
      setError(err.message || 'No se pudo ejecutar la acción de administración.');
    } finally {
      setTrabajando(false);
    }
  }

  async function solicitarLimpieza() {
    if (!confirmandoLimpieza) {
      setError('');
      setMensaje('');
      setConfirmandoLimpieza(true);
      return;
    }

    await ejecutarAccion(limpiarDatosDemoSat);
    setConfirmandoLimpieza(false);
  }

  function cancelarLimpieza() {
    setConfirmandoLimpieza(false);
  }

  function resetFormularioUsuario() {
    setFormUsuario(FORM_USUARIO_INICIAL);
    setUsuarioEditandoId('');
  }

  async function recargarUsuarios() {
    setCargandoUsuarios(true);
    setErrorUsuarios('');

    try {
      const usuariosCargados = await listarUsuariosSat();
      setUsuarios(usuariosCargados);
    } catch (err) {
      setErrorUsuarios(err.message || 'No se pudo actualizar el listado de usuarios.');
    } finally {
      setCargandoUsuarios(false);
    }
  }

  function editarUsuario(usuario) {
    setUsuarioEditandoId(usuario.user_id);
    setMensajeUsuarios('');
    setErrorUsuarios('');
    setFormUsuario({
      email: usuario.email || '',
      password: '',
      rol: usuario.rol || 'tecnico',
      nombre_visible: usuario.nombre_visible || '',
      tecnico_nombre: usuario.tecnico_nombre || '',
      tecnico_especialidad: usuario.tecnico_especialidad || '',
    });
  }

  async function guardarUsuario(evento) {
    evento.preventDefault();
    setGuardandoUsuario(true);
    setMensajeUsuarios('');
    setErrorUsuarios('');

    try {
      if (usuarioEditandoId) {
        await actualizarUsuarioSat(usuarioEditandoId, formUsuario);
        setMensajeUsuarios('Usuario actualizado correctamente.');
      } else {
        await crearUsuarioSat(formUsuario);
        setMensajeUsuarios('Usuario creado correctamente.');
      }

      resetFormularioUsuario();
      await recargarUsuarios();
    } catch (err) {
      setErrorUsuarios(err.message || 'No se pudo guardar el usuario.');
    } finally {
      setGuardandoUsuario(false);
    }
  }

  async function borrarUsuario(userId) {
    setGuardandoUsuario(true);
    setMensajeUsuarios('');
    setErrorUsuarios('');

    try {
      await eliminarUsuarioSat(userId);
      setMensajeUsuarios('Usuario eliminado correctamente.');

      if (usuarioEditandoId === userId) {
        resetFormularioUsuario();
      }

      await recargarUsuarios();
    } catch (err) {
      setErrorUsuarios(err.message || 'No se pudo eliminar el usuario.');
    } finally {
      setGuardandoUsuario(false);
    }
  }

  if (!tieneConfiguracionSupabase()) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        Configura Supabase en `.env` para usar las herramientas internas de administración.
      </section>
    );
  }

  return (
    <section className="space-y-4 pb-20">
      <header className="rounded-2xl bg-marca-900 p-4 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <DatabaseZap className="h-5 w-5" />
          <h2 className="text-lg font-bold">Administración interna</h2>
        </div>
        <p className="mt-2 text-sm text-slate-300">
          Herramientas para cargar o limpiar datos demo del entorno de Supabase.
        </p>
      </header>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {mensaje && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {mensaje}
        </p>
      )}

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => {
            setConfirmandoLimpieza(false);
            ejecutarAccion(cargarDatosDemoSat);
          }}
          disabled={trabajando}
          className="flex items-center justify-center gap-2 rounded-2xl bg-cotepa-rojo-500 px-4 py-4 text-sm font-bold text-white disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          {trabajando ? 'Procesando...' : 'Cargar demo'}
        </button>

        <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
          <button
            type="button"
            onClick={solicitarLimpieza}
            disabled={trabajando}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-4 text-sm font-bold text-white disabled:opacity-60"
          >
            <Eraser className="h-4 w-4" />
            {trabajando ? 'Procesando...' : confirmandoLimpieza ? 'Confirmar limpieza demo' : 'Limpiar demo'}
          </button>

          {confirmandoLimpieza && !trabajando && (
            <>
              <p className="text-sm font-semibold text-rose-800">
                Esta acción eliminará los datos demo y de prueba detectados. Pulsa de nuevo para confirmar.
              </p>
              <button
                type="button"
                onClick={cancelarLimpieza}
                className="w-full rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-700"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border border-marca-100 bg-white p-4 shadow-tarjeta">
        <header className="flex items-center gap-2">
          <ShieldUser className="h-5 w-5 text-marca-700" />
          <h3 className="text-base font-bold text-slate-800">Usuarios y Roles</h3>
        </header>

        <p className="text-sm text-slate-600">
          CRUD de usuarios autenticados y asignacion de rol SAT (admin, oficina, tecnico). Para rol tecnico puedes
          vincular un tecnico activo.
        </p>

        {errorUsuarios && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {errorUsuarios}
          </p>
        )}

        {mensajeUsuarios && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            {mensajeUsuarios}
          </p>
        )}

        <form onSubmit={guardarUsuario} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Email *</span>
            <input
              required
              type="email"
              value={formUsuario.email}
              onChange={(evento) => setFormUsuario((previo) => ({ ...previo, email: evento.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              disabled={guardandoUsuario}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">
              {usuarioEditandoId ? 'Nueva contrasena (opcional)' : 'Contrasena inicial *'}
            </span>
            <input
              type="password"
              value={formUsuario.password}
              required={!usuarioEditandoId}
              minLength={6}
              onChange={(evento) => setFormUsuario((previo) => ({ ...previo, password: evento.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              disabled={guardandoUsuario}
              placeholder={usuarioEditandoId ? 'Dejar vacio para mantener la actual' : 'Minimo 6 caracteres'}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Nombre visible</span>
            <input
              type="text"
              value={formUsuario.nombre_visible}
              onChange={(evento) =>
                setFormUsuario((previo) => ({ ...previo, nombre_visible: evento.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              disabled={guardandoUsuario}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Rol *</span>
            <select
              value={formUsuario.rol}
              onChange={(evento) =>
                setFormUsuario((previo) => ({
                  ...previo,
                  rol: evento.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              disabled={guardandoUsuario}
            >
              <option value="admin">Admin</option>
              <option value="oficina">Oficina</option>
              <option value="tecnico">Tecnico</option>
            </select>
          </label>

          {formUsuario.rol === 'tecnico' && (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Nombre del tecnico</span>
                <input
                  type="text"
                  value={formUsuario.tecnico_nombre}
                  onChange={(evento) =>
                    setFormUsuario((previo) => ({ ...previo, tecnico_nombre: evento.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  disabled={guardandoUsuario}
                  placeholder="Si se deja vacio se usa el nombre visible"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Especialidad</span>
                <input
                  type="text"
                  value={formUsuario.tecnico_especialidad}
                  onChange={(evento) =>
                    setFormUsuario((previo) => ({ ...previo, tecnico_especialidad: evento.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  disabled={guardandoUsuario}
                  placeholder="Ej: Hornos industriales"
                />
              </label>
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              disabled={guardandoUsuario}
              className="w-full rounded-xl bg-marca-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {guardandoUsuario ? 'Guardando...' : usuarioEditandoId ? 'Actualizar usuario' : 'Crear usuario'}
            </button>

            <button
              type="button"
              onClick={resetFormularioUsuario}
              disabled={guardandoUsuario}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-60"
            >
              Limpiar formulario
            </button>
          </div>
        </form>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Usuarios registrados: {usuarios.length}</p>
            <button
              type="button"
              onClick={recargarUsuarios}
              disabled={cargandoUsuarios || guardandoUsuario}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60"
            >
              {cargandoUsuarios ? 'Actualizando...' : 'Recargar'}
            </button>
          </div>

          {cargandoUsuarios ? (
            <p className="text-sm font-semibold text-slate-600">Cargando usuarios...</p>
          ) : (
            <ul className="space-y-2">
              {usuarios.map((usuario) => (
                <li key={usuario.user_id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-bold text-slate-800">{usuario.email}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rol: {usuario.rol}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Nombre visible: {usuario.nombre_visible || 'Sin definir'}
                  </p>
                  {usuario.rol === 'tecnico' && (
                    <p className="text-xs text-slate-600">
                      Tecnico: {usuario.tecnico_nombre || 'Sin nombre'}
                      {usuario.tecnico_especialidad ? ` · ${usuario.tecnico_especialidad}` : ''}
                    </p>
                  )}

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => editarUsuario(usuario)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                      disabled={guardandoUsuario}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => borrarUsuario(usuario.user_id)}
                      className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white"
                      disabled={guardandoUsuario}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </section>
  );
}