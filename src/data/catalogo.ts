// Inventario de la reportería que hoy vive dispersa entre plataformas.
// Sostiene dos cosas: el catálogo unificado (CR-06) y la racionalización del Frente 4.

export type Plataforma =
  | "Power BI"
  | "MicroStrategy"
  | "Looker Studio"
  | "Centralizador"
  | "Portal BI";

export type Destino = "mantener" | "converger" | "reemplazar" | "descontinuar";

export interface Reporte {
  id: string;
  nombre: string;
  plataforma: Plataforma;
  dominio: string;
  owner: string;
  usuariosMes: number;
  ultimaVisita: string;
  certificado: boolean;
  destino: Destino;
  motivo: string;
  duplicaA?: string;
}

export const DESTINOS: Record<Destino, { etiqueta: string; descripcion: string }> = {
  mantener: {
    etiqueta: "Mantener",
    descripcion: "Tiene uso real, dueño claro y no se superpone con otro activo.",
  },
  converger: {
    etiqueta: "Converger",
    descripcion: "Cubre una necesidad válida pero duplica lógica con otro reporte.",
  },
  reemplazar: {
    etiqueta: "Reemplazar",
    descripcion: "La necesidad se resuelve mejor desde el portal sobre la capa semántica.",
  },
  descontinuar: {
    etiqueta: "Descontinuar",
    descripcion: "Uso marginal o nulo. Migrarlo sería mover el problema de lugar.",
  },
};

