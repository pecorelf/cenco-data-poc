// Dataset sintético de marca propia — Supermercados Chile.
// Coherente entre sí: venta, plan, margen, share, quiebre y lealtad se sostienen mutuamente.

export const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
] as const;

export type Mes = (typeof MESES)[number];

export const BANDERAS = ["Jumbo", "Santa Isabel", "Spid"] as const;
export type Bandera = (typeof BANDERAS)[number];

export const CATEGORIAS = [
  "Abarrotes",
  "Lácteos",
  "Bebidas",
  "Limpieza",
  "Cuidado personal",
  "Congelados",
  "Panadería",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export interface FilaComercial {
  mes: Mes;
  bandera: Bandera;
  categoria: Categoria;
  ventaNeta: number; // CLP MM
  plan: number; // CLP MM
  margenBruto: number; // %
  shareMP: number; // %
  quiebre: number; // %
  penetracionLealtad: number; // %
}

// Perfiles base por categoría: [venta base MM, margen base %, share base %, quiebre base %]
const PERFIL: Record<Categoria, [number, number, number, number]> = {
  Abarrotes: [4820, 26.4, 24.1, 3.8],
  Lácteos: [3140, 22.8, 19.6, 5.2],
  Bebidas: [2760, 19.4, 12.3, 4.1],
  Limpieza: [2180, 31.7, 28.9, 3.2],
  "Cuidado personal": [1940, 34.2, 16.4, 4.6],
  Congelados: [1520, 24.9, 21.7, 6.8],
  Panadería: [1180, 29.3, 33.5, 2.4],
};

// Peso relativo por bandera
const PESO_BANDERA: Record<Bandera, number> = {
  Jumbo: 0.46,
  "Santa Isabel": 0.44,
  Spid: 0.1,
};

// Ajuste de margen por bandera (Spid opera con margen más apretado)
const AJUSTE_MARGEN: Record<Bandera, number> = {
  Jumbo: 1.4,
  "Santa Isabel": -0.6,
  Spid: -2.8,
};

// Estacionalidad mensual de venta
const ESTACIONAL = [1.06, 0.94, 1.01, 0.97, 1.0, 1.03, 1.08, 1.05];

// Deriva de margen a lo largo del año: presión de costos desde mayo
const DERIVA_MARGEN = [0.4, 0.3, 0.1, -0.1, -0.5, -0.9, -1.2, -1.6];

function pseudo(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export const DATOS: FilaComercial[] = (() => {
  const filas: FilaComercial[] = [];
  let seed = 1;
  MESES.forEach((mes, mi) => {
    BANDERAS.forEach((bandera) => {
      CATEGORIAS.forEach((categoria) => {
        const [vBase, mBase, sBase, qBase] = PERFIL[categoria];
        const ruido = () => (pseudo(seed++) - 0.5) * 2;

        const ventaNeta =
          vBase * PESO_BANDERA[bandera] * ESTACIONAL[mi] * (1 + ruido() * 0.05);
        // El plan se fijó optimista: crece 6% sobre la base
        const plan = vBase * PESO_BANDERA[bandera] * 1.06 * (1 + ruido() * 0.02);
        const margenBruto =
          mBase + AJUSTE_MARGEN[bandera] + DERIVA_MARGEN[mi] + ruido() * 0.8;
        const shareMP = sBase + mi * 0.22 + ruido() * 1.1;
        const quiebre = qBase + (mi > 4 ? 0.9 : 0) + ruido() * 0.7;
        const penetracionLealtad = 41.2 + mi * 0.8 + ruido() * 2.4;

        filas.push({
          mes,
          bandera,
          categoria,
          ventaNeta: +ventaNeta.toFixed(1),
          plan: +plan.toFixed(1),
          margenBruto: +margenBruto.toFixed(1),
          shareMP: +shareMP.toFixed(1),
          quiebre: +Math.max(0.4, quiebre).toFixed(1),
          penetracionLealtad: +penetracionLealtad.toFixed(1),
        });
      });
    });
  });
  return filas;
})();

// --- Agregaciones -----------------------------------------------------------

export interface Filtro {
  bandera?: Bandera | "Todas";
  categoria?: Categoria | "Todas";
  mes?: Mes;
}

export function filtrar(f: Filtro = {}): FilaComercial[] {
  return DATOS.filter(
    (d) =>
      (!f.bandera || f.bandera === "Todas" || d.bandera === f.bandera) &&
      (!f.categoria || f.categoria === "Todas" || d.categoria === f.categoria) &&
      (!f.mes || d.mes === f.mes)
  );
}

/** Promedio ponderado por venta — así se agrega un margen, no con AVG simple. */
export function margenPonderado(filas: FilaComercial[]): number {
  const venta = filas.reduce((a, d) => a + d.ventaNeta, 0);
  if (!venta) return 0;
  return +(
    filas.reduce((a, d) => a + d.margenBruto * d.ventaNeta, 0) / venta
  ).toFixed(1);
}

export function sumaVenta(filas: FilaComercial[]): number {
  return +filas.reduce((a, d) => a + d.ventaNeta, 0).toFixed(0);
}

export function sumaPlan(filas: FilaComercial[]): number {
  return +filas.reduce((a, d) => a + d.plan, 0).toFixed(0);
}

export function cumplimiento(filas: FilaComercial[]): number {
  const p = sumaPlan(filas);
  return p ? +((sumaVenta(filas) / p) * 100).toFixed(1) : 0;
}

export function sharePonderado(filas: FilaComercial[]): number {
  const venta = filas.reduce((a, d) => a + d.ventaNeta, 0);
  if (!venta) return 0;
  return +(
    filas.reduce((a, d) => a + d.shareMP * d.ventaNeta, 0) / venta
  ).toFixed(1);
}

export function serieMensual(f: Filtro = {}) {
  return MESES.map((mes) => {
    const filas = filtrar({ ...f, mes });
    return {
      mes,
      venta: sumaVenta(filas),
      plan: sumaPlan(filas),
      margen: margenPonderado(filas),
      share: sharePonderado(filas),
      cumplimiento: cumplimiento(filas),
    };
  });
}

export function porCategoria(mes: Mes, bandera: Bandera | "Todas" = "Todas") {
  return CATEGORIAS.map((categoria) => {
    const filas = filtrar({ mes, bandera, categoria });
    return {
      categoria,
      venta: sumaVenta(filas),
      plan: sumaPlan(filas),
      margen: margenPonderado(filas),
      share: sharePonderado(filas),
      cumplimiento: cumplimiento(filas),
      quiebre: +(
        filas.reduce((a, d) => a + d.quiebre, 0) / (filas.length || 1)
      ).toFixed(1),
    };
  });
}

// --- Las tres cifras en conflicto -------------------------------------------
// Mismo indicador, mismo mes, tres sistemas. Ninguna es mentira: cada una
// responde a una definición distinta que nunca se acordó.

export interface CifraLegada {
  sistema: string;
  responsable: string;
  valor: number;
  definicion: string;
  porQueDifiere: string;
}

export const MARGEN_EN_CONFLICTO: CifraLegada[] = [
  {
    sistema: "Power BI · Tablero Comercial MP",
    responsable: "Equipo Comercial Marcas Propias",
    valor: 31.4,
    definicion: "Margen bruto sobre costo estándar, sin descontar merma.",
    porQueDifiere:
      "No descuenta merma ni usa costo real de reposición, por eso queda 3,8 puntos por sobre el certificado.",
  },
  {
    sistema: "MicroStrategy · Rentabilidad Categorías",
    responsable: "Control de Gestión Supermercados",
    valor: 26.8,
    definicion:
      "Margen neto de rebates cobrados en el mes y de merma, a costo real.",
    porQueDifiere:
      "Usa rebates cobrados y no devengados, lo que desplaza el reconocimiento entre meses.",
  },
  {
    sistema: "Centralizador · Planilla Marcas Propias Regional",
    responsable: "Analista regional (mantención manual)",
    valor: 29.1,
    definicion: "Margen bruto a costo estándar con ajuste manual de merma.",
    porQueDifiere:
      "El ajuste de merma se carga a mano y el maestro de SKU está desfasado en dos semanas.",
  },
];

export const MARGEN_CERTIFICADO = 27.6;
