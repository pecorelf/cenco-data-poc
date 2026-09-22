import { create } from "zustand";
import type { Bandera, Categoria, Mes } from "../data/comercial";
import { USUARIOS, PRESUPUESTO_TOTAL_USUARIO, type Usuario } from "../data/usuarios";
import type { EspecGrafico } from "../components/Graficos";
import type { Notificacion } from "../components/Notificaciones";
import { ALERTAS_SEMILLA, type AlertaConfigurada } from "../data/alertas";
import { cargar, guardar as persistir, type Modo } from "./persistencia";

export type Vista =
  | "home"
  | "certificados"
  | "constructor"
  | "graficos"
  | "sql"
  | "alertas"
  | "avisos"
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

export interface EjecucionSQL {
  id: string;
  sql: string;
  usuario: string;
  creditos: number;
  filas: number;
  cuando: string;
}

export interface ConsultaGuardada {
  id: string;
  nombre: string;
  sql: string;
  creadaPor: string;
  creadaEn: string;
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
  autenticado: boolean;
  chatAbierto: boolean;
  tourActivo: boolean;
  mostrarOrigen: boolean;
  usuario: Usuario;
  bandera: Bandera | "Todas";
  categoria: Categoria | "Todas";
  mes: Mes;
  reportes: ReporteGuardado[];
  cargas: RegistroCarga[];
  consultas: ConsultaGuardada[];
  historialSql: EjecucionSQL[];
  alertas: AlertaConfigurada[];
  presupuestos: Record<string, number>;
  notificaciones: Notificacion[];
  notificacionesAbiertas: boolean;
  graficos: GraficoGuardado[];
  modoGuardado: Modo;
  cargandoGraficos: boolean;
  setVista: (v: Vista) => void;
  iniciarSesion: () => void;
  cerrarSesion: () => void;
  alternarChat: () => void;
  cerrarChat: () => void;
  setTourActivo: (v: boolean) => void;
  alternarOrigen: () => void;
  setUsuario: (id: string) => void;
  setBandera: (b: Bandera | "Todas") => void;
  setCategoria: (c: Categoria | "Todas") => void;
  setMes: (m: Mes) => void;
  guardarReporte: (r: ReporteGuardado) => void;
  registrarCarga: (c: RegistroCarga) => void;
  guardarConsulta: (c: ConsultaGuardada) => void;
  borrarConsulta: (id: string) => void;
  consumirCreditos: (usuarioId: string, creditos: number, entrada: EjecucionSQL) => void;
  agregarAlerta: (a: AlertaConfigurada) => void;
  editarAlerta: (id: string, cambios: Partial<AlertaConfigurada>) => void;
  alternarAlerta: (id: string) => void;
  borrarAlerta: (id: string) => void;
  registrarNotificacion: (n: Notificacion) => void;
  alternarNotificaciones: () => void;
  cerrarNotificaciones: () => void;
  marcarTodasLeidas: () => void;
  guardarGrafico: (g: GraficoGuardado) => void;
  borrarGrafico: (id: string) => void;
  renombrarGrafico: (id: string, nombre: string) => void;
  cargarGraficos: () => Promise<void>;
}

export const useStore = create<Estado>((set) => ({
  vista: "home",
  autenticado: false,
  chatAbierto: false,
  tourActivo: false,
  mostrarOrigen: false,
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
  consultas: [],
  historialSql: [],
  alertas: ALERTAS_SEMILLA,
  presupuestos: Object.fromEntries(USUARIOS.map((u) => [u.id, u.presupuestoConsumido])),
  notificacionesAbiertas: false,
  notificaciones: [
    {
      id: "N-1",
      tipo: "definicion",
      titulo: "margen_bruto_mp pasó a la versión 2.1",
      detalle:
        "Paulina Grez incorporó la merma valorizada al costo. Los informes que la usan ya muestran la cifra nueva.",
      cuando: "hace 2 h",
      leida: false,
    },
    {
      id: "N-2",
      tipo: "incidente",
      titulo: "Retraso en la carga de inventario",
      detalle:
        "gold.operaciones.fact_inventario_tienda quedó con 6 horas de atraso. El quiebre en sala puede estar subestimado.",
      cuando: "hace 5 h",
      leida: false,
    },
    {
      id: "N-3",
      tipo: "alerta",
      titulo: "Margen de Lácteos bajo el umbral que definiste",
      detalle: "Cayó a 21,4% en agosto, bajo el 22% que configuraste como aviso.",
      cuando: "ayer",
      leida: false,
    },
    {
      id: "N-4",
      tipo: "carga",
      titulo: "Carga C-000 procesada con rechazos",
      detalle:
        "plan_regional_ago_final.csv: 84 filas aceptadas y 6 rechazadas por maestro desactualizado.",
      cuando: "hace 3 días",
      leida: true,
    },
    {
      id: "N-5",
      tipo: "freshness",
      titulo: "Venta neta al día",
      detalle: "Última actualización hace 12 minutos, dentro del acuerdo de Near Real Time.",
      cuando: "hoy",
      leida: true,
    },
  ],
  graficos: [],
  modoGuardado: "local",
  cargandoGraficos: true,
  setVista: (vista) => set({ vista }),
  iniciarSesion: () => set({ autenticado: true, vista: "home" }),
  cerrarSesion: () => set({ autenticado: false, chatAbierto: false, vista: "home" }),
  alternarChat: () => set((s) => ({ chatAbierto: !s.chatAbierto })),
  cerrarChat: () => set({ chatAbierto: false }),
  setTourActivo: (v) => set({ tourActivo: v }),
  alternarOrigen: () => set((s) => ({ mostrarOrigen: !s.mostrarOrigen })),
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
  guardarConsulta: (c) => set((s) => ({ consultas: [c, ...s.consultas] })),
  borrarConsulta: (id) =>
    set((s) => ({ consultas: s.consultas.filter((c) => c.id !== id) })),
  consumirCreditos: (usuarioId, creditos, entrada) =>
    set((s) => ({
      presupuestos: {
        ...s.presupuestos,
        [usuarioId]: Math.min(
          PRESUPUESTO_TOTAL_USUARIO,
          (s.presupuestos[usuarioId] ?? 0) + creditos
        ),
      },
      historialSql: [entrada, ...s.historialSql].slice(0, 20),
    })),
  agregarAlerta: (a) => set((s) => ({ alertas: [a, ...s.alertas] })),
  editarAlerta: (id, cambios) =>
    set((s) => ({
      alertas: s.alertas.map((a) => (a.id === id ? { ...a, ...cambios } : a)),
    })),
  registrarNotificacion: (n) => set((s) => ({ notificaciones: [n, ...s.notificaciones] })),
  alternarAlerta: (id) =>
    set((s) => ({
      alertas: s.alertas.map((a) => (a.id === id ? { ...a, activa: !a.activa } : a)),
    })),
  borrarAlerta: (id) =>
    set((s) => ({ alertas: s.alertas.filter((a) => a.id !== id) })),
  alternarNotificaciones: () =>
    set((s) => ({ notificacionesAbiertas: !s.notificacionesAbiertas })),
  cerrarNotificaciones: () => set({ notificacionesAbiertas: false }),
  marcarTodasLeidas: () =>
    set((s) => ({ notificaciones: s.notificaciones.map((n) => ({ ...n, leida: true })) })),
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
