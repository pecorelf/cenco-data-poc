import type { SVGProps } from "react";

// Íconos de línea, dibujados a mano: mismo trazo (1.75), mismas puntas
// redondeadas, mismo viewBox 24×24. No es una librería importada — así el
// estilo es siempre el mismo y el bundle no carga cientos de símbolos que
// nunca se usan.

type Props = SVGProps<SVGSVGElement> & { size?: number };

function base(children: React.ReactNode, { size = 18, ...p }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconoInicio = (p: Props) =>
  base(
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </>,
    p
  );

export const IconoReportes = (p: Props) =>
  base(
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </>,
    p
  );

export const IconoSliders = (p: Props) =>
  base(
    <>
      <path d="M5 7h14M5 12h9M5 17h5" />
      <circle cx="16" cy="7" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="8" cy="17" r="1.6" fill="currentColor" stroke="none" />
    </>,
    p
  );

export const IconoMarcador = (p: Props) =>
  base(<path d="M7 4h10v16l-5-3.4L7 20V4Z" />, p);

export const IconoTerminal = (p: Props) =>
  base(
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M7 9.5 10 12l-3 2.5M12.5 15h4.5" />
    </>,
    p
  );

export const IconoIngesta = (p: Props) =>
  base(
    <>
      <path d="M12 4v11M8 11l4 4 4-4" />
      <path d="M5 17.5v1.8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1.8" />
    </>,
    p
  );

export const IconoCampana = (p: Props) =>
  base(
    <>
      <path d="M12 3a5.5 5.5 0 0 0-5.5 5.5v3.2L5 15h14l-1.5-3.3V8.5A5.5 5.5 0 0 0 12 3Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </>,
    p
  );

export const IconoChat = (p: Props) =>
  base(
    <>
      <path d="M4 12a8 8 0 1 1 3.2 6.4L4 19.5l1.1-3.3A7.96 7.96 0 0 1 4 12Z" />
      <circle cx="9" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>,
    p
  );

export const IconoCheck = (p: Props) => base(<path d="M5 12.5 9.5 17 19 6.5" />, p);

export const IconoCheckEscudo = (p: Props) =>
  base(
    <>
      <path d="M12 3 4 6v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V6l-8-3Z" />
      <path d="M8.5 12 11 14.5 15.5 9.5" />
    </>,
    p
  );

export const IconoReloj = (p: Props) =>
  base(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>,
    p
  );

export const IconoAlerta = (p: Props) =>
  base(
    <>
      <path d="M12 4 3 19.5h18L12 4Z" />
      <path d="M12 10.5v3.2" />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
    </>,
    p
  );

export const IconoGlobo = (p: Props) =>
  base(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.2 2.2 3.3 5 3.3 8s-1.1 5.8-3.3 8c-2.2-2.2-3.3-5-3.3-8s1.1-5.8 3.3-8Z" />
    </>,
    p
  );

export const IconoCapas = (p: Props) =>
  base(
    <>
      <path d="M12 4 4 8l8 4 8-4-8-4Z" />
      <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
    </>,
    p
  );

export const IconoCarpeta = (p: Props) =>
  base(<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5H10l2 2.5h6.5A1.5 1.5 0 0 1 20 9v8.5A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11Z" />, p);

export const IconoInsignia = (p: Props) =>
  base(
    <>
      <circle cx="12" cy="10" r="6.2" />
      <path d="M9 15.5 8 20l4-2 4 2-1-4.5" />
      <path d="M9.3 10 11 11.8l3.4-3.6" />
    </>,
    p
  );

export const IconoDescargar = (p: Props) =>
  base(
    <>
      <path d="M12 4v10.5M8 11l4 4 4-4" />
      <path d="M5 17.5v1.8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1.8" />
    </>,
    p
  );

export const IconoSubir = (p: Props) =>
  base(
    <>
      <path d="M7 15.5a4 4 0 0 1 1-7.9 5 5 0 0 1 9.6-1.6A4.5 4.5 0 0 1 17 15.5" />
      <path d="M12 20v-8M9.2 14.8 12 12l2.8 2.8" />
    </>,
    p
  );

export const IconoPlay = (p: Props) => base(<path d="M7 5.5v13l11-6.5-11-6.5Z" />, p);

export const IconoLupa = (p: Props) =>
  base(
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m19.5 19.5-4.3-4.3" />
    </>,
    p
  );

export const IconoDestellos = (p: Props) =>
  base(
    <>
      <path d="M11 3.5c.5 2.6 1.6 3.7 4.2 4.2-2.6.5-3.7 1.6-4.2 4.2-.5-2.6-1.6-3.7-4.2-4.2 2.6-.5 3.7-1.6 4.2-4.2Z" />
      <path d="M17.5 13.5c.3 1.4.9 2 2.3 2.3-1.4.3-2 .9-2.3 2.3-.3-1.4-.9-2-2.3-2.3 1.4-.3 2-.9 2.3-2.3Z" />
    </>,
    p
  );

export const IconoPapelera = (p: Props) =>
  base(
    <>
      <path d="M5 7h14M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      <path d="M7 7v11.3A1.7 1.7 0 0 0 8.7 20h6.6a1.7 1.7 0 0 0 1.7-1.7V7" />
      <path d="M10.3 11v5.5M13.7 11v5.5" />
    </>,
    p
  );

export const IconoLapiz = (p: Props) =>
  base(
    <>
      <path d="M14.5 5.5 18.5 9.5 8 20H4v-4L14.5 5.5Z" />
      <path d="M12.5 7.5 16.5 11.5" />
    </>,
    p
  );

export const IconoCerrar = (p: Props) => base(<path d="M6 6 18 18M18 6 6 18" />, p);

export const IconoMas = (p: Props) => base(<path d="M12 5.5v13M5.5 12h13" />, p);

export const IconoFiltro = (p: Props) =>
  base(<path d="M4 5.5h16L14 13v5l-4 2v-7L4 5.5Z" />, p);

export const IconoReloj2 = IconoReloj;

export const IconoFilas = (p: Props) =>
  base(
    <>
      <rect x="4" y="5" width="16" height="14" rx="1.3" />
      <path d="M4 10h16M4 14.5h16" />
    </>,
    p
  );

export const IconoMoneda = (p: Props) =>
  base(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v9M14.7 9.7c-.5-.8-1.4-1.3-2.7-1.3-1.7 0-2.8.9-2.8 2s1 1.7 2.8 2c1.8.3 2.8.9 2.8 2s-1.1 2-2.8 2c-1.3 0-2.2-.5-2.7-1.3" />
    </>,
    p
  );

export const IconoServidor = (p: Props) =>
  base(
    <>
      <rect x="4" y="4.5" width="16" height="6" rx="1.3" />
      <rect x="4" y="13.5" width="16" height="6" rx="1.3" />
      <path d="M7.5 7.5h.01M7.5 16.5h.01" />
    </>,
    p
  );

export const IconoRayo = (p: Props) => base(<path d="M13 3 5 14h5.5L11 21l8-11.5h-5.5L13 3Z" />, p);

export const IconoSpinner = ({ size = 16, ...p }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className="animate-spin"
    aria-hidden
    {...p}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const IconoSalir = (p: Props) =>
  base(
    <>
      <path d="M9 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3" />
      <path d="M13.5 8 17.5 12l-4 4M17 12H9.5" />
    </>,
    p
  );

export const IconoPregunta = (p: Props) =>
  base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.3a2.4 2.4 0 1 1 3.6 2.1c-.8.5-1.2 1-1.2 1.9" />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
    </>,
    p
  );

export const IconoIndicador = (p: Props) =>
  base(
    <>
      <path d="M4.5 15.5a7.5 7.5 0 0 1 15 0" />
      <path d="M12 15.5 15.5 11" />
      <path d="M4.5 15.5h15" />
    </>,
    p
  );

export const IconoPausa = (p: Props) =>
  base(
    <>
      <rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none" />
    </>,
    p
  );

export const IconoSiguiente = (p: Props) =>
  base(
    <>
      <path d="m7 5.5 9 6.5-9 6.5V5.5Z" />
      <path d="M17.5 5.5v13" />
    </>,
    p
  );

export const IconoAnterior = (p: Props) =>
  base(
    <>
      <path d="m17 5.5-9 6.5 9 6.5V5.5Z" />
      <path d="M6.5 5.5v13" />
    </>,
    p
  );

export const IconoChevronAbajo = (p: Props) => base(<path d="m6 9 6 6 6-6" />, p);

export const IconoChevronArriba = (p: Props) => base(<path d="m6 15 6-6 6 6" />, p);

export const IconoDatabricks = (p: Props) =>
  base(
    <>
      <path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z" />
      <path d="m4 13 8 4.5 8-4.5" />
      <path d="M4 8.5v4.5M20 8.5v4.5" />
    </>,
    p
  );

/** Ícono por identificador de sección, para reutilizar el mismo símbolo en
 * el nav, en las tarjetas del Inicio y en los módulos del login. Un solo
 * mapeo evita que cada pantalla invente su propio símbolo para lo mismo. */
export const ICONO_SECCION = {
  home: IconoInicio,
  certificados: IconoReportes,
  constructor: IconoSliders,
  graficos: IconoMarcador,
  sql: IconoLupa,
  alertas: IconoIndicador,
  avisos: IconoCampana,
  cargas: IconoIngesta,
} as const;
