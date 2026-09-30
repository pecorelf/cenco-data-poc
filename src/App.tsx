import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAlSubir } from "./lib/motion";
import { useStore, type Vista } from "./lib/store";
import { USUARIOS } from "./data/usuarios";
import Certificados from "./views/Certificados";
import Constructor from "./views/Constructor";
import Cargas from "./views/Cargas";
import BIA from "./components/BIA";
import { LogoBandera } from "./components/LogoBandera";
import { BANDERAS } from "./data/comercial";
import TourGuiado from "./components/TourGuiado";
import Ingreso from "./views/Ingreso";
import Home from "./views/Home";
import ExploradorDatos from "./views/ExploradorDatos";
import Notificaciones from "./components/Notificaciones";
import { ICONO_SECCION, IconoSalir, IconoPregunta, IconoDatabricks, IconoDestellos } from "./components/Iconos";
import MisGraficos from "./views/MisGraficos";
import Alertas from "./views/Alertas";
import Variaciones from "./views/Variaciones";
import Catalogo from "./views/Catalogo";
import Avisos from "./views/Avisos";

const NAV: Array<{ id: Vista; label: string; desc: string; aValidar?: boolean; arte?: boolean }> = [
  { id: "home", label: "Inicio", desc: "Tu asistente y tus accesos" },
  {
    id: "certificados",
    label: "KPIs y Reportes Certificados",
    desc: "Venta, margen, participación",
  },
  {
    id: "constructor",
    label: "Reportería Personalizados",
    desc: "Cruza métricas y dimensiones",
  },
  { id: "graficos", label: "Mis gráficos", desc: "Lo que has guardado" },
  {
    id: "sql",
    label: "Explorador de Datos",
    desc: "SQL, constructor y asistente",
    aValidar: true,
  },
  {
    id: "alertas",
    label: "Mis alertas",
    desc: "Métrica, condición y canal",
    aValidar: true,
  },
  {
    id: "avisos",
    label: "Centro de notificaciones",
    desc: "Incidentes, cargas, frescura",
    aValidar: true,
  },
  {
    id: "cargas",
    label: "Portal de ingesta certificada",
    desc: "Con plantilla y traza",
  },
  { id: "variaciones", label: "¿Por qué cambió?", desc: "Explica una variación", arte: true },
  { id: "catalogo", label: "Catálogo de datos", desc: "Busca antes de pedir", arte: true },
];

