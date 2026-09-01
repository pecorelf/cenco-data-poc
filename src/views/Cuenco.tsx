import { useRef, useState } from "react";
import { INDICADORES } from "../data/semantica";
import { filtrar, porCategoria, serieMensual, MESES } from "../data/comercial";
import { Encabezado, Boton, Sello } from "../components/UI";
import { Grafico, type EspecGrafico } from "../components/Graficos";
import { extraer } from "../lib/espec";
import { useStore, alcance } from "../lib/store";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

const SUGERENCIAS = [
  "Muéstrame la evolución del margen y la participación este año",
  "Cruza venta contra plan mes a mes y dime dónde se abrió la brecha",
  "Ranking de categorías por margen en agosto",
  "¿Cuál es el margen de contribución regional?",
];

function construirContexto(usuario: ReturnType<typeof useStore.getState>["usuario"]) {
  const { banderas, categorias } = alcance(usuario);

  const defs = INDICADORES.map(
    (i) =>
      `- id=${i.id} · ${i.nombre} (v${i.version}, ${i.estado}). ${i.definicion} Responde: ${i.owner.nombre}, ${i.owner.cargo}. Deja fuera: ${i.excluye.join("; ")}.`
  ).join("\n");

  const serie = serieMensual({})
    .map(
      (s) =>
        `${s.mes}: venta ${s.venta} MM, plan ${s.plan} MM, cumplimiento ${s.cumplimiento}%, margen ${s.margen}%, participación ${s.share}%`
    )
    .join("\n");

  const cats = porCategoria("Ago")
    .map(
      (c) =>
        `${c.categoria}: venta ${c.venta} MM, cumplimiento ${c.cumplimiento}%, margen ${c.margen}%, participación ${c.share}%, quiebre ${c.quiebre}%`
    )
    .join("\n");

  const f = filtrar({ mes: "Ago" });
  const penetracion = (
    f.reduce((a, d) => a + d.penetracionLealtad, 0) / (f.length || 1)
  ).toFixed(1);

  return `USUARIO EN SESIÓN: ${usuario.nombre}, ${usuario.cargo}.
ALCANCE RLS: banderas = ${banderas ? banderas.join(", ") : "todas"}; categorías = ${
    categorias ? categorias.join(", ") : "todas"
  }. Derecho de publicación: ${usuario.puedePublicar ? "sí" : "no"}.

INDICADORES DE LA CAPA SEMÁNTICA:
${defs}

SERIE MENSUAL 2026 (Supermercados Chile, marca propia). Meses: ${MESES.join(", ")}.
${serie}

DETALLE POR CATEGORÍA, AGOSTO 2026:
${cats}

PENETRACIÓN DE MARCA PROPIA EN CLIENTES DEL PROGRAMA, AGOSTO 2026: ${penetracion}% (indicador en certificación, sin sello).`;
}

/** Tarjeta de gráfico con el flujo de guardado por nombre. */
function GraficoConGuardado({
  espec,
  pregunta,
}: {
  espec: EspecGrafico;
  pregunta: string;
}) {
  const { usuario, guardarGrafico, setVista } = useStore();
  const [abriendo, setAbriendo] = useState(false);
  const [nombre, setNombre] = useState(espec.titulo);
  const [guardado, setGuardado] = useState(false);

  const sinCertificar = (espec.indicadores ?? []).some((id) => {
    const ind = INDICADORES.find((i) => i.id === id);
    return ind ? ind.estado !== "certificado" : false;
  });

  const guardar = () => {
    guardarGrafico({
      id: crypto.randomUUID(),
      nombre: nombre.trim() || espec.titulo,
      creadoPor: usuario.nombre,
      creadoEn: new Date().toLocaleDateString("es-CL"),
      pregunta,
      espec,
      certificado: !sinCertificar,
    });
    setGuardado(true);
    setAbriendo(false);
  };

  return (
    <div className="mt-5 bg-white border border-cenco-line rounded-card shadow-suave p-6">
      <Grafico e={espec} />

      <div className="mt-5 pt-4 border-t border-cenco-line flex flex-wrap items-center gap-3">
        {!guardado ? (
          abriendo ? (
            <>
              <input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && guardar()}
                placeholder="Nombre del gráfico"
                className="flex-1 min-w-[220px] border border-cenco-line px-4 py-2.5 text-[14px]"
              />
              <Boton onClick={guardar}>Guardar</Boton>
              <Boton variante="sutil" onClick={() => setAbriendo(false)}>
                Cancelar
              </Boton>
            </>
          ) : (
            <>
              <Boton variante="contorno" onClick={() => setAbriendo(true)}>
                Guardar en Mis gráficos
              </Boton>
              <Sello estado={sinCertificar ? "exploratorio" : "certificado"} />
              {espec.indicadores?.length ? (
                <span className="text-micro text-gris">
                  Construido sobre {espec.indicadores.length}{" "}
                  {espec.indicadores.length === 1 ? "indicador" : "indicadores"} de la capa
                  semántica
                </span>
              ) : null}
            </>
          )
        ) : (
          <>
            <span className="text-[13.5px] text-certif font-medium">
              Guardado como «{nombre.trim() || espec.titulo}».
            </span>
            <Boton variante="sutil" onClick={() => setVista("graficos")}>
              Ver Mis gráficos
            </Boton>
          </>
        )}
      </div>
    </div>
  );
}

