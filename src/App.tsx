import { useStore, type Vista } from "./lib/store";
import { USUARIOS } from "./data/usuarios";
import Diagnostico from "./views/Diagnostico";
import CapaSemantica from "./views/CapaSemantica";
import Certificados from "./views/Certificados";
import Constructor from "./views/Constructor";
import Cuenco from "./views/Cuenco";

const NAV: Array<{ id: Vista; label: string; desc: string }> = [
  { id: "diagnostico", label: "Diagnóstico", desc: "Dónde estamos hoy" },
  { id: "semantica", label: "Capa semántica", desc: "Definiciones oficiales" },
  { id: "certificados", label: "Informes certificados", desc: "Venta, margen, share" },
  { id: "constructor", label: "Informes personalizados", desc: "Construye el tuyo" },
  { id: "cuenco", label: "Cuenco", desc: "Pregunta en lenguaje natural" },
];

export default function App() {
  const { vista, setVista, usuario, setUsuario } = useStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cabecera */}
      <header className="bg-cenco-deep text-white">
        <div className="px-6 h-16 flex items-center gap-6">
          <img
            src="/cencosud.webp"
            alt="Cencosud"
            className="h-9 w-auto rounded-sm"
          />
          <div className="border-l border-white/25 pl-6">
            <div className="text-[15px] font-medium leading-tight">
              Portal BI &amp; Analytics Unificado 360°
            </div>
            <div className="text-micro text-white/60 leading-tight">
              Marcas Propias &amp; Supermercados Chile
            </div>
          </div>

          <div className="ml-auto flex items-center gap-5">
            <label className="flex items-center gap-2">
              <span className="text-micro text-white/60">Sesión</span>
              <select
                value={usuario.id}
                onChange={(e) => setUsuario(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-sm px-3 py-1.5 text-[13px] text-white"
              >
                {USUARIOS.map((u) => (
                  <option key={u.id} value={u.id} className="text-tinta">
                    {u.nombre} · {u.cargo}
                  </option>
                ))}
              </select>
            </label>
            <img
              src="/deloitte-digital.png"
              alt="Deloitte Digital"
              className="h-7 w-auto bg-white rounded-sm px-2 py-1"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Navegación */}
        <nav className="w-60 shrink-0 bg-white border-r border-cenco-line">
          <ul className="py-3">
            {NAV.map((n) => {
              const activo = vista === n.id;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => setVista(n.id)}
                    aria-current={activo ? "page" : undefined}
                    className={`w-full text-left px-5 py-3 border-l-[3px] transition-colors ${
                      activo
                        ? "border-cenco bg-cenco-soft"
                        : "border-transparent hover:bg-papel"
                    }`}
                  >
                    <div
                      className={`text-[14px] ${
                        activo ? "font-medium text-cenco-deep" : "text-tinta"
                      }`}
                    >
                      {n.label}
                    </div>
                    <div className="text-micro text-gris">{n.desc}</div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mx-5 mt-2 pt-4 border-t border-cenco-line">
            <div className="text-micro text-gris leading-relaxed">
              Tu alcance se hereda de Unity Catalog.
            </div>
            <div className="mt-2 text-[12.5px] text-tinta leading-snug">
              {usuario.nota}
            </div>
          </div>
        </nav>

        {/* Contenido */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {vista === "diagnostico" && <Diagnostico />}
          {vista === "semantica" && <CapaSemantica />}
          {vista === "certificados" && <Certificados />}
          {vista === "constructor" && <Constructor />}
          {vista === "cuenco" && <Cuenco />}
        </main>
      </div>
    </div>
  );
}
