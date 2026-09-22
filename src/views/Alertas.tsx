import { useState } from "react";
import {
  ETIQUETA_METRICA_ALERTA,
  UNIDAD_METRICA_ALERTA,
  CANAL_LISTO,
  valorVigente,
  cumpleCondicion,
  serieHistorica,
  type AlertaConfigurada,
  type MetricaAlerta,
  type Operador,
  type Frecuencia,
  type Canal,
} from "../data/alertas";
import { BANDERAS, CATEGORIAS, type Bandera, type Categoria } from "../data/comercial";
import { Boton, Encabezado, NotaDiscovery, Panel } from "../components/UI";
import { InfoIndicador } from "../components/InfoIndicador";
import { INDICADOR_DE_COLUMNA } from "../data/sql";
import {
  IconoPapelera,
  IconoMas,
  IconoAlerta,
  IconoCheck,
  IconoLapiz,
  IconoCerrar,
} from "../components/Iconos";
import { useStore } from "../lib/store";

const METRICAS: MetricaAlerta[] = ["venta_neta", "plan", "margen_bruto", "share_mp", "quiebre"];
const OPERADORES: Operador[] = ["<", ">", "<=", ">="];
const FRECUENCIAS: Frecuencia[] = ["Diaria", "Semanal", "Al detectarse"];
const CANALES: Canal[] = ["Portal", "Email", "Slack", "WhatsApp"];

const PREGUNTAS = [
  "¿Cada usuario configura sus propias alertas, o un gerente puede configurar alertas para su equipo?",
  "¿Qué canales son indispensables el día uno: solo el portal, o también correo, Slack o WhatsApp?",
  "¿Qué frecuencia de evaluación es realista sobre datos productivos: near real time, diaria, semanal?",
  "¿Hay un límite razonable de alertas activas por usuario, para que no se vuelva ruido?",
];

