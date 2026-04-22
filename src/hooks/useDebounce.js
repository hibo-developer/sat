import { useEffect, useState } from 'react';

export function useDebounce(valor, retraso = 250) {
  const [valorDebounce, setValorDebounce] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setValorDebounce(valor);
    }, retraso);

    return () => clearTimeout(temporizador);
  }, [valor, retraso]);

  return valorDebounce;
}
