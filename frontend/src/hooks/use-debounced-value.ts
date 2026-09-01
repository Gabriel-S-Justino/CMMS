// src/hooks/use-debounced-value.ts
//
// Atrasa a propagação de um valor. Usado na busca da home: sem isso, cada tecla
// dispararia um GET /ativos.

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(valor: T, atrasoMs: number): T {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), atrasoMs);
    return () => clearTimeout(timer);
  }, [valor, atrasoMs]);

  return atrasado;
}
