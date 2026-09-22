import { useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { porId, EXPLICACION_ESTADO } from "../data/semantica";
import { Sello } from "./UI";

// El ícono "(i)" junto a un indicador. Funciona con mouse (hover) y con
// teclado/touch (foco o clic), y se renderiza en un portal a document.body
// para que nunca quede cortado por el overflow de una celda de tabla o un
// chip angosto — la posición se calcula en píxeles reales de pantalla, no
// en el flujo normal del documento.

const ANCHO = 288;
const MARGEN = 12;

export function InfoIndicador({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const ind = porId(id);
  const [abierto, setAbierto] = useState(false);
  const [estilo, setEstilo] = useState<CSSProperties | null>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const cierre = useRef<ReturnType<typeof setTimeout>>();

  if (!ind) return null;

  const posicionar = () => {
    const r = boton.current?.getBoundingClientRect();
    if (!r) return;
    const arriba = window.innerHeight - r.bottom < 200;
    const left = Math.max(
      MARGEN,
      Math.min(window.innerWidth - ANCHO - MARGEN, r.left + r.width / 2 - ANCHO / 2)
    );
    setEstilo(
      arriba
        ? { position: "fixed", bottom: window.innerHeight - r.top + 8, left, width: ANCHO }
        : { position: "fixed", top: r.bottom + 8, left, width: ANCHO }
    );
  };

  const abrir = () => {
    if (cierre.current) clearTimeout(cierre.current);
    posicionar();
    setAbierto(true);
  };
  const cerrarConDemora = () => {
    cierre.current = setTimeout(() => setAbierto(false), 140);
  };
  const cancelarCierre = () => {
    if (cierre.current) clearTimeout(cierre.current);
  };

  return (
    <>
      <button
        ref={boton}
        type="button"
        onMouseEnter={abrir}
        onMouseLeave={cerrarConDemora}
        onFocus={abrir}
        onBlur={() => setAbierto(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          abierto ? setAbierto(false) : abrir();
        }}
        aria-label={`Qué significa ${ind.nombre}`}
        aria-expanded={abierto}
        className={`estado inline-flex items-center justify-center w-4 h-4 rounded-full border border-cenco-line text-gris hover:border-cenco hover:text-cenco hover:bg-cenco-soft text-[10px] font-bold leading-none shrink-0 ${className}`}
      >
        i
      </button>

      {abierto &&
        estilo &&
        createPortal(
          <div
            onMouseEnter={cancelarCierre}
            onMouseLeave={cerrarConDemora}
            style={{ ...estilo, zIndex: 70 }}
            className="bg-white border border-cenco-line rounded-card shadow-alto p-4 anim-aparecer"
          >
            <div className="text-[13px] font-semibold text-cenco-deep leading-snug">
              {ind.nombre}
            </div>
            <p className="mt-1.5 text-[12px] text-tuna leading-relaxed">
              {ind.definicion}
            </p>
            <div className="mt-3 pt-3 border-t border-cenco-line">
              <Sello estado={ind.estado} />
              <p className="mt-1.5 text-[11.5px] text-gris leading-relaxed">
                {EXPLICACION_ESTADO[ind.estado]}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
