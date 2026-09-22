import { useEffect, useRef, useState } from "react";
import { useStore, type Vista } from "../lib/store";
import {
  IconoPlay,
  IconoPausa,
  IconoSiguiente,
  IconoAnterior,
  IconoCerrar,
  IconoDestellos,
  IconoChevronAbajo,
  IconoChevronArriba,
} from "./Iconos";

// Tour autoguiado para la presentación. A propósito solo hace dos cosas:
// cambiar de pantalla (setVista) y cambiar de sesión (setUsuario) — las dos
// acciones que ya se usan a mano en toda la demo y que están probadas. No
// simula arrastrar un chip, no escribe SQL, no abre gráficos: donde hace
// falta interacción real, el paso se detiene y espera un clic humano.

interface Parada {
  vista: Vista;
  titulo: string;
  narracion: string;
  duracionBase: number; // segundos a 1x
  pausarAlLlegar?: boolean;
  accion?: () => void;
}

const PARADAS: Parada[] = [
  {
    vista: "home",
    titulo: "Portal BI Unificado 360°",
    narracion:
      "BIA, el asistente, es la puerta de entrada. Responde con las mismas definiciones que el resto del portal — no es un buscador aparte.",
    duracionBase: 14,
    accion: () => useStore.getState().setUsuario("gg"),
  },
  {
    vista: "certificados",
    titulo: "KPIs y Reportes Certificados",
    narracion:
      "Venta contra plan, margen y participación: los tres reportes que pide el RFP, calculados con la misma definición que usa Power BI.",
    duracionBase: 16,
  },
  {
    vista: "certificados",
    titulo: "El alcance cambia con la sesión",
    narracion:
      "Con Fernanda Ávila, acotada a Lácteos y Congelados en Jumbo y Santa Isabel, los filtros ya no muestran el resto. Lo aplica Unity Catalog, no el portal.",
    duracionBase: 16,
    accion: () => useStore.getState().setUsuario("cat_lacteos"),
  },
  {
    vista: "constructor",
    titulo: "Reportería Personalizados",
    narracion:
      "Arrastra una métrica o una dimensión hasta su casillero. Con dos o más métricas se puede armar un gráfico mixto — Cumplimiento de Plan en línea, con su propio eje. Este es un buen momento para hacerlo en vivo.",
    duracionBase: 24,
    pausarAlLlegar: true,
    accion: () => useStore.getState().setUsuario("gg"),
  },
  {
    vista: "graficos",
    titulo: "Mis gráficos",
    narracion:
      "Cada gráfico guardado conserva la pregunta que lo originó y de qué indicadores salió — se puede auditar después.",
    duracionBase: 12,
  },
  {
    vista: "sql",
    titulo: "Explorador de Datos",
    narracion:
      "SQL, constructor visual o preguntarle a BIA: los tres arman la misma consulta gobernada, con una estimación de consumo antes de ejecutar.",
    duracionBase: 18,
  },
  {
    vista: "alertas",
    titulo: "Mis alertas",
    narracion:
      "Antes de guardar una alerta se ve cómo se habría comportado en los ocho meses de datos disponibles — evita un umbral mal calibrado.",
    duracionBase: 16,
  },
  {
    vista: "avisos",
    titulo: "Centro de notificaciones",
    narracion:
      "Si la alerta ya está incumplida al crearla, el aviso aparece solo, acá — sin esperar a que alguien pregunte.",
    duracionBase: 13,
  },
  {
    vista: "cargas",
    titulo: "Portal de ingesta certificada",
    narracion:
      "El plan regional, que hoy se mantiene a mano en el Centralizador, se valida contra los maestros antes de entrar, y queda registrado quién cargó qué.",
    duracionBase: 16,
  },
  {
    vista: "home",
    titulo: "Una definición, tres motores",
    narracion:
      "Un indicador, una fórmula, un responsable — leído igual desde el portal, desde Power BI y desde BIA.",
    duracionBase: 14,
  },
];

