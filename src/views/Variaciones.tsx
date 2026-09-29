import { useMemo, useState } from "react";
import { useStore, alcance } from "../lib/store";
import { MESES, type Mes } from "../data/comercial";
import {
  explicar,
  narrar,
  METRICAS_VARIACION,
  type Desglose,
  type Explicacion,
  type MetricaVariacion,
} from "../data/variacion";
import { LOGO_BANDERA } from "../data/logosBanderas";
import { useTween } from "../lib/motion";
import { Encabezado, NotaArteDeLoPosible, Panel } from "../components/UI";
import { BadgeOrigen } from "../components/BadgeOrigen";
import { InfoIndicador } from "../components/InfoIndicador";
import { LogoBandera } from "../components/LogoBandera";

// "¿Por qué cambió?" — convierte una variación en sus causas, con la misma
// definición certificada del indicador. Todo lo que se muestra se calcula;
// nada es texto fijo.

const NOMBRE_MES: Record<Mes, string> = {
  Ene: "Enero", Feb: "Febrero", Mar: "Marzo", Abr: "Abril",
  May: "Mayo", Jun: "Junio", Jul: "Julio", Ago: "Agosto",
};

interface Paso {
  etiqueta: string;
  tipo: "total" | "sube" | "baja";
  desde: number;
  hasta: number;
  rotulo: string;
}

const fmt1 = (v: number) =>
  v.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt0 = (v: number) => Math.round(v).toLocaleString("es-CL");
/** Signo explícito, salvo que la cifra redondeada sea cero. */
const signo = (v: number, f: (n: number) => string) => {
  const t = f(Math.abs(v));
  return /^[0,.]+$/.test(t) ? t : `${v >= 0 ? "+" : "−"}${t}`;
};

/** Arma los pasos de la cascada: inicio → causas → final. */
function pasosDe(e: Explicacion): Paso[] {
  const pond = METRICAS_VARIACION[e.metrica].ponderada;
  const f = pond ? fmt1 : fmt0;
  const unidadTotal = pond ? "%" : " MM";
  const MAX = 6;

  let causas: { etiqueta: string; valor: number }[] = pond
    ? [
        { etiqueta: "Mezcla", valor: e.mezcla },
        ...e.contribuciones.map((c) => ({ etiqueta: c.segmento, valor: c.tasa })),
      ]
    : e.contribuciones.map((c) => ({ etiqueta: c.segmento, valor: c.total }));

  // Más de MAX segmentos: los menores se agrupan en "Otras".
  const cabeza = pond ? 1 : 0;
  const segs = causas.slice(cabeza).sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
  if (segs.length > MAX) {
    const resto = segs.slice(MAX - 1).reduce((a, c) => a + c.valor, 0);
    causas = [...causas.slice(0, cabeza), ...segs.slice(0, MAX - 1), { etiqueta: "Otras", valor: resto }];
  } else {
    causas = [...causas.slice(0, cabeza), ...segs];
  }

  const pasos: Paso[] = [
    { etiqueta: NOMBRE_MES[e.desde].slice(0, 3), tipo: "total", desde: NaN, hasta: e.inicial, rotulo: `${f(e.inicial)}${unidadTotal}` },
  ];
  let nivel = e.inicial;
  causas.forEach((c) => {
    pasos.push({
      etiqueta: c.etiqueta,
      tipo: c.valor >= 0 ? "sube" : "baja",
      desde: nivel,
      hasta: nivel + c.valor,
      // Cada cifra se redondea por su cuenta: el mismo número dice lo mismo
      // en la cascada, en la lectura y en la tabla.
      rotulo: signo(c.valor, f),
    });
    nivel += c.valor;
  });
  pasos.push({ etiqueta: NOMBRE_MES[e.hasta].slice(0, 3), tipo: "total", desde: NaN, hasta: e.final, rotulo: `${f(e.final)}${unidadTotal}` });
  return pasos;
}

