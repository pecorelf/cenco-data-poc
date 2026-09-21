import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

// Gráficos en SVG con animación CSS. Sin librería de charting:
// así el trazo, el crecimiento y el orden de entrada son decisiones de diseño,
// no lo que la librería trae por defecto.

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

/** Número que cuenta hacia arriba al montar. */
export function Contador({
  valor,
  decimales = 1,
  unidad = "",
  duracion = 900,
  className = "",
}: {
  valor: number;
  decimales?: number;
  unidad?: string;
  duracion?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(valor);
      return;
    }
    const t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / duracion);
      const e = 1 - Math.pow(1 - p, 3);
      setN(valor * e);
      if (p < 1) raf.current = requestAnimationFrame(paso);
    };
    raf.current = requestAnimationFrame(paso);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [valor, duracion]);

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
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: color(s, i) }}
          />
          {s.nombre}
        </span>
      ))}
    </div>
  );
}

// --- Tooltip al pasar el mouse -----------------------------------------
// Compartido entre Barras, Líneas, Área y Combo: un rectángulo invisible
// capta el movimiento del mouse en toda el área de trazado, encuentra la
// categoría más cercana en el eje X, y dibuja una guía vertical más una
// cajita con el valor de cada serie en ese punto. No depende de acertarle
// a una línea delgada o a un punto pequeño — cualquier lugar de esa franja
// vertical muestra el mismo dato.

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
  padT,
  padB,
  padL,
  H,
  W,
}: {
  categorias: string[];
  series: SerieHover[];
  px: (i: number) => number;
  padT: number;
  padB: number;
  padL: number;
  H: number;
  W: number;
}) {
  const [i, setI] = useState<number | null>(null);
  if (!categorias.length) return null;

  const mover = (e: MouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    const frac = (e.clientX - r.left) / r.width;
    const xVB = padL + frac * (W - padL);
    let mejor = 0;
    let mejorDist = Infinity;
    categorias.forEach((_, idx) => {
      const d = Math.abs(px(idx) - xVB);
      if (d < mejorDist) {
        mejorDist = d;
        mejor = idx;
      }
    });
    setI(mejor);
  };

  const anchoCaja = 168;
  const altoCaja = 24 + series.length * 15;
  const xCross = i !== null ? px(i) : 0;
  const aLaIzquierda = xCross > W * 0.6;
  const xCajaCruda = aLaIzquierda ? xCross - anchoCaja - 10 : xCross + 10;
  const xCaja = Math.max(padL, Math.min(W - anchoCaja - 2, xCajaCruda));

  return (
    <>
      <rect
        x={padL}
        y={padT}
        width={Math.max(0, W - padL)}
        height={Math.max(0, H - padB - padT)}
        fill="transparent"
        onMouseMove={mover}
        onMouseLeave={() => setI(null)}
        style={{ cursor: "crosshair" }}
      />
      {i !== null && (
        <g pointerEvents="none">
          <line
            x1={px(i)}
            x2={px(i)}
            y1={padT}
            y2={H - padB}
            stroke="#9CB7D1"
            strokeWidth={1}
            strokeDasharray="3 2"
          />
          <g transform={`translate(${xCaja}, ${padT + 2})`}>
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
        </g>
      )}
    </>
  );
}

