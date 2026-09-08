import { useState } from "react";
import {
  EJEMPLOS,
  OBJETOS,
  OBJETO_PRINCIPAL,
  INDICADOR_DE_COLUMNA,
  ejecutar,
  ErrorConsulta,
  type Resultado,
  type Complejidad,
} from "../data/sql";
import { INDICADORES, porId } from "../data/semantica";
import { BANDERAS, CATEGORIAS, MESES, type Bandera, type Categoria } from "../data/comercial";
import { PRESUPUESTO_TOTAL_USUARIO, PRESUPUESTO_TOTAL_AREA } from "../data/usuarios";
import { Boton, Panel, Sello } from "../components/UI";
import { BarraProgreso, Contador } from "../components/Graficos";
import { useStore, alcance } from "../lib/store";
import {
  IconoGlobo,
  IconoCapas,
  IconoCarpeta,
  IconoInsignia,
  IconoDestellos,
  IconoSliders,
  IconoTerminal,
  IconoCheckEscudo,
  IconoReloj,
  IconoFilas,
  IconoMoneda,
  IconoServidor,
  IconoDescargar,
  IconoSubir,
  IconoPlay,
  IconoLupa,
  IconoPapelera,
  IconoMas,
  IconoCerrar,
  IconoChat,
} from "../components/Iconos";

type Modo = "asistente" | "constructor" | "sql";

const COLOR_COMPLEJIDAD: Record<Complejidad, string> = {
  Bajo: "bg-certif-soft text-certif",
  Medio: "bg-cenco-soft text-cenco-deep",
  Alto: "bg-naranjo-soft text-naranjo-deep",
};

const AGREGADOR_DEFECTO: Record<string, "SUM" | "AVG"> = {
  venta_neta: "SUM",
  plan: "SUM",
  margen_bruto: "AVG",
  share_mp: "AVG",
  quiebre: "AVG",
};

const ETIQUETA_METRICA: Record<string, string> = {
  venta_neta: "Venta neta",
  plan: "Plan",
  margen_bruto: "Margen bruto",
  share_mp: "Participación",
  quiebre: "Quiebre",
};

const ETIQUETA_DIM: Record<string, string> = {
  mes: "Mes",
  bandera: "Bandera",
  categoria: "Categoría",
};

