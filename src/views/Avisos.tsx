import { useState } from "react";
import type { Notificacion } from "../components/Notificaciones";
import { Boton, Encabezado, NotaDiscovery, Panel } from "../components/UI";
import { BadgeOrigen } from "../components/BadgeOrigen";
import {
  IconoAlerta,
  IconoIngesta,
  IconoReloj,
  IconoCheckEscudo,
  IconoCampana,
} from "../components/Iconos";
import { useStore } from "../lib/store";

const ETIQUETA: Record<
  Notificacion["tipo"],
  { texto: string; clase: string; Icono: typeof IconoAlerta; explica: string }
> = {
  incidente: {
    texto: "Incidente",
    clase: "bg-naranjo-soft text-naranjo-deep",
    Icono: IconoAlerta,
    explica: "Falla o retraso en un flujo de datos.",
  },
  carga: {
    texto: "Carga",
    clase: "bg-cenco-soft text-cenco-deep",
    Icono: IconoIngesta,
    explica: "Resultado de una carga manual: aceptadas y rechazadas.",
  },
  freshness: {
    texto: "Frescura",
    clase: "bg-cenco-soft text-cenco-deep",
    Icono: IconoReloj,
    explica: "Estado de actualización de un dato certificado.",
  },
  definicion: {
    texto: "Definición",
    clase: "bg-certif-soft text-certif",
    Icono: IconoCheckEscudo,
    explica: "Cambio en la fórmula, versión u owner de un indicador.",
  },
  alerta: {
    texto: "Mi alerta",
    clase: "bg-naranjo-soft text-naranjo-deep",
    Icono: IconoCampana,
    explica: "Una regla configurada en Mis alertas se cumplió.",
  },
};

const TIPOS = Object.keys(ETIQUETA) as Notificacion["tipo"][];

const PREGUNTAS = [
  "¿Qué otros eventos, además de incidente, carga, frescura, definición y alerta, deberían avisar?",
  "¿Un mismo incidente que se repite genera un aviso nuevo cada vez, o se agrupa en uno solo?",
  "¿Existe un rol que vea los avisos de todo el portal, distinto del aviso personal de cada usuario?",
  "¿Los avisos deben poder exportarse o auditarse como bitácora, igual que las cargas?",
];

export default function Avisos() {
  const { notificaciones, marcarTodasLeidas } = useStore();
  const [filtro, setFiltro] = useState<Notificacion["tipo"] | "Todos">("Todos");

  const sinLeer = notificaciones.filter((n) => !n.leida).length;
  const visibles =
    filtro === "Todos" ? notificaciones : notificaciones.filter((n) => n.tipo === filtro);

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Centro de notificaciones"
        bajada="Avisos de incidentes, cargas de datos, frescura y cambios relevantes en modelos o reportes — todo lo que hoy alguien se entera preguntando, acá llega solo."
      >
        <div className="mt-4">
          <BadgeOrigen
            tipo="hibrido"
            detalle="Los canales de aviso nativos existen; este feed unificado es nuestro"
          />
        </div>
        <div className="mt-4">
          <NotaDiscovery preguntas={PREGUNTAS} />
        </div>
      </Encabezado>

      <div className="p-8 space-y-6">
        <Panel
          titulo={`${visibles.length} ${visibles.length === 1 ? "aviso" : "avisos"}${
            sinLeer ? ` · ${sinLeer} sin leer` : ""
          }`}
          accion={
            sinLeer > 0 && (
              <Boton variante="sutil" onClick={marcarTodasLeidas}>
                Marcar todas leídas
              </Boton>
            )
          }
        >
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setFiltro("Todos")}
              className={`estado px-3.5 py-1.5 rounded-full text-[13px] font-medium border ${
                filtro === "Todos"
                  ? "bg-cenco text-white border-cenco"
                  : "border-cenco-line text-gris hover:border-cenco/50"
              }`}
            >
              Todos
            </button>
            {TIPOS.map((t) => {
              const e = ETIQUETA[t];
              const activo = filtro === t;
              return (
                <button
                  key={t}
                  onClick={() => setFiltro(activo ? "Todos" : t)}
                  className={`estado inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border ${
                    activo
                      ? "bg-cenco text-white border-cenco"
                      : "border-cenco-line text-gris hover:border-cenco/50"
                  }`}
                >
                  <e.Icono size={13} />
                  {e.texto}
                </button>
              );
            })}
          </div>

          <ul className="divide-y divide-cenco-line -my-2">
            {visibles.map((n) => {
              const e = ETIQUETA[n.tipo];
              return (
                <li key={n.id} className={`py-4 flex gap-3.5 ${n.leida ? "" : "bg-cenco-soft/30 -mx-6 px-6"}`}>
                  <span
                    className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${e.clase}`}
                  >
                    <e.Icono size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-medium text-tuna">{n.titulo}</span>
                      <span className="text-micro text-gris ml-auto">{n.cuando}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-gris leading-relaxed">{n.detalle}</p>
                  </div>
                </li>
              );
            })}
            {!visibles.length && (
              <li className="py-8 text-center text-[13.5px] text-gris">
                Nada de este tipo por ahora.
              </li>
            )}
          </ul>
        </Panel>

        <Panel titulo="Cómo se genera cada tipo de aviso">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIPOS.map((t) => {
              const e = ETIQUETA[t];
              return (
                <li key={t} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${e.clase}`}>
                    <e.Icono size={13} />
                  </span>
                  <div>
                    <div className="text-[13.5px] font-medium text-tuna">{e.texto}</div>
                    <div className="text-micro text-gris mt-0.5 leading-relaxed">{e.explica}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
