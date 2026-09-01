import { useState } from "react";
import { MARGEN_EN_CONFLICTO, MARGEN_CERTIFICADO } from "../data/comercial";
import { porId } from "../data/semantica";
import { Encabezado, Panel, Sello } from "../components/UI";
import { useStore } from "../lib/store";

export default function Diagnostico() {
  const [revelado, setRevelado] = useState(false);
  const setVista = useStore((s) => s.setVista);
  const ind = porId("margen_bruto_mp")!;

  return (
    <div className="pb-12">
      <Encabezado
        titulo="Margen de marca propia · Alimentos · agosto 2026"
        bajada="Tres áreas reportaron esta misma cifra el mes pasado. Ninguna se equivocó al calcular: cada una respondió a una definición distinta que nunca se acordó."
      />

      <div className="p-8 space-y-7">
        {/* Las tres cifras */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {MARGEN_EN_CONFLICTO.map((c) => (
            <article
              key={c.sistema}
              className="bg-white border border-cenco-line p-5 flex flex-col"
            >
              <div className="num text-[42px] font-semibold text-naranjo leading-none">
                {c.valor.toLocaleString("es-CL", { minimumFractionDigits: 1 })}
                <span className="text-[20px] font-normal text-gris ml-0.5">%</span>
              </div>
              <div className="mt-3 text-[13.5px] font-medium text-tinta">
                {c.sistema}
              </div>
              <div className="text-micro text-gris mt-0.5">{c.responsable}</div>
              <p className="mt-3 text-[13px] text-gris leading-relaxed">
                {c.definicion}
              </p>
              {revelado && (
                <p className="mt-3 pt-3 border-t border-cenco-line text-[13px] text-tinta leading-relaxed">
                  {c.porQueDifiere}
                </p>
              )}
            </article>
          ))}
        </div>

        {!revelado && (
          <button
            onClick={() => setRevelado(true)}
            className="bg-cenco text-white px-5 py-2.5 text-[14px] font-medium rounded-sm hover:bg-cenco-deep transition-colors"
          >
            Mostrar la cifra certificada
          </button>
        )}

        {/* La cifra certificada */}
        {revelado && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-5">
            <div className="bg-white border-2 border-certif p-6">
              <Sello estado="certificado" />
              <div className="num text-[56px] font-semibold text-certif leading-none mt-4">
                {MARGEN_CERTIFICADO.toLocaleString("es-CL", {
                  minimumFractionDigits: 1,
                })}
                <span className="text-[24px] font-normal text-gris ml-1">%</span>
              </div>
              <div className="mt-3 text-[14px] font-medium text-tinta">
                {ind.nombre}
              </div>
              <div className="text-micro text-gris mt-1">
                Versión {ind.version} · vigente desde {ind.certificadoDesde}
              </div>
              <div className="mt-4 pt-4 border-t border-cenco-line text-[13px] leading-relaxed text-gris">
                Responde {ind.owner.nombre}, {ind.owner.cargo}. Esta es la cifra
                que devuelven el portal, Power BI y Cuenco, porque los tres leen
                la misma definición.
              </div>
              <button
                onClick={() => setVista("semantica")}
                className="mt-4 text-[13.5px] font-medium text-cenco underline underline-offset-4"
              >
                Ver la ficha completa del indicador
              </button>
            </div>

            <Panel titulo="Qué costaba esto antes de acordar la definición">
              <ul className="space-y-4">
                {[
                  [
                    "Más de 90 preguntas descriptivas al mes",
                    "El equipo BI responde a mano preguntas que la capa semántica ya podría contestar sola.",
                  ],
                  [
                    "80% del esfuerzo del equipo en preparación manual",
                    "Cuatro de cada cinco horas se van en armar datos, no en analizarlos.",
                  ],
                  [
                    "La lógica vive en las personas",
                    "Fórmulas DAX, consultas M y queries sueltas que nadie gobierna y que se van con quien las escribió.",
                  ],
                  [
                    "Nadie sabe cuál cifra llevar al comité",
                    "La discusión se va en reconciliar números en vez de decidir sobre ellos.",
                  ],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-naranjo shrink-0" />
                    <div>
                      <div className="text-[14px] font-medium text-tinta">{t}</div>
                      <p className="text-[13px] text-gris leading-relaxed mt-0.5">
                        {d}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
