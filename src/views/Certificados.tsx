import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  filtrar,
  margenPonderado,
  porCategoria,
  serieMensual,
  sharePonderado,
  sumaVenta,
  cumplimiento,
} from "../data/comercial";
import { Cifra, Encabezado, Filtros, Panel, Sello, clp } from "../components/UI";
import { useStore } from "../lib/store";

const EJE = { fontSize: 12, fill: "#5A6B7D" };

export default function Certificados() {
  const { bandera, categoria, mes } = useStore();
  const f = { bandera, categoria };
  const filasMes = filtrar({ ...f, mes });
  const serie = serieMensual(f);
  const cats = porCategoria(mes, bandera);

  return (
    <div className="pb-12">
      <Encabezado
        titulo="Informes certificados"
        bajada="Los tres reportes oficiales de marca propia. Cada cifra resuelve contra la capa semántica, así que la que ves acá es la misma que verías en Power BI."
      >
        <Filtros />
      </Encabezado>

      <div className="p-8 space-y-6">
        {/* Resumen */}
        <Panel
          titulo={`Resumen · ${mes} 2026`}
          accion={<Sello estado="certificado" />}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Cifra
              valor={clp(sumaVenta(filasMes))}
              unidad=" MM"
              etiqueta="Venta neta marca propia"
            />
            <Cifra
              valor={cumplimiento(filasMes).toLocaleString("es-CL", {
                minimumFractionDigits: 1,
              })}
              unidad="%"
              etiqueta="Cumplimiento de plan"
              tono={cumplimiento(filasMes) >= 100 ? "positivo" : "alerta"}
            />
            <Cifra
              valor={margenPonderado(filasMes).toLocaleString("es-CL", {
                minimumFractionDigits: 1,
              })}
              unidad="%"
              etiqueta="Margen bruto"
            />
            <Cifra
              valor={sharePonderado(filasMes).toLocaleString("es-CL", {
                minimumFractionDigits: 1,
              })}
              unidad="%"
              etiqueta="Participación en categoría"
              tono="positivo"
            />
          </div>
        </Panel>

        {/* Venta vs plan */}
        <Panel titulo="Venta neta contra plan" accion={<Sello estado="certificado" />}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={serie} margin={{ top: 8, right: 16, left: 0 }}>
              <CartesianGrid stroke="#E4EDF7" vertical={false} />
              <XAxis dataKey="mes" tick={EJE} axisLine={{ stroke: "#C9DAEC" }} />
              <YAxis
                yAxisId="l"
                tick={EJE}
                axisLine={false}
                tickLine={false}
                width={62}
              />
              <YAxis
                yAxisId="r"
                orientation="right"
                tick={EJE}
                axisLine={false}
                tickLine={false}
                domain={[85, 110]}
                unit="%"
                width={48}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #C9DAEC",
                  borderRadius: 2,
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12.5 }} />
              <Bar
                yAxisId="l"
                dataKey="plan"
                name="Plan (CLP MM)"
                fill="#C9DAEC"
                barSize={22}
              />
              <Bar
                yAxisId="l"
                dataKey="venta"
                name="Venta neta (CLP MM)"
                fill="#0B57A4"
                barSize={22}
              />
              <Line
                yAxisId="r"
                type="monotone"
                dataKey="cumplimiento"
                name="Cumplimiento (%)"
                stroke="#F57200"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Margen */}
          <Panel
            titulo="Margen bruto y participación"
            accion={<Sello estado="certificado" />}
          >
            <ResponsiveContainer width="100%" height={272}>
              <ComposedChart data={serie} margin={{ top: 8, right: 8, left: 0 }}>
                <CartesianGrid stroke="#E4EDF7" vertical={false} />
                <XAxis dataKey="mes" tick={EJE} axisLine={{ stroke: "#C9DAEC" }} />
                <YAxis
                  tick={EJE}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  width={48}
                  domain={["dataMin - 3", "dataMax + 3"]}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #C9DAEC",
                    borderRadius: 2,
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12.5 }} />
                <Line
                  type="monotone"
                  dataKey="margen"
                  name="Margen bruto"
                  stroke="#063B72"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="share"
                  name="Participación"
                  stroke="#1E7A46"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="mt-3 text-[13px] text-gris leading-relaxed">
              La participación sube mientras el margen cae desde mayo. Es el
              patrón clásico de crecer vía precio: conviene mirarlo por categoría
              antes de celebrar el share.
            </p>
          </Panel>

          {/* Por categoría */}
          <Panel titulo={`Margen por categoría · ${mes}`} accion={<Sello estado="certificado" />}>
            <ResponsiveContainer width="100%" height={272}>
              <BarChart
                data={cats}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8 }}
              >
                <CartesianGrid stroke="#E4EDF7" horizontal={false} />
                <XAxis type="number" tick={EJE} unit="%" axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="categoria"
                  tick={{ fontSize: 12, fill: "#12212F" }}
                  width={104}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #C9DAEC",
                    borderRadius: 2,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="margen" name="Margen bruto (%)" fill="#0B57A4" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Tabla */}
        <Panel titulo={`Detalle por categoría · ${mes} 2026`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b-2 border-cenco-deep text-left">
                  {[
                    "Categoría",
                    "Venta (MM)",
                    "Plan (MM)",
                    "Cumpl.",
                    "Margen",
                    "Share",
                    "Quiebre",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 font-medium text-cenco-deep ${
                        i ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c.categoria} className="border-b border-cenco-line">
                    <td className="py-2.5">{c.categoria}</td>
                    <td className="num py-2.5 text-right">{clp(c.venta)}</td>
                    <td className="num py-2.5 text-right text-gris">
                      {clp(c.plan)}
                    </td>
                    <td
                      className={`num py-2.5 text-right ${
                        c.cumplimiento >= 100 ? "text-certif" : "text-naranjo"
                      }`}
                    >
                      {c.cumplimiento.toFixed(1)}%
                    </td>
                    <td className="num py-2.5 text-right">
                      {c.margen.toFixed(1)}%
                    </td>
                    <td className="num py-2.5 text-right">
                      {c.share.toFixed(1)}%
                    </td>
                    <td
                      className={`num py-2.5 text-right ${
                        c.quiebre > 5.5 ? "text-naranjo" : "text-gris"
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