const COLOR = { total: "#095AA5", sube: "#1B7A4B", baja: "#FF690A" } as const;

function Cascada({ pasos }: { pasos: Paso[] }) {
  const W = 720;
  const H = 290;
  const PAD_L = 16;
  const PAD_B = 36;
  const PAD_T = 26;
  const niveles = pasos.flatMap((p) => (p.tipo === "total" ? [p.hasta] : [p.desde, p.hasta]));
  const min = Math.min(...niveles);
  const max = Math.max(...niveles);
  const rango = max - min || Math.abs(max) * 0.05 || 1;
  const loD = min - rango * 0.9;
  const hiD = max + rango * 0.35;

  // Destino: [lo, hi, y por cada paso (base, tope)]. En la entrada, cada
  // barra nace con altura cero desde su base y crece en orden de lectura.
  const destino = [loD, hiD, ...pasos.flatMap((p) => (p.tipo === "total" ? [loD, p.hasta] : [p.desde, p.hasta]))];
  const inicial = [loD, hiD, ...pasos.flatMap((p) => (p.tipo === "total" ? [loD, loD] : [p.desde, p.desde]))];
  const [lo, hi, ...v] = useTween(destino, {
    inicial,
    duracion: 520,
    retrasos: [0, 0, ...pasos.flatMap((_, i) => [i * 140, i * 140])],
  });

  const n = pasos.length;
  const ancho = (W - PAD_L) / n;
  const barra = Math.min(54, ancho * 0.58);
  const cx = (i: number) => PAD_L + ancho * i + ancho / 2;
  const y = (val: number) => H - PAD_B - ((val - lo) / (hi - lo || 1)) * (H - PAD_B - PAD_T);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Cascada de la variación">
      <line x1={PAD_L} x2={W} y1={H - PAD_B} y2={H - PAD_B} stroke="#D3E2F0" />
      {pasos.map((p, i) => {
        const base = v[i * 2];
        const tope = v[i * 2 + 1];
        const y1 = y(Math.max(base, tope));
        const alto = Math.max(1, Math.abs(y(base) - y(tope)));
        const siguiente = pasos[i + 1];
        return (
          <g key={p.etiqueta + i}>
            <rect x={cx(i) - barra / 2} y={y1} width={barra} height={alto} rx={3} fill={COLOR[p.tipo]}>
              <title>{`${p.etiqueta}: ${p.rotulo}`}</title>
            </rect>
            {siguiente && (
              <line
                x1={cx(i) + barra / 2}
                x2={cx(i + 1) - barra / 2}
                y1={y(tope)}
                y2={y(tope)}
                stroke="#9CB7D1"
                strokeDasharray="3 3"
                className="anim-aparecer"
                style={{ animationDelay: `${(i + 1) * 140 + 300}ms` }}
              />
            )}
            <text
              x={cx(i)}
              y={y1 - 7}
              textAnchor="middle"
              fontSize={p.tipo === "total" ? 12.5 : 11.5}
              fontWeight={p.tipo === "total" ? 700 : 600}
              fill={p.tipo === "total" ? "#064174" : COLOR[p.tipo] === "#FF690A" ? "#C64E00" : COLOR[p.tipo]}
              className="anim-aparecer"
              style={{ animationDelay: `${i * 140 + 380}ms` }}
            >
              {p.rotulo}
            </text>
            {LOGO_BANDERA[p.etiqueta] ? (
              <image href={LOGO_BANDERA[p.etiqueta]} x={cx(i) - 13} y={H - 31} width={26} height={26}>
                <title>{p.etiqueta}</title>
              </image>
            ) : (
              <text x={cx(i)} y={H - 14} textAnchor="middle" fontSize={11.5} fill="#6B7480">
                {p.etiqueta.length > 11 ? p.etiqueta.slice(0, 10) + "…" : p.etiqueta}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Segmentado<T extends string>({
  valor,
  opciones,
  onCambio,
  etiqueta,
}: {
  valor: T;
  opciones: { id: T; texto: string }[];
  onCambio: (v: T) => void;
  etiqueta: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-micro text-gris font-medium">{etiqueta}</span>
      <div role="radiogroup" aria-label={etiqueta} className="inline-flex bg-cenco-soft rounded-full p-1">
        {opciones.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={valor === o.id}
            onClick={() => onCambio(o.id)}
            className={`estado px-3.5 py-1.5 rounded-full text-[13px] font-semibold ${
              valor === o.id ? "bg-cenco text-white shadow-suave" : "text-cenco-deep"
            }`}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

const SELECT = "estado border border-cenco-line bg-white px-3 py-2 text-[13px] rounded-control";

export default function Variaciones() {
  const { usuario } = useStore();
  const uc = alcance(usuario);
  const [metrica, setMetrica] = useState<MetricaVariacion>("margen");
  const [desglose, setDesglose] = useState<Desglose>("categoria");
  const [desde, setDesde] = useState<Mes>("Ene");
  const [hasta, setHasta] = useState<Mes>("Ago");

  const e = useMemo(
    () => explicar(metrica, desde, hasta, desglose, uc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrica, desde, hasta, desglose, usuario.id]
  );
  const pasos = useMemo(() => pasosDe(e), [e]);
  const lectura = useMemo(() => narrar(e), [e]);
  const meta = METRICAS_VARIACION[metrica];
  const idxDesde = MESES.indexOf(desde);

  return (
    <div className="pb-14">
      <Encabezado
        titulo="¿Por qué cambió?"
        bajada="Separa una variación en lo que la explica, calculado con la misma definición certificada del indicador. Elige qué métrica, entre qué meses y contra qué desglose."
      >
        <div className="mt-4">
          <BadgeOrigen tipo="hibrido" detalle="Metric Views entregan los datos; la descomposición es nuestra" />
        </div>
        <NotaArteDeLoPosible queFalta="Con unidades vendidas y precio unitario en la capa Gold, el efecto dentro de cada categoría se podría separar en precio, costo y volumen." />
        <div className="mt-6 flex flex-wrap items-end gap-5">
          <Segmentado
            etiqueta="Métrica"
            valor={metrica}
            onCambio={setMetrica}
            opciones={[
              { id: "margen", texto: "Margen bruto" },
              { id: "share", texto: "Participación" },
              { id: "venta", texto: "Venta neta" },
            ]}
          />
          <Segmentado
            etiqueta="Desglose"
            valor={desglose}
            onCambio={setDesglose}
            opciones={[
              { id: "categoria", texto: "Por categoría" },
              { id: "bandera", texto: "Por bandera" },
            ]}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-micro text-gris font-medium">Desde</span>
            <select
              className={SELECT}
              value={desde}
              onChange={(ev) => {
                const d = ev.target.value as Mes;
                setDesde(d);
                if (MESES.indexOf(hasta) <= MESES.indexOf(d)) setHasta(MESES[Math.min(MESES.indexOf(d) + 1, MESES.length - 1)]);
              }}
            >
              {MESES.slice(0, -1).map((m) => (
                <option key={m} value={m}>{NOMBRE_MES[m]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-micro text-gris font-medium">Hasta</span>
            <select className={SELECT} value={hasta} onChange={(ev) => setHasta(ev.target.value as Mes)}>
              {MESES.slice(idxDesde + 1).map((m) => (
                <option key={m} value={m}>{NOMBRE_MES[m]}</option>
              ))}
            </select>
          </label>
        </div>
      </Encabezado>

      <div className="p-8 space-y-6">
        <Panel
          titulo={`${meta.etiqueta}: de ${NOMBRE_MES[desde].toLowerCase()} a ${NOMBRE_MES[hasta].toLowerCase()}`}
          accion={<InfoIndicador id={meta.indicador} />}
        >
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
            <div>
              <Cascada key={`${metrica}-${desglose}-${usuario.id}`} pasos={pasos} />
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-gris">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cenco" />Valor del mes</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-certif" />Suma</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-naranjo" />Resta</span>
                <span>El eje no parte de cero, para que las causas se vean. Cifras redondeadas a un decimal.</span>
              </div>
            </div>
            <div className="xl:border-l xl:border-cenco-line xl:pl-6">
              <div className="text-micro font-semibold text-gris">Lectura</div>
              <ul className="mt-2 space-y-2.5">
                {lectura.map((l, i) => (
                  <li
                    key={l}
                    className="text-[13.5px] text-tuna leading-relaxed anim-aparecer"
                    style={{ animationDelay: `${300 + i * 120}ms` }}
                  >
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel titulo={`Detalle por ${desglose === "categoria" ? "categoría" : "bandera"}`}>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-[13px] min-w-[640px]">
              <thead>
                <tr className="text-micro text-gris text-right">
                  <th className="text-left font-semibold py-2 px-2">{desglose === "categoria" ? "Categoría" : "Bandera"}</th>
                  <th className="font-semibold py-2 px-2">% de la venta</th>
                  <th className="font-semibold py-2 px-2">{meta.ponderada ? meta.etiqueta : "Venta (MM)"}</th>
                  {meta.ponderada && <th className="font-semibold py-2 px-2">Mezcla</th>}
                  {meta.ponderada && <th className="font-semibold py-2 px-2">Dentro</th>}
                  <th className="font-semibold py-2 px-2">Aporte</th>
                </tr>
              </thead>
              <tbody className="num">
                {e.contribuciones.map((c) => (
                  <tr key={c.segmento} className="border-t border-cenco-line text-right">
                    <td className="text-left py-2.5 px-2 text-tuna">
                      <span className="flex items-center gap-2">
                        <LogoBandera bandera={c.segmento} size={22} />
                        {c.segmento}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-gris">{fmt1(c.peso0)}% → {fmt1(c.peso1)}%</td>
                    <td className="py-2.5 px-2 text-gris">
                      {meta.ponderada
                        ? `${fmt1(c.valor0)}% → ${fmt1(c.valor1)}%`
                        : `${fmt0(c.valor0)} → ${fmt0(c.valor1)}`}
                    </td>
                    {meta.ponderada && <td className="py-2.5 px-2">{signo(c.mezcla, (x) => x.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>}
                    {meta.ponderada && <td className="py-2.5 px-2">{signo(c.tasa, (x) => x.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>}
                    <td className={`py-2.5 px-2 font-semibold ${c.total < 0 ? "text-naranjo-deep" : "text-certif"}`}>
                      {meta.ponderada
                        ? `${signo(c.total, (x) => x.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))} pts`
                        : `${signo(c.total, fmt0)} MM`}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-cenco-line text-right font-semibold text-cenco-deep">
                  <td className="text-left py-2.5 px-2">Total</td>
                  <td className="py-2.5 px-2" />
                  <td className="py-2.5 px-2">
                    {meta.ponderada ? `${fmt1(e.inicial)}% → ${fmt1(e.final)}%` : `${fmt0(e.inicial)} → ${fmt0(e.final)}`}
                  </td>
                  {meta.ponderada && <td className="py-2.5 px-2">{signo(e.mezcla, (x) => x.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>}
                  {meta.ponderada && <td className="py-2.5 px-2">{signo(e.tasa, (x) => x.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>}
                  <td className="py-2.5 px-2">
                    {meta.ponderada
                      ? `${signo(e.delta, (x) => x.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))} pts`
                      : `${signo(e.delta, fmt0)} MM`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12.5px] text-gris leading-relaxed max-w-[80ch]">
            {meta.ponderada
              ? "Mezcla: cuánto cambió el promedio porque la venta se movió entre segmentos de distinto valor. Dentro: cuánto cambió el valor en cada segmento. Las dos columnas suman exacto el total."
              : "Aporte: cuánto cambió la venta de cada segmento. La suma es la variación total."}
          </p>
        </Panel>
      </div>
    </div>
  );
}
