import { useState } from "react";
import { INDICADORES, porId } from "../data/semantica";
import { MARGEN_CERTIFICADO } from "../data/comercial";
import { Boton, Encabezado, Panel, Sello } from "../components/UI";
import { Contador } from "../components/Graficos";

// SH-19 y SH-21: el desarrollador y el usuario de Power BI consumen las mismas
// métricas gobernadas. Es la prueba de que la capa semántica no es un dibujo.

const CADENA = [
  {
    capa: "Gold · Databricks",
    detalle: "gold.sales.fact_venta_linea y sus dimensiones",
    nota: "El dato conformado. No sabe nada de negocio todavía.",
  },
  {
    capa: "UC Metric View",
    detalle: "margen_bruto_mp v2.1",
    nota: "Acá vive la definición. Una sola vez, con owner y linaje.",
  },
  {
    capa: "Mirroring a OneLake",
    detalle: "Fabric · Direct Lake",
    nota: "El modelo se refleja, no se copia. Power BI lee la misma definición.",
  },
];

const MOTORES = [
  {
    id: "portal",
    nombre: "Portal BI",
    quien: "Usuario de negocio",
    como: "Informe certificado · Margen marca propia",
    detalle: "Resuelve contra la Metric View en el momento de la consulta.",
  },
  {
    id: "powerbi",
    nombre: "Power BI",
    quien: "Desarrollador y usuario Power BI",
    como: "Modelo semántico vía Direct Lake sobre OneLake",
    detalle:
      "Sin DAX propio para el margen: la medida ya viene definida desde Unity Catalog.",
  },
  {
    id: "agente",
    nombre: "BIA",
    quien: "Cualquier usuario, en lenguaje natural",
    como: "Consulta la misma Metric View y cita versión y owner",
    detalle: "No calcula: pregunta a la capa semántica y devuelve lo que ella responde.",
  },
];

