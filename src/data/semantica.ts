// Capa semántica — definición única de cada indicador de negocio.
// Esto es lo que en la arquitectura de referencia vive como Unity Catalog Metric View:
// una sola definición, con owner y linaje, consumida por múltiples motores.

export type EstadoIndicador = "certificado" | "en_certificacion" | "exploratorio";

export interface Indicador {
  id: string;
  nombre: string;
  definicion: string;
  formula: string;
  unidad: string;
  granularidad: string;
  owner: { nombre: string; cargo: string; area: string };
  linaje: string[];
  dominio: string;
  estado: EstadoIndicador;
  version: string;
  certificadoDesde: string | null;
  ultimoCambio: string;
  consumidores: Array<"Portal" | "Power BI" | "BIA">;
  incluye: string[];
  excluye: string[];
  frescura: string;
}

export const INDICADORES: Indicador[] = [
  {
    id: "margen_bruto_mp",
    nombre: "Margen bruto marca propia",
    definicion:
      "Margen bruto de los productos de marca propia, neto de rebates de proveedor y de merma reconocida, valorizado a costo real de reposición.",
    formula:
      "SUM(venta_neta - costo_real_reposicion - merma_valorizada + rebate_devengado)\n  / NULLIF(SUM(venta_neta), 0)",
    unidad: "%",
    granularidad: "país · bandera · categoría · mes",
    owner: {
      nombre: "Paulina Grez",
      cargo: "Gerenta de Marcas Propias",
      area: "Marcas Propias & Supermercados Chile",
    },
    linaje: [
      "gold.sales.fact_venta_linea",
      "gold.producto.dim_sku",
      "gold.producto.dim_marca_propia",
      "gold.costos.fact_costo_reposicion",
      "gold.costos.fact_rebate_devengado",
      "gold.operaciones.fact_merma",
    ],
    dominio: "Sales",
    estado: "certificado",
    version: "2.1",
    certificadoDesde: "2026-06-30",
    ultimoCambio: "2026-06-30 · se incorporó merma valorizada al denominador de costo",
    consumidores: ["Portal", "Power BI", "BIA"],
    incluye: [
      "Rebates devengados en el período, no los cobrados",
      "Merma reconocida en sala y en centro de distribución",
      "Costo real de reposición del período",
    ],
    excluye: [
      "Costos logísticos indirectos (viven en margen de contribución)",
      "Descuentos de programa de lealtad (afectan venta neta, no costo)",
      "Marcas de terceros con exclusividad",
    ],
    frescura: "Diaria · 06:00 CLT",
  },
  {
    id: "venta_neta_mp",
    nombre: "Venta neta marca propia",
    definicion:
      "Venta de productos de marca propia neta de IVA, devoluciones y descuentos aplicados en boleta, incluidos los del programa de lealtad.",
    formula:
      "SUM(monto_bruto - iva - devoluciones - descuento_boleta - descuento_lealtad)",
    unidad: "CLP MM",
    granularidad: "país · bandera · tienda · categoría · día",
    owner: {
      nombre: "Rodrigo Meza",
      cargo: "Subgerente de Planificación Comercial",
      area: "Marcas Propias & Supermercados Chile",
    },
    linaje: [
      "gold.sales.fact_venta_linea",
      "gold.producto.dim_sku",
      "gold.loyalty.fact_descuento_aplicado",
    ],
    dominio: "Sales",
    estado: "certificado",
    version: "3.0",
    certificadoDesde: "2026-04-15",
    ultimoCambio: "2026-04-15 · se unificó el tratamiento de descuentos de lealtad",
    consumidores: ["Portal", "Power BI", "BIA"],
    incluye: ["Venta en sala y en canal digital", "Descuentos de lealtad como menor venta"],
    excluye: ["Venta a terceros mayoristas", "Ajustes contables posteriores al cierre"],
    frescura: "Near real time · latencia < 15 min",
  },
  {
    id: "cumplimiento_plan",
    nombre: "Cumplimiento de plan",
    definicion:
      "Venta neta del período dividida por el plan comercial vigente al momento del cierre mensual.",
    formula: "SUM(venta_neta) / NULLIF(SUM(plan_vigente), 0)",
    unidad: "%",
    granularidad: "país · bandera · categoría · mes",
    owner: {
      nombre: "Rodrigo Meza",
      cargo: "Subgerente de Planificación Comercial",
      area: "Marcas Propias & Supermercados Chile",
    },
    linaje: ["gold.sales.fact_venta_linea", "gold.planificacion.fact_plan_comercial"],
    dominio: "Sales",
    estado: "certificado",
    version: "1.4",
    certificadoDesde: "2026-05-20",
    ultimoCambio: "2026-05-20 · se fijó el plan vigente al cierre, no el reforecast",
    consumidores: ["Portal", "Power BI", "BIA"],
    incluye: ["Plan aprobado en el ciclo de presupuesto"],
    excluye: ["Reforecast intramensual", "Ajustes de plan posteriores al cierre"],
    frescura: "Diaria · 06:00 CLT",
  },
  {
    id: "share_mp",
    nombre: "Participación de marca propia",
    definicion:
      "Venta de marca propia como proporción de la venta total de su categoría, en unidades equivalentes.",
    formula:
      "SUM(unidades_eq WHERE es_marca_propia) / NULLIF(SUM(unidades_eq), 0)",
    unidad: "%",
    granularidad: "país · bandera · categoría · mes",
    owner: {
      nombre: "Paulina Grez",
      cargo: "Gerenta de Marcas Propias",
      area: "Marcas Propias & Supermercados Chile",
    },
    linaje: [
      "gold.sales.fact_venta_linea",
      "gold.producto.dim_sku",
      "gold.producto.dim_categoria",
    ],
    dominio: "Sales",
    estado: "certificado",
    version: "2.0",
    certificadoDesde: "2026-06-01",
    ultimoCambio: "2026-06-01 · se pasó de share en valor a share en unidades equivalentes",
    consumidores: ["Portal", "Power BI", "BIA"],
    incluye: ["Unidades equivalentes normalizadas por formato de envase"],
    excluye: ["Categorías sin surtido de marca propia"],
    frescura: "Diaria · 06:00 CLT",
  },
  {
    id: "quiebre_sala",
    nombre: "Quiebre en sala",
    definicion:
      "Proporción de combinaciones SKU-tienda-día con inventario disponible igual a cero durante horario de atención.",
    formula:
      "COUNT(sku_tienda_dia WHERE stock_disponible = 0) / NULLIF(COUNT(sku_tienda_dia), 0)",
    unidad: "%",
    granularidad: "bandera · tienda · categoría · día",
    owner: {
      nombre: "Ignacio Ruiz-Tagle",
      cargo: "Gerente de Supply Chain",
      area: "Supermercados Chile",
    },
    linaje: ["gold.operaciones.fact_inventario_tienda", "gold.producto.dim_sku"],
    dominio: "Onsite",
    estado: "certificado",
    version: "1.2",
    certificadoDesde: "2026-03-10",
    ultimoCambio: "2026-03-10 · se excluyeron SKU en proceso de descontinuación",
    consumidores: ["Portal", "Power BI", "BIA"],
    incluye: ["SKU activos con surtido asignado a la tienda"],
    excluye: ["SKU descontinuados", "Tiendas en remodelación"],
    frescura: "Cada 4 horas",
  },
  {
    id: "penetracion_lealtad",
    nombre: "Penetración de marca propia en clientes del programa",
    definicion:
      "Proporción de clientes identificados del programa de lealtad que compraron al menos un producto de marca propia en el período.",
    formula:
      "COUNT(DISTINCT cliente_id WHERE compro_marca_propia)\n  / NULLIF(COUNT(DISTINCT cliente_id), 0)",
    unidad: "%",
    granularidad: "país · bandera · mes",
    owner: {
      nombre: "Camila Ossandón",
      cargo: "Subgerenta de Lealtad y CRM",
      area: "Supermercados Chile",
    },
    linaje: [
      "gold.loyalty.fact_transaccion_identificada",
      "gold.svoc.dim_cliente",
      "gold.producto.dim_marca_propia",
    ],
    dominio: "Loyalty · SVOC",
    estado: "en_certificacion",
    version: "0.9",
    certificadoDesde: null,
    ultimoCambio: "2026-08-22 · en revisión por el owner, pendiente criterio de cliente activo",
    consumidores: ["Portal", "BIA"],
    incluye: ["Transacciones con cliente identificado"],
    excluye: ["Compras sin identificación", "Clientes con menos de 2 visitas en el período"],
    frescura: "Semanal · lunes 07:00 CLT",
  },
  {
    id: "margen_contribucion_regional",
    nombre: "Margen de contribución regional",
    definicion:
      "Cálculo propio del equipo regional que descuenta logística estimada al margen bruto. No está certificado y su lógica vive fuera de la capa semántica.",
    formula: "margen_bruto_mp - costo_logistico_estimado_pct  // parámetro manual: 3,4%",
    unidad: "%",
    granularidad: "país · categoría · mes",
    owner: {
      nombre: "Sin owner asignado",
      cargo: "—",
      area: "Marcas Propias Regional",
    },
    linaje: ["Centralizador · planilla mantenida manualmente"],
    dominio: "Sales",
    estado: "exploratorio",
    version: "—",
    certificadoDesde: null,
    ultimoCambio: "2026-08-28 · último guardado del archivo",
    consumidores: ["Portal"],
    incluye: ["Supuesto logístico fijo de 3,4% cargado a mano"],
    excluye: ["Trazabilidad del supuesto", "Revisión del owner de margen"],
    frescura: "Manual · depende de la carga del analista",
  },
];

export const porId = (id: string) => INDICADORES.find((i) => i.id === id);
