import { useMemo, useState } from "react";
import { INDICADORES, porId } from "../data/semantica";
import {
  CATEGORIAS,
  BANDERAS,
  MESES,
  filtrar,
  margenPonderado,
  sharePonderado,
  sumaVenta,
  cumplimiento,
  type Bandera,
  type Categoria,
  type Mes,
} from "../data/comercial";
import { Boton, Encabezado, Panel, Sello } from "../components/UI";
import { Grafico, type EspecGrafico } from "../components/Graficos";
import { useStore, alcance } from "../lib/store";

// MH-06: crear un análisis con métricas y dimensiones certificadas,
// sin depender del equipo BI. El armador es real: calcula sobre el dataset.

type Dimension = "mes" | "categoria" | "bandera";

const DIMENSIONES: Array<{ id: Dimension; nombre: string; detalle: string }> = [
  { id: "mes", nombre: "Mes", detalle: "Evolución en el tiempo" },
  { id: "categoria", nombre: "Categoría", detalle: "Comparación entre categorías" },
  { id: "bandera", nombre: "Bandera", detalle: "Comparación entre banderas" },
];

// Solo métricas que la capa semántica sabe agregar por estas dimensiones.
const METRICAS = [
  { id: "venta_neta_mp", etiqueta: "Venta neta", unidad: " MM" },
  { id: "cumplimiento_plan", etiqueta: "Cumplimiento de plan", unidad: "%" },
  { id: "margen_bruto_mp", etiqueta: "Margen bruto", unidad: "%" },
  { id: "share_mp", etiqueta: "Participación", unidad: "%" },
  { id: "margen_contribucion_regional", etiqueta: "Margen contribución regional", unidad: "%" },
] as const;

type MetricaId = (typeof METRICAS)[number]["id"];

function calcular(metrica: MetricaId, filas: ReturnType<typeof filtrar>): number {
  switch (metrica) {
    case "venta_neta_mp":
      return sumaVenta(filas);
    case "cumplimiento_plan":
      return cumplimiento(filas);
    case "margen_bruto_mp":
      return margenPonderado(filas);
    case "share_mp":
      return sharePonderado(filas);
    case "margen_contribucion_regional":
      // Cálculo exploratorio: descuenta un supuesto logístico fijo cargado a mano.
      return +(margenPonderado(filas) - 3.4).toFixed(1);
  }
}

