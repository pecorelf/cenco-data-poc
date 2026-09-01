import type { EspecGrafico, NombreColor, Serie } from "../components/Graficos";

// El copiloto puede pedir un gráfico devolviendo un bloque delimitado.
// Se parsea con JSON.parse y se valida campo por campo: nunca eval ni new Function.

const APERTURA = "```grafico";
const CIERRE = "```";

const TIPOS = ["barras", "lineas", "barras_horizontal", "dona", "combo"] as const;
const COLORES: NombreColor[] = ["azul", "azulMedio", "naranjo", "verde", "gris", "tuna"];

export interface Extraccion {
  texto: string;
  espec: EspecGrafico | null;
  error: string | null;
}

function validar(bruto: unknown): EspecGrafico {
  if (!bruto || typeof bruto !== "object") throw new Error("La especificación no es un objeto.");
  const o = bruto as Record<string, unknown>;

  const tipo = String(o.tipo ?? "barras");
  if (!(TIPOS as readonly string[]).includes(tipo)) {
    throw new Error(`Tipo de gráfico no reconocido: ${tipo}`);
  }

  const titulo = String(o.titulo ?? "").trim();
  if (!titulo) throw new Error("Falta el título del gráfico.");

  if (!Array.isArray(o.categorias) || !o.categorias.length) {
    throw new Error("Faltan las categorías del eje.");
  }
  const categorias = o.categorias.map((c) => String(c));

  if (!Array.isArray(o.series) || !o.series.length) {
    throw new Error("Falta al menos una serie de datos.");
  }

  const series: Serie[] = o.series.map((s: unknown, i: number) => {
    if (!s || typeof s !== "object") throw new Error(`La serie ${i + 1} no es válida.`);
    const so = s as Record<string, unknown>;
    if (!Array.isArray(so.valores)) throw new Error(`La serie ${i + 1} no trae valores.`);
    const valores = so.valores.map((v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) throw new Error(`La serie ${i + 1} tiene un valor no numérico.`);
      return n;
    });
    if (valores.length !== categorias.length) {
      throw new Error(
        `La serie "${so.nombre ?? i + 1}" trae ${valores.length} valores y hay ${categorias.length} categorías.`
      );
    }
    const colorPedido = so.color ? String(so.color) : undefined;
    return {
      nombre: String(so.nombre ?? `Serie ${i + 1}`),
      valores,
      color:
        colorPedido && COLORES.includes(colorPedido as NombreColor)
          ? (colorPedido as NombreColor)
          : undefined,
      tipo: so.tipo === "linea" ? "linea" : so.tipo === "barra" ? "barra" : undefined,
    };
  });

  // La dona y las barras horizontales usan una sola serie.
  if ((tipo === "dona" || tipo === "barras_horizontal") && series.length > 1) {
    series.length = 1;
  }

  return {
    tipo: tipo as EspecGrafico["tipo"],
    titulo,
    subtitulo: o.subtitulo ? String(o.subtitulo) : undefined,
    unidad: o.unidad ? String(o.unidad) : "",
    categorias,
    series,
    nota: o.nota ? String(o.nota) : undefined,
    indicadores: Array.isArray(o.indicadores) ? o.indicadores.map(String) : undefined,
  };
}

/** Separa la prosa del bloque de gráfico y valida este último. */
export function extraer(respuesta: string): Extraccion {
  const inicio = respuesta.indexOf(APERTURA);
  if (inicio === -1) return { texto: respuesta.trim(), espec: null, error: null };

  const desdeJson = inicio + APERTURA.length;
  const fin = respuesta.indexOf(CIERRE, desdeJson);
  const json = respuesta.slice(desdeJson, fin === -1 ? undefined : fin).trim();
  const texto = (
    respuesta.slice(0, inicio) + (fin === -1 ? "" : respuesta.slice(fin + CIERRE.length))
  ).trim();

  // Bloque todavía incompleto mientras llega el stream.
  if (fin === -1) return { texto, espec: null, error: null };

  try {
    return { texto, espec: validar(JSON.parse(json)), error: null };
  } catch (e: unknown) {
    return {
      texto,
      espec: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
