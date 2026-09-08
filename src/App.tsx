import { useEffect } from "react";
import { useStore, type Vista } from "./lib/store";
import { USUARIOS } from "./data/usuarios";
import Diagnostico from "./views/Diagnostico";
import CapaSemantica from "./views/CapaSemantica";
import Certificados from "./views/Certificados";
import Constructor from "./views/Constructor";
import Catalogo from "./views/Catalogo";
import Interoperabilidad from "./views/Interoperabilidad";
import MisGraficos from "./views/MisGraficos";
import Cuenco from "./views/Cuenco";

const NAV: Array<{
  seccion: string;
  items: Array<{ id: Vista; label: string; desc: string }>;
}> = [
  {
    seccion: "Entender",
    items: [
      { id: "diagnostico", label: "Diagnóstico", desc: "Dónde estamos hoy" },
      { id: "catalogo", label: "Catálogo unificado", desc: "Todo lo que existe" },
    ],
  },
  {
    seccion: "Gobernar",
    items: [
      { id: "semantica", label: "Capa semántica", desc: "Definiciones oficiales" },
      {
        id: "interoperabilidad",
        label: "Portal, Power BI y agente",
        desc: "Una definición, tres motores",
      },
    ],
  },
  {
    seccion: "Consumir",
    items: [
      { id: "certificados", label: "Informes certificados", desc: "Venta, margen, share" },
      { id: "constructor", label: "Informes personalizados", desc: "Construye el tuyo" },
      { id: "cuenco", label: "Cuenco", desc: "Pregunta y cruza datos" },
      { id: "graficos", label: "Mis gráficos", desc: "Lo que has guardado" },
    ],
  },
];

export default function App() {
  const { vista, setVista, usuario, setUsuario, graficos, cargarGraficos } = useStore();

  // Carga inicial de los gráficos del usuario en sesión.
  useEffect(() => {
    void cargarGraficos();
    // Solo al montar: los cambios de sesión los maneja setUsuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-cenco-deep text-white">
        <div className="px-6 h-[68px] flex items-center gap-6">
          <img
            src="/cencosud.webp"
            alt="Cencosud"
            className="h-10 w-auto rounded-control"
          />
          <div className="border-l border-white/20 pl-6">
            <div className="text-[15.5px] font-semibold leading-tight">
              Portal BI &amp; Analytics Unificado 360°
            </div>
            <div className="text-micro text-white/60 leading-tight mt-0.5">
              Marcas Propias &amp; Supermercados Chile
            </div>
          </div>

          <div className="ml-auto flex items-center gap-5">
            <label className="flex items-center gap-2.5">
              <span className="text-micro text-white/60 font-medium">Sesión</span>
              <select
                value={usuario.id}
                onChange={(e) => setUsuario(e.target.value)}
                className="estado bg-white/10 border border-white/20 px-3.5 py-2 text-[13px] text-white hover:bg-white/15 cursor-pointer"
              >
                {USUARIOS.map((u) => (
                  <option key={u.id} value={u.id} className="text-tuna">
                    {u.nombre} · {u.cargo}
                  </option>
                ))}
              </select>
            </label>
            <img
              src="/deloitte-digital.png"
              alt="Deloitte Digital"
              className="h-8 w-auto bg-white rounded-control px-2.5 py-1.5"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className="w-64 shrink-0 overflow-y-auto bg-white border-r border-cenco-line">
          <div className="py-4 px-3 space-y-5">
            {NAV.map((grupo) => (
              <div key={grupo.seccion}>
                <div className="px-4 pb-2 text-micro font-semibold text-gris uppercase tracking-wider">
                  {grupo.seccion}
                </div>
                <ul className="space-y-1">
                  {grupo.items.map((n) => {
                    const activo = vista === n.id;
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => setVista(n.id)}
                          aria-current={activo ? "page" : undefined}
                          className={`estado w-full text-left px-4 py-2.5 rounded-control ${
                            activo
                              ? "bg-cenco text-white shadow-suave"
                              : "text-tuna hover:bg-cenco-soft"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[14px] ${
                                activo ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {n.label}
                            </span>
                            {n.id === "graficos" && graficos.length > 0 && (
                              <span
                                className={`num text-micro font-semibold px-1.5 py-0.5 rounded-full ${
                                  activo ? "bg-white/20" : "bg-naranjo text-white"
                                }`}
                              >
                                {graficos.length}
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-micro mt-0.5 ${
                              activo ? "text-white/70" : "text-gris"
                            }`}
                          >
                            {n.desc}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-6 mt-3 pt-5 border-t border-cenco-line">
            <div className="text-micro text-gris font-medium">
              Alcance heredado de Unity Catalog
            </div>
            <div className="mt-2 text-[12.5px] text-tuna leading-relaxed">
              {usuario.nota}
            </div>
          </div>
        </nav>

        <main className="flex-1 min-w-0 overflow-y-auto">
          {vista === "diagnostico" && <Diagnostico />}
          {vista === "catalogo" && <Catalogo />}
          {vista === "semantica" && <CapaSemantica />}
          {vista === "interoperabilidad" && <Interoperabilidad />}
          {vista === "certificados" && <Certificados />}
          {vista === "constructor" && <Constructor />}
          {vista === "cuenco" && <Cuenco />}
          {vista === "graficos" && <MisGraficos />}
        </main>
      </div>
    </div>
  );
}
