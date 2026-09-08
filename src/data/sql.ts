// Consultas SQL gobernadas.
// No es un editor de mentira: parsea un subconjunto acotado de SELECT y lo ejecuta
// sobre el dataset en memoria. Lo que no soporta lo dice, en vez de inventar un
// resultado. La gracia de la pantalla es el gobierno: qué objetos puedes tocar,
// qué filtro de RLS se inyecta solo y qué se rechaza antes de ejecutar.

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
    motivo:
      "Contiene datos personales. Unity Catalog no concede acceso a perfiles de negocio.",
    columnas: [],
  },
];

export const OBJETO_PRINCIPAL = OBJETOS[0];

export interface Alcance {
  banderas: readonly string[] | null;
  categorias: readonly string[] | null;
}

export interface Resultado {
  columnas: string[];
  filas: Array<Record<string, string | number>>;
  filasLeidas: number;
  rlsAplicado: string | null;
  advertencias: string[];
  sqlEfectivo: string;
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

interface Condicion {
  columna: string;
  operador: string;
  valor: string | number;
}

function parsearWhere(texto: string, columnas: Columna[]): Condicion[] {
  if (!texto.trim()) return [];
  if (/\bor\b/i.test(texto)) {
    throw new ErrorConsulta(
      "El operador OR todavía no está soportado en este editor.",
      "Combina condiciones con AND, o filtra desde la vista previa del informe."
    );
  }

  return texto.split(/\s+and\s+/i).map((parte) => {
    const m = parte
      .trim()
      .match(/^([a-z_][a-z0-9_]*)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/i);
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

export function ejecutar(sql: string, alcance: Alcance): Resultado {
  const q = normalizar(sql);
  if (!q) throw new ErrorConsulta("Escribe una consulta.");

  // Solo lectura. Nada de DDL ni DML, aunque el usuario tenga permisos en otra parte.
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

  // Gobierno: el objeto debe existir y estar autorizado para el perfil.
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
    throw new ErrorConsulta(
      `Sin permisos sobre «${objeto.nombre}».`,
      objeto.motivo
    );
  }

  const columnas = objeto.columnas;
  const advertencias: string[] = [];

  const proyecciones =
    seleccion.trim() === "*"
      ? columnas.map((c) => ({
          expresion: c.nombre,
          alias: c.nombre,
          agregada: null,
          columna: c.nombre,
        }))
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

  // RLS: el alcance del usuario se inyecta aunque no lo escriba. No es opcional.
  const filtrosRls: string[] = [];
  if (alcance.banderas) filtrosRls.push(`bandera IN (${alcance.banderas.map((b) => `'${b}'`).join(", ")})`);
  if (alcance.categorias)
    filtrosRls.push(`categoria IN (${alcance.categorias.map((c) => `'${c}'`).join(", ")})`);
  const rlsAplicado = filtrosRls.length ? filtrosRls.join(" AND ") : null;

  let filas = DATOS.map(aFila).filter((f) => {
    if (alcance.banderas && !alcance.banderas.includes(String(f.bandera))) return false;
    if (alcance.categorias && !alcance.categorias.includes(String(f.categoria))) return false;
    return condiciones.every((c) => cumple(f, c));
  });

  const filasLeidas = filas.length;

  // Agregación
  const hayAgregadas = proyecciones.some((p) => p.agregada);
  const grupos = groupBy
    .split(",")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean);

  for (const g of grupos) {
    if (!columnas.some((c) => c.nombre === g)) {
      throw new ErrorConsulta(`No se puede agrupar por «${g}»: la columna no existe.`);
    }
  }

  let resultado: Array<Record<string, string | number>>;

  if (hayAgregadas || grupos.length) {
    const sinAgrupar = proyecciones.filter(
      (p) => !p.agregada && p.columna && !grupos.includes(p.columna)
    );
    if (sinAgrupar.length) {
      throw new ErrorConsulta(
        `«${sinAgrupar[0].columna}» está en el SELECT pero no en el GROUP BY.`,
        "Agrégala al GROUP BY o envuélvela en una función de agregación."
      );
    }

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
            fila[p.alias] = +valores.reduce((a, b) => a + b, 0).toFixed(1);
            break;
          case "avg":
            fila[p.alias] = +(valores.reduce((a, b) => a + b, 0) / (valores.length || 1)).toFixed(2);
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

  // Orden
  if (orderBy.trim()) {
    const [colCruda, dir = "asc"] = orderBy.trim().split(/\s+/);
    const col = colCruda.toLowerCase();
    const claves = Object.keys(resultado[0] ?? {});
    if (resultado.length && !claves.includes(col)) {
      throw new ErrorConsulta(
        `No se puede ordenar por «${col}»: no está en el resultado.`,
        `Puedes ordenar por: ${claves.join(", ")}.`
      );
    }
    const desc = /^desc$/i.test(dir);
    resultado.sort((a, b) => {
      const x = a[col];
      const y = b[col];
      const cmp = typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), "es");
      return desc ? -cmp : cmp;
    });
  }

  // Presupuesto de cómputo: el límite no es opcional.
  const pedido = limite ? Number(limite) : LIMITE_DEFECTO;
  if (!limite) {
    advertencias.push(
      `La consulta no traía LIMIT, así que se aplicó ${LIMITE_DEFECTO} por control de cómputo.`
    );
  }
  const aplicado = Math.min(pedido, LIMITE_MAXIMO);
  if (pedido > LIMITE_MAXIMO) {
    advertencias.push(
      `El límite pedido (${pedido}) supera el máximo del perfil, se recortó a ${LIMITE_MAXIMO}.`
    );
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
    orderBy.trim() ? `ORDER BY ${orderBy.trim()}` : null,
    `LIMIT ${aplicado}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    columnas: Object.keys(recortado[0] ?? {}),
    filas: recortado,
    filasLeidas,
    rlsAplicado,
    advertencias,
    sqlEfectivo,
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
