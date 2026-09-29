import { LOGO_BANDERA } from "../data/logosBanderas";

/** Logo oficial de una bandera. Si el nombre no es una bandera, no dibuja nada. */
export function LogoBandera({
  bandera,
  size = 28,
  className = "",
}: {
  bandera: string;
  size?: number;
  className?: string;
}) {
  const src = LOGO_BANDERA[bandera];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={bandera}
      title={bandera}
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}

export const esBandera = (nombre: string) => nombre in LOGO_BANDERA;
