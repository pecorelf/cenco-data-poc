// Explorador de datos: consultas SQL gobernadas.
// No es un editor de mentira: parsea un subconjunto acotado de SELECT y lo
// ejecuta sobre el dataset en memoria. Lo que no soporta lo dice, en vez de
// inventar un resultado.
//
// El parseo se separa de la ejecución (analizar / ejecutar) para que la
// interpretación de la consulta y la estimación de consumo se calculen
// exactamente sobre lo que se va a correr — sea que venga del editor SQL,
// del constructor visual o de un atajo del asistente. Un solo motor, tres
// puertas de entrada.

import { DATOS, type FilaComercial } from "./comercial";

export interface Columna {
  nombre: string;
  tipo: "texto" | "numero";
  descripcion: string;
}

export interface Objeto {
  nombre: string;
  descripcion: string;
  columnas: Columna[];
  autorizado: boolean;
  motivo?: string;
}

export const OBJETOS: Objeto[] = [
  {
    nombre: "gold.marca_propia.vw_desempeno",
    descripcion:
      "Vista de consumo de marca propia por mes, bandera y categoría. Resuelve contra la capa semántica.",
    autorizado: true,
    columnas: [
      { nombre: "mes", tipo: "texto", descripcion: "Mes del ejercicio 2026" },
      { nombre: "bandera", tipo: "texto", descripcion: "Jumbo, Santa Isabel o Spid" },
      { nombre: "categoria", tipo: "texto", descripcion: "Categoría comercial" },
      { nombre: "venta_neta", tipo: "numero", descripcion: "Venta neta en CLP MM" },
      { nombre: "plan", tipo: "numero", descripcion: "Plan comercial en CLP MM" },
      { nombre: "margen_bruto", tipo: "numero", descripcion: "Margen bruto en %" },
      { nombre: "share_mp", tipo: "numero", descripcion: "Participación en %" },
      { nombre: "quiebre", tipo: "numero", descripcion: "Quiebre en sala en %" },
    ],
  },
  {
    nombre: "gold.rrhh.fact_remuneracion",
    descripcion: "Remuneraciones del personal de tienda.",
    autorizado: false,
    motivo: "Contiene datos personales. Unity Catalog no concede acceso a perfiles de negocio.",
    columnas: [],
  },
];

export const OBJETO_PRINCIPAL = OBJETOS[0];

// A qué indicador de la capa semántica corresponde cada columna numérica,
// para poder mostrar su estado de certificación en el explorador.
export const INDICADOR_DE_COLUMNA: Record<string, string> = {
  venta_neta: "venta_neta_mp",
  plan: "cumplimiento_plan",
  margen_bruto: "margen_bruto_mp",
  share_mp: "share_mp",
  quiebre: "quiebre_sala",
};

export interface Alcance {
  banderas: readonly string[] | null;
  categorias: readonly string[] | null;
}

export class ErrorConsulta extends Error {
  constructor(mensaje: string, readonly sugerencia?: string) {
    super(mensaje);
  }
}

const AGREGADAS = ["sum", "avg", "count", "min", "max"] as const;
type Agregada = (typeof AGREGADAS)[number];

interface Proyeccion {
  expresion: string;
  alias: string;
  agregada: Agregada | null;
  columna: string | null;
}

export interface Condicion {
  columna: string;
  operador: string;
  valor: string | number;
}

interface Analisis {
  objeto: Objeto;
  proyecciones: Proyeccion[];
  condiciones: Condicion[];
  grupos: string[];
  orderBy: string;
  limitePedido: number | null;
}

const LIMITE_DEFECTO = 100;
const LIMITE_MAXIMO = 500;

function normalizar(sql: string): string {
  return sql.replace(/--[^\n]*/g, " ").replace(/\s+/g, " ").trim().replace(/;$/, "");
}

