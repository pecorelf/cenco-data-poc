import { useEffect, useRef, useState } from "react";

// Sistema de motion del portal. Tres reglas:
//  1. Cada movimiento comunica algo: una entrada, un cambio de dato o la
//     respuesta a una acción. Nada se mueve solo por decorar.
//  2. Los datos se TRANSFORMAN, no se reinician: al cambiar un filtro, las
//     barras y líneas viajan desde su valor anterior al nuevo.
//  3. prefers-reduced-motion se respeta siempre: los valores saltan al
//     destino sin interpolación.

export const DURACION = {
  rapida: 150, // hover, presionar
  base: 220, // abrir/cerrar paneles, popovers
  pantalla: 320, // cambio de pantalla
  datos: 700, // barras, líneas y cifras que cambian
} as const;

export const salida = (t: number) => 1 - Math.pow(1 - t, 3);

export function reduceMovimiento(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Interpola un arreglo de números hacia `destino`.
 * - Primer montaje: parte desde `inicial` (si no viene, no anima).
 * - Cambios posteriores: parte desde el valor que se está mostrando, aunque
 *   la animación anterior no haya terminado — así nunca hay saltos.
 * - `retrasos` (ms por posición) solo se aplica en la primera entrada: el
 *   escalonado presenta los datos una vez; las actualizaciones se mueven
 *   juntas para que se lea el cambio completo de un vistazo.
 */
export function useTween(
  destino: number[],
  {
    duracion = DURACION.datos,
    inicial,
    retrasos,
  }: { duracion?: number; inicial?: number[]; retrasos?: number[] } = {}
): number[] {
  const [actual, setActual] = useState<number[]>(() =>
    reduceMovimiento() || !inicial ? destino : inicial
  );
  const actualRef = useRef(actual);
  actualRef.current = actual;
  const primera = useRef(true);
  const clave = destino.join("|");

  useEffect(() => {
    const esPrimera = primera.current;
    primera.current = false;
    if (reduceMovimiento()) {
      setActual(destino);
      return;
    }
    const origen = destino.map((v, i) => actualRef.current[i] ?? inicial?.[i] ?? v);
    if (origen.every((v, i) => v === destino[i])) return;

    const escalon = esPrimera && retrasos ? retrasos : destino.map(() => 0);
    const total = duracion + Math.max(0, ...escalon);
    const t0 = performance.now();
    let raf = 0;
    const paso = (t: number) => {
      const transcurrido = t - t0;
      setActual(
        destino.map((v, i) => {
          const p = Math.min(1, Math.max(0, (transcurrido - escalon[i]) / duracion));
          return origen[i] + (v - origen[i]) * salida(p);
        })
      );
      if (transcurrido < total) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, duracion]);

  // Si cambió la cantidad de puntos, los nuevos entran ya en su valor.
  return destino.map((v, i) => actual[i] ?? v);
}

/** Detecta cuando un número sube, para disparar una animación de "llegó algo". */
export function useAlSubir(valor: number): number {
  const anterior = useRef(valor);
  const [pulsos, setPulsos] = useState(0);
  useEffect(() => {
    if (valor > anterior.current) setPulsos((p) => p + 1);
    anterior.current = valor;
  }, [valor]);
  return pulsos;
}
