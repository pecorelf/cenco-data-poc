import type ExcelJSTipo from "exceljs";
import { porId } from "../data/semantica";

// Exportar a Excel: el archivo viaja por correo y se abre lejos del portal,
// así que lleva consigo lo que en el portal está a un clic:
//  - el logo y el contexto (quién lo generó, cuándo, con qué alcance);
//  - números como números (porcentajes como fracción con formato 0,0 %),
//    y totales como fórmulas, no como valores escritos;
//  - de qué indicador certificado sale cada columna, su versión y quién
//    responde por él; y una hoja con las definiciones completas.

export interface ColumnaExport {
  indicadorId: string;
  nombre: string;
  unidad: string; // "%" o " MM"
  valores: number[];
}

export interface DatosExport {
  titulo: string;
  subtitulo: string;
  dimension: string; // "Mes", "Categoría" o "Bandera"
  categorias: string[];
  columnas: ColumnaExport[];
  generadoPor: string;
  alcance: string;
  fecha: Date;
}

const AZUL = "FF095AA5";
const AZUL_OSCURO = "FF064174";
const AZUL_SUAVE = "FFE6EFF8";
const NARANJO = "FFC64E00";
const GRIS = "FF6B7480";
const FUENTE = "Arial";

// Solo estos promedios se ponderan por venta en la capa semántica; para ellos
// el total del período es SUMAPRODUCTO(métrica; venta) / SUMA(venta).
const PONDERADOS_POR_VENTA = new Set(["margen_bruto_mp", "share_mp"]);

const esPorcentaje = (u: string) => u.trim() === "%";
const letra = (i: number) => String.fromCharCode(65 + i); // A, B, C… (hasta 26 columnas)

