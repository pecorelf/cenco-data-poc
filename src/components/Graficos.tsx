import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useTween, DURACION, reduceMovimiento, salida } from "../lib/motion";
import { LOGO_BANDERA } from "../data/logosBanderas";
import { LogoBandera } from "./LogoBandera";

// Gráficos en SVG, sin librería de charting. El motion lo maneja useTween:
// la primera vez los datos entran escalonados; después, cada cambio de
// filtro, sesión o tipo transforma los valores anteriores en los nuevos —
// incluidas las escalas de los ejes, para que nada salte.

export const PALETA = {
  azul: "#095AA5",
  azulMedio: "#3A7BB7",
  naranjo: "#FF690A",
  verde: "#1B7A4B",
  gris: "#B7C6D6",
  tuna: "#3B3D40",
} as const;

export type NombreColor = keyof typeof PALETA;

export interface Serie {
  nombre: string;
  valores: number[];
  color?: NombreColor;
  /** "linea" pasa la serie al eje derecho en un gráfico "combo". */
  tipo?: "barra" | "area" | "linea";
}

export interface EspecGrafico {
  tipo: "barras" | "lineas" | "area" | "barras_horizontal" | "dona" | "combo";
  titulo: string;
  subtitulo?: string;
  unidad?: string;
  /** Solo para "combo": unidad del eje derecho, donde viven las series "linea". */
  unidadDerecha?: string;
  categorias: string[];
  series: Serie[];
  nota?: string;
  indicadores?: string[];
}

const ORDEN: NombreColor[] = ["azul", "naranjo", "verde", "azulMedio", "gris"];
const color = (s: Serie, i: number) => PALETA[s.color ?? ORDEN[i % ORDEN.length]];

const fmt = (n: number, u = "") =>
  `${n.toLocaleString("es-CL", { maximumFractionDigits: 1 })}${u}`;

const W = 720;
const H = 260;
const PAD_L = 46;
const PAD_B = 30;
const PAD_T = 10;

/** Máximo "redondo" para el eje: pasos de 1, 2, 2,5 o 5 × 10^n, en 4 tramos.
 * Así el eje dice 0 · 3.000 · 6.000 · 9.000 · 12.000, no 3080 o 9240. */
export function maximoRedondo(max: number, tramos = 4): number {
  if (!(max > 0)) return 1;
  const bruto = max / tramos;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const paso = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * mag).find((x) => x * tramos >= max)!;
  return paso * tramos;
}
const etiquetaEje = (v: number) =>
  Math.round(v).toLocaleString("es-CL", { maximumFractionDigits: 0 });
/** Con pocas categorías las barras pueden ser más anchas. */
const topeBarra = (nCategorias: number) => (nCategorias <= 4 ? 46 : nCategorias <= 8 ? 30 : 22);

/** Aplana series a un solo arreglo para interpolarlas juntas. */
const aplanar = (series: Serie[]) => series.flatMap((s) => s.valores);
const desaplanar = (plano: number[], series: Serie[]) => {
  let k = 0;
  return series.map((s) => s.valores.map(() => plano[k++]));
};
/** Retraso de entrada: por categoría, y un poco más por serie. */
const retrasosPor = (series: Serie[], porCat = 55, porSerie = 90) =>
  series.flatMap((_, si) => series[si].valores.map((__, ci) => ci * porCat + si * porSerie));

// --- Contador ---------------------------------------------------------------
// Cuenta desde cero solo la primera vez que se ve una cifra en la sesión
// (identificada por `clave`). Volver a la pantalla no repite la cuenta; si
// el valor cambia (otro filtro, otra sesión), rueda desde el valor anterior.
const vistos = new Set<string>();

export function Contador({
  valor,
  decimales = 1,
  unidad = "",
  clave,
  className = "",
}: {
  valor: number;
  decimales?: number;
  unidad?: string;
  clave?: string;
  className?: string;
}) {
  const primeraVez = !clave || !vistos.has(clave);
  const [n] = useTween([valor], {
    duracion: primeraVez ? 900 : DURACION.datos,
    inicial: primeraVez ? [0] : undefined,
  });
  useEffect(() => {
    if (clave) vistos.add(clave);
  }, [clave]);

  return (
    <span className={`num ${className}`}>
      {n.toLocaleString("es-CL", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      })}
      {unidad && <span className="font-normal text-gris ml-0.5">{unidad}</span>}
    </span>
  );
}

function Leyenda({ series }: { series: Serie[] }) {
  if (series.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
      {series.map((s, i) => (
        <span key={s.nombre} className="flex items-center gap-2 text-[12.5px] text-gris">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color(s, i) }} />
          {s.nombre}
        </span>
      ))}
    </div>
  );
}