function parsearProyeccion(texto: string): Proyeccion {
  const limpio = texto.trim();
  const conAlias = limpio.match(/^(.*?)\s+as\s+([a-z_][a-z0-9_]*)$/i);
  const expresion = (conAlias ? conAlias[1] : limpio).trim();
  const agregada = expresion.match(/^(sum|avg|count|min|max)\s*\(\s*(\*|[a-z_][a-z0-9_]*)\s*\)$/i);

  if (agregada) {
    const fn = agregada[1].toLowerCase() as Agregada;
    const col = agregada[2] === "*" ? null : agregada[2].toLowerCase();
    return {
      expresion,
      alias: conAlias ? conAlias[2] : `${fn}_${agregada[2].replace("*", "todo")}`,
      agregada: fn,
      columna: col,
    };
  }

  if (!/^[a-z_][a-z0-9_]*$/i.test(expresion)) {
    throw new ErrorConsulta(
      `No se reconoce la expresión «${expresion}».`,
      "Se admiten columnas simples y las funciones SUM, AVG, COUNT, MIN y MAX."
    );
  }

  return {
    expresion,
    alias: conAlias ? conAlias[2] : expresion.toLowerCase(),
    agregada: null,
    columna: expresion.toLowerCase(),
  };
}

function parsearWhere(texto: string, columnas: Columna[]): Condicion[] {
  if (!texto.trim()) return [];
  if (/\bor\b/i.test(texto)) {
    throw new ErrorConsulta(
      "El operador OR todavía no está soportado en este editor.",
      "Combina condiciones con AND, o arma la consulta desde el constructor visual."
    );
  }

  return texto.split(/\s+and\s+/i).map((parte) => {
    const m = parte.trim().match(/^([a-z_][a-z0-9_]*)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/i);
    if (!m) {
      throw new ErrorConsulta(
        `No se entiende la condición «${parte.trim()}».`,
        "Usa la forma columna = valor, por ejemplo bandera = 'Jumbo'."
      );
    }
    const columna = m[1].toLowerCase();
    if (!columnas.some((c) => c.nombre === columna)) {
      throw new ErrorConsulta(
        `La columna «${columna}» no existe en la vista.`,
        `Columnas disponibles: ${columnas.map((c) => c.nombre).join(", ")}.`
      );
    }
    const crudo = m[3].trim();
    const valor = /^'.*'$/.test(crudo)
      ? crudo.slice(1, -1)
      : Number.isFinite(Number(crudo))
      ? Number(crudo)
      : crudo.replace(/^"|"$/g, "");
    return { columna, operador: m[2], valor };
  });
}

/** Parsea y valida contra el catálogo de objetos. No toca datos ni RLS. */
function analizar(sql: string): Analisis {
  const q = normalizar(sql);
  if (!q) throw new ErrorConsulta("Escribe una consulta.");

  const prohibido = q.match(
    /\b(insert|update|delete|drop|alter|create|truncate|merge|grant|revoke|copy)\b/i
  );
  if (prohibido) {
    throw new ErrorConsulta(
      `Este editor solo ejecuta consultas de lectura. Se encontró «${prohibido[1].toUpperCase()}».`,
      "Las escrituras pasan por el Portal de ingesta certificada, que deja traza."
    );
  }

  const m = q.match(
    /^select\s+(.+?)\s+from\s+([a-z0-9_.]+)(?:\s+where\s+(.+?))?(?:\s+group\s+by\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?$/i
  );
  if (!m) {
    throw new ErrorConsulta(
      "No se pudo interpretar la consulta.",
      "La forma soportada es: SELECT columnas FROM objeto [WHERE …] [GROUP BY …] [ORDER BY …] [LIMIT n]."
    );
  }
  const [, seleccion, tabla, where = "", groupBy = "", orderBy = "", limite] = m;

  const objeto = OBJETOS.find((o) => o.nombre === tabla.toLowerCase());
  if (!objeto) {
    throw new ErrorConsulta(
      `El objeto «${tabla}» no existe o no está publicado en Unity Catalog.`,
      `Objetos disponibles para tu perfil: ${OBJETOS.filter((o) => o.autorizado)
        .map((o) => o.nombre)
        .join(", ")}.`
    );
  }
  if (!objeto.autorizado) {
    throw new ErrorConsulta(`Sin permisos sobre «${objeto.nombre}».`, objeto.motivo);
  }

  const columnas = objeto.columnas;
  const proyecciones =
    seleccion.trim() === "*"
      ? columnas.map((c) => ({ expresion: c.nombre, alias: c.nombre, agregada: null, columna: c.nombre }))
      : seleccion.split(",").map(parsearProyeccion);

  for (const p of proyecciones) {
    if (p.columna && !columnas.some((c) => c.nombre === p.columna)) {
      throw new ErrorConsulta(
        `La columna «${p.columna}» no existe en ${objeto.nombre}.`,
        `Columnas disponibles: ${columnas.map((c) => c.nombre).join(", ")}.`
      );
    }
  }

  const condiciones = parsearWhere(where, columnas);
  const grupos = groupBy.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean);
  for (const g of grupos) {
    if (!columnas.some((c) => c.nombre === g)) {
      throw new ErrorConsulta(`No se puede agrupar por «${g}»: la columna no existe.`);
    }
  }

  const hayAgregadas = proyecciones.some((p) => p.agregada);
  if (hayAgregadas || grupos.length) {
    const sinAgrupar = proyecciones.filter((p) => !p.agregada && p.columna && !grupos.includes(p.columna));
    if (sinAgrupar.length) {
      throw new ErrorConsulta(
        `«${sinAgrupar[0].columna}» está en el SELECT pero no en el GROUP BY.`,
        "Agrégala al GROUP BY o envuélvela en una función de agregación."
      );
    }
  }

  return { objeto, proyecciones, condiciones, grupos, orderBy: orderBy.trim(), limitePedido: limite ? Number(limite) : null };
}

