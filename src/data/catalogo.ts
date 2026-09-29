import { INDICADORES, type Indicador } from "./semantica";

// Catálogo de datos: buscar antes de pedir. El RFP describe más de 90
// solicitudes mensuales al equipo de BI; una parte se responde con
// indicadores que ya existen. La búsqueda entiende cómo habla el negocio
// (sinónimos) y, si de verdad no existe, la solicitud llega al responsable
// del dominio con la decisión que busca apoyar.

/** Cómo se nombra cada indicador en el día a día, además de su nombre oficial. */
export const SINONIMOS: Record<string, string[]> = {
  margen_bruto_mp: ["margen", "rentabilidad", "contribución bruta", "gross margin", "ganancia"],
  venta_neta_mp: ["venta", "ventas", "facturación", "ingresos", "sell out", "vendido"],
  cumplimiento_plan: ["plan", "presupuesto", "meta", "cumplimiento", "contra presupuesto", "contra plan", "objetivo"],
  share_mp: ["participación", "share", "peso en la categoría", "cuota"],
  quiebre_sala: ["quiebre", "stock out", "sin stock", "disponibilidad", "oos", "góndola vacía", "góndola"],
  penetracion_lealtad: ["clientes", "lealtad", "programa", "penetración", "compradores", "compran"],
  margen_contribucion_regional: ["margen de contribución", "logística", "regional", "después de logística"],
};

export const DOMINIOS = ["Sales", "Onsite", "Loyalty", "Offsite", "SVOC"] as const;
export type Dominio = (typeof DOMINIOS)[number];

export const DESCRIPCION_DOMINIO: Record<Dominio, string> = {
  Sales: "Venta, margen, plan y participación",
  Onsite: "Operación en tienda: quiebre, surtido, góndola",
  Loyalty: "Programa de lealtad y clientes identificados",
  Offsite: "Canales digitales y venta fuera de la tienda",
  SVOC: "Vista única del cliente",
};

export const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ");

const VACIAS = new Set(["de", "la", "el", "los", "las", "por", "en", "y", "a", "con", "del", "para", "que", "un", "una", "mp", "marca", "propia", "vs", "al", "se", "contra", "frente", "como"]);

// Palabras que describen el CORTE (dónde o cuándo), no QUÉ se mide. No cuentan
// para decidir si un indicador responde la pregunta.
const NEUTRAS = new Set(["bandera", "banderas", "categoria", "categorias", "tienda", "tiendas", "region", "regiones", "mes", "mensual", "jumbo", "santa", "isabel", "spid", "lacteos", "congelados", "abarrotes", "bebidas", "limpieza", "panaderia", "cuidado", "personal", "productos", "producto", "cuantos", "cuanto", "cuantas"]);
export const palabras = (t: string) => normalizar(t).split(/\s+/).filter((w) => w.length > 2 && !VACIAS.has(w));

export interface Resultado {
  indicador: Indicador;
  puntaje: number;
  coincide: string; // por qué apareció, en palabras
}

/** Busca en nombre, sinónimos y definición. El puntaje pondera dónde coincide. */
export function buscar(consulta: string): Resultado[] {
  const q = palabras(consulta).filter((w) => !NEUTRAS.has(w));
  if (!q.length) return [];
  const qn = normalizar(consulta);
  const toca = (p: string, w: string) => p.length > 2 && (p.startsWith(w) || w.startsWith(p));
  return INDICADORES.map((ind) => {
    const nombre = palabras(ind.nombre);
    const sinon = SINONIMOS[ind.id] ?? [];
    const defin = palabras(ind.definicion);
    let puntaje = 0;
    let cubiertas = 0;
    let coincide = "";
    for (const w of q) {
      let cubre = false;
      if (nombre.some((n) => toca(n, w))) {
        puntaje += 3;
        cubre = true;
        coincide ||= "nombre";
      }
      const s = sinon.find((x) => normalizar(x).split(" ").some((p) => toca(p, w)));
      if (s) {
        puntaje += 2;
        cubre = true;
        coincide ||= `se conoce como "${s}"`;
      }
      if (defin.some((d) => d.startsWith(w))) puntaje += 1;
      if (cubre) cubiertas++;
    }
    // Una frase completa de un sinónimo dentro de la consulta es señal fuerte.
    const frase = sinon.find((x) => x.includes(" ") && qn.includes(normalizar(x)));
    if (frase) {
      puntaje += 4;
      coincide = `se conoce como "${frase}"`;
    }
    // Debe cubrir al menos la mitad de lo que se pregunta (o calzar una frase).
    const responde = frase || cubiertas / q.length >= 0.5;
    return { indicador: ind, puntaje: responde ? puntaje : 0, coincide: coincide || "definición" };
  })
    .filter((r) => r.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje);
}