/** Barras verticales agrupadas, con crecimiento escalonado. */
function Barras({ e }: { e: EspecGrafico }) {
  const W = 720;
  const H = 260;
  const padL = 46;
  const padB = 30;
  const padT = 10;
  const max = Math.max(...e.series.flatMap((s) => s.valores)) * 1.1 || 1;
  const anchoGrupo = (W - padL) / e.categorias.length;
  const nS = e.series.length;
  const anchoBarra = Math.min(26, (anchoGrupo * 0.68) / nS);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const px = (i: number) => padL + anchoGrupo * i + anchoGrupo / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      {ticks.map((t, i) => {
        const y = H - padB - (t / max) * (H - padB - padT);
        return (
          <g key={i}>
            <line x1={padL} x2={W} y1={y} y2={y} stroke="#E6EFF8" strokeWidth={1} />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#6B7480">
              {Math.round(t)}
            </text>
          </g>
        );
      })}
      {e.categorias.map((c, ci) => (
        <text key={c} x={px(ci)} y={H - 10} textAnchor="middle" fontSize={11.5} fill="#6B7480">
          {c}
        </text>
      ))}
      {e.series.map((s, si) =>
        s.valores.map((v, ci) => {
          const alto = Math.max(0, (v / max) * (H - padB - padT));
          const x = px(ci) - (anchoBarra * nS) / 2 + anchoBarra * si;
          return (
            <rect
              key={`${si}-${ci}`}
              x={x}
              y={H - padB - alto}
              width={anchoBarra - 3}
              height={alto}
              rx={4}
              fill={color(s, si)}
              className="anim-crecer"
              style={{
                transformOrigin: `center ${H - padB}px`,
                animationDelay: `${ci * 55 + si * 90}ms`,
              }}
            />
          );
        })
      )}
      <Crosshair
        categorias={e.categorias}
        px={px}
        padT={padT}
        padB={padB}
        padL={padL}
        H={H}
        W={W}
        series={e.series.map((s, si) => ({
          nombre: s.nombre,
          color: color(s, si),
          valores: s.valores,
          unidad: e.unidad,
        }))}
      />
    </svg>
  );
}

/** Líneas que se dibujan trazo a trazo. */
function Lineas({ e }: { e: EspecGrafico }) {
  const W = 720;
  const H = 260;
  const padL = 46;
  const padB = 30;
  const padT = 10;
  const todos = e.series.flatMap((s) => s.valores);
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const rango = max - min || 1;
  const lo = min - rango * 0.18;
  const hi = max + rango * 0.18;
  const px = (i: number) =>
    padL + (i * (W - padL - 12)) / Math.max(1, e.categorias.length - 1);
  const py = (v: number) => H - padB - ((v - lo) / (hi - lo)) * (H - padB - padT);
  const ticks = [0, 0.5, 1].map((t) => lo + t * (hi - lo));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W} y1={py(t)} y2={py(t)} stroke="#E6EFF8" strokeWidth={1} />
          <text x={padL - 8} y={py(t) + 4} textAnchor="end" fontSize={11} fill="#6B7480">
            {fmt(t)}
          </text>
        </g>
      ))}
      {e.categorias.map((c, i) => (
        <text key={c} x={px(i)} y={H - 10} textAnchor="middle" fontSize={11.5} fill="#6B7480">
          {c}
        </text>
      ))}
      {e.series.map((s, si) => {
        const d = s.valores.map((v, i) => `${i ? "L" : "M"}${px(i)},${py(v)}`).join(" ");
        return (
          <g key={s.nombre}>
            <path
              d={d}
              fill="none"
              stroke={color(s, si)}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              className="anim-trazar"
              style={{ animationDelay: `${si * 220}ms` }}
            />
            {s.valores.map((v, i) => (
              <circle
                key={i}
                cx={px(i)}
                cy={py(v)}
                r={3.5}
                fill="#fff"
                stroke={color(s, si)}
                strokeWidth={2}
                className="anim-aparecer"
                style={{ animationDelay: `${900 + si * 220 + i * 40}ms` }}
              />
            ))}
          </g>
        );
      })}
      <Crosshair
        categorias={e.categorias}
        px={px}
        padT={padT}
        padB={padB}
        padL={padL}
        H={H}
        W={W}
        series={e.series.map((s, si) => ({
          nombre: s.nombre,
          color: color(s, si),
          valores: s.valores,
          unidad: e.unidad,
        }))}
      />
    </svg>
  );
}

