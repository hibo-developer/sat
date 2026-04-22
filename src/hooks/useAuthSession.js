import { useEffect, useState } from 'react';
import {
  cerrarSesion,
  escucharCambiosSesion,
  iniciarSesionConPassword,
  obtenerSesionActual,
} from '../services/authService';
import { tieneConfiguracionSupabase } from '../services/supabaseClient';

export function useAuthSession() {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let montado = true;

    async function inicializarSesion() {
      if (!tieneConfiguracionSupabase()) {
        setCargando(false);
        return;
      }

      try {
        const sesionActual = await obtenerSesionActual();
        if (montado) {
          setSesion(sesionActual);
        }
      } catch (err) {
        if (montado) {
          setError(err.message || 'No se pudo comprobar la sesion actual.');
        }
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    }

    inicializarSesion();

    const desuscribir = escucharCambiosSesion((siguienteSesion) => {
      if (montado) {
        setSesion(siguienteSesion);
      }
    });

    return () => {
      montado = false;
      desuscribir();
    };
  }, []);

  async function login(email, password) {
    setError('');
    const sesionCreada = await iniciarSesionConPassword({ email, password });
    setSesion(sesionCreada);
    return sesionCreada;
  }

  async function logout() {
    setError('');
    await cerrarSesion();
    setSesion(null);
  }

  return {
    sesion,
    cargando,
    error,
    login,
    logout,
  };
}