// --- Clasificación e interpretación en lenguaje llano -----------------------

export interface Interpretacion {
  metricas: string[];
  agrupacion: string[];
  periodo: string;
  fuente: string;
}

function interpretar(a: Analisis): Interpretacion {
  const tipoDe = (col: string | null) => a.objeto.columnas.find((c) => c.nombre === col)?.tipo;

  const metricas = a.proyecciones
    .filter((p) => p.agregada || tipoDe(p.columna) === "numero")
    .map((p) => (p.agregada ? `${p.columna ?? "*"} · ${p.agregada.toUpperCase()}` : p.columna!));

  const agrupacion = a.grupos.length
    ? a.grupos
    : [...new Set(a.proyecciones.filter((p) => !p.agregada && tipoDe(p.columna) === "texto").map((p) => p.columna!))];

  const condMes = a.condiciones.find((c) => c.columna === "mes" && c.operador === "=");
  const periodo = condMes
    ? `${condMes.valor} 2026`
    : a.condiciones.some((c) => c.columna === "mes")
    ? "Personalizado"
    : "Todo el histórico (Ene–Ago 2026)";

  return {
    metricas: metricas.length ? metricas : ["—"],
    agrupacion: agrupacion.length ? agrupacion : ["Sin agrupar"],
    periodo,
    fuente: a.objeto.nombre,
  };
}

// --- Estimación de consumo ---------------------------------------------------
//
// Los "3.400.000" de base son un supuesto de producción, no un dato real:
// nuestro dataset de demo tiene 168 filas. La cifra existe para que la
// experiencia de estimar-antes-de-ejecutar se sienta como en un lakehouse de
// verdad. Se documenta acá para que quien lea el código sepa que es ilustrativo.
const FILAS_BASE_PRODUCCION = 340_000;

export type Complejidad = "Bajo" | "Medio" | "Alto";

export interface Consumo {
  filasEstimadas: number;
  complejidad: Complejidad;
  tiempoEstimado: string;
  creditos: number;
}