// --- Tooltip con línea guía ---------------------------------------------------
// La guía vertical se DESLIZA de una categoría a la siguiente (transición de
// transform), en vez de saltar: el ojo sigue el movimiento y no pierde el
// punto que estaba leyendo.

interface SerieHover {
  nombre: string;
  color: string;
  valores: number[];
  unidad?: string;
}

function Crosshair({
  categorias,
  series,
  px,
}: {
  categorias: string[];
  series: SerieHover[];
  px: (i: number) => number;
}) {
  const [i, setI] = useState<number | null>(null);
  if (!categorias.length) return null;

  const mover = (e: MouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    const xVB = PAD_L + ((e.clientX - r.left) / r.width) * (W - PAD_L);
    let mejor = 0;
    let dist = Infinity;
    categorias.forEach((_, idx) => {
      const d = Math.abs(px(idx) - xVB);
      if (d < dist) {
        dist = d;
        mejor = idx;
      }
    });
    setI(mejor);
  };

  const anchoCaja = 168;
  const altoCaja = 24 + series.length * 15;
  const x = i !== null ? px(i) : px(0);
  const xCaja = Math.max(
    PAD_L,
    Math.min(W - anchoCaja - 2, x > W * 0.6 ? x - anchoCaja - 10 : x + 10)
  );

  return (
    <>
      <rect
        x={PAD_L}
        y={PAD_T}
        width={W - PAD_L}
        height={H - PAD_B - PAD_T}
        fill="transparent"
        onMouseMove={mover}
        onMouseLeave={() => setI(null)}
        style={{ cursor: "crosshair" }}
      />
      <g
        pointerEvents="none"
        className="guia-grafico"
        style={{ opacity: i === null ? 0 : 1 }}
      >
        <line
          x1={0}
          x2={0}
          y1={PAD_T}
          y2={H - PAD_B}
          stroke="#9CB7D1"
          strokeWidth={1}
          strokeDasharray="3 2"
          style={{ transform: `translateX(${x}px)` }}
          className="guia-deslizar"
        />
        {i !== null && (
          <g style={{ transform: `translate(${xCaja}px, ${PAD_T + 2}px)` }} className="guia-deslizar">
            <rect width={anchoCaja} height={altoCaja} rx={6} fill="#063B72" fillOpacity={0.96} />
            <text x={10} y={16} fill="#fff" fontSize={10.5} fontWeight={600}>
              {categorias[i]}
            </text>
            {series.map((s, si) => (
              <g key={s.nombre} transform={`translate(10, ${30 + si * 15})`}>
                <circle cx={2.5} cy={-3.5} r={3} fill={s.color} />
                <text x={11} y={0} fill="#fff" fontSize={9.5}>
                  {s.nombre}: {fmt(s.valores[i], s.unidad)}
                </text>
              </g>
            ))}
          </g>
        )}
      </g>
    </>
  );
}

const hoverDe = (e: EspecGrafico, unidadPorSerie?: (s: Serie) => string | undefined) =>
  e.series.map((s, si) => ({
    nombre: s.nombre,
    color: color(s, si),
    valores: s.valores,
    unidad: unidadPorSerie ? unidadPorSerie(s) : e.unidad,
  }));

function Grilla({
  ticks,
  py,
  etiqueta,
  hasta = W,
}: {
  ticks: number[];
  py: (v: number) => number;
  etiqueta: (v: number) => string;
  hasta?: number;
}) {
  return (
    <>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={hasta} y1={py(t)} y2={py(t)} stroke="#E6EFF8" strokeWidth={1} />
          <text x={PAD_L - 8} y={py(t) + 4} textAnchor="end" fontSize={11} fill="#6B7480">
            {etiqueta(t)}
          </text>
        </g>
      ))}
    </>
  );
}

function EjeX({ categorias, px }: { categorias: string[]; px: (i: number) => number }) {
  return (
    <>
      {categorias.map((c, i) =>
        LOGO_BANDERA[c] ? (
          <image key={c} href={LOGO_BANDERA[c]} x={px(i) - 13} y={H - 28} width={26} height={26}>
            <title>{c}</title>
          </image>
        ) : (
          <text key={c} x={px(i)} y={H - 10} textAnchor="middle" fontSize={11.5} fill="#6B7480">
            {c}
          </text>
        )
      )}
    </>
  );
}

// --- Barras verticales agrupadas --------------------------------------------

