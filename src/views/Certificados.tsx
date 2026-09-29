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
import { BadgeOrigen } from "../components/BadgeOrigen";
import { IconoMoneda, IconoCheckEscudo, IconoReportes, IconoInsignia } from "../components/Iconos";
import { Contador, Grafico } from "../components/Graficos";
import { useStore, alcance } from "../lib/store";

const NOMBRE_MES: Record<string, string> = {
  Ene: "enero", Feb: "febrero", Mar: "marzo", Abr: "abril",
  May: "mayo", Jun: "junio", Jul: "julio", Ago: "agosto",
};

export default function Certificados() {
  const { bandera, categoria, mes, usuario } = useStore();
  const uc = alcance(usuario);
  const f = { bandera, categoria, enBanderas: uc.banderas, enCategorias: uc.categorias };
  const filasMes = filtrar({ ...f, mes });
  const serie = serieMensual(f);
  const cats = porCategoria(mes, bandera, uc);
  const cumpl = cumplimiento(filasMes);

  // Las notas se calculan desde la misma serie que se grafica: así nunca
  // contradicen al gráfico cuando cambian los filtros o la sesión.
  const primerMesBajoPlan = serie.find((s) => s.venta < s.plan)?.mes;
  const peorMes = serie.reduce((a, b) => (b.cumplimiento < a.cumplimiento ? b : a));
  const notaVentaPlan = primerMesBajoPlan
    ? `La venta queda bajo el plan desde ${NOMBRE_MES[primerMesBajoPlan]}; la brecha más grande es en ${NOMBRE_MES[peorMes.mes]}, con ${peorMes.cumplimiento.toLocaleString("es-CL")}% de cumplimiento.`
    : "La venta está sobre el plan en todos los meses del período.";
  const ini = serie[0];
  const fin = serie[serie.length - 1];
  const dMargen = +(fin.margen - ini.margen).toFixed(1);
  const dShare = +(fin.share - ini.share).toFixed(1);
  const notaMargenShare =
    dMargen < 0 && dShare > 0
      ? `En el período el margen cae ${Math.abs(dMargen)} pts y la participación sube ${dShare} pts: la participación puede estar ganándose con precio.`
      : `En el período el margen varía ${dMargen > 0 ? "+" : ""}${dMargen} pts y la participación ${dShare > 0 ? "+" : ""}${dShare} pts.`;

  const meses = [...MESES];

  return (
    <div className="pb-14">
      <Encabezado
        titulo="KPIs y Reportes Certificados"
        bajada="Los tres reportes oficiales de marca propia. Cada cifra se calcula con la definición de la capa semántica, la misma que usa Power BI."
      >
        <Filtros />
      </Encabezado>

      <div className="p-8 space-y-6">
        <Panel
          titulo={`Resumen · ${mes} 2026`}
          accion={
            <div className="flex items-center gap-2">
              <BadgeOrigen tipo="nativo" detalle="Unity Catalog Metric Views" />
              <Sello estado="certificado" />
            </div>
          }
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Cifra
              icono={IconoMoneda}
              valor={<Contador valor={sumaVenta(filasMes)} decimales={0} clave="cert-venta" />}
              unidad=" MM"
              etiqueta="Venta neta marca propia"
              indicadorId="venta_neta_mp"
            />
            <Cifra
              icono={IconoCheckEscudo}
              valor={<Contador valor={cumpl} clave="cert-cumpl" />}
              unidad="%"
              etiqueta="Cumplimiento de plan"
              indicadorId="cumplimiento_plan"
              tono={cumpl >= 100 ? "positivo" : "alerta"}
            />
            <Cifra
              icono={IconoReportes}
              valor={<Contador valor={margenPonderado(filasMes)} clave="cert-margen" />}
              unidad="%"
              etiqueta="Margen bruto"
              indicadorId="margen_bruto_mp"
            />
            <Cifra
              icono={IconoInsignia}
              valor={<Contador valor={sharePonderado(filasMes)} clave="cert-share" />}
              unidad="%"
              etiqueta="Participación en categoría"
              indicadorId="share_mp"
              tono="positivo"
            />
          </div>
        </Panel>

        <Panel
          titulo="Venta contra plan"
          accion={
            <div className="flex items-center gap-2">
              <BadgeOrigen tipo="custom" detalle="Gráfico, tooltip y selector de tipo propios" />
              <Sello estado="certificado" />
            </div>
          }
        >
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
              nota: notaVentaPlan,
            }}
          />
        </Panel>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel
            titulo="Margen y participación"
            accion={
              <div className="flex items-center gap-2">
                <BadgeOrigen tipo="custom" detalle="Componentes de gráfico propios" />
                <Sello estado="certificado" />
              </div>
            }
          >
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
                nota: notaMargenShare,
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
