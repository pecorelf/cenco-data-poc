// Mis alertas — SH: "Configuración de alertas por usuario (métrica, condición,
// frecuencia, canal de aviso)". La regla se evalúa de verdad contra el dataset
// vigente, no es una maqueta: si el umbral ya está cruzado, se marca al tiro.

import {
  filtrar,
  margenPonderado,
  sharePonderado,
  sumaVenta,
  sumaPlan,
  type Bandera,
  type Categoria,
} from "./comercial";

export type MetricaAlerta = "venta_neta" | "plan" | "margen_bruto" | "share_mp" | "quiebre";

export const ETIQUETA_METRICA_ALERTA: Record<MetricaAlerta, string> = {
  venta_neta: "Venta neta",
  plan: "Plan",
  margen_bruto: "Margen bruto",
  share_mp: "Participación",
  quiebre: "Quiebre en sala",
};

export const UNIDAD_METRICA_ALERTA: Record<MetricaAlerta, string> = {
  venta_neta: " MM",
  plan: " MM",
  margen_bruto: "%",
  share_mp: "%",
  quiebre: "%",
};

export type Operador = "<" | ">" | "<=" | ">=";
export type Frecuencia = "Diaria" | "Semanal" | "Al detectarse";
export type Canal = "Portal" | "Email" | "Slack" | "WhatsApp";

export const CANAL_LISTO: Record<Canal, boolean> = {
  Portal: true,
  Email: false,
  Slack: false,
  WhatsApp: false,
};

export interface AlertaConfigurada {
  id: string;
  metrica: MetricaAlerta;
  bandera: Bandera | "Todas";
  categoria: Categoria | "Todas";
  operador: Operador;
  umbral: number;
  frecuencia: Frecuencia;
  canales: Canal[];
  activa: boolean;
  creadaPor: string;
  creadaEn: string;
}

/** Valor vigente de la métrica para el alcance de la alerta, agosto 2026. */
export function valorVigente(a: Pick<AlertaConfigurada, "metrica" | "bandera" | "categoria">): number {
  const filas = filtrar({
    bandera: a.bandera === "Todas" ? undefined : a.bandera,
    categoria: a.categoria === "Todas" ? undefined : a.categoria,
    mes: "Ago",
  });
  switch (a.metrica) {
    case "venta_neta":
      return sumaVenta(filas);
    case "plan":
      return sumaPlan(filas);
    case "margen_bruto":
      return margenPonderado(filas);
    case "share_mp":
      return sharePonderado(filas);
    case "quiebre":
      return +(filas.reduce((s, f) => s + f.quiebre, 0) / (filas.length || 1)).toFixed(1);
  }
}

export function cumpleCondicion(valor: number, operador: Operador, umbral: number): boolean {
  switch (operador) {
    case "<":
      return valor < umbral;
    case ">":
      return valor > umbral;
    case "<=":
      return valor <= umbral;
    case ">=":
      return valor >= umbral;
  }
}

export const ALERTAS_SEMILLA: AlertaConfigurada[] = [
  {
    id: "AL-001",
    metrica: "margen_bruto",
    bandera: "Todas",
    categoria: "Lácteos",
    operador: "<",
    umbral: 22,
    frecuencia: "Diaria",
    canales: ["Portal"],
    activa: true,
    creadaPor: "Paulina Grez",
    creadaEn: "20-08-2026",
  },
  {
    id: "AL-002",
    metrica: "quiebre",
    bandera: "Todas",
    categoria: "Todas",
    operador: ">",
    umbral: 6,
    frecuencia: "Al detectarse",
    canales: ["Portal", "Email"],
    activa: true,
    creadaPor: "Rodrigo Meza",
    creadaEn: "15-08-2026",
  },
  {
    id: "AL-003",
    metrica: "share_mp",
    bandera: "Spid",
    categoria: "Todas",
    operador: "<",
    umbral: 15,
    frecuencia: "Semanal",
    canales: ["Portal"],
    activa: false,
    creadaPor: "Sebastián Ortiz",
    creadaEn: "02-08-2026",
  },
];
