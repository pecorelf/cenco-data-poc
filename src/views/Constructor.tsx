import { useMemo, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { toPng } from "html-to-image";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
import {
  IconoMarcador,
  IconoCheckEscudo,
  IconoCheck,
  IconoAlerta,
  IconoDescargar,
  IconoSpinner,
} from "../components/Iconos";
import { Grafico, type EspecGrafico } from "../components/Graficos";
import { useStore, alcance } from "../lib/store";

// MH-06: crear un análisis con métricas y dimensiones certificadas,
// sin depender del equipo BI. El armador es real: calcula sobre el dataset,
// y ahora se arma arrastrando — el "drag & drop" que pide el RFP tal cual,
// no un clic disfrazado de arrastre.

type Dimension = "mes" | "categoria" | "bandera";

const DIMENSIONES: Array<{ id: Dimension; nombre: string; detalle: string }> = [
  { id: "mes", nombre: "Mes", detalle: "Evolución en el tiempo" },
  { id: "categoria", nombre: "Categoría", detalle: "Comparación entre categorías" },
  { id: "bandera", nombre: "Bandera", detalle: "Comparación entre banderas" },
];

const METRICAS = [
  { id: "venta_neta_mp", etiqueta: "Venta neta", unidad: " MM" },
  { id: "cumplimiento_plan", etiqueta: "Cumplimiento de plan", unidad: "%" },
  { id: "margen_bruto_mp", etiqueta: "Margen bruto", unidad: "%" },
  { id: "share_mp", etiqueta: "Participación", unidad: "%" },
  { id: "margen_contribucion_regional", etiqueta: "Margen contribución regional", unidad: "%" },
] as const;

type MetricaId = (typeof METRICAS)[number]["id"];

const ETIQUETA_TIPO: Record<EspecGrafico["tipo"], string> = {
  barras: "Barras",
  lineas: "Líneas",
  area: "Área",
  barras_horizontal: "Barras horizontales",
  dona: "Dona",
  combo: "Combo",
};

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
      return +(margenPonderado(filas) - 3.4).toFixed(1);
  }
}

// --- Arrastrar y soltar -------------------------------------------------
// Sin librería de reordenamiento: cada chip es arrastrable (useDraggable) y
// cada zona es un blanco de suelta (useDroppable). Soltar sobre "paleta"
// quita la selección; soltar sobre una zona la agrega. El clic sigue
// funcionando igual que antes — es el mismo gesto, solo que ahora también
// se puede arrastrar. Así nadie pierde funcionalidad por no arrastrar bien.

interface DatoChip {
  tipo: "metrica" | "dimension";
  id: string;
  origen: "paleta" | "zona";
}

function Chip({
  id,
  dato,
  etiqueta,
  tono,
  puntoEstado,
  onClick,
}: {
  id: string;
  dato: DatoChip;
  etiqueta: string;
  tono: "paleta" | "zona";
  puntoEstado?: "certificado" | "exploratorio";
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: dato,
  });
  const estilo: CSSProperties = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 30, position: "relative" }
    : {};
  return (
    <button
      ref={setNodeRef}
      style={estilo}
      onClick={onClick}
      {...listeners}
      {...attributes}
      className={`estado touch-none select-none flex items-center gap-2 px-4 py-2 text-[13.5px] rounded-full border cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      } ${
        tono === "zona"
          ? "bg-cenco text-white border-cenco"
          : "bg-white border-cenco-line text-tuna hover:border-cenco/50"
      }`}
    >
      {etiqueta}
      {puntoEstado && (
        <span
          className={`w-2 h-2 rounded-full ${
            puntoEstado === "certificado" ? "bg-certif" : "bg-naranjo"
          }`}
          aria-label={puntoEstado}
        />
      )}
    </button>
  );
}

