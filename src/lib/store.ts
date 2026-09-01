import { create } from "zustand";
import type { Bandera, Categoria, Mes } from "../data/comercial";
import { USUARIOS, type Usuario } from "../data/usuarios";

export type Vista =
  | "diagnostico"
  | "semantica"
  | "certificados"
  | "constructor"
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

interface Estado {
  vista: Vista;
  usuario: Usuario;
  bandera: Bandera | "Todas";
  categoria: Categoria | "Todas";
  mes: Mes;
  reportes: ReporteGuardado[];
  setVista: (v: Vista) => void;
  setUsuario: (id: string) => void;
  setBandera: (b: Bandera | "Todas") => void;
  setCategoria: (c: Categoria | "Todas") => void;
  setMes: (m: Mes) => void;
  guardarReporte: (r: ReporteGuardado) => void;
}

export const useStore = create<Estado>((set) => ({
  vista: "diagnostico",
  usuario: USUARIOS[0],
  bandera: "Todas",
  categoria: "Todas",
  mes: "Ago",
  reportes: [],
  setVista: (vista) => set({ vista }),
  setUsuario: (id) => {
    const usuario = USUARIOS.find((u) => u.id === id) ?? USUARIOS[0];
    // Al cambiar de usuario, el alcance se re-hereda: si su RLS no cubre el
    // filtro actual, vuelve al alcance permitido.
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
}));

/** Banderas y categorías que el RLS del usuario le permite ver. */
export function alcance(u: Usuario) {
  return {
    banderas: u.banderas === "todas" ? null : u.banderas,
    categorias: u.categorias === "todas" ? null : u.categorias,
  };
}