export type EstadoSolicitud =
  | "recibida"
  | "en_evaluacion"
  | "resuelta_existente"
  | "aprobada"
  | "en_construccion"
  | "publicada";

export const ETAPAS: { id: EstadoSolicitud; texto: string }[] = [
  { id: "recibida", texto: "Recibida" },
  { id: "en_evaluacion", texto: "En evaluación" },
  { id: "aprobada", texto: "Aprobada" },
  { id: "en_construccion", texto: "En construcción" },
  { id: "publicada", texto: "Publicada" },
];

export interface Solicitud {
  id: string;
  titulo: string;
  decision: string; // para qué decisión se necesita
  solicitante: string;
  area: string;
  dominio: Dominio;
  responsable: string;
  estado: EstadoSolicitud;
  resueltaCon?: string; // id del indicador que ya la respondía
  creada: string;
}

/** Responsable por dominio: el owner del primer indicador certificado del dominio. */
export function responsableDe(dominio: Dominio): string {
  const ind = INDICADORES.find((i) => i.dominio === dominio && i.estado === "certificado");
  return ind ? `${ind.owner.nombre} · ${ind.owner.cargo}` : "Equipo BI Marcas Propias";
}

export const SOLICITUDES_SEMILLA: Solicitud[] = [
  {
    id: "s1",
    titulo: "Ventas de marca propia contra presupuesto, por bandera",
    decision: "Revisar el avance mensual en el comité comercial",
    solicitante: "Andrea Soto",
    area: "Comercial Jumbo",
    dominio: "Sales",
    responsable: responsableDe("Sales"),
    estado: "resuelta_existente",
    resueltaCon: "cumplimiento_plan",
    creada: "3 sep",
  },
  {
    id: "s2",
    titulo: "Productos sin stock en góndola en Lácteos",
    decision: "Priorizar reposición con el proveedor",
    solicitante: "Marcelo Díaz",
    area: "Operaciones Santa Isabel",
    dominio: "Onsite",
    responsable: responsableDe("Onsite"),
    estado: "resuelta_existente",
    resueltaCon: "quiebre_sala",
    creada: "5 sep",
  },
  {
    id: "s3",
    titulo: "Margen después de logística, por región",
    decision: "Decidir qué categorías conviene abastecer desde el centro regional",
    solicitante: "Sebastián Ortiz",
    area: "BI Marcas Propias Regional",
    dominio: "Sales",
    responsable: responsableDe("Sales"),
    estado: "en_evaluacion",
    creada: "10 sep",
  },
  {
    id: "s4",
    titulo: "Venta de marca propia en canal online, Spid y Jumbo.cl",
    decision: "Definir surtido de marca propia para la app de Spid",
    solicitante: "Camila Reyes",
    area: "E-commerce",
    dominio: "Offsite",
    responsable: responsableDe("Offsite"),
    estado: "en_construccion",
    creada: "12 sep",
  },
  {
    id: "s5",
    titulo: "Clientes del programa que compran marca propia",
    decision: "Segmentar una campaña de lealtad",
    solicitante: "Josefina Vial",
    area: "Loyalty",
    dominio: "Loyalty",
    responsable: responsableDe("Loyalty"),
    estado: "resuelta_existente",
    resueltaCon: "penetracion_lealtad",
    creada: "16 sep",
  },
  {
    id: "s6",
    titulo: "Ahorro del cliente al elegir marca propia frente a la marca líder",
    decision: "Comunicar el ahorro en la góndola y en la app",
    solicitante: "Francisca Lagos",
    area: "Marketing Marcas Propias",
    dominio: "Sales",
    responsable: responsableDe("Sales"),
    estado: "recibida",
    creada: "22 sep",
  },
  {
    id: "s7",
    titulo: "Rotación de inventario de marca propia por tienda",
    decision: "Ajustar la frecuencia de pedidos por tienda",
    solicitante: "Rodrigo Meza",
    area: "Planificación Comercial",
    dominio: "Onsite",
    responsable: responsableDe("Onsite"),
    estado: "recibida",
    creada: "25 sep",
  },
];

/** Parecido entre textos (Jaccard sobre palabras con contenido). */
export function parecido(a: string, b: string): number {
  const A = new Set(palabras(a));
  const B = new Set(palabras(b));
  if (!A.size || !B.size) return 0;
  let comun = 0;
  A.forEach((w) => {
    if ([...B].some((x) => x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5)))) comun++;
  });
  return comun / (A.size + B.size - comun);
}