function ZonaSoltar({
  id,
  titulo,
  vacio,
  placeholder,
  children,
}: {
  id: string;
  titulo: string;
  vacio: boolean;
  placeholder: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`estado rounded-card border-2 border-dashed px-4 py-3.5 min-h-[76px] ${
        isOver ? "border-cenco bg-cenco-soft" : "border-cenco-line/70 bg-papel"
      }`}
    >
      <div className="text-micro font-semibold text-gris uppercase tracking-wider mb-2">
        {titulo}
      </div>
      {vacio ? (
        <p className="text-[12.5px] text-gris">{placeholder}</p>
      ) : (
        <div className="flex flex-wrap gap-2">{children}</div>
      )}
    </div>
  );
}

function PanelSoltar({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      className={`estado border rounded-card shadow-suave overflow-hidden ${
        isOver ? "border-cenco bg-cenco-soft" : "border-cenco-line bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-cenco-line">
        <h2 className="text-[14.5px] font-semibold text-cenco-deep">{titulo}</h2>
        {isOver && (
          <span className="text-micro font-semibold text-cenco">Suelta para quitar</span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function Constructor() {
  const { usuario, guardarGrafico, setVista } = useStore();
  const { banderas, categorias } = alcance(usuario);

  const [dimension, setDimension] = useState<Dimension | null>("mes");
  const [metricas, setMetricas] = useState<MetricaId[]>(["margen_bruto_mp", "share_mp"]);
  const [tipoElegido, setTipoElegido] = useState<EspecGrafico["tipo"] | null>(null);
  const [nombre, setNombre] = useState("");
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tono: "ok" | "bloqueo"; texto: string } | null>(null);
  const [exportando, setExportando] = useState(false);
  const vistaPreviaRef = useRef<HTMLDivElement>(null);

  const elegidas = metricas.map((id) => METRICAS.find((m) => m.id === id)!);
  const indicadores = metricas.map((id) => porId(id)!).filter(Boolean);
  const hayExploratorio = indicadores.some((i) => i.estado !== "certificado");
  const mezclaUnidades = new Set(elegidas.map((m) => m.unidad)).size > 1;

  // Qué tipos de gráfico tienen sentido para la forma actual de los datos.
  // Una serie temporal admite líneas, área o barras; una comparación entre
  // categorías admite barras (y una dona si es una sola métrica, porque ahí
  // sí es una composición). No se ofrece lo que no corresponde.
  const tipoAuto: EspecGrafico["tipo"] = !dimension
    ? "barras"
    : dimension === "mes"
    ? "lineas"
    : metricas.length === 1
    ? "barras_horizontal"
    : "barras";

  const tiposPermitidos: EspecGrafico["tipo"][] = !dimension
    ? []
    : dimension === "mes"
    ? ["lineas", "area", "barras"]
    : metricas.length === 1
    ? ["barras_horizontal", "barras", "dona"]
    : ["barras", "barras_horizontal"];

  const tipoFinal: EspecGrafico["tipo"] =
    tipoElegido && tiposPermitidos.includes(tipoElegido) ? tipoElegido : tipoAuto;

  const metricasDisponibles = METRICAS.filter((m) => !metricas.includes(m.id));
  const dimensionesDisponibles = DIMENSIONES.filter((d) => d.id !== dimension);

  const agregarMetrica = (id: MetricaId) => {
    setAviso(null);
    setMetricas((m) => (m.includes(id) ? m : [...m, id]));
  };
  const quitarMetrica = (id: MetricaId) => {
    setAviso(null);
    setMetricas((m) => m.filter((x) => x !== id));
  };
  const elegirDimension = (id: Dimension) => {
    setAviso(null);
    setDimension(id);
  };
  const quitarDimension = () => {
    setAviso(null);
    setDimension(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const alIniciarArrastre = (e: DragStartEvent) => {
    const d = e.active.data.current as DatoChip;
    setArrastrando(
      d.tipo === "metrica"
        ? METRICAS.find((m) => m.id === d.id)?.etiqueta ?? d.id
        : DIMENSIONES.find((x) => x.id === d.id)?.nombre ?? d.id
    );
  };

  const alTerminarArrastre = (e: DragEndEvent) => {
    setArrastrando(null);
    const { active, over } = e;
    if (!over) return; // soltado fuera de todo: no se toca nada, es el default más seguro
    const d = active.data.current as DatoChip;
    const overId = String(over.id);

    if (overId === "paleta") {
      if (d.tipo === "metrica") quitarMetrica(d.id as MetricaId);
      else if (d.origen === "zona") quitarDimension();
      return;
    }
    if (overId === "zona-metricas" && d.tipo === "metrica") {
      agregarMetrica(d.id as MetricaId);
      return;
    }
    if (overId === "zona-dimension" && d.tipo === "dimension") {
      elegirDimension(d.id as Dimension);
      return;
    }
  };

  const espec: EspecGrafico | null = useMemo(() => {
    if (!metricas.length || !dimension) return null;

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
      tipo: tipoFinal,
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
  }, [dimension, metricas, elegidas, banderas, categorias, mezclaUnidades, tipoFinal]);

  const exportarPNG = async () => {
    if (!vistaPreviaRef.current || !espec) return;
    setExportando(true);
    try {
      const dataUrl = await toPng(vistaPreviaRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const slug =
        (nombre.trim() || espec.titulo)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "reporte";
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${slug}.png`;
      a.click();
    } catch {
      setAviso({
        tono: "bloqueo",
        texto: "No se pudo generar el PNG. Vuelve a intentarlo.",
      });
    } finally {
      setExportando(false);
    }
  };

  const guardar = () => {
    if (!espec) return;
    guardarGrafico({
      id: crypto.randomUUID(),
      nombre: nombre.trim() || espec.titulo,
      creadoPor: usuario.nombre,
      creadoEn: new Date().toLocaleDateString("es-CL"),
      pregunta: "Construido en Reportería Personalizados",
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

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Reportería Personalizados"
        bajada="Arrastra una dimensión y las métricas que quieras cruzar desde la capa semántica — o simplemente haz clic, si prefieres no arrastrar. Los dos gestos hacen lo mismo."
      />

      <DndContext sensors={sensors} onDragStart={alIniciarArrastre} onDragEnd={alTerminarArrastre}>
        <div className="p-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          <div className="space-y-6">
            <PanelSoltar id="paleta" titulo="Disponibles — arrastra o haz clic para usar">
              <div className="space-y-3.5">
                <div>
                  <div className="text-micro text-gris font-medium mb-2">Dimensiones</div>
                  <div className="flex flex-wrap gap-2 min-h-[38px]">
                    {dimensionesDisponibles.map((d) => (
                      <Chip
                        key={d.id}
                        id={`pal-d-${d.id}`}
                        dato={{ tipo: "dimension", id: d.id, origen: "paleta" }}
                        etiqueta={d.nombre}
                        tono="paleta"
                        onClick={() => elegirDimension(d.id)}
                      />
                    ))}
                    {!dimensionesDisponibles.length && (
                      <span className="text-[12.5px] text-gris py-2">
                        Ya usaste la única dimensión disponible.
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-micro text-gris font-medium mb-2">Métricas</div>
                  <div className="flex flex-wrap gap-2 min-h-[38px]">
                    {metricasDisponibles.map((m) => {
                      const ind = porId(m.id)!;
                      return (
                        <Chip
                          key={m.id}
                          id={`pal-m-${m.id}`}
                          dato={{ tipo: "metrica", id: m.id, origen: "paleta" }}
                          etiqueta={m.etiqueta}
                          tono="paleta"
                          puntoEstado={ind.estado === "certificado" ? "certificado" : "exploratorio"}
                          onClick={() => agregarMetrica(m.id)}
                        />
                      );
                    })}
                    {!metricasDisponibles.length && (
                      <span className="text-[12.5px] text-gris py-2">
                        Ya usaste todas las métricas disponibles.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-3.5 pt-3.5 border-t border-cenco-line text-[12.5px] text-gris leading-relaxed">
                El punto verde marca las métricas certificadas; el naranjo, las que todavía no
                tienen definición acordada ni responsable. Puedes usar ambas, pero un informe
                que incluya una métrica sin certificar no se puede publicar como oficial. Para
                quitar algo ya elegido, arrástralo hasta acá o simplemente haz clic sobre él.
              </p>
            </PanelSoltar>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ZonaSoltar
                id="zona-dimension"
                titulo="Agrupar por"
                vacio={!dimension}
                placeholder="Arrastra una dimensión acá."
              >
                {dimension && (
                  <Chip
                    id={`zona-d-${dimension}`}
                    dato={{ tipo: "dimension", id: dimension, origen: "zona" }}
                    etiqueta={DIMENSIONES.find((d) => d.id === dimension)!.nombre}
                    tono="zona"
                    onClick={quitarDimension}
                  />
                )}
              </ZonaSoltar>

              <ZonaSoltar
                id="zona-metricas"
                titulo="Métricas del informe"
                vacio={!metricas.length}
                placeholder="Arrastra al menos una métrica acá."
              >
                {elegidas.map((m) => {
                  const ind = porId(m.id)!;
                  return (
                    <Chip
                      key={m.id}
                      id={`zona-m-${m.id}`}
                      dato={{ tipo: "metrica", id: m.id, origen: "zona" }}
                      etiqueta={m.etiqueta}
                      tono="zona"
                      puntoEstado={ind.estado === "certificado" ? "certificado" : "exploratorio"}
                      onClick={() => quitarMetrica(m.id)}
                    />
                  );
                })}
              </ZonaSoltar>
            </div>

            <Panel
              titulo="Vista previa"
              accion={
                espec && (
                  <Boton variante="contorno" onClick={exportarPNG} disabled={exportando}>
                    {exportando ? <IconoSpinner size={14} /> : <IconoDescargar size={14} />}
                    {exportando ? "Generando…" : "Exportar PNG"}
                  </Boton>
                )
              }
            >
              {espec ? (
                <>
                  {tiposPermitidos.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tiposPermitidos.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTipoElegido(t)}
                          className={`estado px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border ${
                            t === tipoFinal
                              ? "bg-cenco text-white border-cenco"
                              : "border-cenco-line text-tuna hover:border-cenco/50"
                          }`}
                        >
                          {ETIQUETA_TIPO[t]}
                        </button>
                      ))}
                    </div>
                  )}
                  <div ref={vistaPreviaRef} className="bg-white p-3">
                    <Grafico e={espec} key={`${dimension}-${metricas.join(",")}-${tipoFinal}`} />
                  </div>
                </>
              ) : !metricas.length ? (
                <p className="text-[14px] text-gris">
                  Arrastra al menos una métrica para ver el resultado.
                </p>
              ) : (
                <p className="text-[14px] text-gris">
                  Arrastra una dimensión para agrupar el resultado.
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
                  <IconoMarcador size={14} />
                  Guardar en Mis gráficos
                </Boton>
                <Boton ancho variante="contorno" onClick={publicar} disabled={!espec}>
                  <IconoCheckEscudo size={14} />
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
                  <span className="flex gap-2">
                    {aviso.tono === "ok" ? (
                      <IconoCheck size={15} className="shrink-0 mt-0.5" />
                    ) : (
                      <IconoAlerta size={15} className="shrink-0 mt-0.5" />
                    )}
                    <span>{aviso.texto}</span>
                  </span>
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

        <DragOverlay>
          {arrastrando && (
            <div className="flex items-center gap-2 px-4 py-2 text-[13.5px] rounded-full bg-cenco-deep text-white shadow-alto pointer-events-none">
              {arrastrando}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