export default function Constructor() {
  const { usuario, guardarGrafico, setVista } = useStore();
  const { banderas, categorias } = alcance(usuario);

  const [dimension, setDimension] = useState<Dimension>("mes");
  const [metricas, setMetricas] = useState<MetricaId[]>([
    "margen_bruto_mp",
    "share_mp",
  ]);
  const [nombre, setNombre] = useState("");
  const [aviso, setAviso] = useState<{ tono: "ok" | "bloqueo"; texto: string } | null>(
    null
  );

  const elegidas = metricas.map((id) => METRICAS.find((m) => m.id === id)!);
  const indicadores = metricas.map((id) => porId(id)!).filter(Boolean);
  const hayExploratorio = indicadores.some((i) => i.estado !== "certificado");
  const mezclaUnidades = new Set(elegidas.map((m) => m.unidad)).size > 1;

  const alternar = (id: MetricaId) => {
    setAviso(null);
    setMetricas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  };

  const espec: EspecGrafico | null = useMemo(() => {
    if (!metricas.length) return null;

    const valoresDim =
      dimension === "mes"
        ? [...MESES]
        : dimension === "categoria"
        ? (categorias ?? [...CATEGORIAS])
        : (banderas ?? [...BANDERAS]);

    const series = elegidas.map((m, i) => ({
      nombre: m.etiqueta,
      valores: valoresDim.map((v) => {
        const f =
          dimension === "mes"
            ? { mes: v as Mes }
            : dimension === "categoria"
            ? { categoria: v as Categoria }
            : { bandera: v as Bandera };
        return calcular(m.id, filtrar(f));
      }),
      color: (["azul", "verde", "naranjo", "azulMedio", "gris"] as const)[i % 5],
      tipo: (dimension === "mes" ? "linea" : "barra") as "linea" | "barra",
    }));

    return {
      tipo:
        dimension === "mes"
          ? "lineas"
          : series.length === 1
          ? "barras_horizontal"
          : "barras",
      titulo: `${elegidas.map((m) => m.etiqueta).join(" y ")} por ${
        DIMENSIONES.find((d) => d.id === dimension)!.nombre.toLowerCase()
      }`,
      subtitulo: `Marca propia · ${
        banderas ? banderas.join(", ") : "todas las banderas"
      } · 2026`,
      unidad: mezclaUnidades ? "" : elegidas[0].unidad,
      categorias: [...valoresDim],
      series,
      indicadores: metricas,
      nota: mezclaUnidades
        ? "Las métricas elegidas tienen unidades distintas, así que la escala del eje es referencial."
        : undefined,
    };
  }, [dimension, metricas, elegidas, banderas, categorias, mezclaUnidades]);

  const guardar = () => {
    if (!espec) return;
    guardarGrafico({
      id: crypto.randomUUID(),
      nombre: nombre.trim() || espec.titulo,
      creadoPor: usuario.nombre,
      creadoEn: new Date().toLocaleDateString("es-CL"),
      pregunta: "Construido en Informes personalizados",
      espec,
      certificado: !hayExploratorio,
    });
    setAviso({
      tono: "ok",
      texto: hayExploratorio
        ? "Guardado en tu espacio personal. No queda como oficial porque incluye una métrica sin certificar."
        : "Guardado en tu espacio personal. Todas sus métricas están certificadas.",
    });
  };

  const publicar = () => {
    if (hayExploratorio) {
      const sinCert = indicadores.find((i) => i.estado !== "certificado")!;
      setAviso({
        tono: "bloqueo",
        texto: `No se puede publicar: «${sinCert.nombre}» no está certificado. La solicitud se envió a ${
          sinCert.owner.nombre === "Sin owner asignado"
            ? "la mesa de gobierno para que le asigne un responsable"
            : sinCert.owner.nombre
        }. El informe sigue disponible en tu espacio personal.`,
      });
      return;
    }
    if (!usuario.puedePublicar) {
      setAviso({
        tono: "bloqueo",
        texto:
          "Las métricas están certificadas, pero tu perfil no tiene derecho de publicación. La solicitud quedó en cola para el owner de cada indicador.",
      });
      return;
    }
    setAviso({
      tono: "ok",
      texto:
        "Publicado en el catálogo oficial. Queda visible para todos los usuarios cuyo alcance incluya estas categorías.",
    });
  };

  const chip = "estado px-4 py-2 text-[13.5px] rounded-full border cursor-pointer";

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Reportería Personalizados"
        bajada="Elige una dimensión y las métricas que quieras cruzar. Todo lo que aparece acá viene de la capa semántica, así que tu análisis usa las mismas definiciones que los informes oficiales."
      />

      <div className="p-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          <Panel titulo="1 · Agrupar por">
            <div className="flex flex-wrap gap-2.5">
              {DIMENSIONES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDimension(d.id);
                    setAviso(null);
                  }}
                  className={`${chip} ${
                    dimension === d.id
                      ? "bg-cenco text-white border-cenco"
                      : "border-cenco-line text-tuna hover:border-cenco/50"
                  }`}
                  title={d.detalle}
                >
                  {d.nombre}
                </button>
              ))}
            </div>
          </Panel>

          <Panel titulo="2 · Métricas">
            <div className="flex flex-wrap gap-2.5">
              {METRICAS.map((m) => {
                const ind = porId(m.id)!;
                const activa = metricas.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => alternar(m.id)}
                    className={`${chip} flex items-center gap-2 ${
                      activa
                        ? "bg-cenco text-white border-cenco"
                        : "border-cenco-line text-tuna hover:border-cenco/50"
                    }`}
                  >
                    {m.etiqueta}
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ind.estado === "certificado" ? "bg-certif" : "bg-naranjo"
                      }`}
                      aria-label={ind.estado}
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[12.5px] text-gris leading-relaxed">
              El punto verde marca las métricas certificadas; el naranjo, las que todavía no
              tienen definición acordada ni responsable. Puedes usar ambas, pero un informe
              que incluya una métrica sin certificar no se puede publicar como oficial.
            </p>
          </Panel>

          <Panel titulo="3 · Vista previa">
            {espec ? (
              <Grafico e={espec} key={`${dimension}-${metricas.join(",")}`} />
            ) : (
              <p className="text-[14px] text-gris">
                Elige al menos una métrica para ver el resultado.
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6">
          <Panel titulo="Guardar o publicar">
            <label className="block">
              <span className="text-micro text-gris font-medium">Nombre del informe</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={espec?.titulo ?? "Sin título"}
                className="estado mt-1.5 w-full border border-cenco-line px-3.5 py-2.5 text-[14px] focus:border-cenco"
              />
            </label>

            <div className="mt-4 flex items-center gap-2">
              <Sello estado={hayExploratorio ? "exploratorio" : "certificado"} />
              <span className="text-micro text-gris">
                {metricas.length}{" "}
                {metricas.length === 1 ? "métrica" : "métricas"} seleccionadas
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <Boton ancho onClick={guardar} disabled={!espec}>
                Guardar en Mis gráficos
              </Boton>
              <Boton ancho variante="contorno" onClick={publicar} disabled={!espec}>
                Publicar como oficial
              </Boton>
            </div>

            {aviso && (
              <div
                role="status"
                className={`mt-4 p-4 border rounded-card text-[13px] leading-relaxed ${
                  aviso.tono === "ok"
                    ? "border-certif/35 bg-certif-soft text-certif"
                    : "border-naranjo/35 bg-naranjo-soft text-naranjo-deep"
                }`}
              >
                {aviso.texto}
                {aviso.tono === "ok" && (
                  <button
                    onClick={() => setVista("graficos")}
                    className="block mt-2 underline underline-offset-4 font-medium"
                  >
                    Ver Mis gráficos
                  </button>
                )}
              </div>
            )}
          </Panel>

        </div>
      </div>
    </div>
  );
}
