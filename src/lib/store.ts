import { create } from "zustand";
import type { Bandera, Categoria, Mes } from "../data/comercial";
import { USUARIOS, type Usuario } from "../data/usuarios";
import type { EspecGrafico } from "../components/Graficos";
import { cargar, guardar as persistir, type Modo } from "./persistencia";

export type Vista =
  | "certificados"
  | "constructor"
  | "graficos"
  | "interoperabilidad"
  | "cargas";

export interface ReporteGuardado {
  id: string;
  nombre: string;
  creadoPor: string;
  creadoEn: string;
  indicadores: string[];
  estado: "certificado" | "exploratorio";
  descripcion: string;
}

export interface RegistroCarga {
  id: string;
  archivo: string;
  usuario: string;
  fecha: string;
  aceptadas: number;
  rechazadas: number;
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
  chatAbierto: boolean;
  usuario: Usuario;
  bandera: Bandera | "Todas";
  categoria: Categoria | "Todas";
  mes: Mes;
  reportes: ReporteGuardado[];
  cargas: RegistroCarga[];
  graficos: GraficoGuardado[];
  modoGuardado: Modo;
  cargandoGraficos: boolean;
  setVista: (v: Vista) => void;
  alternarChat: () => void;
  cerrarChat: () => void;
  setUsuario: (id: string) => void;
  setBandera: (b: Bandera | "Todas") => void;
  setCategoria: (c: Categoria | "Todas") => void;
  setMes: (m: Mes) => void;
  guardarReporte: (r: ReporteGuardado) => void;
  registrarCarga: (c: RegistroCarga) => void;
  guardarGrafico: (g: GraficoGuardado) => void;
  borrarGrafico: (id: string) => void;
  renombrarGrafico: (id: string, nombre: string) => void;
  cargarGraficos: () => Promise<void>;
}

export const useStore = create<Estado>((set) => ({
  vista: "certificados",
  chatAbierto: false,
  usuario: USUARIOS[0],
  bandera: "Todas",
  categoria: "Todas",
  mes: "Ago",
  reportes: [],
  // Dos cargas previas para que la bitácora no arranque vacía en la demo.
  cargas: [
    {
      id: "C-000",
      archivo: "plan_regional_ago_final.csv",
      usuario: "Sebastián Ortiz",
      fecha: "28-08-2026 17:42",
      aceptadas: 84,
      rechazadas: 6,
    },
    {
      id: "C-00A",
      archivo: "ajuste_maestro_categorias.csv",
      usuario: "Rodrigo Meza",
      fecha: "12-08-2026 09:15",
      aceptadas: 21,
      rechazadas: 0,
    },
  ],
  graficos: [],
  modoGuardado: "local",
  cargandoGraficos: true,
  setVista: (vista) => set({ vista }),
  alternarChat: () => set((s) => ({ chatAbierto: !s.chatAbierto })),
  cerrarChat: () => set({ chatAbierto: false }),
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
  registrarCarga: (c) => set((s) => ({ cargas: [c, ...s.cargas] })),
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
