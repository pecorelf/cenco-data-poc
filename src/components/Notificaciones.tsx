import { useEffect, useRef } from "react";
import { useStore } from "../lib/store";
import {
  IconoCampana,
  IconoAlerta,
  IconoIngesta,
  IconoReloj,
  IconoCheckEscudo,
} from "./Iconos";

// Centro de notificaciones y alertas. Vive en la cabecera y no como pestaña:
// es algo que se consulta al pasar, no un lugar donde uno trabaja.

export interface Notificacion {
  id: string;
  tipo: "incidente" | "carga" | "freshness" | "definicion" | "alerta";
  titulo: string;
  detalle: string;
  cuando: string;
  leida: boolean;
}

const ETIQUETA: Record<
  Notificacion["tipo"],
  { texto: string; clase: string; Icono: typeof IconoAlerta }
> = {
  incidente: { texto: "Incidente", clase: "bg-naranjo-soft text-naranjo-deep", Icono: IconoAlerta },
  carga: { texto: "Carga", clase: "bg-cenco-soft text-cenco-deep", Icono: IconoIngesta },
  freshness: { texto: "Frescura", clase: "bg-cenco-soft text-cenco-deep", Icono: IconoReloj },
  definicion: { texto: "Definición", clase: "bg-certif-soft text-certif", Icono: IconoCheckEscudo },
  alerta: { texto: "Mi alerta", clase: "bg-naranjo-soft text-naranjo-deep", Icono: IconoCampana },
};

export default function Notificaciones() {
  const {
    notificaciones,
    notificacionesAbiertas,
    alternarNotificaciones,
    cerrarNotificaciones,
    marcarTodasLeidas,
  } = useStore();

  const ref = useRef<HTMLDivElement>(null);
  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  // Clic fuera y Escape cierran el panel.
  useEffect(() => {
    if (!notificacionesAbiertas) return;
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cerrarNotificaciones();
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && cerrarNotificaciones();
    document.addEventListener("mousedown", fuera);
    window.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      window.removeEventListener("keydown", escape);
    };
  }, [notificacionesAbiertas, cerrarNotificaciones]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={alternarNotificaciones}
        aria-expanded={notificacionesAbiertas}
        aria-label={`Notificaciones${sinLeer ? `, ${sinLeer} sin leer` : ""}`}
        className="estado relative flex items-center justify-center w-10 h-10 rounded-full border border-white/20 hover:bg-white/10"
      >
        <IconoCampana size={18} />
        {sinLeer > 0 && (
          <span className="num absolute -top-1 -right-1 bg-naranjo text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {sinLeer}
          </span>
        )}
      </button>

      {notificacionesAbiertas && (
        <div className="absolute right-0 top-12 z-50 w-[min(400px,calc(100vw-2rem))] bg-white text-tuna border border-cenco-line rounded-card shadow-alto anim-aparecer">
          <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-cenco-line">
            <div>
              <div className="text-[14.5px] font-semibold text-cenco-deep">
                Notificaciones y alertas
              </div>
              <div className="text-micro text-gris">
                {sinLeer ? `${sinLeer} sin leer` : "Todo al día"}
              </div>
            </div>
            {sinLeer > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="estado text-micro font-semibold text-cenco hover:underline underline-offset-4"
              >
                Marcar leídas
              </button>
            )}
          </header>

          <ul className="max-h-[420px] overflow-y-auto divide-y divide-cenco-line">
            {notificaciones.map((n) => {
              const e = ETIQUETA[n.tipo];
              return (
                <li
                  key={n.id}
                  className={`px-5 py-3.5 ${n.leida ? "" : "bg-cenco-soft/35"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-micro font-semibold px-2 py-0.5 rounded-full ${e.clase}`}
                    >
                      <e.Icono size={11} />
                      {e.texto}
                    </span>
                    <span className="text-micro text-gris ml-auto">{n.cuando}</span>
                  </div>
                  <div className="mt-1.5 text-[13.5px] font-medium text-tuna leading-snug">
                    {n.titulo}
                  </div>
                  <p className="mt-1 text-[12.5px] text-gris leading-relaxed">
                    {n.detalle}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="px-5 py-3 border-t border-cenco-line">
            <p className="text-micro text-gris leading-relaxed">
              Las alertas por métrica, condición y frecuencia se configuran por usuario. En
              la demo vienen precargadas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