function estimarConsumo(a: Analisis, alcance: Alcance, interp: Interpretacion): Consumo {
  let filas = FILAS_BASE_PRODUCCION;

  for (const c of a.condiciones) {
    if (c.columna === "mes" && c.operador === "=") filas /= 8;
    else if (c.columna === "bandera" && c.operador === "=") filas /= 3;
    else if (c.columna === "categoria" && c.operador === "=") filas /= 7;
    else filas /= 4;
  }
  // El alcance RLS también acota lo que hay que escanear, no solo lo que se ve.
  if (alcance.banderas) filas *= alcance.banderas.length / 3;
  if (alcance.categorias) filas *= alcance.categorias.length / 7;

  const filasEstimadas = Math.max(300, Math.round(filas / 10) * 10);
  const numMetricas = interp.metricas.filter((m) => m !== "—").length;
  const numDim = interp.agrupacion.filter((d) => d !== "Sin agrupar").length;
  const hayAgregada = a.proyecciones.some((p) => p.agregada);

  const complejidad: Complejidad =
    filasEstimadas > 200_000 || numMetricas >= 3 || numDim >= 3
      ? "Alto"
      : hayAgregada || numMetricas >= 2 || numDim >= 2
      ? "Medio"
      : "Bajo";

  const tiempoEstimado = { Bajo: "2–4 seg", Medio: "5–10 seg", Alto: "15–30 seg" }[complejidad];
  const creditos = Math.min(
    40,
    Math.max(1, Math.round(filasEstimadas / 9000 + numMetricas * 0.5 + numDim * 0.3))
  );

  return { filasEstimadas, complejidad, tiempoEstimado, creditos };
}

// --- Ejecución ----------------------------------------------------------------

function cumple(fila: Record<string, string | number>, c: Condicion): boolean {
  const v = fila[c.columna];
  switch (c.operador) {
    case "=":
      return String(v).toLowerCase() === String(c.valor).toLowerCase();
    case "<>":
    case "!=":
      return String(v).toLowerCase() !== String(c.valor).toLowerCase();
    case ">":
      return Number(v) > Number(c.valor);
    case "<":
      return Number(v) < Number(c.valor);
    case ">=":
      return Number(v) >= Number(c.valor);
    case "<=":
      return Number(v) <= Number(c.valor);
    default:
      return true;
  }
}

const aFila = (d: FilaComercial): Record<string, string | number> => ({
  mes: d.mes,
  bandera: d.bandera,
  categoria: d.categoria,
  venta_neta: d.ventaNeta,
  plan: d.plan,
  margen_bruto: d.margenBruto,
  share_mp: d.shareMP,
  quiebre: d.quiebre,
});

export interface Resultado {
  columnas: string[];
  filas: Array<Record<string, string | number>>;
  filasLeidas: number;
  rlsAplicado: string | null;
  advertencias: string[];
  sqlEfectivo: string;
  interpretacion: Interpretacion;
  consumo: Consumo;
}