export default function Interoperabilidad() {
  const [version, setVersion] = useState<"v2.1" | "v2.2">("v2.1");
  const ind = porId("margen_bruto_mp")!;

  const esV22 = version === "v2.2";
  const valor = esV22 ? 26.9 : MARGEN_CERTIFICADO;

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Una definición, tres motores"
        bajada="El margen de marca propia de agosto, consultado al mismo tiempo desde el portal, desde Power BI y desde el agente. Las tres cifras coinciden porque ninguna de las tres la calcula: las tres preguntan al mismo lugar."
      />

      <div className="p-8 space-y-6">
        {/* Los tres motores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {MOTORES.map((m, i) => (
            <article
              key={m.id}
              className="bg-white border border-cenco-line rounded-card shadow-suave p-6 anim-aparecer"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] font-semibold text-cenco-deep">
                  {m.nombre}
                </span>
                <Sello estado="certificado" />
              </div>
              <div
                className="num text-[46px] font-semibold text-certif leading-none mt-5"
                key={`${m.id}-${version}`}
              >
                <Contador valor={valor} duracion={700} />
                <span className="text-[22px] font-normal text-gris ml-1">%</span>
              </div>
              <div className="text-micro text-gris mt-2">
                margen_bruto_mp {version} · agosto 2026
              </div>
              <div className="mt-4 pt-4 border-t border-cenco-line space-y-1.5">
                <div className="text-[13px] text-tuna">{m.quien}</div>
                <div className="text-[12.5px] text-gris leading-relaxed">{m.como}</div>
              </div>
              <p className="mt-3 text-[12.5px] text-gris leading-relaxed">{m.detalle}</p>
            </article>
          ))}
        </div>

        {/* La prueba: cambiar la definición */}
        <Panel titulo="Qué pasa cuando la definición cambia">
          <div className="flex flex-wrap items-start gap-8">
            <div className="flex-1 min-w-[300px]">
              <p className="text-[14px] text-gris leading-relaxed max-w-[68ch]">
                {ind.owner.nombre} decide incorporar el costo logístico directo al cálculo
                del margen y publica la versión 2.2. No hay que tocar el portal, ni
                reescribir DAX, ni avisarle al agente. La definición cambia en un solo
                lugar y los tres motores devuelven la cifra nueva en la siguiente consulta.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Boton
                  variante={esV22 ? "contorno" : "solido"}
                  onClick={() => setVersion("v2.1")}
                >
                  Versión 2.1 vigente
                </Boton>
                <Boton
                  variante={esV22 ? "solido" : "contorno"}
                  onClick={() => setVersion("v2.2")}
                >
                  Publicar versión 2.2
                </Boton>
              </div>

              {esV22 && (
                <div className="mt-5 border border-certif/30 bg-certif-soft rounded-card p-4 anim-aparecer">
                  <div className="text-[13.5px] font-semibold text-certif">
                    Versión 2.2 publicada por {ind.owner.nombre}
                  </div>
                  <p className="mt-1.5 text-[13px] text-tuna leading-relaxed">
                    Los tres motores pasaron de 27,6% a 26,9% sin ninguna intervención
                    técnica. El cambio quedó registrado con autor, fecha y motivo, y los
                    informes que usaban la versión anterior muestran el aviso de cambio en
                    su centro de notificaciones.
                  </p>
                </div>
              )}
            </div>

            {/* La cadena */}
            <div className="min-w-[280px] flex-1">
              <ol className="space-y-0">
                {CADENA.map((c, i) => (
                  <li key={c.capa} className="relative pl-8 pb-6 last:pb-0">
                    <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-cenco ring-4 ring-cenco-soft" />
                    {i < CADENA.length - 1 && (
                      <span className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-cenco-line" />
                    )}
                    <div className="text-[13.5px] font-semibold text-cenco-deep">
                      {c.capa}
                    </div>
                    <div className="num text-micro text-gris mt-0.5">{c.detalle}</div>
                    <p className="text-[12.5px] text-gris mt-1 leading-relaxed">
                      {c.nota}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Panel>

        {/* Qué gana cada quien */}
        <Panel titulo="Qué cambia para cada rol">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-cenco-line rounded-control p-5">
              <div className="text-micro text-gris font-semibold">SH-19</div>
              <div className="text-[14.5px] font-semibold text-cenco-deep mt-1">
                Desarrollador Power BI
              </div>
              <p className="mt-2 text-[13.5px] text-gris leading-relaxed">
                Deja de escribir la medida de margen en DAX. La toma del modelo semántico y
                se dedica a la visualización. Si alguien discute la cifra, la discusión ya
                no es con él.
              </p>
            </div>
            <div className="border border-cenco-line rounded-control p-5">
              <div className="text-micro text-gris font-semibold">SH-21</div>
              <div className="text-[14.5px] font-semibold text-cenco-deep mt-1">
                Usuario Power BI
              </div>
              <p className="mt-2 text-[13.5px] text-gris leading-relaxed">
                No cambia de herramienta ni aprende una nueva. Sigue en Power BI, pero
                ahora sobre fuente gobernada. La transición no le pide nada y la adopción
                deja de ser un problema.
              </p>
            </div>
          </div>
          <p className="mt-5 text-[13px] text-gris leading-relaxed max-w-[80ch]">
            Este es el punto que evita la trampa del portal único: no se trata de obligar a
            todos a migrar a una herramienta nueva, sino de que todas las herramientas lean
            la misma verdad. El portal gana usuarios porque es mejor, no porque se apagó lo
            demás.
          </p>
        </Panel>

        <p className="text-micro text-gris max-w-[80ch] leading-relaxed">
          En la demo los tres motores son la misma fuente en memoria. En la implementación
          real, la equivalencia depende de que el mirroring hacia OneLake y el modo Direct
          Lake estén habilitados sobre Databricks en AWS — uno de los puntos que quedó como
          pregunta abierta del RFP.
        </p>
      </div>
    </div>
  );
}