export const REPORTES: Reporte[] = [
  {
    id: "R-001",
    nombre: "Venta diaria marca propia",
    plataforma: "Power BI",
    dominio: "Sales",
    owner: "Rodrigo Meza",
    usuariosMes: 184,
    ultimaVisita: "hoy",
    certificado: true,
    destino: "mantener",
    motivo: "Uso alto y transversal. Se reapunta a la capa semántica sin rehacerlo.",
  },
  {
    id: "R-002",
    nombre: "Tablero Comercial MP",
    plataforma: "Power BI",
    dominio: "Sales",
    owner: "Equipo Comercial MP",
    usuariosMes: 96,
    ultimaVisita: "hoy",
    certificado: false,
    destino: "converger",
    motivo: "Calcula margen con costo estándar. Es una de las tres cifras en conflicto.",
    duplicaA: "R-004",
  },
  {
    id: "R-003",
    nombre: "Venta vs. plan por categoría",
    plataforma: "MicroStrategy",
    dominio: "Sales",
    owner: "Control de Gestión",
    usuariosMes: 71,
    ultimaVisita: "ayer",
    certificado: false,
    destino: "reemplazar",
    motivo: "Idéntico al informe certificado del portal. Se apaga al liberar el piloto.",
    duplicaA: "R-001",
  },
  {
    id: "R-004",
    nombre: "Rentabilidad Categorías",
    plataforma: "MicroStrategy",
    dominio: "Sales",
    owner: "Control de Gestión",
    usuariosMes: 58,
    ultimaVisita: "hace 2 días",
    certificado: false,
    destino: "converger",
    motivo: "Usa rebates cobrados y no devengados. Debe alinearse a la definición oficial.",
    duplicaA: "R-002",
  },
  {
    id: "R-005",
    nombre: "Planilla Marcas Propias Regional",
    plataforma: "Centralizador",
    dominio: "Sales",
    owner: "Analista regional",
    usuariosMes: 42,
    ultimaVisita: "hace 3 días",
    certificado: false,
    destino: "reemplazar",
    motivo: "Mantención manual de maestros. Es el proceso que el Frente 1 automatiza.",
  },
  {
    id: "R-006",
    nombre: "Quiebres en sala por tienda",
    plataforma: "Power BI",
    dominio: "Onsite",
    owner: "Ignacio Ruiz-Tagle",
    usuariosMes: 133,
    ultimaVisita: "hoy",
    certificado: true,
    destino: "mantener",
    motivo: "Operativo, con dueño y uso diario en tiendas.",
  },
  {
    id: "R-007",
    nombre: "Seguimiento surtido MP (v2 final)",
    plataforma: "Power BI",
    dominio: "Onsite",
    owner: "Sin owner asignado",
    usuariosMes: 3,
    ultimaVisita: "hace 4 meses",
    certificado: false,
    destino: "descontinuar",
    motivo: "Tres usuarios en el último trimestre y sin responsable. El nombre lo dice todo.",
  },
  {
    id: "R-008",
    nombre: "Dashboard lealtad y canje",
    plataforma: "Looker Studio",
    dominio: "Loyalty",
    owner: "Camila Ossandón",
    usuariosMes: 64,
    ultimaVisita: "hoy",
    certificado: false,
    destino: "converger",
    motivo: "Define cliente activo distinto al indicador en certificación.",
  },
  {
    id: "R-009",
    nombre: "Penetración MP en clientes identificados",
    plataforma: "Looker Studio",
    dominio: "Loyalty · SVOC",
    owner: "Camila Ossandón",
    usuariosMes: 29,
    ultimaVisita: "hace 5 días",
    certificado: false,
    destino: "reemplazar",
    motivo: "Pasa al portal cuando el indicador termine su certificación.",
  },
  {
    id: "R-010",
    nombre: "Margen por SKU — copia Fernanda",
    plataforma: "Power BI",
    dominio: "Sales",
    owner: "Fernanda Ávila",
    usuariosMes: 1,
    ultimaVisita: "hace 6 semanas",
    certificado: false,
    destino: "descontinuar",
    motivo: "Copia personal de otro tablero. El caso típico que la migración arrastra sin revisar.",
    duplicaA: "R-002",
  },
  {
    id: "R-011",
    nombre: "Share de categoría vs. mercado",
    plataforma: "MicroStrategy",
    dominio: "Sales",
    owner: "Paulina Grez",
    usuariosMes: 47,
    ultimaVisita: "ayer",
    certificado: false,
    destino: "converger",
    motivo: "Mide share en valor y no en unidades equivalentes, como quedó definido en v2.0.",
  },
  {
    id: "R-012",
    nombre: "Informe certificado · Venta vs. plan",
    plataforma: "Portal BI",
    dominio: "Sales",
    owner: "Rodrigo Meza",
    usuariosMes: 0,
    ultimaVisita: "sin publicar",
    certificado: true,
    destino: "mantener",
    motivo: "Nuevo. Reemplaza a R-003 al liberarse el piloto.",
  },
  {
    id: "R-013",
    nombre: "Informe certificado · Margen marca propia",
    plataforma: "Portal BI",
    dominio: "Sales",
    owner: "Paulina Grez",
    usuariosMes: 0,
    ultimaVisita: "sin publicar",
    certificado: true,
    destino: "mantener",
    motivo: "Nuevo. Es la cifra única que reconcilia R-002, R-004 y R-005.",
  },
  {
    id: "R-014",
    nombre: "Reporte semanal dirección (PDF manual)",
    plataforma: "Centralizador",
    dominio: "Sales",
    owner: "Analista regional",
    usuariosMes: 12,
    ultimaVisita: "hace 1 semana",
    certificado: false,
    destino: "reemplazar",
    motivo: "Se arma a mano cada lunes. Es una alerta programada, no un reporte.",
  },
];

export const PLATAFORMAS: Plataforma[] = [
  "Power BI",
  "MicroStrategy",
  "Looker Studio",
  "Centralizador",
  "Portal BI",
];

export function resumenRacionalizacion() {
  return (Object.keys(DESTINOS) as Destino[]).map((d) => ({
    destino: d,
    etiqueta: DESTINOS[d].etiqueta,
    cantidad: REPORTES.filter((r) => r.destino === d).length,
    usuarios: REPORTES.filter((r) => r.destino === d).reduce(
      (a, r) => a + r.usuariosMes,
      0
    ),
  }));
}