function Barras({ e }: { e: EspecGrafico }) {
  const destinoMax = maximoRedondo(Math.max(...aplanar(e.series)) * 1.04);
  const plano = aplanar(e.series);
  const [maxT, ...valT] = useTween([destinoMax, ...plano], {
    inicial: [destinoMax, ...plano.map(() => 0)],
    retrasos: [0, ...retrasosPor(e.series)],
  });
  const vals = desaplanar(valT, e.series);
  const anchoGrupo = (W - PAD_L) / e.categorias.length;
  const nS = e.series.length;
  const anchoBarra = Math.min(topeBarra(e.categorias.length), (anchoGrupo * 0.68) / nS);
  const px = (i: number) => PAD_L + anchoGrupo * i + anchoGrupo / 2;
  const py = (v: number) => H - PAD_B - (v / maxT) * (H - PAD_B - PAD_T);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      <Grilla
        ticks={[0, 0.25, 0.5, 0.75, 1].map((t) => t * maxT)}
        py={py}
        etiqueta={etiquetaEje}
      />
      <EjeX categorias={e.categorias} px={px} />
      {e.series.map((s, si) =>
        vals[si].map((v, ci) => (
          <rect
            key={`${si}-${ci}`}
            x={px(ci) - (anchoBarra * nS) / 2 + anchoBarra * si}
            y={py(Math.max(0, v))}
            width={anchoBarra - 3}
            height={Math.max(0, py(0) - py(Math.max(0, v)))}
            rx={3}
            fill={color(s, si)}
          />
        ))
      )}
      <Crosshair categorias={e.categorias} px={px} series={hoverDe(e)} />
    </svg>
  );
}

// --- Líneas y área (comparten geometría) -------------------------------------

function LineasOArea({ e, area }: { e: EspecGrafico; area: boolean }) {
  const plano = aplanar(e.series);
  const min = Math.min(...plano);
  const max = Math.max(...plano);
  const rango = max - min || 1;
  // Se interpolan los límites del eje junto con los puntos.
  const [lo, hi, ...valT] = useTween([min - rango * 0.18, max + rango * 0.18, ...plano]);
  const vals = desaplanar(valT, e.series);
  const px = (i: number) => PAD_L + (i * (W - PAD_L - 12)) / Math.max(1, e.categorias.length - 1);
  const py = (v: number) => H - PAD_B - ((v - lo) / (hi - lo || 1)) * (H - PAD_B - PAD_T);
  const base = H - PAD_B;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      <Grilla ticks={[0, 0.5, 1].map((t) => lo + t * (hi - lo))} py={py} etiqueta={(v) => fmt(v)} />
      <EjeX categorias={e.categorias} px={px} />
      {e.series.map((s, si) => {
        const linea = vals[si].map((v, i) => `${i ? "L" : "M"}${px(i)},${py(v)}`).join(" ");
        return (
          <g key={s.nombre}>
            {area && (
              <path
                d={`${linea} L${px(vals[si].length - 1)},${base} L${px(0)},${base} Z`}
                fill={color(s, si)}
                fillOpacity={0.16}
                className="anim-aparecer"
                style={{ animationDelay: `${300 + si * 150}ms` }}
              />
            )}
            <path
              d={linea}
              fill="none"
              stroke={color(s, si)}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              className="anim-trazar"
              style={{ animationDelay: `${si * 220}ms` }}
            />
            {vals[si].map((v, i) => (
              <circle
                key={i}
                cx={px(i)}
                cy={py(v)}
                r={3.5}
                fill="#fff"
                stroke={color(s, si)}
                strokeWidth={2}
                className="anim-punto"
                style={{ animationDelay: `${700 + si * 220 + i * 45}ms` }}
              />
            ))}
          </g>
        );
      })}
      <Crosshair categorias={e.categorias} px={px} series={hoverDe(e)} />
    </svg>
  );
}

// --- Barras horizontales: ranking -------------------------------------------
// El valor ya va escrito en la barra, así que no necesita tooltip. Al
// cambiar de mes las barras se estiran o encogen, y el número rueda.

