import { useState } from 'react';
import { NavbarInferior } from './components/NavbarInferior';
import { useAuthSession } from './hooks/useAuthSession';
import { tieneConfiguracionSupabase } from './services/supabaseClient';
import logoCotepa from './assets/cotepa.jpg';
import { AdminView } from './views/AdminView';
import { AccesoView } from './views/AccesoView';
import { ClientesView } from './views/ClientesView';
import { ListaOrdenesView } from './views/ListaOrdenesView';
import { ParteTrabajoView } from './views/ParteTrabajoView';

const TITULOS = {
  ordenes: 'Panel SAT',
  parte: 'Nuevo Parte',
  clientes: 'Clientes',
  admin: 'Administración',
};

export default function App() {
  const [vistaActiva, setVistaActiva] = useState('ordenes');
  const { sesion, cargando, error, login, logout } = useAuthSession();
  const requiereLogin = tieneConfiguracionSupabase();
  const accesoBloqueado = requiereLogin && !sesion;

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-5">
      <header className="mb-4 overflow-hidden rounded-2xl border border-marca-100 bg-white shadow-tarjeta">
        <div className="h-2 w-full bg-cotepa-rojo-500" />
        <div className="flex items-center gap-3 p-3">
          <img
            src={logoCotepa}
            alt="Logo COTEPA"
            className="h-16 w-16 rounded-xl border border-marca-100 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-marca-700">SAT Móvil COTEPA</p>
            <p className="truncate text-base font-extrabold text-marca-900">Hornos y equipos para panificación</p>
          </div>
        </div>

        <div className="border-t border-marca-100 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-marca-900">
            {accesoBloqueado ? 'Acceso' : TITULOS[vistaActiva]}
          </h1>
          {requiereLogin && sesion && (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-xl border border-marca-100 bg-marca-50 px-3 py-2 text-xs font-bold text-marca-700"
            >
              Cerrar sesion
            </button>
          )}
        </div>
        </div>
      </header>

      {accesoBloqueado ? (
        <AccesoView onLogin={login} cargandoSesion={cargando} errorSesion={error} />
      ) : (
        <>
          {vistaActiva === 'ordenes' && <ListaOrdenesView />}
          {vistaActiva === 'parte' && <ParteTrabajoView />}
          {vistaActiva === 'clientes' && <ClientesView />}
          {vistaActiva === 'admin' && <AdminView />}
        </>
      )}

      {!accesoBloqueado && (
        <NavbarInferior vistaActiva={vistaActiva} onCambiarVista={setVistaActiva} />
      )}
    </div>
  );
}