export async function construirLibro(
  ExcelJS: typeof ExcelJSTipo,
  d: DatosExport,
  logoPng: ArrayBuffer | Uint8Array | null
): Promise<ExcelJSTipo.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Portal BI Unificado 360°, Cencosud";
  wb.created = d.fecha;

  const ws = wb.addWorksheet("Reporte", {
    views: [{ state: "frozen", ySplit: 5, showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const nCols = 1 + d.columnas.length;
  const anchoFranja = Math.max(nCols, 6);
  ws.getColumn(1).width = 26;
  d.columnas.forEach((_, i) => (ws.getColumn(i + 2).width = 24));
  for (let c = nCols + 1; c <= anchoFranja; c++) ws.getColumn(c).width = 14;

  // --- Franja superior azul con logo y contexto ----------------------------
  [1, 2, 3].forEach((r) => {
    ws.getRow(r).height = r === 1 ? 26 : 20;
    for (let c = 1; c <= anchoFranja; c++) {
      ws.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    }
  });
  const fecha = d.fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
  const tit = ws.getCell("B1");
  tit.value = d.titulo;
  tit.font = { name: FUENTE, size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  tit.alignment = { vertical: "middle" };
  const sub = ws.getCell("B2");
  sub.value = d.subtitulo;
  sub.font = { name: FUENTE, size: 10, color: { argb: "FFFFFFFF" } };
  const meta = ws.getCell("B3");
  meta.value = `Generado el ${fecha} por ${d.generadoPor}. Alcance: ${d.alcance}.`;
  meta.font = { name: FUENTE, size: 9, color: { argb: "FFD3E2F0" } };

  if (logoPng) {
    const id = wb.addImage({ buffer: logoPng as ArrayBuffer, extension: "png" });
    // 360×196 px de origen, mostrado a 120×65 dentro de la columna A.
    ws.addImage(id, { tl: { col: 0.15, row: 0.12 }, ext: { width: 120, height: 65 } });
  }

  // --- Encabezado de la tabla (fila 5) --------------------------------------
  const FILA_ENC = 5;
  const enc = ws.getRow(FILA_ENC);
  enc.height = 30;
  const encabezados = [
    d.dimension,
    ...d.columnas.map((c) => `${c.nombre} (${esPorcentaje(c.unidad) ? "%" : "MM CLP"})`),
  ];
  encabezados.forEach((t, i) => {
    const cel = enc.getCell(i + 1);
    cel.value = t;
    cel.font = { name: FUENTE, size: 10, bold: true, color: { argb: AZUL_OSCURO } };
    cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_SUAVE } };
    cel.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", wrapText: true };
    cel.border = { bottom: { style: "medium", color: { argb: AZUL } } };
  });

  // --- Datos -----------------------------------------------------------------
  const PRIMERA = FILA_ENC + 1;
  d.categorias.forEach((cat, fi) => {
    const fila = ws.getRow(PRIMERA + fi);
    const c0 = fila.getCell(1);
    c0.value = cat;
    c0.font = { name: FUENTE, size: 10 };
    d.columnas.forEach((col, ci) => {
      const cel = fila.getCell(ci + 2);
      const v = col.valores[fi];
      cel.value = esPorcentaje(col.unidad) ? v / 100 : v; // % se guarda como fracción
      cel.numFmt = esPorcentaje(col.unidad) ? "0.0%" : "#,##0";
      cel.font = { name: FUENTE, size: 10 };
      cel.alignment = { horizontal: "right" };
    });
    fila.eachCell((cel) => (cel.border = { bottom: { style: "hair", color: { argb: "FFD3E2F0" } } }));
  });
  const ULTIMA = PRIMERA + d.categorias.length - 1;

  // --- Total: solo donde tiene sentido, y siempre como fórmula ---------------
  const iVenta = d.columnas.findIndex((c) => c.indicadorId === "venta_neta_mp");
  const hayTotal = d.columnas.some(
    (c) => !esPorcentaje(c.unidad) || (iVenta >= 0 && PONDERADOS_POR_VENTA.has(c.indicadorId))
  );
  let filaNota = ULTIMA + 2;
  if (hayTotal) {
    const FT = ULTIMA + 1;
    const tot = ws.getRow(FT);
    tot.getCell(1).value = "Total del período";
    const colVenta = iVenta >= 0 ? letra(iVenta + 1) : null;
    d.columnas.forEach((col, ci) => {
      const L = letra(ci + 1);
      const cel = tot.getCell(ci + 2);
      if (!esPorcentaje(col.unidad)) {
        cel.value = { formula: `SUM(${L}${PRIMERA}:${L}${ULTIMA})` };
        cel.numFmt = "#,##0";
      } else if (colVenta && PONDERADOS_POR_VENTA.has(col.indicadorId)) {
        cel.value = {
          formula: `SUMPRODUCT(${L}${PRIMERA}:${L}${ULTIMA},${colVenta}${PRIMERA}:${colVenta}${ULTIMA})/SUM(${colVenta}${PRIMERA}:${colVenta}${ULTIMA})`,
        };
        cel.numFmt = "0.0%";
      }
      cel.alignment = { horizontal: "right" };
    });
    // La raya del total cubre todas las columnas, también las que quedan vacías.
    for (let c = 1; c <= nCols; c++) {
      const cel = tot.getCell(c);
      cel.font = { name: FUENTE, size: 10, bold: true, color: { argb: AZUL_OSCURO } };
      cel.border = { top: { style: "thin", color: { argb: AZUL } } };
    }
    filaNota = FT + 2;
  }

  // --- Fuente: de qué indicador certificado sale cada columna ----------------
  const fuente = ws.getCell(`A${filaNota}`);
  fuente.value = "Fuente: capa semántica del Portal BI Unificado 360°";
  fuente.font = { name: FUENTE, size: 9, bold: true, color: { argb: AZUL_OSCURO } };
  d.columnas.forEach((col, i) => {
    const ind = porId(col.indicadorId);
    const cel = ws.getCell(`A${filaNota + 1 + i}`);
    const estado =
      ind?.estado === "certificado"
        ? "certificado"
        : ind?.estado === "en_certificacion"
        ? "en certificación"
        : "exploratorio, no es cifra oficial";
    const conResponsable = ind && !/^sin /i.test(ind.owner.nombre) && ind.owner.nombre !== "—";
    const version = ind && /\d/.test(ind.version) ? ` v${ind.version}` : "";
    cel.value = ind
      ? `${ind.nombre}: indicador ${ind.id}${version}, ${estado}. ${
          conResponsable ? `Responde ${ind.owner.nombre} (${ind.owner.cargo}).` : "Sin responsable asignado."
        }`
      : col.nombre;
    cel.font = {
      name: FUENTE,
      size: 9,
      color: { argb: ind && ind.estado !== "certificado" ? NARANJO : GRIS },
    };
  });
  const notaTotales = ws.getCell(`A${filaNota + 2 + d.columnas.length}`);
  notaTotales.value = hayTotal
    ? "Totales calculados con fórmulas. Margen y participación se ponderan por venta, igual que en la capa semántica."
    : "Sin fila de total: los porcentajes no se suman y no hay venta en el reporte para ponderarlos.";
  notaTotales.font = { name: FUENTE, size: 9, italic: true, color: { argb: GRIS } };

  // --- Hoja de definiciones ---------------------------------------------------
  const def = wb.addWorksheet("Definiciones", { views: [{ state: "frozen", ySplit: 1 }] });
  def.columns = [
    { header: "Indicador", key: "nombre", width: 30 },
    { header: "Id", key: "id", width: 24 },
    { header: "Definición", key: "definicion", width: 60 },
    { header: "Fórmula", key: "formula", width: 40 },
    { header: "Responsable", key: "owner", width: 32 },
    { header: "Estado", key: "estado", width: 16 },
    { header: "Versión", key: "version", width: 10 },
    { header: "Frescura", key: "frescura", width: 24 },
  ];
  d.columnas.forEach((col) => {
    const ind = porId(col.indicadorId);
    if (!ind) return;
    def.addRow({
      nombre: ind.nombre,
      id: ind.id,
      definicion: ind.definicion,
      formula: ind.formula,
      owner: /^sin /i.test(ind.owner.nombre) ? "Sin responsable asignado" : `${ind.owner.nombre}, ${ind.owner.cargo}`,
      estado: ind.estado.replace("_", " "),
      version: ind.version,
      frescura: ind.frescura,
    });
  });
  def.getRow(1).eachCell((cel) => {
    cel.font = { name: FUENTE, size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    cel.alignment = { vertical: "middle" };
  });
  def.eachRow((fila, n) => {
    if (n === 1) return;
    fila.eachCell((cel) => {
      cel.font = { name: FUENTE, size: 10 };
      cel.alignment = { vertical: "top", wrapText: true };
    });
  });

  return wb;
}

/** Genera el archivo en el navegador y lo descarga. ExcelJS se carga recién
 * aquí, así no pesa en la carga inicial del portal. */
export async function descargarExcel(d: DatosExport, nombreArchivo: string): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  let logo: ArrayBuffer | null = null;
  try {
    logo = await (await fetch("/cencosud-exportar.png")).arrayBuffer();
  } catch {
    logo = null; // sin logo, el archivo sigue siendo válido
  }
  const wb = await construirLibro(ExcelJS, d, logo);
  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombreArchivo}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