export default function TourGuiado() {
  const [activo, setActivo] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [paso, setPaso] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(true);
  const [velocidad, setVelocidad] = useState<1 | 2 | 3>(1);
  const setTourActivo = useStore((s) => s.setTourActivo);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // BIA solo necesita correrse hacia arriba cuando la barra completa ocupa
  // espacio abajo — no cuando el tour está solo minimizado a la pastilla.
  useEffect(() => {
    setTourActivo(activo && !minimizado);
  }, [activo, minimizado, setTourActivo]);

  const ir = (i: number) => {
    const idx = Math.max(0, Math.min(PARADAS.length - 1, i));
    setPaso(idx);
    const p = PARADAS[idx];
    useStore.getState().setVista(p.vista);
    p.accion?.();
    if (p.pausarAlLlegar) setReproduciendo(false);
  };

  const iniciar = () => {
    // Arranca siempre desde un estado conocido, sin importar qué estaba
    // abierto antes: sesión completa y BIA cerrado.
    useStore.getState().setUsuario("gg");
    useStore.getState().cerrarChat();
    setActivo(true);
    setMinimizado(false);
    setReproduciendo(true);
    setPaso(0);
    useStore.getState().setVista(PARADAS[0].vista);
  };

  const salir = () => {
    setActivo(false);
    setMinimizado(false);
    if (timer.current) clearTimeout(timer.current);
  };

  // Ocultar la barra pausa a la vez: así nunca cambia de pantalla mientras
  // no se está mirando el contador. Volver a mostrarla no la reanuda sola
  // — hay que darle play, a propósito.
  const minimizar = () => {
    setMinimizado(true);
    setReproduciendo(false);
  };

  useEffect(() => {
    if (!activo || !reproduciendo) return;
    const ms = (PARADAS[paso].duracionBase * 1000) / velocidad;
    timer.current = setTimeout(() => {
      if (paso < PARADAS.length - 1) ir(paso + 1);
      else setReproduciendo(false);
    }, ms);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, reproduciendo, paso, velocidad]);

  if (!activo) {
    return (
      <button
        onClick={iniciar}
        className="estado fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-white border border-cenco-line text-cenco-deep rounded-full pl-4 pr-5 py-2.5 shadow-alto hover:border-cenco/50"
      >
        <IconoDestellos size={14} className="text-naranjo" />
        <span className="text-[13px] font-semibold">Tour guiado</span>
      </button>
    );
  }

  if (minimizado) {
    return (
      <button
        onClick={() => setMinimizado(false)}
        className="estado fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 bg-cenco-deep text-white rounded-full pl-4 pr-4 py-2.5 shadow-alto hover:bg-cenco border border-white/10"
      >
        <IconoChevronArriba size={13} />
        <span className="text-[12.5px] font-semibold">
          Tour · paso {paso + 1} de {PARADAS.length}
        </span>
        <span className="text-[12.5px] text-white/60">— mostrar</span>
      </button>
    );
  }

  const p = PARADAS[paso];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-cenco-deep text-white border-t border-white/10 shadow-alto">
      <div className="px-6 py-3.5 max-w-[1200px] mx-auto flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 text-micro text-white/55 font-semibold uppercase tracking-wider">
            <span>
              Paso {paso + 1} de {PARADAS.length}
            </span>
            {!reproduciendo && <span className="text-naranjo">· en pausa</span>}
          </div>
          <div className="text-[14px] font-semibold leading-snug mt-0.5">{p.titulo}</div>
          <p className="text-[12.5px] text-white/75 leading-relaxed mt-0.5 max-w-[64ch]">
            {p.narracion}
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-1.5">
          {PARADAS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                ir(i);
                setReproduciendo(false);
              }}
              aria-label={`Ir al paso ${i + 1}`}
              className={`estado w-2 h-2 rounded-full ${
                i === paso ? "bg-naranjo" : "bg-white/25 hover:bg-white/45"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              ir(paso - 1);
              setReproduciendo(false);
            }}
            disabled={paso === 0}
            className="estado w-8 h-8 rounded-full border border-white/20 flex items-center justify-center disabled:opacity-30 hover:bg-white/10"
            aria-label="Paso anterior"
          >
            <IconoAnterior size={13} />
          </button>
          <button
            onClick={() => setReproduciendo((r) => !r)}
            className="estado w-9 h-9 rounded-full bg-naranjo flex items-center justify-center hover:bg-naranjo-deep"
            aria-label={reproduciendo ? "Pausar" : "Reproducir"}
          >
            {reproduciendo ? (
              <IconoPausa size={14} />
            ) : (
              <IconoPlay size={13} className="ml-0.5" />
            )}
          </button>
          <button
            onClick={() => {
              const siguiente = paso + 1 < PARADAS.length;
              ir(paso + 1);
              setReproduciendo(siguiente && reproduciendo);
            }}
            disabled={paso === PARADAS.length - 1}
            className="estado w-8 h-8 rounded-full border border-white/20 flex items-center justify-center disabled:opacity-30 hover:bg-white/10"
            aria-label="Paso siguiente"
          >
            <IconoSiguiente size={13} />
          </button>

          <div className="flex items-center bg-white/10 rounded-full p-0.5 ml-1">
            {([1, 2, 3] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVelocidad(v)}
                className={`estado px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                  velocidad === v ? "bg-white text-cenco-deep" : "text-white/70 hover:text-white"
                }`}
              >
                {v}×
              </button>
            ))}
          </div>

          <button
            onClick={minimizar}
            className="estado ml-1 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10"
            aria-label="Minimizar la barra del tour"
            title="Ocultar la barra y ver la pantalla completa"
          >
            <IconoChevronAbajo size={14} />
          </button>
          <button
            onClick={salir}
            className="estado w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10"
            aria-label="Salir del tour"
          >
            <IconoCerrar size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