export default function App() {
  const {
    vista,
    setVista,
    usuario,
    setUsuario,
    graficos,
    cargarGraficos,
    autenticado,
    cerrarSesion,
    mostrarOrigen,
    alternarOrigen,
  } = useStore();

  // Al cambiar de pantalla se vuelve arriba: si no, se llega a la mitad de
  // la vista nueva con el scroll que traía la anterior.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [vista]);

  // Indicador de sección activa: mide el ítem y se desliza hasta él.
  const listaRef = useRef<HTMLUListElement>(null);
  const [indicador, setIndicador] = useState<{ top: number; alto: number } | null>(null);
  useLayoutEffect(() => {
    // Se mide el botón, no el <li>: el primer ítem de un grupo lleva además
    // el encabezado del grupo, que no debe quedar resaltado.
    const li = listaRef.current?.querySelector<HTMLElement>(`[data-nav="${vista}"]`);
    const boton = li?.querySelector<HTMLElement>("button");
    if (li && boton) setIndicador({ top: li.offsetTop + boton.offsetTop, alto: boton.offsetHeight });
  }, [vista, autenticado]);

  const pulsosGraficos = useAlSubir(graficos.length);

  // Carga inicial de los gráficos del usuario en sesión.
  useEffect(() => {
    void cargarGraficos();
    // Solo al montar: los cambios de sesión los maneja setUsuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!autenticado) return <Ingreso />;

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <header className="bg-cenco text-white">
        <div className="px-6 min-h-[68px] py-2 flex items-center gap-6 flex-wrap">
          <img
            src="/cencosud.webp"
            alt="Cencosud"
            className="h-10 w-auto"
          />
          <div className="border-l border-white/20 pl-6">
            <div className="text-[15.5px] font-semibold leading-tight">
              Portal BI &amp; Analytics Unificado 360°
            </div>
            <div className="text-micro text-white/60 leading-tight mt-0.5">
              Marcas Propias &amp; Supermercados Chile
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4 flex-wrap justify-end">
            <label className="flex items-center gap-2.5">
              <span className="text-micro text-white/60 font-medium shrink-0">Sesión</span>
              <select
                value={usuario.id}
                onChange={(e) => setUsuario(e.target.value)}
                title={`${usuario.nombre} · ${usuario.cargo}`}
                className="estado bg-white/10 border border-white/20 px-3.5 py-2 text-[13px] text-white hover:bg-white/15 cursor-pointer max-w-[190px] truncate"
              >
                {USUARIOS.map((u) => (
                  <option key={u.id} value={u.id} className="text-tuna">
                    {u.nombre} · {u.cargo}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={alternarOrigen}
              aria-pressed={mostrarOrigen}
              title="Mostrar qué es nativo de Databricks y qué construimos a medida"
              className={`estado flex items-center gap-1.5 rounded-full px-3.5 py-2 text-micro font-semibold border ${
                mostrarOrigen
                  ? "bg-naranjo border-naranjo text-white"
                  : "border-white/20 text-white/70 hover:bg-white/10"
              }`}
            >
              <IconoDatabricks size={13} />
              Origen
            </button>
            <Notificaciones />
            <img
              src="/deloitte-digital.png"
              alt="Deloitte Digital"
              className="h-8 w-auto bg-white rounded-control px-2.5 py-1.5"
            />
            <button
              onClick={cerrarSesion}
              className="estado flex items-center gap-1.5 text-micro font-semibold text-white/70 hover:text-white border border-white/20 rounded-full pl-3 pr-3.5 py-2"
            >
              <IconoSalir size={14} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {mostrarOrigen && (
        <div className="bg-papel border-b border-cenco-line px-6 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-micro text-gris">
          <span className="font-semibold text-tuna">
            Marcando qué viene con la plataforma y qué construimos:
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cenco" /> Nativo Databricks — ya viene con la
            plataforma
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-naranjo" /> Construido a medida — ingeniería
            nuestra encima
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-certif" /> Híbrido — el dato es nativo, la
            experiencia es nuestra
          </span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <nav className="w-64 shrink-0 overflow-y-auto bg-white border-r border-cenco-line">
          <ul ref={listaRef} className="relative py-4 px-3 space-y-1">
            {indicador && (
              <span
                aria-hidden
                className="indicador-nav absolute left-3 right-3 top-0 rounded-control bg-cenco-soft"
                style={{ transform: `translateY(${indicador.top}px)`, height: indicador.alto }}
              >
                <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-cenco" />
              </span>
            )}
            {NAV.map((n, i) => {
              const activo = vista === n.id;
              const inicioArte = n.arte && !NAV[i - 1]?.arte;
              const Icono = ICONO_SECCION[n.id];
              return (
                <li key={n.id} data-nav={n.id} className="relative">
                  {inicioArte && (
                    <div className="flex items-center gap-1.5 px-4 pt-4 pb-2 mt-2 border-t border-cenco-line text-micro font-semibold text-naranjo-deep">
                      <IconoDestellos size={12} /> Arte de lo posible
                    </div>
                  )}
                  <button
                    onClick={() => setVista(n.id)}
                    aria-current={activo ? "page" : undefined}
                    className={`estado w-full text-left px-4 py-3 rounded-control flex items-start gap-3 ${
                      activo ? "text-cenco-deep" : "text-tuna hover:bg-cenco-soft/45"
                    }`}
                  >
                    <Icono
                      size={19}
                      className={`shrink-0 mt-0.5 transition-colors duration-200 ${activo ? "text-cenco" : "text-gris"}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[14px] ${activo ? "font-semibold" : "font-medium"}`}
                        >
                          {n.label}
                        </span>
                        {n.aValidar && (
                          <span title="Alcance a validar con el cliente">
                            <IconoPregunta
                              size={13}
                              className="text-cenco/60"
                            />
                          </span>
                        )}
                        {n.id === "graficos" && graficos.length > 0 && (
                          <span
                            key={pulsosGraficos}
                            className={`num text-micro font-semibold px-1.5 py-0.5 rounded-full bg-naranjo text-white ${
                              pulsosGraficos ? "anim-pop" : ""
                            }`}
                          >
                            {graficos.length}
                          </span>
                        )}
                      </div>
                      <div
                        className="text-micro mt-0.5 text-gris"
                      >
                        {n.desc}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mx-6 mt-3 pt-5 border-t border-cenco-line">
            <div className="text-micro text-gris font-medium">
              Alcance heredado de Unity Catalog
            </div>
            <div key={usuario.id} className="mt-2.5 flex items-center gap-1.5 anim-texto">
              {(usuario.banderas === "todas" ? BANDERAS : usuario.banderas).map((b) => (
                <LogoBandera key={b} bandera={b} size={30} />
              ))}
            </div>
            <div className="mt-2 text-[12.5px] text-tuna leading-relaxed">
              {usuario.nota}
            </div>
          </div>
        </nav>

        <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto">
          <div key={vista} className="anim-pantalla">
          {vista === "home" && <Home />}
          {vista === "sql" && <ExploradorDatos />}
          {vista === "alertas" && <Alertas />}
          {vista === "avisos" && <Avisos />}
          {vista === "cargas" && <Cargas />}
          {vista === "certificados" && <Certificados />}
          {vista === "constructor" && <Constructor />}
          {vista === "graficos" && <MisGraficos />}
          {vista === "variaciones" && <Variaciones />}
          {vista === "catalogo" && <Catalogo />}
          </div>
        </main>
      </div>

      <BIA />
      <TourGuiado />
    </div>
  );
}
