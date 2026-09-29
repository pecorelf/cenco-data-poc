import { BANDERAS, CATEGORIAS, filtrar, type FilaComercial, type Mes } from "./comercial";

// "¿Por qué cambió?" — descomposición EXACTA de una variación con los datos
// que existen en la capa Gold de la demo (venta, margen y participación por
// mes, bandera y categoría).
//
// Para métricas que son promedios ponderados por venta (margen, participación):
//   M = Σ w_s · m_s, con w_s = venta_s / venta_total
//   ΔM = Σ (w1_s − w0_s)(m0_s − M0)   ← efecto MEZCLA
//      + Σ w1_s (m1_s − m0_s)         ← efecto TASA
// La suma cuadra exacto con ΔM (Σ(w1 − w0) = 0). Referir la mezcla al promedio
// M0 hace que cada segmento sume por lo que realmente aporta: ganar peso en
// una categoría de margen alto sube; en una de margen bajo, baja.
//
// Para la venta, la variación es la suma de lo que cambió cada segmento.
//
// Lo que NO se puede separar con estos datos: precio contra costo contra
// volumen físico. Para eso hacen falta unidades vendidas y precio unitario.

export type MetricaVariacion = "margen" | "share" | "venta";
export type Desglose = "categoria" | "bandera";

export const METRICAS_VARIACION: Record<
  MetricaVariacion,
  { etiqueta: string; unidad: string; indicador: string; ponderada: boolean }
> = {
  margen: { etiqueta: "Margen bruto", unidad: " pts", indicador: "margen_bruto_mp", ponderada: true },
  share: { etiqueta: "Participación", unidad: " pts", indicador: "share_mp", ponderada: true },
  venta: { etiqueta: "Venta neta", unidad: " MM", indicador: "venta_neta_mp", ponderada: false },
};

export interface Contribucion {
  segmento: string;
  peso0: number; // % de la venta
  peso1: number;
  valor0: number; // margen/participación del segmento, o venta
  valor1: number;
  mezcla: number;
  tasa: number;
  total: number;
}

export interface Explicacion {
  metrica: MetricaVariacion;
  desglose: Desglose;
  desde: Mes;
  hasta: Mes;
  inicial: number;
  final: number;
  delta: number;
  mezcla: number;
  tasa: number;
  contribuciones: Contribucion[]; // ordenadas por impacto absoluto
}

const venta = (f: FilaComercial[]) => f.reduce((a, d) => a + d.ventaNeta, 0);
const ponderado = (f: FilaComercial[], campo: "margenBruto" | "shareMP") => {
  const v = venta(f);
  return v ? f.reduce((a, d) => a + d[campo] * d.ventaNeta, 0) / v : 0;
};

export function explicar(
  metrica: MetricaVariacion,
  desde: Mes,
  hasta: Mes,
  desglose: Desglose,
  alcance: { banderas: readonly string[] | null; categorias: readonly string[] | null }
): Explicacion {
  const enAlcance = { enBanderas: alcance.banderas, enCategorias: alcance.categorias };
  const universo =
    desglose === "categoria"
      ? CATEGORIAS.filter((c) => !alcance.categorias || alcance.categorias.includes(c))
      : BANDERAS.filter((b) => !alcance.banderas || alcance.banderas.includes(b));

  const f0 = filtrar({ mes: desde, ...enAlcance });
  const f1 = filtrar({ mes: hasta, ...enAlcance });
  const V0 = venta(f0);
  const V1 = venta(f1);
  const campo = metrica === "margen" ? "margenBruto" : "shareMP";
  const M0 = metrica === "venta" ? V0 : ponderado(f0, campo);
  const M1 = metrica === "venta" ? V1 : ponderado(f1, campo);

  const contribuciones: Contribucion[] = universo.map((s) => {
    const clave = desglose === "categoria" ? { categoria: s as never } : { bandera: s as never };
    const s0 = filtrar({ mes: desde, ...enAlcance, ...clave });
    const s1 = filtrar({ mes: hasta, ...enAlcance, ...clave });
    const v0 = venta(s0);
    const v1 = venta(s1);
    const w0 = V0 ? v0 / V0 : 0;
    const w1 = V1 ? v1 / V1 : 0;
    if (metrica === "venta") {
      return { segmento: s, peso0: w0 * 100, peso1: w1 * 100, valor0: v0, valor1: v1, mezcla: 0, tasa: v1 - v0, total: v1 - v0 };
    }
    const m0 = ponderado(s0, campo);
    const m1 = ponderado(s1, campo);
    const mezcla = (w1 - w0) * (m0 - M0);
    const tasa = w1 * (m1 - m0);
    return { segmento: s, peso0: w0 * 100, peso1: w1 * 100, valor0: m0, valor1: m1, mezcla, tasa, total: mezcla + tasa };
  });

  contribuciones.sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  return {
    metrica,
    desglose,
    desde,
    hasta,
    inicial: M0,
    final: M1,
    delta: M1 - M0,
    mezcla: contribuciones.reduce((a, c) => a + c.mezcla, 0),
    tasa: contribuciones.reduce((a, c) => a + c.tasa, 0),
    contribuciones,
  };
}

