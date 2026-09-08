import { useMemo, useState } from "react";
import {
  DESTINOS,
  PLATAFORMAS,
  REPORTES,
  resumenRacionalizacion,
  type Destino,
  type Plataforma,
} from "../data/catalogo";
import { Encabezado, Panel, Sello } from "../components/UI";
import { Grafico } from "../components/Graficos";

const COLOR_DESTINO: Record<Destino, string> = {
  mantener: "bg-certif-soft text-certif border-certif/25",
  converger: "bg-cenco-soft text-cenco-deep border-cenco/25",
  reemplazar: "bg-naranjo-soft text-naranjo-deep border-naranjo/30",
  descontinuar: "bg-papel text-gris border-cenco-line",
};

const MARCA_PLATAFORMA: Record<Plataforma, string> = {
  "Power BI": "bg-[#F2C80F]/20 text-[#8A6D00] border-[#F2C80F]/40",
  MicroStrategy: "bg-[#D9002B]/10 text-[#A10021] border-[#D9002B]/25",
  "Looker Studio": "bg-[#4285F4]/10 text-[#1A56C4] border-[#4285F4]/25",
  Centralizador: "bg-tuna/10 text-tuna border-tuna/25",
  "Portal BI": "bg-cenco text-white border-cenco",
};

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState("");
  const [plataforma, setPlataforma] = useState<Plataforma | "Todas">("Todas");
  const [destino, setDestino] = useState<Destino | "Todos">("Todos");

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return REPORTES.filter(
      (r) =>
        (plataforma === "Todas" || r.plataforma === plataforma) &&
        (destino === "Todos" || r.destino === destino) &&
        (!q ||
          r.nombre.toLowerCase().includes(q) ||
          r.dominio.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q))
    ).sort((a, b) => b.usuariosMes - a.usuariosMes);
  }, [busqueda, plataforma, destino]);

  const resumen = resumenRacionalizacion();
  const porPlataforma = PLATAFORMAS.map((p) => ({
    p,
    n: REPORTES.filter((r) => r.plataforma === p).length,
  }));

  const chip =
    "estado px-3.5 py-1.5 text-[13px] rounded-full border cursor-pointer";

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Catálogo unificado"
        bajada="Todo lo que hoy existe, sin importar en qué plataforma viva. Buscar en un solo lugar es la mitad del problema; la otra mitad es decidir qué merece sobrevivir a la migración."
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel titulo="Dónde vive la reportería hoy">
            <Grafico
              e={{
                tipo: "barras_horizontal",
                titulo: "Activos por plataforma",
                subtitulo: `${REPORTES.length} reportes inventariados`,
                unidad: "",
                categorias: porPlataforma.map((x) => x.p),
                series: [
                  { nombre: "Reportes", valores: porPlataforma.map((x) => x.n), color: "azul" },
                ],
                nota: "Cuatro plataformas de consumo para un mismo negocio. El portal no es una quinta: es donde convergen las anteriores.",
              }}
            />
          </Panel>

          <Panel titulo="Qué hacer con cada activo">
            <div className="grid grid-cols-2 gap-4">
              {resumen.map((r) => (
                <button
                  key={r.destino}
                  onClick={() =>
                    setDestino(destino === r.destino ? "Todos" : (r.destino as Destino))
                  }
                  className={`estado text-left border rounded-control p-4 ${
                    COLOR_DESTINO[r.destino as Destino]
                  } ${destino === r.destino ? "ring-2 ring-cenco/40" : ""}`}
                >
                  <div className="num text-[26px] font-semibold leading-none">
                    {r.cantidad}
                  </div>
                  <div className="text-[13.5px] font-semibold mt-1.5">{r.etiqueta}</div>
                  <div className="text-micro mt-1 opacity-80 leading-relaxed">
                    {DESTINOS[r.destino as Destino].descripcion}
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-gris leading-relaxed">
              Migrar los catorce cuesta lo mismo que migrar nueve y apagar cinco. La
              diferencia es que en el segundo caso la deuda no viaja con nosotros.
            </p>
          </Panel>
        </div>

        <Panel titulo={`Buscar en las ${PLATAFORMAS.length} plataformas`}>
          <div className="space-y-4">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca por nombre, dominio o responsable…"
              className="estado w-full border border-cenco-line px-5 py-3 text-[14px] focus:border-cenco"
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPlataforma("Todas")}
                className={`${chip} ${
                  plataforma === "Todas"
                    ? "bg-cenco text-white border-cenco"
                    : "border-cenco-line text-gris hover:border-cenco/50"
                }`}
              >
                Todas
              </button>
              {PLATAFORMAS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlataforma(plataforma === p ? "Todas" : p)}
                  className={`${chip} ${
                    plataforma === p
                      ? "bg-cenco text-white border-cenco"
                      : "border-cenco-line text-gris hover:border-cenco/50"
                  }`}
                >
                  {p}
                </button>
              ))}
              {destino !== "Todos" && (
                <button
                  onClick={() => setDestino("Todos")}
                  className={`${chip} bg-naranjo-soft text-naranjo-deep border-naranjo/30`}
                >
                  {DESTINOS[destino].etiqueta} ✕
                </button>
              )}
            </div>

            <div className="text-micro text-gris">
              {resultados.length} de {REPORTES.length} activos
            </div>

            <ul className="divide-y divide-cenco-line border-t border-cenco-line">
              {resultados.map((r) => (
                <li key={r.id} className="py-4 flex flex-wrap gap-4 items-start">
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[14.5px] font-medium text-tuna">
                        {r.nombre}
                      </span>
                      <span
                        className={`text-micro font-semibold px-2.5 py-1 rounded-full border ${
                          MARCA_PLATAFORMA[r.plataforma]
                        }`}
                      >
                        {r.plataforma}
                      </span>
                      {r.certificado && <Sello estado="certificado" />}
                    </div>
                    <div className="text-micro text-gris mt-1.5">
                      {r.id} · {r.dominio} · {r.owner} · {r.usuariosMes} usuarios/mes ·
                      último uso {r.ultimaVisita}
                      {r.duplicaA && <> · duplica lógica con {r.duplicaA}</>}
                    </div>
                    <p className="text-[13px] text-gris mt-1.5 leading-relaxed max-w-[76ch]">
                      {r.motivo}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-micro font-semibold px-3 py-1.5 rounded-full border ${
                      COLOR_DESTINO[r.destino]
                    }`}
                  >
                    {DESTINOS[r.destino].etiqueta}
                  </span>
                </li>
              ))}
              {!resultados.length && (
                <li className="py-8 text-[14px] text-gris">
                  Nada coincide con esa búsqueda.
                </li>
              )}
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}
