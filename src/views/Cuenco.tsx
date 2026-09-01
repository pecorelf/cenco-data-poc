import { useRef, useState } from "react";
import { INDICADORES } from "../data/semantica";
import {
  filtrar,
  porCategoria,
  serieMensual,
  MESES,
} from "../data/comercial";
import { Encabezado } from "../components/UI";
import { useStore, alcance } from "../lib/store";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

const SUGERENCIAS = [
  "¿Cómo va el margen de marca propia este año y por qué cayó?",
  "¿Qué categoría está más lejos de su plan en agosto?",
  "¿Cuánto es la penetración de marca propia en clientes del programa?",
  "¿Cuál es el margen de contribución regional?",
];

/** Arma el contexto que el agente puede usar. Nada fuera de esto existe para él. */
function construirContexto(
  usuario: ReturnType<typeof useStore.getState>["usuario"]
) {
  const { banderas, categorias } = alcance(usuario);

  const defs = INDICADORES.map(
    (i) =>
      `- ${i.nombre} (v${i.version}, ${i.estado}). ${i.definicion} Fórmula: ${i.formula.replace(
        /\n\s*/g,
        " "
      )} Responde: ${i.owner.nombre}, ${i.owner.cargo}. Deja fuera: ${i.excluye.join("; ")}.`
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

  const penetracion = (() => {
    const f = filtrar({ mes: "Ago" });
    const v =
      f.reduce((a, d) => a + d.penetracionLealtad, 0) / (f.length || 1);
    return v.toFixed(1);
  })();

  return `USUARIO EN SESIÓN: ${usuario.nombre}, ${usuario.cargo}.
ALCANCE RLS: banderas = ${banderas ? banderas.join(", ") : "todas"}; categorías = ${
    categorias ? categorias.join(", ") : "todas"
  }. Derecho de publicación: ${usuario.puedePublicar ? "sí" : "no"}.

INDICADORES DEFINIDOS EN LA CAPA SEMÁNTICA:
${defs}

SERIE MENSUAL 2026 (total Supermercados Chile, marca propia), meses disponibles ${MESES.join(", ")}:
${serie}

DETALLE POR CATEGORÍA, AGOSTO 2026:
${cats}

PENETRACIÓN DE MARCA PROPIA EN CLIENTES DEL PROGRAMA, AGOSTO 2026: ${penetracion}% (indicador en certificación, todavía sin sello).`;
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

      while (true) {
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
              copia[copia.length - 1] = {
                role: "assistant",
                content: acumulado,
              };
              return copia;
            });
            finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          } else if (evento.type === "error") {
            throw new Error(evento.error);
          }
        }
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setMensajes((m) => m.slice(0, -1));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pb-12">
      <Encabezado
        titulo="Cuenco"
        bajada="Pregunta en lenguaje natural. Cuenco resuelve contra la misma capa semántica que alimenta el portal y Power BI, así que su respuesta trae la misma cifra y te dice de qué definición salió."
      />

      <div className="max-w-[820px] px-8 py-7">
        {!mensajes.length && (
          <div className="space-y-2.5">
            <p className="text-[13px] text-gris">Prueba con:</p>
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                onClick={() => preguntar(s)}
                className="block w-full text-left border border-cenco-line bg-white px-4 py-3 text-[14px] text-tinta hover:border-cenco hover:bg-cenco-soft transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-5">
          {mensajes.map((m, i) => (
            <div key={i}>
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-cenco text-white px-4 py-2.5 text-[14px] max-w-[80%] leading-relaxed">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div className="bg-white border-l-[3px] border-cenco-deep border-y border-r border-cenco-line px-5 py-4">
                  <div className="text-micro text-gris mb-2">Cuenco</div>
                  <div className="text-[14px] text-tinta leading-relaxed whitespace-pre-wrap">
                    {m.content ||
                      (cargando ? "Consultando la capa semántica…" : "")}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={finRef} />
        </div>

        {error && (
          <div className="mt-5 border border-naranjo/40 bg-orange-50 text-naranjo p-4 text-[13px] leading-relaxed">
            No se pudo consultar: {error}
            <span className="block mt-1 text-gris">
              Revisa que ANTHROPIC_API_KEY esté configurada en el proyecto.
            </span>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <input
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && preguntar(entrada)}
            placeholder="Pregunta por venta, margen, participación o quiebre…"
            className="flex-1 border border-cenco-line bg-white px-4 py-3 text-[14px] rounded-sm"
          />
          <button
            onClick={() => preguntar(entrada)}
            disabled={cargando || !entrada.trim()}
            className="bg-cenco text-white px-6 text-[14px] font-medium rounded-sm hover:bg-cenco-deep disabled:opacity-40 transition-colors"
          >
            {cargando ? "…" : "Preguntar"}
          </button>
        </div>

        <p className="mt-3 text-micro text-gris leading-relaxed">
          Cuenco solo puede responder con los indicadores definidos en la capa
          semántica y dentro del alcance de {usuario.nombre}. Si algo no está
          definido, lo dice en vez de estimarlo.
        </p>
      </div>
    </div>
  );
}
