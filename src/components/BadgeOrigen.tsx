import { useStore } from "../lib/store";
import { IconoDatabricks, IconoDestellos, IconoCapas } from "./Iconos";

// Marca, panel por panel, qué vendría con la plataforma y qué es ingeniería
// nuestra. Solo se renderiza cuando alguien activa el interruptor "Origen"
// en la cabecera — por defecto la demo queda limpia, y esto se reserva para
// el momento en que la conversación es exactamente sobre esto.

export type Origen = "nativo" | "custom" | "hibrido";

const ORIGEN: Record<
  Origen,
  { texto: string; clase: string; Icono: typeof IconoDatabricks }
> = {
  nativo: {
    texto: "Nativo Databricks",
    clase: "bg-cenco-soft text-cenco-deep border-cenco/25",
    Icono: IconoDatabricks,
  },
  custom: {
    texto: "Construido a medida",
    clase: "bg-naranjo-soft text-naranjo-deep border-naranjo/30",
    Icono: IconoDestellos,
  },
  hibrido: {
    texto: "Híbrido",
    clase: "bg-certif-soft text-certif border-certif/25",
    Icono: IconoCapas,
  },
};

export function BadgeOrigen({
  tipo,
  detalle,
}: {
  tipo: Origen;
  /** Qué feature específica de Databricks lo resolvería, o qué es lo que agregamos. */
  detalle: string;
}) {
  const mostrarOrigen = useStore((s) => s.mostrarOrigen);
  if (!mostrarOrigen) return null;

  const o = ORIGEN[tipo];
  return (
    <span
      title={detalle}
      className={`inline-flex items-center gap-1.5 border rounded-full pl-2 pr-2.5 py-1 text-micro font-semibold anim-aparecer ${o.clase}`}
    >
      <o.Icono size={11} />
      {o.texto}
    </span>
  );
}
