import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { INDICADORES } from "../data/semantica";
import {
  buscar,
  parecido,
  responsableDe,
  DOMINIOS,
  DESCRIPCION_DOMINIO,
  ETAPAS,
  type Dominio,
  type Solicitud,
} from "../data/catalogo";
import { Boton, Encabezado, NotaArteDeLoPosible, Panel, Sello } from "../components/UI";
import { BadgeOrigen } from "../components/BadgeOrigen";
import { InfoIndicador } from "../components/InfoIndicador";
import { IconoLupa, IconoCheck, IconoMas, IconoCerrar } from "../components/Iconos";

// Catálogo de datos: buscar antes de pedir, y pedir bien cuando no existe.

const EJEMPLOS = ["ventas contra presupuesto", "productos sin stock", "rotación de inventario por tienda"];
const EN_KPIS = new Set(["venta_neta_mp", "cumplimiento_plan", "margen_bruto_mp", "share_mp"]);
const EN_VARIACIONES = new Set(["venta_neta_mp", "margen_bruto_mp", "share_mp"]);
const ORDEN_ESTADO = { certificado: 0, en_certificacion: 1, exploratorio: 2 } as const;

function Avance({ s }: { s: Solicitud }) {
  if (s.estado === "resuelta_existente") {
    return (
      <span className="inline-flex items-center gap-1.5 text-micro font-semibold text-certif bg-certif-soft border border-certif/25 rounded-full px-2.5 py-1">
        <IconoCheck size={11} /> Ya existía
      </span>
    );
  }
  const idx = ETAPAS.findIndex((e) => e.id === s.estado);
  return (
    <div className="min-w-[132px]">
      <div className="flex gap-1" aria-hidden>
        {ETAPAS.map((e, i) => (
          <span
            key={e.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              i <= idx ? (s.estado === "publicada" ? "bg-certif" : "bg-cenco") : "bg-cenco-soft"
            }`}
          />
        ))}
      </div>
      <div key={s.estado} className="mt-1 text-micro font-semibold text-cenco-deep anim-texto">
        {ETAPAS[idx].texto}
      </div>
    </div>
  );
}

export default function Catalogo() {
  const { usuario, setVista, solicitudes, crearSolicitud, cambiarEstadoSolicitud, registrarNotificacion } =
    useStore();
  const [q, setQ] = useState("");
  const [formulario, setFormulario] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [decision, setDecision] = useState("");
  const [dominio, setDominio] = useState<Dominio>("Sales");
  const [aviso, setAviso] = useState<string | null>(null);

  const resultados = useMemo(() => buscar(q), [q]);
  const lista = q.trim()
    ? resultados
    : [...INDICADORES]
        .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado])
        .map((indicador) => ({ indicador, puntaje: 0, coincide: "" }));

  // Antes de enviar: ¿ya existe un indicador o una solicitud parecida?
  const yaExiste = useMemo(() => (titulo.trim() ? buscar(titulo).slice(0, 1) : []), [titulo]);
  const parecidas = useMemo(
    () =>
      titulo.trim()
        ? solicitudes
            .filter((s) => s.estado !== "resuelta_existente")
            .map((s) => ({ s, p: parecido(titulo, s.titulo) }))
            .filter((x) => x.p >= 0.3)
            .sort((a, b) => b.p - a.p)
            .slice(0, 2)
        : [],
    [titulo, solicitudes]
  );

  const abrirFormulario = (texto: string) => {
    setTitulo(texto);
    setDecision("");
    setFormulario(true);
    setAviso(null);
  };

  const enviar = () => {
    const responsable = responsableDe(dominio);
    crearSolicitud({
      id: crypto.randomUUID(),
      titulo: titulo.trim(),
      decision: decision.trim(),
      solicitante: usuario.nombre,
      area: usuario.cargo,
      dominio,
      responsable,
      estado: "recibida",
      creada: "hoy",
    });
    setFormulario(false);
    setQ("");
    setAviso(`Solicitud enviada. La recibe ${responsable}.`);
  };

  const sumarse = (s: Solicitud) => {
    registrarNotificacion({
      id: crypto.randomUUID(),
      tipo: "definicion",
      titulo: `Te sumaste a «${s.titulo}»`,
      detalle: `Recibirás los avances. Responsable: ${s.responsable}.`,
      cuando: "ahora",
      leida: false,
    });
    setFormulario(false);
    setQ("");
    setAviso(`Te sumaste a «${s.titulo}». Una solicitud menos para el equipo de BI.`);
  };

  const total = solicitudes.length;
  const existentes = solicitudes.filter((s) => s.estado === "resuelta_existente").length;
  const enCurso = solicitudes.filter((s) => ["recibida", "en_evaluacion", "aprobada", "en_construccion"].includes(s.estado)).length;
  const publicadas = solicitudes.filter((s) => s.estado === "publicada").length;

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Catálogo de datos"
        bajada="Antes de pedir un reporte, busca si ya existe. Si no existe, la solicitud llega a quien responde por ese dominio, con la decisión que necesitas apoyar."
      >
        <div className="mt-4">
          <BadgeOrigen tipo="hibrido" detalle="La búsqueda sobre Unity Catalog es nativa; el flujo de solicitudes es nuestro" />
        </div>
        <NotaArteDeLoPosible queFalta="En producción, el catálogo leería directo de Unity Catalog y el flujo se conectaría con la herramienta de tickets que ya use el equipo de BI." />
        <div className="mt-6 max-w-[720px]">
          <label className="flex items-center gap-3 bg-white border-2 border-cenco-line focus-within:border-cenco rounded-full px-5 py-3 transition-colors duration-200">
            <IconoLupa size={18} className="text-gris shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="¿Qué necesitas saber? Por ejemplo: ventas contra presupuesto"
              className="flex-1 bg-transparent outline-none text-[14.5px] text-tuna placeholder:text-gris/70"
              aria-label="Buscar en el catálogo"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Limpiar búsqueda" className="text-gris hover:text-tuna">
                <IconoCerrar size={15} />
              </button>
            )}
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-micro text-gris">Prueba con:</span>
            {EJEMPLOS.map((e) => (
              <button
                key={e}
                onClick={() => setQ(e)}
                className="estado text-[12.5px] px-3 py-1 rounded-full border border-cenco-line text-cenco-deep hover:border-cenco/50 hover:bg-cenco-soft/50"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </Encabezado>

      <div className="p-8 space-y-6">
        {aviso && (
          <div className="anim-aparecer flex items-center gap-3 bg-certif-soft border border-certif/25 text-certif rounded-control px-4 py-3 text-[13.5px] font-medium">
            <IconoCheck size={15} /> {aviso}
          </div>
        )}

        <Panel titulo={q.trim() ? `Resultados para «${q.trim()}»` : "Indicadores disponibles"}>
          {lista.length > 0 && (
            <ul className="divide-y divide-cenco-line -my-2">
              {lista.map(({ indicador: ind, coincide }, i) => (
                <li
                  key={ind.id}
                  className="py-3.5 flex flex-wrap items-start gap-x-6 gap-y-2 anim-aparecer"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14.5px] font-semibold text-cenco-deep">{ind.nombre}</span>
                      <InfoIndicador id={ind.id} />
                      <Sello estado={ind.estado} />
                    </div>
                    <p className="mt-1 text-[12.5px] text-gris leading-relaxed max-w-[80ch]">{ind.definicion}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-micro text-gris">
                      <span>Dominio {ind.dominio}</span>
                      <span>Responde {ind.owner.nombre}</span>
                      <span>Disponible en {ind.consumidores.join(", ")}</span>
                      {q.trim() && coincide.startsWith("se conoce") && (
                        <span className="text-cenco font-semibold">Coincide porque {coincide}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {EN_KPIS.has(ind.id) && (
                      <Boton variante="contorno" onClick={() => setVista("certificados")}>
                        Ver en KPIs
                      </Boton>
                    )}
                    {EN_VARIACIONES.has(ind.id) && (
                      <Boton variante="sutil" onClick={() => setVista("variaciones")}>
                        ¿Por qué cambió?
                      </Boton>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {q.trim() && lista.length === 0 && (
            <div className="anim-aparecer py-2">
              <p className="text-[14px] text-tuna">
                No hay un indicador que responda <strong>«{q.trim()}»</strong>.
              </p>
              <p className="mt-1 text-[12.5px] text-gris">
                Puedes solicitarlo: llega al responsable del dominio con la decisión que buscas apoyar.
              </p>
              <div className="mt-4">
                <Boton onClick={() => abrirFormulario(q.trim())}>
                  <IconoMas size={14} /> Solicitar este indicador
                </Boton>
              </div>
            </div>
          )}

          {q.trim() && lista.length > 0 && !formulario && (
            <button
              onClick={() => abrirFormulario(q.trim())}
              className="mt-5 text-[13px] font-semibold text-cenco hover:underline"
            >
              ¿Ninguno responde tu pregunta? Solicitar un indicador nuevo
            </button>
          )}
        </Panel>

        {formulario && (
          <Panel
            titulo="Nueva solicitud"
            accion={
              <button onClick={() => setFormulario(false)} aria-label="Cerrar" className="text-gris hover:text-tuna">
                <IconoCerrar size={16} />
              </button>
            }
          >
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-8">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-micro text-gris font-medium">Qué necesitas</span>
                  <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="estado mt-1 w-full border border-cenco-line rounded-control px-3 py-2.5 text-[13.5px]"
                  />
                </label>
                <label className="block">
                  <span className="text-micro text-gris font-medium">Para qué decisión lo vas a usar</span>
                  <textarea
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    rows={2}
                    placeholder="Por ejemplo: ajustar la frecuencia de pedidos por tienda"
                    className="estado mt-1 w-full border border-cenco-line rounded-control px-3 py-2.5 text-[13.5px] resize-none"
                  />
                  <span className="text-micro text-gris">
                    Es lo que más ayuda al responsable a priorizar.
                  </span>
                </label>
                <label className="block">
                  <span className="text-micro text-gris font-medium">Dominio</span>
                  <select
                    value={dominio}
                    onChange={(e) => setDominio(e.target.value as Dominio)}
                    className="estado mt-1 w-full border border-cenco-line rounded-control px-3 py-2.5 text-[13.5px] bg-white"
                  >
                    {DOMINIOS.map((d) => (
                      <option key={d} value={d}>
                        {d}: {DESCRIPCION_DOMINIO[d]}
                      </option>
                    ))}
                  </select>
                  <span className="text-micro text-gris">La recibe {responsableDe(dominio)}.</span>
                </label>
                <Boton onClick={enviar} disabled={!titulo.trim() || !decision.trim()}>
                  Enviar solicitud
                </Boton>
              </div>

              <div className="xl:border-l xl:border-cenco-line xl:pl-6">
                <div className="text-micro font-semibold text-gris">Antes de enviar</div>
                {yaExiste.length === 0 && parecidas.length === 0 ? (
                  <p className="mt-2 text-[13px] text-gris leading-relaxed">
                    No hay indicadores ni solicitudes parecidas. Esta sería nueva.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-3">
                    {yaExiste.map(({ indicador }) => (
                      <li key={indicador.id} className="anim-aparecer text-[13px] leading-relaxed">
                        <span className="text-tuna">Quizás ya existe: </span>
                        <span className="font-semibold text-cenco-deep">{indicador.nombre}</span>
                        <span className="inline-flex align-middle ml-1.5">
                          <InfoIndicador id={indicador.id} />
                        </span>
                      </li>
                    ))}
                    {parecidas.map(({ s }) => (
                      <li key={s.id} className="anim-aparecer text-[13px] leading-relaxed">
                        <span className="text-tuna">Parecida a una solicitud en curso: </span>
                        <span className="font-semibold text-cenco-deep">«{s.titulo}»</span>
                        <div className="mt-1.5">
                          <Boton variante="contorno" onClick={() => sumarse(s)}>
                            Sumarme a esa solicitud
                          </Boton>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Panel>
        )}

        <Panel titulo="Solicitudes">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-5 mb-2 border-b border-cenco-line">
            <div>
              <div className="num text-[26px] font-semibold text-cenco-deep leading-none">{total}</div>
              <div className="mt-1.5 text-[12.5px] text-gris">solicitudes</div>
            </div>
            <div>
              <div className="num text-[26px] font-semibold text-certif leading-none">
                {existentes}
                <span className="text-[15px] font-normal text-gris ml-1.5">
                  ({total ? Math.round((existentes / total) * 100) : 0}%)
                </span>
              </div>
              <div className="mt-1.5 text-[12.5px] text-gris">se respondían con un indicador que ya existía</div>
            </div>
            <div>
              <div className="num text-[26px] font-semibold text-cenco-deep leading-none">{enCurso}</div>
              <div className="mt-1.5 text-[12.5px] text-gris">en curso</div>
            </div>
            <div>
              <div className="num text-[26px] font-semibold text-cenco-deep leading-none">{publicadas}</div>
              <div className="mt-1.5 text-[12.5px] text-gris">publicadas</div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-[13px] min-w-[860px]">
              <thead>
                <tr className="text-micro text-gris text-left">
                  <th className="font-semibold py-2 px-2">Solicitud</th>
                  <th className="font-semibold py-2 px-2">Pide</th>
                  <th className="font-semibold py-2 px-2">Responde</th>
                  <th className="font-semibold py-2 px-2">Avance</th>
                  <th className="font-semibold py-2 px-2">Acción del responsable (simulada)</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => {
                  const existente = buscar(s.titulo)[0]?.indicador;
                  return (
                    <tr key={s.id} className="border-t border-cenco-line align-top anim-aparecer">
                      <td className="py-3 px-2 max-w-[300px]">
                        <div className="font-semibold text-cenco-deep leading-snug">{s.titulo}</div>
                        <div className="mt-0.5 text-micro text-gris">Para: {s.decision}</div>
                      </td>
                      <td className="py-3 px-2 text-tuna">
                        {s.solicitante}
                        <div className="text-micro text-gris">{s.area}, {s.creada}</div>
                      </td>
                      <td className="py-3 px-2 text-tuna">
                        {s.responsable.split(" · ")[0]}
                        <div className="text-micro text-gris">Dominio {s.dominio}</div>
                      </td>
                      <td className="py-3 px-2">
                        <Avance s={s} />
                        {s.resueltaCon && (
                          <div className="mt-1 flex items-center gap-1 text-micro text-gris">
                            Con {INDICADORES.find((i) => i.id === s.resueltaCon)?.nombre}
                            <InfoIndicador id={s.resueltaCon} />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-2">
                          {s.estado === "recibida" && (
                            <Boton variante="contorno" onClick={() => cambiarEstadoSolicitud(s.id, "en_evaluacion")}>
                              Pasar a evaluación
                            </Boton>
                          )}
                          {s.estado === "en_evaluacion" && existente && (
                            <Boton
                              variante="contorno"
                              onClick={() => cambiarEstadoSolicitud(s.id, "resuelta_existente", existente.id)}
                            >
                              Ya existe
                            </Boton>
                          )}
                          {s.estado === "en_evaluacion" && (
                            <Boton variante="contorno" onClick={() => cambiarEstadoSolicitud(s.id, "aprobada")}>
                              Aprobar
                            </Boton>
                          )}
                          {s.estado === "aprobada" && (
                            <Boton variante="contorno" onClick={() => cambiarEstadoSolicitud(s.id, "en_construccion")}>
                              Iniciar construcción
                            </Boton>
                          )}
                          {s.estado === "en_construccion" && (
                            <Boton variante="contorno" onClick={() => cambiarEstadoSolicitud(s.id, "publicada")}>
                              Publicar
                            </Boton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12.5px] text-gris leading-relaxed max-w-[80ch]">
            Solicitudes de ejemplo. Cada cambio de etapa avisa a quien la pidió en el Centro de
            notificaciones.
          </p>
        </Panel>
      </div>
    </div>
  );
}