function Interruptor({ activo, onClick }: { activo: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={activo}
      className={`estado relative w-10 h-6 rounded-full shrink-0 ${
        activo ? "bg-certif" : "bg-cenco-line"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-suave transition-all duration-200 ${
          activo ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/**
 * Back-test: antes de guardar, muestra cómo se habría comportado esta regla
 * en lo que va del año. No es adorno — evita el umbral mal calibrado que
 * dispara todos los meses o que nunca dispara.
 */
function MiniHistorico({
  metrica,
  bandera,
  categoria,
  operador,
  umbral,
}: {
  metrica: MetricaAlerta;
  bandera: Bandera | "Todas";
  categoria: Categoria | "Todas";
  operador: Operador;
  umbral: number;
}) {
  const puntos = serieHistorica({ metrica, bandera, categoria, operador, umbral });
  const valores = puntos.map((p) => p.valor);
  const min = Math.min(...valores, umbral);
  const max = Math.max(...valores, umbral);
  const rango = max - min || 1;
  const W = 100;
  const H = 64;
  const padB = 14;
  const padT = 4;
  const y = (v: number) => padT + (1 - (v - min) / rango) * (H - padT - padB);
  const anchoBarra = W / puntos.length - 3;
  const disparos = puntos.filter((p) => p.cumple).length;

  return (
    <div className="border border-cenco-line rounded-control p-3.5 bg-papel">
      <div className="text-micro text-gris font-medium mb-2">
        Cómo se habría comportado este año
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
        <line
          x1={0}
          x2={W}
          y1={y(umbral)}
          y2={y(umbral)}
          stroke="#FF690A"
          strokeWidth={0.6}
          strokeDasharray="2 1.5"
          vectorEffect="non-scaling-stroke"
        />
        {puntos.map((p, i) => {
          const x = (W / puntos.length) * i + 1.5;
          const yTope = y(p.valor);
          const alto = Math.max(1.5, H - padB - yTope);
          return (
            <rect
              key={p.mes}
              x={x}
              y={yTope}
              width={Math.max(1, anchoBarra)}
              height={alto}
              rx={0.8}
              fill={p.cumple ? "#FF690A" : "#095AA5"}
              opacity={p.cumple ? 1 : 0.5}
              className="anim-crecer"
              style={{ transformOrigin: `0px ${H - padB}px`, animationDelay: `${i * 40}ms` }}
            >
              <title>{`${p.mes}: ${p.valor}${UNIDAD_METRICA_ALERTA[metrica]}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex mt-1">
        {puntos.map((p) => (
          <span key={p.mes} className="text-[9.5px] text-gris flex-1 text-center">
            {p.mes}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-gris leading-relaxed">
        Con este umbral se habría activado en{" "}
        <strong className={disparos ? "text-naranjo-deep font-semibold" : "text-tuna font-semibold"}>
          {disparos} de {puntos.length}
        </strong>{" "}
        meses.{" "}
        {disparos === puntos.length && "Dispararía siempre — puede que el umbral esté muy laxo."}
        {disparos === 0 && "No se habría activado nunca — puede que el umbral esté muy exigente."}
      </p>
    </div>
  );
}

const ALERTA_VACIA = {
  metrica: "margen_bruto" as MetricaAlerta,
  bandera: "Todas" as Bandera | "Todas",
  categoria: "Todas" as Categoria | "Todas",
  operador: "<" as Operador,
  umbral: 20,
  frecuencia: "Diaria" as Frecuencia,
  canales: ["Portal"] as Canal[],
};

export default function Alertas() {
  const {
    usuario,
    alertas,
    agregarAlerta,
    editarAlerta,
    alternarAlerta,
    borrarAlerta,
    registrarNotificacion,
  } = useStore();
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);
  // "cerrado" | "nueva" | el id de la alerta que se está editando
  const [formulario, setFormulario] = useState<"cerrado" | "nueva" | string>("cerrado");

  const [metrica, setMetrica] = useState<MetricaAlerta>(ALERTA_VACIA.metrica);
  const [bandera, setBandera] = useState<Bandera | "Todas">(ALERTA_VACIA.bandera);
  const [categoria, setCategoria] = useState<Categoria | "Todas">(ALERTA_VACIA.categoria);
  const [operador, setOperador] = useState<Operador>(ALERTA_VACIA.operador);
  const [umbral, setUmbral] = useState(ALERTA_VACIA.umbral);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>(ALERTA_VACIA.frecuencia);
  const [canales, setCanales] = useState<Canal[]>(ALERTA_VACIA.canales);

  const editandoAlerta = formulario !== "cerrado" && formulario !== "nueva";

  const abrirNueva = () => {
    setMetrica(ALERTA_VACIA.metrica);
    setBandera(ALERTA_VACIA.bandera);
    setCategoria(ALERTA_VACIA.categoria);
    setOperador(ALERTA_VACIA.operador);
    setUmbral(ALERTA_VACIA.umbral);
    setFrecuencia(ALERTA_VACIA.frecuencia);
    setCanales(ALERTA_VACIA.canales);
    setFormulario("nueva");
  };

  const abrirEdicion = (a: AlertaConfigurada) => {
    setMetrica(a.metrica);
    setBandera(a.bandera);
    setCategoria(a.categoria);
    setOperador(a.operador);
    setUmbral(a.umbral);
    setFrecuencia(a.frecuencia);
    setCanales(a.canales);
    setFormulario(a.id);
  };

  const guardar = () => {
    const valorAlGuardar = valorVigente({ metrica, bandera, categoria });
    const cumplida = cumpleCondicion(valorAlGuardar, operador, umbral);

    if (formulario === "nueva") {
      agregarAlerta({
        id: `AL-${crypto.randomUUID().slice(0, 4)}`,
        metrica,
        bandera,
        categoria,
        operador,
        umbral,
        frecuencia,
        canales,
        activa: true,
        creadaPor: usuario.nombre,
        creadaEn: new Date().toLocaleDateString("es-CL"),
      });
    } else if (editandoAlerta) {
      editarAlerta(formulario, { metrica, bandera, categoria, operador, umbral, frecuencia, canales });
    }

    // El cierre del ciclo: si la regla ya está incumplida al momento de
    // guardarla, el aviso aparece de inmediato en el Centro de notificaciones
    // — no hace falta esperar a un cron que esta POC no tiene.
    if (cumplida) {
      registrarNotificacion({
        id: crypto.randomUUID(),
        tipo: "alerta",
        titulo: `${ETIQUETA_METRICA_ALERTA[metrica]} ${operador} ${umbral}${UNIDAD_METRICA_ALERTA[metrica]} ya se cumple`,
        detalle: `${
          bandera === "Todas" ? "Todas las banderas" : bandera
        } · ${categoria === "Todas" ? "todas las categorías" : categoria}. Valor vigente: ${valorAlGuardar}${
          UNIDAD_METRICA_ALERTA[metrica]
        }.`,
        cuando: "ahora",
        leida: false,
      });
    }

    setFormulario("cerrado");
  };

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Mis alertas"
        bajada="Define una métrica, una condición y con qué frecuencia revisarla. Cuando el umbral se cruza, se genera una notificación."
      >
        <div className="mt-6">
          <NotaDiscovery preguntas={PREGUNTAS} />
        </div>
      </Encabezado>

      <div className="p-8 space-y-6">
        <Panel
          titulo={`${alertas.length} ${alertas.length === 1 ? "regla configurada" : "reglas configuradas"}`}
          accion={
            <Boton
              variante="contorno"
              onClick={() => (formulario === "nueva" ? setFormulario("cerrado") : abrirNueva())}
            >
              {formulario === "nueva" ? (
                <>
                  <IconoCerrar size={14} />
                  Cancelar
                </>
              ) : (
                <>
                  <IconoMas size={14} />
                  Nueva alerta
                </>
              )}
            </Boton>
          }
        >
          {formulario !== "cerrado" && (
            <div className="mb-5 pb-5 border-b border-cenco-line">
              {editandoAlerta && (
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-cenco-deep">
                    Editando {ETIQUETA_METRICA_ALERTA[alertas.find((a) => a.id === formulario)!.metrica]}
                  </span>
                  <button
                    onClick={() => setFormulario("cerrado")}
                    className="text-micro text-gris hover:text-cenco-deep"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-5">
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="block">
                      <span className="text-micro text-gris font-medium inline-flex items-center gap-1.5">
                        <label htmlFor="alerta-metrica">Métrica</label>
                        <InfoIndicador id={INDICADOR_DE_COLUMNA[metrica]} />
                      </span>
                      <select
                        id="alerta-metrica"
                        value={metrica}
                        onChange={(e) => setMetrica(e.target.value as MetricaAlerta)}
                        className="estado mt-1 w-full border border-cenco-line px-2.5 py-2 text-[13px]"
                      >
                        {METRICAS.map((m) => (
                          <option key={m} value={m}>
                            {ETIQUETA_METRICA_ALERTA[m]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="block">
                      <span className="text-micro text-gris font-medium">Bandera</span>
                      <select
                        value={bandera}
                        onChange={(e) => setBandera(e.target.value as Bandera | "Todas")}
                        className="estado mt-1 w-full border border-cenco-line px-2.5 py-2 text-[13px]"
                      >
                        <option value="Todas">Todas</option>
                        {BANDERAS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-micro text-gris font-medium">Categoría</span>
                      <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as Categoria | "Todas")}
                        className="estado mt-1 w-full border border-cenco-line px-2.5 py-2 text-[13px]"
                      >
                        <option value="Todas">Todas</option>
                        {CATEGORIAS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-micro text-gris font-medium">Frecuencia</span>
                      <select
                        value={frecuencia}
                        onChange={(e) => setFrecuencia(e.target.value as Frecuencia)}
                        className="estado mt-1 w-full border border-cenco-line px-2.5 py-2 text-[13px]"
                      >
                        {FRECUENCIAS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="block">
                      <span className="text-micro text-gris font-medium">Condición</span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <select
                          value={operador}
                          onChange={(e) => setOperador(e.target.value as Operador)}
                          className="estado border border-cenco-line px-2.5 py-2 text-[13px] font-mono"
                        >
                          {OPERADORES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={umbral}
                          onChange={(e) => setUmbral(Number(e.target.value))}
                          className="estado w-24 border border-cenco-line px-2.5 py-2 text-[13px] num"
                        />
                        <span className="text-[13px] text-gris">{UNIDAD_METRICA_ALERTA[metrica]}</span>
                      </div>
                    </label>

                    <div>
                      <span className="text-micro text-gris font-medium block mb-1">Canal de aviso</span>
                      <div className="flex flex-wrap gap-2">
                        {CANALES.map((c) => {
                          const activo = canales.includes(c);
                          return (
                            <button
                              key={c}
                              onClick={() =>
                                setCanales((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))
                              }
                              className={`estado rounded-full px-3 py-1.5 text-[12.5px] font-medium border ${
                                activo
                                  ? "bg-cenco text-white border-cenco"
                                  : "border-cenco-line text-tuna hover:border-cenco/50"
                              }`}
                            >
                              {c}
                              {!CANAL_LISTO[c] && <span className="opacity-70"> · próx.</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Boton onClick={guardar}>
                      {editandoAlerta ? "Guardar cambios" : "Crear alerta"}
                    </Boton>
                  </div>
                  <p className="mt-3 text-micro text-gris leading-relaxed">
                    En este piloto solo el canal Portal está habilitado.
                  </p>
                </div>

                <MiniHistorico
                  metrica={metrica}
                  bandera={bandera}
                  categoria={categoria}
                  operador={operador}
                  umbral={umbral}
                />
              </div>
            </div>
          )}

          <ul className="divide-y divide-cenco-line -my-2">
            {alertas.map((a) => {
              const valor = valorVigente(a);
              const cumplida = cumpleCondicion(valor, a.operador, a.umbral);
              return (
                <li key={a.id} className="py-4 flex flex-wrap items-start gap-4">
                  <Interruptor activo={a.activa} onClick={() => alternarAlerta(a.id)} />

                  <div className="flex-1 min-w-[240px]">
                    <div className="text-[14px] font-medium text-tuna">
                      {ETIQUETA_METRICA_ALERTA[a.metrica]} {a.operador} {a.umbral}
                      {UNIDAD_METRICA_ALERTA[a.metrica]}
                      <span className="text-gris font-normal">
                        {" "}
                        · {a.bandera === "Todas" ? "todas las banderas" : a.bandera} ·{" "}
                        {a.categoria === "Todas" ? "todas las categorías" : a.categoria}
                      </span>
                    </div>
                    <div className="text-micro text-gris mt-1">
                      {a.frecuencia} · {a.canales.join(", ")} · configurada por {a.creadaPor} el{" "}
                      {a.creadaEn}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="num text-[13.5px] font-semibold text-tuna">
                      {valor.toLocaleString("es-CL")}
                      {UNIDAD_METRICA_ALERTA[a.metrica]}
                    </div>
                    <div className="text-micro text-gris">valor vigente · ago 2026</div>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 text-micro font-semibold px-2.5 py-1 rounded-full ${
                      !a.activa
                        ? "bg-papel text-gris"
                        : cumplida
                        ? "bg-naranjo-soft text-naranjo-deep"
                        : "bg-certif-soft text-certif"
                    }`}
                  >
                    {a.activa ? (
                      cumplida ? (
                        <>
                          <IconoAlerta size={12} /> Activa ahora
                        </>
                      ) : (
                        <>
                          <IconoCheck size={12} /> Sin novedad
                        </>
                      )
                    ) : (
                      "Pausada"
                    )}
                  </span>

                  <Boton variante="sutil" onClick={() => abrirEdicion(a)}>
                    <IconoLapiz size={13} />
                  </Boton>

                  <Boton
                    variante="sutil"
                    onClick={() => {
                      if (confirmarBorrado === a.id) {
                        borrarAlerta(a.id);
                        setConfirmarBorrado(null);
                      } else {
                        setConfirmarBorrado(a.id);
                        setTimeout(
                          () =>
                            setConfirmarBorrado((actual) => (actual === a.id ? null : actual)),
                          3000
                        );
                      }
                    }}
                  >
                    <span
                      className={`flex items-center gap-1.5 ${
                        confirmarBorrado === a.id ? "text-naranjo-deep" : ""
                      }`}
                    >
                      <IconoPapelera size={13} />
                      {confirmarBorrado === a.id ? "¿Eliminar?" : ""}
                    </span>
                  </Boton>
                </li>
              );
            })}
            {!alertas.length && (
              <li className="py-8 text-center text-[13.5px] text-gris">
                Todavía no configuras ninguna alerta.
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
