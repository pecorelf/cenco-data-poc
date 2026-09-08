import { create } from "zustand";
import type { Bandera, Categoria, Mes } from "../data/comercial";
import { USUARIOS, type Usuario } from "../data/usuarios";
import type { EspecGrafico } from "../components/Graficos";

export type Vista =
  | "diagnostico"
  | "catalogo"
  | "semantica"
  | "interoperabilidad"
  | "certificados"
  | "constructor"
  | "graficos"
  | "cuenco";

export interface ReporteGuardado {
  id: string;
  nombre: string;
  creadoPor: string;
  creadoEn: string;
  indicadores: string[];
  estado: "certificado" | "exploratorio";
  descripcion: string;
}

export interface GraficoGuardado {
  id: string;
  nombre: string;
  creadoPor: string;
  creadoEn: string;
  pregunta: string;
  espec: EspecGrafico;
  certificado: boolean;
}

const CLAVE = "cenco.misGraficos.v1";

function leerGraficos(): GraficoGuardado[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as GraficoGuardado[]) : [];
  } catch {
    return [];
  }
}

function escribirGraficos(g: GraficoGuardado[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(g));
  } catch {
    /* cuota llena o almacenamiento bloqueado: la sesión sigue funcionando */
  }
}

interface Estado {
  vista: Vista;
  usuario: Usuario;
  bandera: Bandera | "Todas";
  categoria: Categoria | "Todas";
  mes: Mes;
  reportes: ReporteGuardado[];
  graficos: GraficoGuardado[];
  setVista: (v: Vista) => void;
  setUsuario: (id: string) => void;
  setBandera: (b: Bandera | "Todas") => void;
  setCategoria: (c: Categoria | "Todas") => void;
  setMes: (m: Mes) => void;
  guardarReporte: (r: ReporteGuardado) => void;
  guardarGrafico: (g: GraficoGuardado) => void;
  borrarGrafico: (id: string) => void;
  renombrarGrafico: (id: string, nombre: string) => void;
}

export const useStore = create<Estado>((set) => ({
  vista: "diagnostico",
  usuario: USUARIOS[0],
  bandera: "Todas",
  categoria: "Todas",
  mes: "Ago",
  reportes: [],
  graficos: leerGraficos(),
  setVista: (vista) => set({ vista }),
  setUsuario: (id) => {
    const usuario = USUARIOS.find((u) => u.id === id) ?? USUARIOS[0];
    // El alcance se re-hereda desde Unity Catalog al cambiar de sesión.
    const bandera =
      usuario.banderas === "todas" ? "Todas" : (usuario.banderas[0] as Bandera);
    const categoria =
      usuario.categorias === "todas"
        ? "Todas"
        : (usuario.categorias[0] as Categoria);
    set({ usuario, bandera, categoria });
  },
  setBandera: (bandera) => set({ bandera }),
  setCategoria: (categoria) => set({ categoria }),
  setMes: (mes) => set({ mes }),
  guardarReporte: (r) => set((s) => ({ reportes: [r, ...s.reportes] })),
  guardarGrafico: (g) =>
    set((s) => {
      const graficos = [g, ...s.graficos];
      escribirGraficos(graficos);
      return { graficos };
    }),
  borrarGrafico: (id) =>
    set((s) => {
      const graficos = s.graficos.filter((g) => g.id !== id);
      escribirGraficos(graficos);
      return { graficos };
    }),
  renombrarGrafico: (id, nombre) =>
    set((s) => {
      const graficos = s.graficos.map((g) => (g.id === id ? { ...g, nombre } : g));
      escribirGraficos(graficos);
      return { graficos };
    }),
}));

/** Banderas y categorías que el RLS del usuario le permite ver. */
export function alcance(u: Usuario) {
  return {
    banderas: u.banderas === "todas" ? null : u.banderas,
    categorias: u.categorias === "todas" ? null : u.categorias,
  };
}