export function ejecutar(sql: string, alcance: Alcance): Resultado {
  const a = analizar(sql);
  const { objeto, proyecciones, condiciones, grupos, orderBy } = a;
  const advertencias: string[] = [];

  const filtrosRls: string[] = [];
  if (alcance.banderas) filtrosRls.push(`bandera IN (${alcance.banderas.map((b) => `'${b}'`).join(", ")})`);
  if (alcance.categorias) filtrosRls.push(`categoria IN (${alcance.categorias.map((c) => `'${c}'`).join(", ")})`);
  const rlsAplicado = filtrosRls.length ? filtrosRls.join(" AND ") : null;

  let filas = DATOS.map(aFila).filter((f) => {
    if (alcance.banderas && !alcance.banderas.includes(String(f.bandera))) return false;
    if (alcance.categorias && !alcance.categorias.includes(String(f.categoria))) return false;
    return condiciones.every((c) => cumple(f, c));
  });
  const filasLeidas = filas.length;

  const hayAgregadas = proyecciones.some((p) => p.agregada);
  let resultado: Array<Record<string, string | number>>;

  if (hayAgregadas || grupos.length) {
    const mapa = new Map<string, Array<Record<string, string | number>>>();
    for (const f of filas) {
      const llave = grupos.map((g) => f[g]).join("§") || "__total__";
      const lista = mapa.get(llave) ?? [];
      lista.push(f);
      mapa.set(llave, lista);
    }
    resultado = [...mapa.values()].map((lista) => {
      const fila: Record<string, string | number> = {};
      grupos.forEach((g) => (fila[g] = lista[0][g]));
      for (const p of proyecciones) {
        if (!p.agregada) continue;
        const valores = p.columna ? lista.map((f) => Number(f[p.columna!])) : [];
        switch (p.agregada) {
          case "count":
            fila[p.alias] = lista.length;
            break;
          case "sum":
            fila[p.alias] = +valores.reduce((x, y) => x + y, 0).toFixed(1);
            break;
          case "avg":
            fila[p.alias] = +(valores.reduce((x, y) => x + y, 0) / (valores.length || 1)).toFixed(2);
            break;
          case "min":
            fila[p.alias] = Math.min(...valores);
            break;
          case "max":
            fila[p.alias] = Math.max(...valores);
            break;
        }
      }
      return fila;
    });
  } else {
    resultado = filas.map((f) => {
      const fila: Record<string, string | number> = {};
      proyecciones.forEach((p) => (fila[p.alias] = f[p.columna!]));
      return fila;
    });
  }

  if (orderBy) {
    const [colCruda, dir = "asc"] = orderBy.split(/\s+/);
    const col = colCruda.toLowerCase();
    const claves = Object.keys(resultado[0] ?? {});
    if (resultado.length && !claves.includes(col)) {
      throw new ErrorConsulta(
        `No se puede ordenar por «${col}»: no está en el resultado.`,
        `Puedes ordenar por: ${claves.join(", ")}.`
      );
    }
    const desc = /^desc$/i.test(dir);
    resultado.sort((x, y) => {
      const vx = x[col];
      const vy = y[col];
      const cmp = typeof vx === "number" && typeof vy === "number" ? vx - vy : String(vx).localeCompare(String(vy), "es");
      return desc ? -cmp : cmp;
    });
  }

  const pedido = a.limitePedido ?? LIMITE_DEFECTO;
  if (!a.limitePedido) {
    advertencias.push(`La consulta no traía LIMIT, así que se aplicó ${LIMITE_DEFECTO} por control de cómputo.`);
  }
  const aplicado = Math.min(pedido, LIMITE_MAXIMO);
  if (pedido > LIMITE_MAXIMO) {
    advertencias.push(`El límite pedido (${pedido}) supera el máximo del perfil, se recortó a ${LIMITE_MAXIMO}.`);
  }
  const recortado = resultado.slice(0, aplicado);

  const sqlEfectivo = [
    `SELECT ${proyecciones.map((p) => p.expresion).join(", ")}`,
    `FROM ${objeto.nombre}`,
    condiciones.length || rlsAplicado
      ? `WHERE ${[
          ...condiciones.map((c) => `${c.columna} ${c.operador} ${typeof c.valor === "string" ? `'${c.valor}'` : c.valor}`),
          ...(rlsAplicado ? [`/* RLS */ ${rlsAplicado}`] : []),
        ].join(" AND ")}`
      : null,
    grupos.length ? `GROUP BY ${grupos.join(", ")}` : null,
    orderBy ? `ORDER BY ${orderBy}` : null,
    `LIMIT ${aplicado}`,
  ]
    .filter(Boolean)
    .join("\n");

  const interpretacion = interpretar(a);
  const consumo = estimarConsumo(a, alcance, interpretacion);

  return {
    columnas: Object.keys(recortado[0] ?? {}),
    filas: recortado,
    filasLeidas,
    rlsAplicado,
    advertencias,
    sqlEfectivo,
    interpretacion,
    consumo,
  };
}

export const EJEMPLOS = [
  {
    titulo: "Margen promedio por categoría",
    sql: "SELECT categoria, AVG(margen_bruto) AS margen\nFROM gold.marca_propia.vw_desempeno\nWHERE mes = 'Ago'\nGROUP BY categoria\nORDER BY margen DESC",
  },
  {
    titulo: "Venta y plan por mes",
    sql: "SELECT mes, SUM(venta_neta) AS venta, SUM(plan) AS plan\nFROM gold.marca_propia.vw_desempeno\nGROUP BY mes",
  },
  {
    titulo: "Categorías con quiebre sobre 6%",
    sql: "SELECT bandera, categoria, quiebre\nFROM gold.marca_propia.vw_desempeno\nWHERE mes = 'Ago' AND quiebre > 6\nORDER BY quiebre DESC",
  },
  {
    titulo: "Un objeto sin permisos",
    sql: "SELECT * FROM gold.rrhh.fact_remuneracion",
  },
];
