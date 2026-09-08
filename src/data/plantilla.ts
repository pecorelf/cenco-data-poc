// SH-13 · Cargas manuales gobernadas.
// La plantilla es el plan regional por categoría: exactamente lo que hoy se
// mantiene a mano en el Centralizador. El parseo y la validación son reales;
// lo simulado es la escritura en la capa Gold.

import { BANDERAS, CATEGORIAS } from "./comercial";

// El dataset tiene ejecución hasta agosto, pero un plan se carga hacia adelante:
// el maestro de meses de la plantilla cubre el ejercicio completo.
export const MESES_PLAN = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export const PAISES = ["Chile", "Argentina", "Perú", "Colombia"] as const;

export interface Columna {
  id: string;
  etiqueta: string;
  tipo: "texto" | "numero";
  valores?: readonly string[];
  ejemplo: string;
  regla: string;
}

export const COLUMNAS: Columna[] = [
  {
    id: "pais",
    etiqueta: "País",
    tipo: "texto",
    valores: PAISES,
    ejemplo: "Chile",
    regla: "Debe existir en el maestro de países.",
  },
  {
    id: "bandera",
    etiqueta: "Bandera",
    tipo: "texto",
    valores: BANDERAS,
    ejemplo: "Jumbo",
    regla: "Debe existir en el maestro de banderas.",
  },
  {
    id: "categoria",
    etiqueta: "Categoría",
    tipo: "texto",
    valores: CATEGORIAS,
    ejemplo: "Abarrotes",
    regla: "Debe existir en el maestro de categorías.",
  },
  {
    id: "mes",
    etiqueta: "Mes",
    tipo: "texto",
    valores: MESES_PLAN,
    ejemplo: "Sep",
    regla: "Mes del ejercicio 2026, abreviado a tres letras.",
  },
  {
    id: "plan_clp_mm",
    etiqueta: "Plan (CLP MM)",
    tipo: "numero",
    ejemplo: "2210.5",
    regla: "Número mayor que cero, con punto decimal.",
  },
];

export const CABECERA = COLUMNAS.map((c) => c.id).join(",");

export interface FilaCargada {
  linea: number;
  valores: Record<string, string>;
  errores: string[];
}

export interface Resultado {
  archivo: string;
  columnasFaltantes: string[];
  columnasSobrantes: string[];
  filas: FilaCargada[];
  aceptadas: FilaCargada[];
  rechazadas: FilaCargada[];
}

/** Parseo de CSV con soporte de comillas y separador coma o punto y coma. */
function parsear(texto: string): string[][] {
  const limpio = texto.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const primeraLinea = limpio.split("\n")[0] ?? "";
  const sep = primeraLinea.split(";").length > primeraLinea.split(",").length ? ";" : ",";

  const filas: string[][] = [];
  let campo = "";
  let fila: string[] = [];
  let enComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (enComillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        enComillas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      enComillas = true;
    } else if (c === sep) {
      fila.push(campo);
      campo = "";
    } else if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo || fila.length) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((v) => v.trim() !== ""));
}

export interface Alcance {
  banderas: readonly string[] | null;
  categorias: readonly string[] | null;
}

/**
 * Acepta 2310.4 y 2310,4, y también 1.234,5 con punto de miles.
 * Devuelve null si no es un número interpretable.
 */