export default function Cuenco() {
  const usuario = useStore((s) => s.usuario);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  const preguntar = async (texto: string) => {
    const pregunta = texto.trim();
    if (!pregunta || cargando) return;

    setError(null);
    const historial: Mensaje[] = [...mensajes, { role: "user", content: pregunta }];
    setMensajes([...historial, { role: "assistant", content: "" }]);
    setEntrada("");
    setCargando(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historial,
          contexto: construirContexto(usuario),
        }),
      });

      if (!r.ok || !r.body) {
        const t = await r.text();
        throw new Error(t.slice(0, 300) || `HTTP ${r.status}`);
      }

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acumulado = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const partes = buffer.split("\n\n");
        buffer = partes.pop() ?? "";

        for (const p of partes) {
          const linea = p.trim();
          if (!linea.startsWith("data:")) continue;
          const evento = JSON.parse(linea.slice(5).trim());
          if (evento.type === "text") {
            acumulado += evento.text;
            setMensajes((m) => {
              const copia = [...m];
              copia[copia.length - 1] = { role: "assistant", content: acumulado };
              return copia;
            });
            finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          } else if (evento.type === "error") {
            throw new Error(evento.error);
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setMensajes((m) => m.slice(0, -1));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Cuenco"
        bajada="Pregunta en lenguaje natural y pide los cruces que necesites. Cuenco resuelve contra la misma capa semántica que alimenta el portal y Power BI, arma el gráfico y te dice de qué indicador salió cada cifra."
      />

      <div className="max-w-[880px] px-8 py-8">
        {!mensajes.length && (
          <div className="grid sm:grid-cols-2 gap-3">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                onClick={() => preguntar(s)}
                className="estado text-left border border-cenco-line bg-white px-5 py-4 rounded-card text-[14px] text-tuna leading-snug hover:border-cenco/50 hover:shadow-suave"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {mensajes.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="bg-cenco text-white px-5 py-3 rounded-card rounded-br-md text-[14px] max-w-[80%] leading-relaxed shadow-suave">
                    {m.content}
                  </div>
                </div>
              );
            }

            const { texto, espec, error: errEspec } = extraer(m.content);
            const preguntaPrevia = mensajes[i - 1]?.content ?? "";

            return (
              <div key={i}>
                <div className="bg-white border border-cenco-line rounded-card shadow-suave px-6 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-naranjo" aria-hidden />
                    <span className="text-micro text-gris font-semibold">Cuenco</span>
                  </div>
                  <div className="text-[14.5px] text-tuna leading-relaxed whitespace-pre-wrap">
                    {texto ||
                      (cargando ? (
                        <span className="anim-pulso text-gris">
                          Consultando la capa semántica…
                        </span>
                      ) : null)}
                  </div>
                  {errEspec && (
                    <p className="mt-3 text-[13px] text-naranjo-deep">
                      No se pudo dibujar el gráfico: {errEspec}
                    </p>
                  )}
                </div>
                {espec && (
                  <GraficoConGuardado espec={espec} pregunta={preguntaPrevia} />
                )}
              </div>
            );
          })}
          <div ref={finRef} />
        </div>

        {error && (
          <div className="mt-5 border border-naranjo/35 bg-naranjo-soft text-naranjo-deep p-4 rounded-card text-[13.5px] leading-relaxed">
            No se pudo consultar: {error}
            <span className="block mt-1 text-gris">
              Revisa que ANTHROPIC_API_KEY esté configurada en el proyecto.
            </span>
          </div>
        )}

        <div className="mt-7 flex gap-3">
          <input
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && preguntar(entrada)}
            placeholder="Pide un cruce: margen contra participación, venta contra plan…"
            className="estado flex-1 border border-cenco-line bg-white px-5 py-3.5 text-[14px] shadow-suave focus:border-cenco"
          />
          <Boton onClick={() => preguntar(entrada)} disabled={cargando || !entrada.trim()}>
            {cargando ? "Consultando…" : "Preguntar"}
          </Boton>
        </div>

        <p className="mt-3 text-micro text-gris leading-relaxed">
          Cuenco solo responde con los indicadores definidos en la capa semántica y dentro
          del alcance de {usuario.nombre}. Si algo no está definido, lo dice en vez de
          estimarlo.
        </p>
      </div>
    </div>
  );
}
