import { useEffect, useRef, useState } from "react";
import { INDICADORES } from "../data/semantica";
import { filtrar, porCategoria, serieMensual, MESES } from "../data/comercial";
import { Boton, Sello } from "./UI";
import { Grafico, type EspecGrafico } from "./Graficos";
import { extraer } from "../lib/espec";
import { useStore, alcance } from "../lib/store";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

const SUGERENCIAS = [
  "Evolución del margen y la participación este año",
  "¿Dónde se abrió la brecha contra el plan?",
  "Ranking de categorías por margen en agosto",
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

function GraficoConGuardado({
  espec,
  pregunta,
}: {
  espec: EspecGrafico;
  pregunta: string;
}) {
  const { usuario, guardarGrafico, setVista, cerrarChat } = useStore();
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
    <div className="mt-3 border border-cenco-line rounded-card bg-white p-4">
      <Grafico e={espec} />
      <div className="mt-4 pt-3 border-t border-cenco-line">
        {!guardado ? (
          abriendo ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && guardar()}
                placeholder="Nombre del gráfico"
                className="w-full border border-cenco-line px-3 py-2 text-[13px]"
              />
              <div className="flex gap-2">
                <Boton onClick={guardar}>Guardar</Boton>
                <Boton variante="sutil" onClick={() => setAbriendo(false)}>
                  Cancelar
                </Boton>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Boton variante="contorno" onClick={() => setAbriendo(true)}>
                Guardar
              </Boton>
              <Sello estado={sinCertificar ? "exploratorio" : "certificado"} />
            </div>
          )
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-certif font-medium">
              Guardado como «{nombre.trim() || espec.titulo}».
            </span>
            <Boton
              variante="sutil"
              onClick={() => {
                setVista("graficos");
                cerrarChat();
              }}
            >
              Ver
            </Boton>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BIA() {
  const { usuario, chatAbierto, alternarChat, cerrarChat } = useStore();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noLeidos, setNoLeidos] = useState(0);
  const finRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  // Al abrir: foco en el campo y se limpia el aviso de respuesta nueva.
  useEffect(() => {
    if (chatAbierto) {
      setNoLeidos(0);
      campoRef.current?.focus();
      finRef.current?.scrollIntoView({ block: "end" });
    }
  }, [chatAbierto]);

  // Escape cierra el panel sin perder la conversación.
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && chatAbierto) cerrarChat();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [chatAbierto, cerrarChat]);

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

      // Si respondió con el panel cerrado, la burbuja lo avisa.
      if (!useStore.getState().chatAbierto) setNoLeidos((n) => n + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setMensajes((m) => m.slice(0, -1));
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* Burbuja */}
      <button
        onClick={alternarChat}
        aria-expanded={chatAbierto}
        aria-label={chatAbierto ? "Cerrar BIA" : "Abrir BIA"}
        className="estado fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-cenco text-white rounded-full pl-5 pr-6 py-3.5 shadow-alto hover:bg-cenco-deep"
      >
        <span className="relative flex w-2.5 h-2.5">
          <span className="absolute inset-0 rounded-full bg-naranjo anim-pulso" />
          <span className="relative w-2.5 h-2.5 rounded-full bg-naranjo" />
        </span>
        <span className="text-[14px] font-semibold">
          {chatAbierto ? "Cerrar BIA" : "BIA"}
        </span>
        {!chatAbierto && noLeidos > 0 && (
          <span className="num text-micro font-bold bg-naranjo rounded-full px-1.5 py-0.5">
            {noLeidos}
          </span>
        )}
      </button>

      {/*
        El panel no se desmonta al cerrarse: solo se oculta. Así la conversación,
        el streaming en curso y los gráficos generados siguen ahí al reabrirlo.
      */}
      <section
        aria-hidden={!chatAbierto}
        className={`fixed bottom-24 right-6 z-50 w-[min(440px,calc(100vw-3rem))] max-h-[min(640px,calc(100vh-9rem))] flex flex-col bg-white border border-cenco-line rounded-card shadow-alto transition-all duration-300 ease-cenco ${
          chatAbierto
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-cenco-line">
          <div>
            <div className="text-[15px] font-semibold text-cenco-deep">BIA</div>
            <p className="text-micro text-gris mt-0.5 leading-relaxed">
              Responde sobre la capa semántica, dentro del alcance de{" "}
              {usuario.nombre.split(" ")[0]}.
            </p>
          </div>
          <button
            onClick={cerrarChat}
            aria-label="Cerrar"
            className="estado text-gris hover:text-cenco-deep text-[20px] leading-none px-1"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!mensajes.length && (
            <div className="space-y-2">
              <p className="text-[13px] text-gris">Prueba con:</p>
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => preguntar(s)}
                  className="estado block w-full text-left border border-cenco-line px-4 py-2.5 rounded-control text-[13.5px] text-tuna leading-snug hover:border-cenco/50 hover:bg-cenco-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {mensajes.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="bg-cenco text-white px-4 py-2.5 rounded-card rounded-br-md text-[13.5px] max-w-[85%] leading-relaxed">
                    {m.content}
                  </div>
                </div>
              );
            }
            const { texto, espec, error: errEspec } = extraer(m.content);
            return (
              <div key={i}>
                <div className="text-[13.5px] text-tuna leading-relaxed whitespace-pre-wrap">
                  {texto ||
                    (cargando ? (
                      <span className="anim-pulso text-gris">
                        Consultando la capa semántica…
                      </span>
                    ) : null)}
                </div>
                {errEspec && (
                  <p className="mt-2 text-[12.5px] text-naranjo-deep">
                    No se pudo dibujar el gráfico: {errEspec}
                  </p>
                )}
                {espec && (
                  <GraficoConGuardado
                    espec={espec}
                    pregunta={mensajes[i - 1]?.content ?? ""}
                  />
                )}
              </div>
            );
          })}

          {error && (
            <div className="border border-naranjo/35 bg-naranjo-soft text-naranjo-deep p-3.5 rounded-card text-[12.5px] leading-relaxed">
              No se pudo consultar: {error}
            </div>
          )}
          <div ref={finRef} />
        </div>

        <div className="px-5 py-4 border-t border-cenco-line">
          <div className="flex gap-2">
            <input
              ref={campoRef}
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && preguntar(entrada)}
              placeholder="Pregunta o pide un cruce…"
              className="estado flex-1 border border-cenco-line px-4 py-2.5 text-[13.5px] focus:border-cenco"
            />
            <Boton
              onClick={() => preguntar(entrada)}
              disabled={cargando || !entrada.trim()}
            >
              {cargando ? "…" : "Enviar"}
            </Boton>
          </div>
        </div>
      </section>
    </>
  );
}