function BarrasH({ e }: { e: EspecGrafico }) {
  const s = e.series[0];
  const destinoMax = Math.max(...s.valores) * 1.08 || 1;
  const [maxT, ...valT] = useTween([destinoMax, ...s.valores], {
    inicial: [destinoMax, ...s.valores.map(() => 0)],
    retrasos: [0, ...s.valores.map((_, i) => i * 65)],
  });
  return (
    <div className="space-y-2.5">
      {e.categorias.map((c, i) => (
        <div key={c} className="flex items-center gap-3">
          <div className="w-28 shrink-0 text-[12.5px] text-tuna truncate flex justify-end">
            {LOGO_BANDERA[c] ? <LogoBandera bandera={c} size={28} /> : c}
          </div>
          <div className="flex-1 h-7 bg-cenco-soft/60 rounded-control overflow-hidden">
            <div
              className="h-full rounded-control flex items-center justify-end pr-2.5 min-w-[46px]"
              style={{ width: `${Math.max(0, (valT[i] / maxT) * 100)}%`, background: color(s, 0) }}
            >
              <span className="num text-[11.5px] font-medium text-white">
                {fmt(valT[i], e.unidad)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Dona --------------------------------------------------------------------
// Los arcos se despliegan desde las 12 en la primera entrada; después cada
// porción crece o se achica hacia su nueva proporción.

function Dona({ e }: { e: EspecGrafico }) {
  const s = e.series[0];
  const total = s.valores.reduce((a, b) => a + b, 0) || 1;
  const valT = useTween(s.valores, {
    inicial: s.valores.map(() => 0),
    retrasos: s.valores.map((_, i) => i * 90),
  });
  const R = 70;
  const C = 2 * Math.PI * R;
  let acumulado = 0;
  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg viewBox="0 0 180 180" className="w-44 h-44 shrink-0 -rotate-90">
        {valT.map((v, i) => {
          const largo = (Math.max(0, v) / total) * C;
          const offset = acumulado;
          acumulado += largo;
          return (
            <circle
              key={i}
              cx={90}
              cy={90}
              r={R}
              fill="none"
              stroke={PALETA[ORDEN[i % ORDEN.length]]}
              strokeWidth={26}
              strokeDasharray={`${largo} ${C - largo}`}
              strokeDashoffset={-offset}
            >
              <title>{`${e.categorias[i]}: ${fmt(s.valores[i], e.unidad)}`}</title>
            </circle>
          );
        })}
      </svg>
      <ul className="space-y-2">
        {e.categorias.map((c, i) => (
          <li key={c} className="flex items-center gap-2.5 text-[13px]">
            <span className="w-3 h-3 rounded-sm" style={{ background: PALETA[ORDEN[i % ORDEN.length]] }} />
            <LogoBandera bandera={c} size={22} />
            <span className="text-tuna">{c}</span>
            <span className="num text-gris ml-auto pl-4">{fmt(valT[i], e.unidad)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Combo con eje doble ------------------------------------------------------
// Barras y área en el eje izquierdo (desde cero), líneas en el derecho con
// su propia escala. Una sola grilla y un solo set de posiciones en X. Ambas
// escalas se interpolan con los datos.

function Combo({ e }: { e: EspecGrafico }) {
  const n = e.categorias.length || 1;
  const anchoGrupo = (W - PAD_L) / n;
  const px = (i: number) => PAD_L + anchoGrupo * i + anchoGrupo / 2;

  const principales = e.series.filter((s) => s.tipo !== "linea");
  const lineales = e.series.filter((s) => s.tipo === "linea");
  const hayDer = lineales.length > 0;

  const maxIzqD = maximoRedondo(Math.max(0, ...aplanar(principales)) * 1.04);
  const vDer = aplanar(lineales);
  const minD = vDer.length ? Math.min(...vDer) : 0;
  const maxD = vDer.length ? Math.max(...vDer) : 1;
  const rD = maxD - minD || 1;

  const plano = aplanar(e.series);
  const [maxIzq, loDer, hiDer, ...valT] = useTween(
    [maxIzqD, minD - rD * 0.18, maxD + rD * 0.18, ...plano],
    {
      inicial: [maxIzqD, minD - rD * 0.18, maxD + rD * 0.18, ...e.series.flatMap((s) =>
        s.valores.map((v) => (s.tipo === "linea" ? v : 0))
      )],
      retrasos: [0, 0, 0, ...retrasosPor(e.series)],
    }
  );
  const vals = desaplanar(valT, e.series);
  const valDe = (s: Serie) => vals[e.series.indexOf(s)];

  const pyIzq = (v: number) => H - PAD_B - (v / maxIzq) * (H - PAD_B - PAD_T);
  const pyDer = (v: number) => H - PAD_B - ((v - loDer) / (hiDer - loDer || 1)) * (H - PAD_B - PAD_T);

  const barras = principales.filter((s) => s.tipo !== "area");
  const areas = principales.filter((s) => s.tipo === "area");
  const nB = barras.length || 1;
  const anchoBarra = Math.min(topeBarra(n), (anchoGrupo * 0.5) / nB);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      <Grilla
        ticks={[0, 0.25, 0.5, 0.75, 1].map((t) => t * maxIzq)}
        py={pyIzq}
        etiqueta={etiquetaEje}
        hasta={hayDer ? W - 30 : W}
      />
      {hayDer &&
        [0, 0.5, 1].map((t, i) => {
          const v = loDer + t * (hiDer - loDer);
          return (
            <text key={i} x={W - 4} y={pyDer(v) + 4} textAnchor="end" fontSize={11} fill="#FF690A">
              {fmt(v)}
            </text>
          );
        })}
      <EjeX categorias={e.categorias} px={px} />

      {areas.map((s) => {
        const v = valDe(s);
        const linea = v.map((x, i) => `${i ? "L" : "M"}${px(i)},${pyIzq(x)}`).join(" ");
        return (
          <path
            key={s.nombre}
            d={`${linea} L${px(v.length - 1)},${H - PAD_B} L${px(0)},${H - PAD_B} Z`}
            fill={color(s, e.series.indexOf(s))}
            fillOpacity={0.16}
          />
        );
      })}

      {barras.map((s, bi) =>
        valDe(s).map((v, ci) => (
          <rect
            key={`${bi}-${ci}`}
            x={px(ci) - (anchoBarra * nB) / 2 + anchoBarra * bi}
            y={pyIzq(Math.max(0, v))}
            width={Math.max(1, anchoBarra - 3)}
            height={Math.max(0, pyIzq(0) - pyIzq(Math.max(0, v)))}
            rx={3}
            fill={color(s, e.series.indexOf(s))}
          />
        ))
      )}

      {lineales.map((s) => {
        const si = e.series.indexOf(s);
        const v = valDe(s);
        return (
          <g key={s.nombre}>
            <path
              d={v.map((x, i) => `${i ? "L" : "M"}${px(i)},${pyDer(x)}`).join(" ")}
              fill="none"
              stroke={color(s, si)}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              className="anim-trazar"
              style={{ animationDelay: "350ms" }}
            />
            {v.map((x, i) => (
              <circle
                key={i}
                cx={px(i)}
                cy={pyDer(x)}
                r={3.5}
                fill="#fff"
                stroke={color(s, si)}
                strokeWidth={2}
                className="anim-punto"
                style={{ animationDelay: `${900 + i * 45}ms` }}
              />
            ))}
          </g>
        );
      })}

      <Crosshair
        categorias={e.categorias}
        px={px}
        series={hoverDe(e, (s) => (s.tipo === "linea" ? e.unidadDerecha ?? e.unidad : e.unidad))}
      />
    </svg>
  );
}

/** Barra de progreso: su ancho viaja al nuevo valor en vez de saltar. */
export function BarraProgreso({
  porcentaje,
  tono = "azul",
  alto = "h-2.5",
}: {
  porcentaje: number;
  tono?: "azul" | "naranjo" | "verde";
  alto?: string;
}) {
  const c = tono === "naranjo" ? PALETA.naranjo : tono === "verde" ? PALETA.verde : PALETA.azul;
  const p = Math.max(0, Math.min(100, porcentaje));
  return (
    <div className={`w-full ${alto} rounded-full bg-cenco-soft overflow-hidden`}>
      <div
        className="h-full rounded-full transition-[width,background-color] duration-700 ease-cenco"
        style={{ width: `${p}%`, background: c }}
      />
    </div>
  );
}

export function Grafico({ e }: { e: EspecGrafico }) {
  // Cambiar de tipo sí vuelve a montar (otra geometría); cambiar datos, no.
  const cuerpo = useMemo(() => {
    switch (e.tipo) {
      case "lineas":
        return <LineasOArea e={e} area={false} />;
      case "area":
        return <LineasOArea e={e} area />;
      case "barras_horizontal":
        return <BarrasH e={e} />;
      case "dona":
        return <Dona e={e} />;
      case "combo":
        return <Combo e={e} />;
      default:
        return <Barras e={e} />;
    }
  }, [e]);

  return (
    <figure className="m-0">
      <figcaption className="mb-3">
        <div className="text-[15px] font-semibold text-cenco-deep leading-snug">{e.titulo}</div>
        {e.subtitulo && <div className="text-[12.5px] text-gris mt-0.5">{e.subtitulo}</div>}
      </figcaption>
      <div key={e.tipo} className="anim-cambio-tipo">
        {cuerpo}
      </div>
      <Leyenda series={e.series} />
      {e.nota && (
        <p key={e.nota} className="mt-3 text-[12.5px] text-gris leading-relaxed max-w-[76ch] anim-texto">
          {e.nota}
        </p>
      )}
    </figure>
  );
}

// Exportado para pruebas del motor fuera de React.
export const _interno = { salida, reduceMovimiento };