function aNumero(v: string): number | null {
  const limpio = v.includes(",")
    ? v.replace(/\./g, "").replace(",", ".")
    : v.replace(/\s/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

export function validar(
  texto: string,
  archivo: string,
  alcance: Alcance
): Resultado {
  const filas = parsear(texto);
  const vacio: Resultado = {
    archivo,
    columnasFaltantes: [],
    columnasSobrantes: [],
    filas: [],
    aceptadas: [],
    rechazadas: [],
  };

  if (!filas.length) {
    return { ...vacio, columnasFaltantes: COLUMNAS.map((c) => c.id) };
  }

  const cabecera = filas[0].map((c) => c.trim().toLowerCase());
  const esperadas = COLUMNAS.map((c) => c.id);
  const columnasFaltantes = esperadas.filter((c) => !cabecera.includes(c));
  const columnasSobrantes = cabecera.filter((c) => !esperadas.includes(c));

  if (columnasFaltantes.length) {
    return { ...vacio, columnasFaltantes, columnasSobrantes };
  }

  const indice = Object.fromEntries(esperadas.map((c) => [c, cabecera.indexOf(c)]));
  const vistas = new Set<string>();
  const procesadas: FilaCargada[] = [];

  filas.slice(1).forEach((cruda, i) => {
    const valores: Record<string, string> = {};
    esperadas.forEach((c) => {
      valores[c] = (cruda[indice[c]] ?? "").trim();
    });

    const errores: string[] = [];

    for (const col of COLUMNAS) {
      const v = valores[col.id];
      if (!v) {
        errores.push(`${col.etiqueta} está vacío.`);
        continue;
      }
      if (col.valores && !col.valores.includes(v)) {
        errores.push(`«${v}» no existe en el maestro de ${col.etiqueta.toLowerCase()}.`);
      }
      if (col.tipo === "numero") {
        const n = aNumero(v);
        if (n === null) errores.push(`${col.etiqueta} no es un número válido.`);
        else if (n <= 0) errores.push(`${col.etiqueta} debe ser mayor que cero.`);
      }
    }

    // Duplicados dentro del mismo archivo.
    const llave = `${valores.pais}|${valores.bandera}|${valores.categoria}|${valores.mes}`;
    if (vistas.has(llave)) {
      errores.push("Fila duplicada: ya viene otra con el mismo país, bandera, categoría y mes.");
    } else {
      vistas.add(llave);
    }

    // El alcance del usuario también se aplica al escribir, no solo al leer.
    if (alcance.banderas && valores.bandera && !alcance.banderas.includes(valores.bandera)) {
      errores.push(`Tu alcance en Unity Catalog no incluye la bandera ${valores.bandera}.`);
    }
    if (
      alcance.categorias &&
      valores.categoria &&
      !alcance.categorias.includes(valores.categoria)
    ) {
      errores.push(`Tu alcance en Unity Catalog no incluye la categoría ${valores.categoria}.`);
    }

    procesadas.push({ linea: i + 2, valores, errores });
  });

  return {
    archivo,
    columnasFaltantes,
    columnasSobrantes,
    filas: procesadas,
    aceptadas: procesadas.filter((f) => !f.errores.length),
    rechazadas: procesadas.filter((f) => f.errores.length),
  };
}

export function plantillaCSV(): string {
  const ejemplo = COLUMNAS.map((c) => c.ejemplo).join(",");
  return `${CABECERA}\n${ejemplo}\n`;
}

// Archivos de ejemplo, para que la demo no dependa de que el presentador
// tenga un CSV a mano.

export const EJEMPLO_LIMPIO = `${CABECERA}
Chile,Jumbo,Abarrotes,Sep,2310.4
Chile,Jumbo,Lácteos,Sep,1520.8
Chile,Santa Isabel,Abarrotes,Sep,2180.2
Chile,Santa Isabel,Lácteos,Sep,1410.6
Chile,Spid,Bebidas,Sep,318.9
Chile,Jumbo,Limpieza,Sep,1042.7
`;

export const EJEMPLO_CON_ERRORES = `${CABECERA}
Chile,Jumbo,Abarrotes,Sep,2310.4
Chile,Jumbo,Lácteos,Sep,1520.8
Chile,Jumbo,Lácteos,Sep,1499.0
Chile,Jumbo,Perecibles,Sep,880.1
Chile,Vea,Abarrotes,Sep,1204.0
Chile,Santa Isabel,Bebidas,Sep,
Chile,Spid,Limpieza,Sep,-120.5
Chile,Santa Isabel,Congelados,Setiembre,640.3
Chile,Jumbo,Panadería,Sep,mil doscientos
`;
