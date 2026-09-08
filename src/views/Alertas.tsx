import { useState } from "react";
import {
  ETIQUETA_METRICA_ALERTA,
  UNIDAD_METRICA_ALERTA,
  CANAL_LISTO,
  valorVigente,
  cumpleCondicion,
  type MetricaAlerta,
  type Operador,
  type Frecuencia,
  type Canal,
} from "../data/alertas";
import { BANDERAS, CATEGORIAS, type Bandera, type Categoria } from "../data/comercial";
import { Boton, Encabezado, NotaDiscovery, Panel } from "../components/UI";
import { IconoPapelera, IconoMas, IconoAlerta, IconoCheck } from "../components/Iconos";
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

export default function Alertas() {
  const { usuario, alertas, agregarAlerta, alternarAlerta, borrarAlerta } = useStore();
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);
  const [abriendo, setAbriendo] = useState(false);

  const [metrica, setMetrica] = useState<MetricaAlerta>("margen_bruto");
  const [bandera, setBandera] = useState<Bandera | "Todas">("Todas");
  const [categoria, setCategoria] = useState<Categoria | "Todas">("Todas");
  const [operador, setOperador] = useState<Operador>("<");
  const [umbral, setUmbral] = useState(20);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>("Diaria");
  const [canales, setCanales] = useState<Canal[]>(["Portal"]);

  const crear = () => {
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
    setAbriendo(false);
  };

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Mis alertas"
        bajada="Define una métrica, una condición y con qué frecuencia revisarla. Cuando el umbral se cruza, el aviso llega solo — sin que nadie tenga que abrir el portal a mirar."
      >
        <div className="mt-6">
          <NotaDiscovery preguntas={PREGUNTAS} />
        </div>
      </Encabezado>

      <div className="p-8 space-y-6">
        <Panel
          titulo={`${alertas.length} ${alertas.length === 1 ? "regla configurada" : "reglas configuradas"}`}
          accion={
            <Boton variante="contorno" onClick={() => setAbriendo((v) => !v)}>
              <IconoMas size={14} />
              Nueva alerta
            </Boton>
          }
        >
          {abriendo && (
            <div className="mb-5 pb-5 border-b border-cenco-line">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="block">
                  <span className="text-micro text-gris font-medium">Métrica</span>
                  <select
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
                </label>
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

                <Boton onClick={crear}>Crear alerta</Boton>
              </div>
              <p className="mt-3 text-micro text-gris leading-relaxed">
                En este piloto solo el canal Portal está conectado de verdad. Email, Slack y
                WhatsApp quedan seleccionables para la conversación de mañana, no porque ya
                envíen algo.
              </p>
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
