import {
  filtrar,
  margenPonderado,
  porCategoria,
  serieMensual,
  sharePonderado,
  sumaVenta,
  cumplimiento,
  MESES,
} from "../data/comercial";
import { Cifra, Encabezado, Filtros, Panel, Sello, clp } from "../components/UI";
import { Contador, Grafico } from "../components/Graficos";
import { useStore } from "../lib/store";

export default function Certificados() {
  const { bandera, categoria, mes } = useStore();
  const f = { bandera, categoria };
  const filasMes = filtrar({ ...f, mes });
  const serie = serieMensual(f);
  const cats = porCategoria(mes, bandera);
  const cumpl = cumplimiento(filasMes);

  const meses = [...MESES];

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Informes certificados"
        bajada="Los tres reportes oficiales de marca propia. Cada cifra se calcula con la definición de la capa semántica, la misma que usa Power BI."
      >
        <Filtros />
      </Encabezado>

      <div className="p-8 space-y-6">
        <Panel titulo={`Resumen · ${mes} 2026`} accion={<Sello estado="certificado" />}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Cifra
              valor={<Contador valor={sumaVenta(filasMes)} decimales={0} />}
              unidad=" MM"
              etiqueta="Venta neta marca propia"
            />
            <Cifra
              valor={<Contador valor={cumpl} />}
              unidad="%"
              etiqueta="Cumplimiento de plan"
              tono={cumpl >= 100 ? "positivo" : "alerta"}
            />
            <Cifra
              valor={<Contador valor={margenPonderado(filasMes)} />}
              unidad="%"
              etiqueta="Margen bruto"
            />
            <Cifra
              valor={<Contador valor={sharePonderado(filasMes)} />}
              unidad="%"
              etiqueta="Participación en categoría"
              tono="positivo"
            />
          </div>
        </Panel>

        <Panel accion={<Sello estado="certificado" />} titulo="Venta contra plan">
          <Grafico
            e={{
              tipo: "barras",
              titulo: "Venta neta y plan, mes a mes",
              subtitulo: `${bandera === "Todas" ? "Todas las banderas" : bandera} · ${
                categoria === "Todas" ? "todas las categorías" : categoria
              } · 2026`,
              unidad: " MM",
              categorias: meses,
              series: [
                { nombre: "Plan", valores: serie.map((s) => s.plan), color: "gris" },
                { nombre: "Venta neta", valores: serie.map((s) => s.venta), color: "azul" },
              ],
              nota: "La brecha se abre desde mayo: el plan se fijó con un crecimiento de 6% que la venta no alcanzó a seguir.",
            }}
          />
        </Panel>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel titulo="Margen y participación" accion={<Sello estado="certificado" />}>
            <Grafico
              e={{
                tipo: "lineas",
                titulo: "Margen bruto contra participación",
                subtitulo: "Marca propia · 2026",
                unidad: "%",
                categorias: meses,
                series: [
                  {
                    nombre: "Margen bruto",
                    valores: serie.map((s) => s.margen),
                    color: "azul",
                  },
                  {
                    nombre: "Participación",
                    valores: serie.map((s) => s.share),
                    color: "verde",
                  },
                ],
                nota: "Desde mayo la participación sube y el margen baja. Conviene revisarlo por categoría antes de leer el alza de participación como una buena noticia.",
              }}
            />
          </Panel>

          <Panel titulo={`Ranking por categoría · ${mes}`} accion={<Sello estado="certificado" />}>
            <Grafico
              e={{
                tipo: "barras_horizontal",
                titulo: "Margen bruto por categoría",
                subtitulo: `${mes} 2026`,
                unidad: "%",
                categorias: cats.map((c) => c.categoria),
                series: [
                  { nombre: "Margen bruto", valores: cats.map((c) => c.margen), color: "azul" },
                ],
              }}
            />
          </Panel>
        </div>

        <Panel titulo={`Detalle por categoría · ${mes} 2026`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b-2 border-cenco-deep text-left">
                  {["Categoría", "Venta (MM)", "Plan (MM)", "Cumpl.", "Margen", "Share", "Quiebre"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`py-3 font-semibold text-cenco-deep ${i ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr
                    key={c.categoria}
                    className="border-b border-cenco-line hover:bg-cenco-soft/40 transition-colors"
                  >
                    <td className="py-3">{c.categoria}</td>
                    <td className="num py-3 text-right">{clp(c.venta)}</td>
                    <td className="num py-3 text-right text-gris">{clp(c.plan)}</td>
                    <td
                      className={`num py-3 text-right font-medium ${
                        c.cumplimiento >= 100 ? "text-certif" : "text-naranjo-deep"
                      }`}
                    >
                      {c.cumplimiento.toFixed(1)}%
                    </td>
                    <td className="num py-3 text-right">{c.margen.toFixed(1)}%</td>
                    <td className="num py-3 text-right">{c.share.toFixed(1)}%</td>
                    <td
                      className={`num py-3 text-right ${
                        c.quiebre > 5.5 ? "text-naranjo-deep" : "text-gris"
                      }`}
                    >
                      {c.quiebre.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
