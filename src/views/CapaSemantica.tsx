import { useState } from "react";
import { INDICADORES, type Indicador } from "../data/semantica";
import { Encabezado, Panel, Sello } from "../components/UI";

export default function CapaSemantica() {
  const [sel, setSel] = useState<Indicador>(INDICADORES[0]);

  return (
    <div className="pb-12">
      <Encabezado
        titulo="Capa semántica"
        bajada="Cada indicador se define una sola vez, sobre la capa Gold, con un responsable y un linaje trazable. El portal, Power BI y el agente leen desde acá; ninguno guarda su propia versión del cálculo."
      />

      <div className="p-8 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
        {/* Catálogo */}
        <div className="bg-white border border-cenco-line">
          <div className="px-4 py-3 border-b border-cenco-line text-[14px] font-medium text-cenco-deep">
            {INDICADORES.length} indicadores
          </div>
          <ul>
            {INDICADORES.map((i) => {
              const activo = i.id === sel.id;
              return (
                <li key={i.id}>
                  <button
                    onClick={() => setSel(i)}
                    className={`w-full text-left px-4 py-3 border-l-[3px] border-b border-b-cenco-line/60 transition-colors ${
                      activo
                        ? "border-l-cenco bg-cenco-soft"
                        : "border-l-transparent hover:bg-papel"
                    }`}
                  >
                    <div className="text-[13.5px] text-tinta leading-snug">
                      {i.nombre}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Sello estado={i.estado} />
                      <span className="text-micro text-gris">{i.dominio}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Ficha — el documento sellado */}
        <article className="bg-white border border-cenco-line">
          <header className="px-6 pt-6 pb-5 border-b-2 border-cenco-deep">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-[22px] font-semibold text-cenco-deep leading-tight">
                  {sel.nombre}
                </h2>
                <p className="mt-2 text-[13.5px] text-gris leading-relaxed max-w-[62ch]">
                  {sel.definicion}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <Sello estado={sel.estado} />
                <div className="num text-micro text-gris mt-2">
                  v{sel.version}
                </div>
              </div>
            </div>
          </header>

          <div className="px-6 py-5 space-y-6">
            {/* Fórmula */}
            <div>
              <h3 className="text-[13px] font-medium text-cenco-deep mb-2">
                Cómo se calcula
              </h3>
              <pre className="bg-papel border border-cenco-line p-4 text-[12.5px] leading-relaxed text-tinta overflow-x-auto whitespace-pre-wrap">
                {sel.formula}
              </pre>
              <div className="mt-2 flex gap-6 text-micro text-gris">
                <span>Unidad: {sel.unidad}</span>
                <span>Granularidad: {sel.granularidad}</span>
                <span>Actualización: {sel.frescura}</span>
              </div>
            </div>

            {/* Responsable + linaje */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-[13px] font-medium text-cenco-deep mb-2">
                  Quién responde por este número
                </h3>
                <div className="border border-cenco-line p-4">
                  <div className="text-[15px] text-tinta">{sel.owner.nombre}</div>
                  <div className="text-[13px] text-gris">{sel.owner.cargo}</div>
                  <div className="text-micro text-gris mt-1">{sel.owner.area}</div>
                </div>
                <div className="mt-3 text-[12.5px] text-gris leading-relaxed">
                  {sel.certificadoDesde
                    ? `Certificado desde el ${sel.certificadoDesde}.`
                    : "Todavía no está certificado."}{" "}
                  Último cambio: {sel.ultimoCambio}.
                </div>
              </div>

              <div>
                <h3 className="text-[13px] font-medium text-cenco-deep mb-2">
                  De dónde viene el dato
                </h3>
                <ol className="border border-cenco-line divide-y divide-cenco-line">
                  {sel.linaje.map((t) => (
                    <li
                      key={t}
                      className="px-4 py-2.5 text-[12.5px] text-tinta break-all"
                    >
                      {t}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Alcance del cálculo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-[13px] font-medium text-certif mb-2">
                  Considera
                </h3>
                <ul className="space-y-1.5">
                  {sel.incluye.map((x) => (
                    <li
                      key={x}
                      className="text-[13px] text-tinta leading-relaxed pl-4 relative"
                    >
                      <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-certif" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-medium text-naranjo mb-2">
                  Deja fuera
                </h3>
                <ul className="space-y-1.5">
                  {sel.excluye.map((x) => (
                    <li
                      key={x}
                      className="text-[13px] text-tinta leading-relaxed pl-4 relative"
                    >
                      <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-naranjo" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Consumidores — la prueba de la cifra única */}
            <div>
              <h3 className="text-[13px] font-medium text-cenco-deep mb-2">
                Quién lo consume
              </h3>
              <div className="flex flex-wrap gap-2">
                {(["Portal", "Power BI", "Agente Cuenco"] as const).map((c) => {
                  const activo = sel.consumidores.includes(c);
                  return (
                    <span
                      key={c}
                      className={`px-3 py-1.5 text-[13px] border rounded-sm ${
                        activo
                          ? "border-cenco bg-cenco-soft text-cenco-deep"
                          : "border-cenco-line text-gris line-through"
                      }`}
                    >
                      {c}
                    </span>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[12.5px] text-gris leading-relaxed max-w-[70ch]">
                Los tres motores resuelven contra esta misma definición. Si mañana
                cambia la fórmula, cambia en los tres a la vez y queda registrado
                quién la cambió.
              </p>
            </div>
          </div>
        </article>
      </div>

      {/* Nota sobre el exploratorio */}
      <div className="px-8">
        <Panel>
          <p className="text-[13.5px] text-gris leading-relaxed max-w-[80ch]">
            El catálogo incluye a propósito un indicador sin certificar. El modelo
            de dos velocidades no prohíbe que alguien cree su propio cálculo: lo
            permite, lo marca y lo deja fuera de la publicación oficial hasta que
            un owner lo revise. Puedes ver cómo funciona en Informes personalizados.
          </p>
        </Panel>
      </div>
    </div>
  );
}