/** Igual que Líneas, pero con el área bajo la curva rellena. */
function Areas({ e }: { e: EspecGrafico }) {
  const W = 720;
  const H = 260;
  const padL = 46;
  const padB = 30;
  const padT = 10;
  const todos = e.series.flatMap((s) => s.valores);
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const rango = max - min || 1;
  const lo = min - rango * 0.18;
  const hi = max + rango * 0.18;
  const px = (i: number) =>
    padL + (i * (W - padL - 12)) / Math.max(1, e.categorias.length - 1);
  const py = (v: number) => H - padB - ((v - lo) / (hi - lo)) * (H - padB - padT);
  const base = H - padB;
  const ticks = [0, 0.5, 1].map((t) => lo + t * (hi - lo));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W} y1={py(t)} y2={py(t)} stroke="#E6EFF8" strokeWidth={1} />
          <text x={padL - 8} y={py(t) + 4} textAnchor="end" fontSize={11} fill="#6B7480">
            {fmt(t)}
          </text>
        </g>
      ))}
      {e.categorias.map((c, i) => (
        <text key={c} x={px(i)} y={H - 10} textAnchor="middle" fontSize={11.5} fill="#6B7480">
          {c}
        </text>
      ))}
      {e.series.map((s, si) => {
        const linea = s.valores.map((v, i) => `${i ? "L" : "M"}${px(i)},${py(v)}`).join(" ");
        const area = `${linea} L${px(s.valores.length - 1)},${base} L${px(0)},${base} Z`;
        return (
          <g key={s.nombre}>
            <path
              d={area}
              fill={color(s, si)}
              fillOpacity={0.16}
              stroke="none"
              className="anim-aparecer"
              style={{ animationDelay: `${si * 150}ms` }}
            />
            <path
              d={linea}
              fill="none"
              stroke={color(s, si)}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              className="anim-trazar"
              style={{ animationDelay: `${si * 220}ms` }}
            />
            {s.valores.map((v, i) => (
              <circle
                key={i}
                cx={px(i)}
                cy={py(v)}
                r={3.5}
                fill="#fff"
                stroke={color(s, si)}
                strokeWidth={2}
                className="anim-aparecer"
                style={{ animationDelay: `${900 + si * 220 + i * 40}ms` }}
              />
            ))}
          </g>
        );
      })}
      <Crosshair
        categorias={e.categorias}
        px={px}
        padT={padT}
        padB={padB}
        padL={padL}
        H={H}
        W={W}
        series={e.series.map((s, si) => ({
          nombre: s.nombre,
          color: color(s, si),
          valores: s.valores,
          unidad: e.unidad,
        }))}
      />
    </svg>
  );
}

/** Barras horizontales — para rankings por categoría. Ya muestra el valor
 * escrito dentro de cada barra, así que no necesita hover para leerlo. */
