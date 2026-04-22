import { useState } from 'react';
import { DatabaseZap, Eraser, RefreshCw } from 'lucide-react';
import { cargarDatosDemoSat, limpiarDatosDemoSat } from '../services/demoDataService';
import { tieneConfiguracionSupabase } from '../services/supabaseClient';

export function AdminView() {
  const [trabajando, setTrabajando] = useState(false);
  const [confirmandoLimpieza, setConfirmandoLimpieza] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

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
    </section>
  );
}