function construirSQL(
  metricas: string[],
  dimensiones: string[],
  mes: string | "todos",
  filtros: Array<{ columna: string; valor: string }>
): string {
  const hayAgrupacion = dimensiones.length > 0;
  const proyecciones = hayAgrupacion
    ? [
        ...dimensiones,
        ...metricas.map((m) => `${AGREGADOR_DEFECTO[m]}(${m}) AS ${m}`),
      ]
    : [...dimensiones, ...metricas];

  const condiciones = [
    ...(mes !== "todos" ? [`mes = '${mes}'`] : []),
    ...filtros.map((f) => `${f.columna} = '${f.valor}'`),
  ];

  return [
    `SELECT ${proyecciones.join(", ")}`,
    `FROM ${OBJETO_PRINCIPAL.nombre}`,
    condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : null,
    hayAgrupacion ? `GROUP BY ${dimensiones.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function ExploradorDatos() {
  const {
    usuario,
    consultas,
    guardarConsulta,
    borrarConsulta,
    presupuestos,
    historialSql,
    consumirCreditos,
    alternarChat,
  } = useStore();
  const { banderas, categorias } = alcance(usuario);

  const [modo, setModo] = useState<Modo>("sql");
  const [sql, setSql] = useState(EJEMPLOS[0].sql);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [error, setError] = useState<{ mensaje: string; sugerencia?: string } | null>(null);
  const [nombreGuardado, setNombreGuardado] = useState("");
  const [verHistorial, setVerHistorial] = useState(false);
  const [verGuardadas, setVerGuardadas] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);

  // Constructor visual
  const [metricasSel, setMetricasSel] = useState<string[]>(["venta_neta", "margen_bruto"]);
  const [dimensionesSel, setDimensionesSel] = useState<string[]>(["mes"]);
  const [periodoMes, setPeriodoMes] = useState<string | "todos">("todos");
  const [filtrosExtra, setFiltrosExtra] = useState<
    Array<{ columna: "bandera" | "categoria"; valor: string }>
  >([]);

  const consumido = presupuestos[usuario.id] ?? 0;
  const disponible = PRESUPUESTO_TOTAL_USUARIO - consumido;
  const consumidoArea = Object.values(presupuestos).reduce((a, b) => a + b, 0);

  const limpiarResultado = () => {
    setResultado(null);
    setConfirmado(false);
    setError(null);
  };

  const analizar = (sqlAAnalizar: string) => {
    try {
      const r = ejecutar(sqlAAnalizar, { banderas, categorias });
      setResultado(r);
      setConfirmado(false);
      setError(null);
    } catch (e) {
      setResultado(null);
      setError(e instanceof ErrorConsulta ? { mensaje: e.message, sugerencia: e.sugerencia } : { mensaje: String(e) });
    }
  };

  const evaluarDiseno = () => {
    const nuevo = construirSQL(metricasSel, dimensionesSel, periodoMes, filtrosExtra);
    setSql(nuevo);
    analizar(nuevo);
  };

  const ejecutarYVer = () => {
    if (!resultado) return;
    consumirCreditos(usuario.id, resultado.consumo.creditos, {
      id: crypto.randomUUID(),
      sql,
      usuario: usuario.nombre,
      creditos: resultado.consumo.creditos,
      filas: resultado.filas.length,
      cuando: new Date().toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
    });
    setConfirmado(true);
  };

  const guardar = () => {
    guardarConsulta({
      id: crypto.randomUUID(),
      nombre: nombreGuardado.trim() || `Consulta ${consultas.length + 1}`,
      sql,
      creadaPor: usuario.nombre,
      creadaEn: new Date().toLocaleDateString("es-CL"),
    });
    setNombreGuardado("");
  };

  const dentroDeCuota = resultado ? resultado.consumo.creditos <= disponible : true;

  return (
    <div className="pb-14">
      {/* Cabecera de la página, con acciones a la derecha */}
      <div className="px-8 pt-8 pb-5 bg-white border-b border-cenco-line">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-micro text-gris">Portal BI · Explorar datos</div>
            <h1 className="mt-1 text-[27px] font-semibold text-cenco-deep leading-tight tracking-[-0.01em]">
              Explorador de datos
            </h1>
            <p className="mt-2 text-[14px] text-gris max-w-[64ch] leading-relaxed">
              Consulta información certificada con control de acceso y consumo
              computacional. Asistente, constructor visual y SQL resuelven contra el mismo
              motor gobernado.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Boton variante="contorno" onClick={() => setVerHistorial((v) => !v)}>
              Historial
            </Boton>
            <Boton variante="contorno" onClick={() => setVerGuardadas((v) => !v)}>
              Consultas guardadas
              {consultas.length > 0 && (
                <span className="num ml-1.5 bg-cenco text-white text-micro font-bold rounded-full px-1.5">
                  {consultas.length}
                </span>
              )}
            </Boton>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {verHistorial && (
          <Panel titulo={`Historial de ${usuario.nombre.split(" ")[0]}`}>
            {historialSql.filter((h) => h.usuario === usuario.nombre).length ? (
              <ul className="divide-y divide-cenco-line -my-2">
                {historialSql
                  .filter((h) => h.usuario === usuario.nombre)
                  .map((h) => (
                    <li key={h.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <code className="text-[12.5px] font-mono text-tuna break-all">
                          {h.sql.replace(/\s+/g, " ")}
                        </code>
                        <div className="text-micro text-gris mt-1">{h.cuando}</div>
                      </div>
                      <div className="num text-[13px] text-gris shrink-0">
                        {h.filas} filas · {h.creditos} créditos
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center text-center py-6">
                <IconoReloj size={22} className="text-cenco-line" />
                <p className="mt-2 text-[13.5px] text-gris">
                  Todavía no ejecutas ninguna consulta.
                </p>
              </div>
            )}
          </Panel>
        )}

        {verGuardadas && (
          <Panel titulo="Consultas guardadas">
            {consultas.length ? (
              <ul className="divide-y divide-cenco-line -my-2">
                {consultas.map((c) => (
                  <li key={c.id} className="py-3 flex items-start justify-between gap-4">
                    <button
                      onClick={() => {
                        setSql(c.sql);
                        setModo("sql");
                        limpiarResultado();
                      }}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className="text-[14px] text-tuna">{c.nombre}</div>
                      <div className="text-micro text-gris mt-0.5 truncate font-mono">
                        {c.sql.replace(/\s+/g, " ")}
                      </div>
                      <div className="text-micro text-gris mt-0.5">
                        {c.creadaPor} · {c.creadaEn}
                      </div>
                    </button>
                    <Boton
                      variante="sutil"
                      onClick={() => {
                        if (confirmarBorrado === c.id) {
                          borrarConsulta(c.id);
                          setConfirmarBorrado(null);
                        } else {
                          setConfirmarBorrado(c.id);
                          setTimeout(
                            () =>
                              setConfirmarBorrado((actual) => (actual === c.id ? null : actual)),
                            3000
                          );
                        }
                      }}
                    >
                      {confirmarBorrado === c.id ? (
                        <span className="text-naranjo-deep flex items-center gap-1.5">
                          <IconoPapelera size={14} />
                          ¿Eliminar?
                        </span>
                      ) : (
                        "Eliminar"
                      )}
                    </Boton>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center text-center py-6">
                <IconoCapas size={22} className="text-cenco-line" />
                <p className="mt-2 text-[13.5px] text-gris">
                  Todavía no guardas ninguna consulta.
                </p>
              </div>
            )}
          </Panel>
        )}

        {confirmado && resultado && (
          <div className="border border-certif/35 bg-certif-soft rounded-card px-5 py-3.5 flex items-center justify-between gap-4">
            <span className="text-[13.5px] font-medium text-certif">
              Consulta ejecutada correctamente. Se consumieron {resultado.consumo.creditos}{" "}
              créditos.
            </span>
            <button
              onClick={() => setConfirmado(false)}
              className="text-certif hover:text-certif/70 text-[18px] leading-none"
              aria-label="Cerrar aviso"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_320px] gap-6 items-start">
          {/* Contexto de datos */}
          <div className="space-y-5 xl:sticky xl:top-6">
            <Panel titulo="Contexto de datos">
              <label className="block mb-4">
                <span className="flex items-center gap-1.5 text-micro text-gris font-medium">
                  <IconoGlobo size={13} /> Mercado
                </span>
                <select
                  disabled
                  value="Chile"
                  title="Los demás países quedan fuera del alcance de este piloto"
                  className="estado mt-1.5 w-full border border-cenco-line px-3 py-2 text-[13.5px] bg-papel text-gris cursor-not-allowed"
                >
                  <option>Chile</option>
                </select>
                <p className="mt-1 text-micro text-gris leading-relaxed">
                  Chile es el alcance de este piloto.
                </p>
              </label>

              <label className="block mb-5">
                <span className="flex items-center gap-1.5 text-micro text-gris font-medium">
                  <IconoCapas size={13} /> Producto de datos
                </span>
                <select
                  disabled
                  title="Único producto de datos publicado en este piloto"
                  className="estado mt-1.5 w-full border border-cenco-line px-3 py-2 text-[13.5px] bg-papel text-gris cursor-not-allowed"
                >
                  <option>Vista 360° · Marca Propia</option>
                </select>
              </label>

              <div className="mb-5">
                <span className="flex items-center gap-1.5 text-micro text-gris font-medium">
                  <IconoCarpeta size={13} /> Dominios
                </span>
                <ul className="mt-1.5 space-y-1">
                  <li className="px-3 py-2 rounded-control bg-cenco-soft text-cenco-deep text-[13.5px] font-medium flex items-center justify-between">
                    Comercial
                    <span className="num text-micro">
                      {OBJETO_PRINCIPAL.columnas.filter((c) => c.tipo === "numero").length}
                    </span>
                  </li>
                  {["Clientes", "Operaciones", "Finanzas", "E-commerce"].map((d) => (
                    <li
                      key={d}
                      title="Todavía no modelado en este piloto"
                      className="px-3 py-2 rounded-control text-[13.5px] text-gris flex items-center justify-between cursor-help"
                    >
                      {d}
                      <span className="text-micro">Próximamente</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="flex items-center gap-1.5 text-micro text-gris font-medium">
                  <IconoInsignia size={13} /> Métricas certificadas
                </span>
                <ul className="mt-1.5 space-y-1">
                  {OBJETO_PRINCIPAL.columnas
                    .filter((c) => c.tipo === "numero")
                    .map((c) => {
                      const ind = porId(INDICADOR_DE_COLUMNA[c.nombre]);
                      const activa = metricasSel.includes(c.nombre);
                      return (
                        <li key={c.nombre}>
                          <label className="flex items-center gap-2.5 px-1 py-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={activa}
                              onChange={() =>
                                setMetricasSel((s) =>
                                  s.includes(c.nombre) ? s.filter((x) => x !== c.nombre) : [...s, c.nombre]
                                )
                              }
                              className="w-4 h-4 accent-[#095AA5]"
                            />
                            <span className="text-[13px] text-tuna flex-1">
                              {ETIQUETA_METRICA[c.nombre]}
                            </span>
                            {ind && <Sello estado={ind.estado} />}
                          </label>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </Panel>
          </div>

          {/* Centro: modos */}
          <div className="space-y-5 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="inline-flex bg-cenco-soft rounded-full p-1">
                {(
                  [
                    ["asistente", "Asistente", IconoDestellos],
                    ["constructor", "Constructor visual", IconoSliders],
                    ["sql", "SQL", IconoTerminal],
                  ] as const
                ).map(([id, label, Icono]) => (
                  <button
                    key={id}
                    onClick={() => setModo(id)}
                    className={`estado flex items-center gap-2 px-4 py-2 text-[13.5px] font-semibold rounded-full ${
                      modo === id ? "bg-cenco text-white shadow-suave" : "text-cenco-deep"
                    }`}
                  >
                    <Icono size={15} />
                    {label}
                  </button>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 text-micro font-semibold text-certif bg-certif-soft border border-certif/25 rounded-full px-3 py-1.5">
                <IconoCheckEscudo size={13} />
                Entorno gobernado
              </span>
            </div>

            {/* SQL */}
            {modo === "sql" && (
              <Panel>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-micro font-mono text-gris">consulta.sql</span>
                  <span className="text-micro font-semibold text-gris bg-papel border border-cenco-line rounded-full px-2.5 py-1">
                    Solo lectura
                  </span>
                </div>
                <textarea
                  value={sql}
                  onChange={(e) => {
                    setSql(e.target.value);
                    limpiarResultado();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && analizar(sql)}
                  spellCheck={false}
                  rows={7}
                  className="w-full bg-cenco-deep text-white rounded-control px-4 py-3.5 text-[13px] leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-cenco/50"
                />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {EJEMPLOS.map((e) => (
                    <button
                      key={e.titulo}
                      onClick={() => {
                        setSql(e.sql);
                        limpiarResultado();
                      }}
                      className="estado text-micro border border-cenco-line rounded-full px-3 py-1.5 text-gris hover:border-cenco/50 hover:text-cenco-deep"
                    >
                      {e.titulo}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Boton onClick={() => analizar(sql)}><IconoLupa size={14} />Analizar consulta</Boton>
                  <span className="text-micro text-gris">Ctrl + Enter también analiza.</span>
                </div>
              </Panel>
            )}

            {/* Constructor visual */}
            {modo === "constructor" && (
              <Panel>
                <div>
                  <h3 className="text-[13.5px] font-semibold text-cenco-deep mb-2.5">Métricas</h3>
                  <div className="flex flex-wrap gap-2">
                    {metricasSel.length === 0 && (
                      <span className="text-[13px] text-gris">
                        Marca al menos una en el panel de la izquierda.
                      </span>
                    )}
                    {metricasSel.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-2 bg-cenco text-white rounded-full pl-3.5 pr-2 py-1.5 text-[13px] font-medium"
                      >
                        {ETIQUETA_METRICA[m]}
                        <button
                          onClick={() => setMetricasSel((s) => s.filter((x) => x !== m))}
                          className="hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          <IconoCerrar size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-[13.5px] font-semibold text-cenco-deep mb-2.5">
                    Dimensiones y agrupación
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(["mes", "bandera", "categoria"] as const).map((d) => {
                      const activa = dimensionesSel.includes(d);
                      return (
                        <button
                          key={d}
                          onClick={() =>
                            setDimensionesSel((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]))
                          }
                          className={`estado rounded-full px-4 py-1.5 text-[13px] font-medium border ${
                            activa
                              ? "bg-cenco text-white border-cenco"
                              : "border-cenco-line text-tuna hover:border-cenco/50"
                          }`}
                        >
                          {ETIQUETA_DIM[d]}
                        </button>
                      );
                    })}
                  </div>
                  {!dimensionesSel.length && (
                    <p className="mt-2 text-micro text-gris">
                      Sin agrupar verás el detalle fila a fila.
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="text-micro text-gris font-medium">Período</span>
                    <select
                      value={periodoMes}
                      onChange={(e) => setPeriodoMes(e.target.value)}
                      className="estado border border-cenco-line px-3 py-2 text-[13px]"
                    >
                      <option value="todos">Todo el histórico</option>
                      {MESES.map((m) => (
                        <option key={m} value={m}>
                          {m} 2026
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    onClick={() => {
                      const disponibles = (["bandera", "categoria"] as const).filter(
                        (c) => !filtrosExtra.some((f) => f.columna === c)
                      );
                      if (!disponibles.length) return;
                      const columna = disponibles[0];
                      const valor = columna === "bandera" ? (banderas ?? BANDERAS)[0] : (categorias ?? CATEGORIAS)[0];
                      setFiltrosExtra((f) => [...f, { columna, valor }]);
                    }}
                    className="estado text-[13px] font-semibold text-cenco border border-cenco-line rounded-full px-4 py-2 hover:bg-cenco-soft"
                  >
                    <IconoMas size={13} />
                    Agregar filtro
                  </button>
                </div>

                {filtrosExtra.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {filtrosExtra.map((f, i) => {
                      const opciones =
                        f.columna === "bandera" ? banderas ?? BANDERAS : categorias ?? CATEGORIAS;
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-2 bg-papel border border-cenco-line rounded-full pl-3.5 pr-2 py-1.5 text-[13px]"
                        >
                          {ETIQUETA_DIM[f.columna]} =
                          <select
                            value={f.valor}
                            onChange={(e) =>
                              setFiltrosExtra((arr) =>
                                arr.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x))
                              )
                            }
                            className="bg-transparent font-medium text-cenco-deep focus:outline-none"
                          >
                            {opciones.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setFiltrosExtra((arr) => arr.filter((_, j) => j !== i))}
                            className="hover:bg-cenco-line rounded-full w-4 h-4 flex items-center justify-center"
                          >
                            <IconoCerrar size={10} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-cenco-line">
                  <Boton onClick={evaluarDiseno} disabled={!metricasSel.length}>
                    <IconoPlay size={14} />
                    Evaluar diseño
                  </Boton>
                </div>
              </Panel>
            )}

            {/* Asistente */}
            {modo === "asistente" && (
              <Panel>
                <p className="text-[13.5px] text-gris leading-relaxed max-w-[60ch]">
                  Elige un punto de partida y ajústalo desde SQL o el constructor visual.
                  Para preguntas libres en lenguaje natural —cruces, comparaciones,
                  explicaciones— usa BIA: entiende la pregunta y arma el gráfico, en vez de
                  una consulta para editar.
                </p>
                <div className="mt-4 grid sm:grid-cols-2 gap-2.5">
                  {EJEMPLOS.filter((e) => e.titulo !== "Un objeto sin permisos").map((e) => (
                    <button
                      key={e.titulo}
                      onClick={() => {
                        setSql(e.sql);
                        setModo("sql");
                        limpiarResultado();
                      }}
                      className="estado text-left border border-cenco-line rounded-control px-4 py-3 text-[13.5px] text-tuna hover:border-cenco/50 hover:bg-cenco-soft"
                    >
                      {e.titulo}
                    </button>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-cenco-line">
                  <Boton variante="contorno" onClick={alternarChat}>
                    <IconoChat size={14} />
                    Preguntarle a BIA
                  </Boton>
                </div>
              </Panel>
            )}

            {error && (
              <div className="border border-naranjo/35 bg-naranjo-soft rounded-card p-5">
                <div className="text-[14px] font-semibold text-naranjo-deep">{error.mensaje}</div>
                {error.sugerencia && (
                  <p className="mt-2 text-[13.5px] text-tuna leading-relaxed">{error.sugerencia}</p>
                )}
              </div>
            )}

            {resultado && (
              <Panel
                titulo="Interpretación de la consulta"
                accion={
                  modo !== "sql" && (
                    <button
                      onClick={() => setModo("sql")}
                      className="text-[13px] font-semibold text-cenco hover:underline underline-offset-4"
                    >
                      Editar como SQL
                    </button>
                  )
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {[
                    ["Métricas", resultado.interpretacion.metricas.join(", ")],
                    ["Agrupación", resultado.interpretacion.agrupacion.join(", ")],
                    ["Período", resultado.interpretacion.periodo],
                    ["Fuente", resultado.interpretacion.fuente],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-micro font-semibold text-gris uppercase tracking-wider">
                        {k}
                      </div>
                      <div className="mt-1 text-[13px] text-tuna break-words">{v}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {confirmado && resultado && (
              <Panel titulo={`${resultado.filas.length} ${resultado.filas.length === 1 ? "fila" : "filas"} · ${resultado.filasLeidas} leídas`}>
                {resultado.rlsAplicado && (
                  <div className="mb-4 border border-cenco/25 bg-cenco-soft rounded-control px-4 py-3">
                    <div className="text-micro font-semibold text-cenco-deep">
                      Filtro aplicado por Unity Catalog
                    </div>
                    <code className="block mt-1 text-[12.5px] text-tuna font-mono">
                      {resultado.rlsAplicado}
                    </code>
                  </div>
                )}
                {resultado.advertencias.map((a) => (
                  <p key={a} className="mb-3 text-[13px] text-gris leading-relaxed">
                    {a}
                  </p>
                ))}
                <div className="overflow-x-auto border border-cenco-line rounded-control">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-papel border-b border-cenco-line text-left">
                        {resultado.columnas.map((c) => (
                          <th key={c} className="px-4 py-2.5 font-semibold text-cenco-deep font-mono text-[12px]">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.filas.map((f, i) => (
                        <tr key={i} className="border-b border-cenco-line last:border-0">
                          {resultado.columnas.map((c) => (
                            <td key={c} className={`px-4 py-2 ${typeof f[c] === "number" ? "num text-right" : ""}`}>
                              {typeof f[c] === "number" ? (f[c] as number).toLocaleString("es-CL") : String(f[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <details className="mt-4">
                  <summary className="text-[13px] text-cenco cursor-pointer">
                    Ver la consulta que se ejecutó realmente
                  </summary>
                  <pre className="mt-2 bg-papel border border-cenco-line rounded-control p-4 text-[12px] font-mono text-tuna overflow-x-auto whitespace-pre-wrap">
                    {resultado.sqlEfectivo}
                  </pre>
                </details>

                <div className="mt-5 pt-4 border-t border-cenco-line flex flex-wrap gap-2 items-center">
                  <input
                    value={nombreGuardado}
                    onChange={(e) => setNombreGuardado(e.target.value)}
                    placeholder="Nombre para guardarla"
                    className="border border-cenco-line px-3.5 py-2 text-[13.5px] min-w-[220px]"
                  />
                  <Boton variante="contorno" onClick={guardar}>
                    Guardar consulta
                  </Boton>
                </div>
              </Panel>
            )}
          </div>

          {/* Presupuesto y consumo */}
          <div className="space-y-5 xl:sticky xl:top-6">
            <Panel titulo="Mi presupuesto">
              <div className="num text-[34px] font-semibold text-cenco-deep leading-none">
                <Contador valor={(disponible / PRESUPUESTO_TOTAL_USUARIO) * 100} decimales={0} />
                <span className="text-[18px] font-normal text-gris ml-0.5">%</span>
              </div>
              <div className="mt-1 text-[12.5px] text-gris">disponible este mes</div>

              <div className="mt-3">
                <BarraProgreso
                  porcentaje={(disponible / PRESUPUESTO_TOTAL_USUARIO) * 100}
                  tono={disponible < 15 ? "naranjo" : "azul"}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[12.5px]">
                <span className="text-gris">
                  Consumido: <span className="num text-tuna font-medium">{consumido}</span>
                </span>
                <span className="text-gris">
                  Total: <span className="num text-tuna font-medium">{PRESUPUESTO_TOTAL_USUARIO}</span> créditos
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-cenco-line flex items-center justify-between text-[12.5px]">
                <span className="text-gris">Presupuesto del área</span>
                <span className="num text-tuna font-medium">
                  {consumidoArea} / {PRESUPUESTO_TOTAL_AREA}
                </span>
              </div>
            </Panel>

            {resultado && (
              <Panel titulo="Evaluación de consumo">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gris">Complejidad estimada</span>
                  <span
                    className={`text-micro font-semibold px-2.5 py-1 rounded-full ${COLOR_COMPLEJIDAD[resultado.consumo.complejidad]}`}
                  >
                    {resultado.consumo.complejidad}
                  </span>
                </div>

                <ul className="mt-4 space-y-3">
                  {(
                    [
                      ["Tiempo estimado", resultado.consumo.tiempoEstimado, IconoReloj],
                      [
                        "Filas estimadas",
                        resultado.consumo.filasEstimadas.toLocaleString("es-CL"),
                        IconoFilas,
                      ],
                      ["Consumo estimado", `${resultado.consumo.creditos} créditos`, IconoMoneda],
                      ["Warehouse", "BI Explorer", IconoServidor],
                    ] as const
                  ).map(([k, v, Icono]) => (
                    <li key={k} className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-gris">
                        <Icono size={14} className="text-cenco-line" />
                        {k}
                      </span>
                      <span className="num text-tuna font-medium">{v}</span>
                    </li>
                  ))}
                </ul>

                {!confirmado && (
                  <div className="mt-5 pt-4 border-t border-cenco-line">
                    {dentroDeCuota ? (
                      <>
                        <div className="border border-certif/30 bg-certif-soft rounded-control px-4 py-3 text-[12.5px] text-certif leading-relaxed">
                          Dentro de tu cuota disponible. Puedes ejecutarla.
                        </div>
                        <div className="mt-3">
                          <Boton ancho onClick={ejecutarYVer}>
                            <IconoPlay size={14} />
                            Ejecutar y ver resultados
                          </Boton>
                        </div>
                      </>
                    ) : (
                      <div className="border border-naranjo/35 bg-naranjo-soft rounded-control px-4 py-3 text-[12.5px] text-naranjo-deep leading-relaxed">
                        Esta consulta cuesta {resultado.consumo.creditos} créditos y solo te
                        quedan {disponible}. No se puede ejecutar hasta el próximo ciclo o con
                        un filtro que la haga más barata.
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            )}

            <div className="border border-cenco-line bg-white rounded-card shadow-suave p-5">
              <h3 className="text-[13.5px] font-semibold text-cenco-deep">
                Qué soporta este editor
              </h3>
              <p className="mt-2 text-[12.5px] text-gris leading-relaxed">
                SELECT con WHERE, GROUP BY, ORDER BY y LIMIT, y las funciones SUM, AVG,
                COUNT, MIN y MAX. Solo objetos que Unity Catalog autorizó a tu perfil, con tu
                alcance de RLS aplicado siempre.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
