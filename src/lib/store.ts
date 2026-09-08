import { create } from "zustand";
import type { Bandera, Categoria, Mes } from "../data/comercial";
import { USUARIOS, type Usuario } from "../data/usuarios";
import type { EspecGrafico } from "../components/Graficos";
import { cargar, guardar as persistir, type Modo } from "./persistencia";

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

interface Estado {
  vista: Vista;
  usuario: Usuario;
  bandera: Bandera | "Todas";
  categoria: Categoria | "Todas";
  mes: Mes;
  reportes: ReporteGuardado[];
  graficos: GraficoGuardado[];
  modoGuardado: Modo;
  cargandoGraficos: boolean;
  setVista: (v: Vista) => void;
  setUsuario: (id: string) => void;
  setBandera: (b: Bandera | "Todas") => void;
  setCategoria: (c: Categoria | "Todas") => void;
  setMes: (m: Mes) => void;
  guardarReporte: (r: ReporteGuardado) => void;
  guardarGrafico: (g: GraficoGuardado) => void;
  borrarGrafico: (id: string) => void;
  renombrarGrafico: (id: string, nombre: string) => void;
  cargarGraficos: () => Promise<void>;
}

export const useStore = create<Estado>((set) => ({
  vista: "diagnostico",
  usuario: USUARIOS[0],
  bandera: "Todas",
  categoria: "Todas",
  mes: "Ago",
  reportes: [],
  graficos: [],
  modoGuardado: "local",
  cargandoGraficos: true,
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
    set({ usuario, bandera, categoria, graficos: [], cargandoGraficos: true });
    void cargar(usuario.id).then(({ graficos, modo }) =>
      set({ graficos, modoGuardado: modo, cargandoGraficos: false })
    );
  },
  setBandera: (bandera) => set({ bandera }),
  setCategoria: (categoria) => set({ categoria }),
  setMes: (mes) => set({ mes }),
  guardarReporte: (r) => set((s) => ({ reportes: [r, ...s.reportes] })),
  guardarGrafico: (g) =>
    set((s) => {
      const graficos = [g, ...s.graficos];
      void persistir(s.usuario.id, graficos).then((modo) => set({ modoGuardado: modo }));
      return { graficos };
    }),
  borrarGrafico: (id) =>
    set((s) => {
      const graficos = s.graficos.filter((g) => g.id !== id);
      void persistir(s.usuario.id, graficos).then((modo) => set({ modoGuardado: modo }));
      return { graficos };
    }),
  renombrarGrafico: (id, nombre) =>
    set((s) => {
      const graficos = s.graficos.map((g) => (g.id === id ? { ...g, nombre } : g));
      void persistir(s.usuario.id, graficos).then((modo) => set({ modoGuardado: modo }));
      return { graficos };
    }),
  cargarGraficos: async () => {
    const { usuario } = useStore.getState();
    set({ cargandoGraficos: true });
    const { graficos, modo } = await cargar(usuario.id);
    set({ graficos, modoGuardado: modo, cargandoGraficos: false });
  },
}));

/** Banderas y categorías que el RLS del usuario le permite ver. */
export function alcance(u: Usuario) {
  return {
    banderas: u.banderas === "todas" ? null : u.banderas,
    categorias: u.categorias === "todas" ? null : u.categorias,
  };
}