function BarrasH({ e }: { e: EspecGrafico }) {
  const s = e.series[0];
  const max = Math.max(...s.valores) * 1.08 || 1;
  return (
    <div className="space-y-2.5">
      {e.categorias.map((c, i) => (
        <div key={c} className="flex items-center gap-3">
          <div className="w-28 shrink-0 text-[12.5px] text-tuna truncate text-right">
            {c}
          </div>
          <div className="flex-1 h-7 bg-cenco-soft/60 rounded-control overflow-hidden">
            <div
              className="h-full rounded-control anim-crecer-x flex items-center justify-end pr-2.5"
              style={{
                width: `${(s.valores[i] / max) * 100}%`,
                background: color(s, 0),
                animationDelay: `${i * 65}ms`,
              }}
            >
              <span className="num text-[11.5px] font-medium text-white">
                {fmt(s.valores[i], e.unidad)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dona — para composición o participación. Los valores ya están en la
 * leyenda de al lado, siempre visibles. */
function Dona({ e }: { e: EspecGrafico }) {
  const s = e.series[0];
  const total = s.valores.reduce((a, b) => a + b, 0) || 1;
  const R = 70;
  const C = 2 * Math.PI * R;
  let acumulado = 0;
  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg viewBox="0 0 180 180" className="w-44 h-44 shrink-0 -rotate-90">
        {s.valores.map((v, i) => {
          const largo = (v / total) * C;
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
              className="anim-aparecer"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <title>{`${e.categorias[i]}: ${fmt(v, e.unidad)}`}</title>
            </circle>
          );
        })}
      </svg>
      <ul className="space-y-2">
        {e.categorias.map((c, i) => (
          <li key={c} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ background: PALETA[ORDEN[i % ORDEN.length]] }}
            />
            <span className="text-tuna">{c}</span>
            <span className="num text-gris ml-auto pl-4">
              {fmt(s.valores[i], e.unidad)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Combo con eje doble de verdad: barras y área comparten el eje izquierdo
 * (arranca en cero, como cualquier barra), las series marcadas "linea"
 * tienen su propio eje derecho con su propia escala. No son dos gráficos
 * apilados — es una sola grilla, un solo cero, un solo set de posiciones
 * en X, así que el cursor y la línea guía caen exactamente en el mismo
 * lugar para ambos ejes.
 */
function Combo({ e }: { e: EspecGrafico }) {
  const W = 720;
  const H = 260;
  const padL = 46;
  const padB = 30;
  const padT = 10;
  const n = e.categorias.length || 1;
  const anchoGrupo = (W - padL) / n;
  const px = (i: number) => padL + anchoGrupo * i + anchoGrupo / 2;

  const principales = e.series.filter((s) => s.tipo !== "linea");
  const lineales = e.series.filter((s) => s.tipo === "linea");
  const barrasSeries = principales.filter((s) => s.tipo !== "area");
  const areaSeries = principales.filter((s) => s.tipo === "area");
  const hayEjeDerecho = lineales.length > 0;

  const maxIzq = Math.max(0, ...principales.flatMap((s) => s.valores)) * 1.1 || 1;
  const pyIzq = (v: number) => H - padB - (v / maxIzq) * (H - padB - padT);
  const ticksIzq = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxIzq);

  const valoresDer = lineales.flatMap((s) => s.valores);
  const minDer = valoresDer.length ? Math.min(...valoresDer) : 0;
  const maxDer = valoresDer.length ? Math.max(...valoresDer) : 1;
  const rangoDer = maxDer - minDer || 1;
  const loDer = minDer - rangoDer * 0.18;
  const hiDer = maxDer + rangoDer * 0.18;
  const pyDer = (v: number) => H - padB - ((v - loDer) / (hiDer - loDer)) * (H - padB - padT);
  const ticksDer = [0, 0.5, 1].map((t) => loDer + t * (hiDer - loDer));

  const nBarras = barrasSeries.length || 1;
  const anchoBarra = Math.min(22, (anchoGrupo * 0.5) / nBarras);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      {ticksIzq.map((t, i) => (
        <g key={`i${i}`}>
          <line
            x1={padL}
            x2={hayEjeDerecho ? W - 30 : W}
            y1={pyIzq(t)}
            y2={pyIzq(t)}
            stroke="#E6EFF8"
            strokeWidth={1}
          />
          <text x={padL - 8} y={pyIzq(t) + 4} textAnchor="end" fontSize={11} fill="#6B7480">
            {Math.round(t)}
          </text>
        </g>
      ))}
      {hayEjeDerecho &&
        ticksDer.map((t, i) => (
          <text key={`d${i}`} x={W - 4} y={pyDer(t) + 4} textAnchor="end" fontSize={11} fill="#FF690A">
            {fmt(t)}
          </text>
        ))}
      {e.categorias.map((c, i) => (
        <text key={c} x={px(i)} y={H - 10} textAnchor="middle" fontSize={11.5} fill="#6B7480">
          {c}
        </text>
      ))}

      {areaSeries.map((s) => {
        const si = e.series.indexOf(s);
        const linea = s.valores.map((v, i) => `${i ? "L" : "M"}${px(i)},${pyIzq(v)}`).join(" ");
        const area = `${linea} L${px(s.valores.length - 1)},${H - padB} L${px(0)},${H - padB} Z`;
        return (
          <path
            key={s.nombre}
            d={area}
            fill={color(s, si)}
            fillOpacity={0.16}
            stroke="none"
            className="anim-aparecer"
          />
        );
      })}

      {barrasSeries.map((s, bi) => {
        const si = e.series.indexOf(s);
        return s.valores.map((v, ci) => {
          const alto = Math.max(0, pyIzq(0) - pyIzq(v));
          const x = px(ci) - (anchoBarra * nBarras) / 2 + anchoBarra * bi;
          return (
            <rect
              key={`${bi}-${ci}`}
              x={x}
              y={pyIzq(v)}
              width={Math.max(1, anchoBarra - 3)}
              height={alto}
              rx={3}
              fill={color(s, si)}
              className="anim-crecer"
              style={{
                transformOrigin: `center ${H - padB}px`,
                animationDelay: `${ci * 55 + bi * 90}ms`,
              }}
            />
          );
        });
      })}

      {lineales.map((s) => {
        const si = e.series.indexOf(s);
        const d = s.valores.map((v, i) => `${i ? "L" : "M"}${px(i)},${pyDer(v)}`).join(" ");
        return (
          <g key={s.nombre}>
            <path
              d={d}
              fill="none"
              stroke={color(s, si)}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              className="anim-trazar"
            />
            {s.valores.map((v, i) => (
              <circle
                key={i}
                cx={px(i)}
                cy={pyDer(v)}
                r={3.5}
                fill="#fff"
                stroke={color(s, si)}
                strokeWidth={2}
                className="anim-aparecer"
              />
            ))}
          </g>
        );
      })}

      <Crosshair
        categorias={e.categorias}
        px={px}
        padT={padT}
        padB={padB}
        padL={padL}
        H={H}
        W={W}
        series={e.series.map((s) => {
          const si = e.series.indexOf(s);
          return {
            nombre: s.nombre,
            color: color(s, si),
            valores: s.valores,
            unidad: s.tipo === "linea" ? e.unidadDerecha ?? e.unidad : e.unidad,
          };
        })}
      />
    </svg>
  );
}

/** Barra horizontal que anima su ancho al montar y en cada cambio de valor. */
export function BarraProgreso({
  porcentaje,
  tono = "azul",
  alto = "h-2.5",
}: {
  porcentaje: number;
  tono?: "azul" | "naranjo" | "verde";
  alto?: string;
}) {
  const color =
    tono === "naranjo" ? PALETA.naranjo : tono === "verde" ? PALETA.verde : PALETA.azul;
  const p = Math.max(0, Math.min(100, porcentaje));
  return (
    <div className={`w-full ${alto} rounded-full bg-cenco-soft overflow-hidden`}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${p}%`, background: color }}
      />
    </div>
  );
}

export function Grafico({ e }: { e: EspecGrafico }) {
  const cuerpo = useMemo(() => {
    switch (e.tipo) {
      case "lineas":
        return <Lineas e={e} />;
      case "area":
        return <Areas e={e} />;
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
        <div className="text-[15px] font-semibold text-cenco-deep leading-snug">
          {e.titulo}
        </div>
        {e.subtitulo && (
          <div className="text-[12.5px] text-gris mt-0.5">{e.subtitulo}</div>
        )}
      </figcaption>
      {cuerpo}
      <Leyenda series={e.series} />
      {e.nota && (
        <p className="mt-3 text-[12.5px] text-gris leading-relaxed max-w-[76ch]">
          {e.nota}
        </p>
      )}
    </figure>
  );
}