/** Redondea partes a `dec` decimales ajustando la más grande para que la
 * suma mostrada cuadre con el total mostrado (un analista siempre suma). */
export function redondearCuadrando(partes: number[], total: number, dec = 1): number[] {
  const f = Math.pow(10, dec);
  const r = partes.map((p) => Math.round(p * f) / f);
  const objetivo = Math.round(total * f) / f;
  const dif = Math.round((objetivo - r.reduce((a, b) => a + b, 0)) * f) / f;
  if (dif !== 0 && r.length) {
    let k = 0;
    partes.forEach((p, i) => { if (Math.abs(p) > Math.abs(partes[k])) k = i; });
    r[k] = Math.round((r[k] + dif) * f) / f;
  }
  return r;
}

const NOMBRE_MES: Record<string, string> = {
  Ene: "enero", Feb: "febrero", Mar: "marzo", Abr: "abril",
  May: "mayo", Jun: "junio", Jul: "julio", Ago: "agosto",
};
const n1 = (v: number) => Math.abs(v).toLocaleString("es-CL", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const s1 = (v: number) => `${v >= 0 ? "+" : "−"}${n1(v)}`;
const n0 = (v: number) => Math.abs(Math.round(v)).toLocaleString("es-CL");

/** Lectura en palabras, calculada — nunca texto fijo. */
export function narrar(e: Explicacion): string[] {
  const m = METRICAS_VARIACION[e.metrica];
  const seg = e.desglose === "categoria" ? "categoría" : "bandera";
  const periodo = `entre ${NOMBRE_MES[e.desde]} y ${NOMBRE_MES[e.hasta]}`;
  const verbo = (v: number) => (v >= 0 ? "sube" : "cae");

  if (!m.ponderada) {
    const pct = e.inicial ? (e.delta / e.inicial) * 100 : 0;
    const top = e.contribuciones.slice(0, 2);
    return [
      `La venta ${verbo(e.delta)} ${n0(e.delta)} MM ${periodo} (${e.delta >= 0 ? "+" : "−"}${n1(pct)}%).`,
      `Lo que más la mueve: ${top
        .map((c) => `${c.segmento} (${c.total >= 0 ? "+" : "−"}${n0(c.total)} MM)`)
        .join(" y ")}.`,
    ];
  }

  const [mz, ts] = redondearCuadrando([e.mezcla, e.tasa], e.delta);
  const lineas = [
    `${m.etiqueta} ${verbo(e.delta)} ${n1(e.delta)} pts ${periodo}: ${s1(ts)} pts por cambios dentro de cada ${seg} y ${s1(mz)} pts por mezcla.`,
  ];
  if (Math.abs(e.mezcla) < 0.05) {
    lineas.push(
      `La mezcla casi no influye: ninguna ${seg} ganó suficiente peso en la venta como para mover el promedio. La variación viene de adentro de cada ${seg}.`
    );
  } else {
    // El segmento que más peso ganó, y si su valor está bajo o sobre el promedio.
    const gano = [...e.contribuciones].sort((a, b) => b.peso1 - b.peso0 - (a.peso1 - a.peso0))[0];
    lineas.push(
      `Mezcla: ${gano.segmento} pasa de ${n1(gano.peso0)}% a ${n1(gano.peso1)}% de la venta, con ${m.etiqueta.toLowerCase()} ${
        gano.valor0 < e.inicial ? "bajo" : "sobre"
      } el promedio (${n1(gano.valor0)}% contra ${n1(e.inicial)}%).`
    );
  }
  const porTasa = [...e.contribuciones].sort((a, b) => Math.abs(b.tasa) - Math.abs(a.tasa)).slice(0, 2);
  lineas.push(
    `Dentro de cada ${seg}, lo que más pesa: ${porTasa
      .map((c) => `${c.segmento} (${s1(c.tasa)} pts)`)
      .join(" y ")}.`
  );
  return lineas;
}
