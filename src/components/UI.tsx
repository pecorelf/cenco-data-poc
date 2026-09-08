import type { ReactNode } from "react";
import type { EstadoIndicador } from "../data/semantica";
import { BANDERAS, CATEGORIAS, MESES } from "../data/comercial";
import { useStore, alcance } from "../lib/store";
import { IconoCheckEscudo, IconoReloj, IconoAlerta, IconoPregunta } from "./Iconos";

export function Encabezado({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada: string;
  children?: ReactNode;
}) {
  return (
    <div className="px-8 pt-8 pb-6 bg-white border-b border-cenco-line">
      <h1 className="text-[27px] font-semibold text-cenco-deep leading-tight tracking-[-0.01em]">
        {titulo}
      </h1>
      <p className="mt-2 text-[14px] text-gris max-w-[70ch] leading-relaxed">
        {bajada}
      </p>
      {children}
    </div>
  );
}

const SELLO: Record<EstadoIndicador, { texto: string; clase: string; Icono: typeof IconoCheckEscudo }> = {
  certificado: {
    texto: "Certificado",
    clase: "bg-certif-soft text-certif border-certif/25",
    Icono: IconoCheckEscudo,
  },
  en_certificacion: {
    texto: "En certificación",
    clase: "bg-cenco-soft text-cenco-deep border-cenco/25",
    Icono: IconoReloj,
  },
  exploratorio: {
    texto: "Sin certificar",
    clase: "bg-naranjo-soft text-naranjo-deep border-naranjo/30",
    Icono: IconoAlerta,
  },
};

// El ícono cambia de forma según el estado, no solo el color: así se lee
// igual de claro para alguien con dificultad para distinguir colores, y
// reconocer "certificado" no depende de memorizar qué tono es cuál.
export function Sello({ estado }: { estado: EstadoIndicador }) {
  const s = SELLO[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full pl-2 pr-2.5 py-1 text-micro font-semibold ${s.clase}`}
    >
      <s.Icono size={12} />
      {s.texto}
    </span>
  );
}

type Variante = "solido" | "contorno" | "sutil";

export function Boton({
  children,
  onClick,
  variante = "solido",
  disabled,
  ancho,
  tipo = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: Variante;
  disabled?: boolean;
  ancho?: boolean;
  tipo?: "button" | "submit";
}) {
  const base =
    "estado inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none";
  const v =
    variante === "solido"
      ? "bg-cenco text-white shadow-suave hover:bg-cenco-deep hover:shadow-alto"
      : variante === "contorno"
      ? "border border-cenco/45 text-cenco bg-white hover:bg-cenco-soft hover:border-cenco"
      : "text-cenco hover:bg-cenco-soft";
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${v} ${ancho ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

/**
 * Callout para módulos cuyo alcance todavía se está validando con el cliente.
 * No es un error ni una limitación técnica: es una señal honesta de que la
 * pantalla es un punto de partida para la conversación, no una entrega cerrada.
 */
export function NotaDiscovery({
  titulo = "Para validar en la sesión con el equipo de BI",
  preguntas,
}: {
  titulo?: string;
  preguntas: string[];
}) {
  return (
    <div className="border border-cenco/25 bg-cenco-soft rounded-card px-5 py-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-cenco-deep">
        <IconoPregunta size={15} />
        {titulo}
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {preguntas.map((p) => (
          <li key={p} className="text-[13px] text-tuna leading-relaxed pl-4 relative">
            <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-cenco" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Cifra({
  valor,
  unidad,
  etiqueta,
  tono = "neutro",
  icono: Icono,
}: {
  valor: ReactNode;
  unidad?: string;
  etiqueta: string;
  tono?: "neutro" | "positivo" | "alerta";
  icono?: (p: { size?: number; className?: string }) => ReactNode;
}) {
  const color =
    tono === "positivo"
      ? "text-certif"
      : tono === "alerta"
      ? "text-naranjo-deep"
      : "text-cenco-deep";
  return (
    <div>
      {Icono && <Icono size={16} className="text-gris" />}
      <div className={`num text-[31px] font-semibold leading-none ${color} ${Icono ? "mt-1.5" : ""}`}>
        {valor}
        {unidad && (
          <span className="text-[16px] font-normal ml-0.5 text-gris">{unidad}</span>
        )}
      </div>
      <div className="mt-2 text-[12.5px] text-gris">{etiqueta}</div>
    </div>
  );
}

export function Panel({
  titulo,
  children,
  accion,
}: {
  titulo?: string;
  children: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <section className="bg-white border border-cenco-line rounded-card shadow-suave overflow-hidden">
      {titulo && (
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-cenco-line">
          <h2 className="text-[14.5px] font-semibold text-cenco-deep">{titulo}</h2>
          {accion}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

const SELECT =
  "estado border border-cenco-line bg-white px-3.5 py-2 text-[13.5px] text-tuna hover:border-cenco/50 cursor-pointer";

export function Filtros() {
  const { usuario, bandera, categoria, mes, setBandera, setCategoria, setMes } =
    useStore();
  const { banderas, categorias } = alcance(usuario);
  const opcionesBandera = banderas ?? BANDERAS;
  const opcionesCategoria = categorias ?? CATEGORIAS;

  return (
    <div className="mt-6 flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-micro text-gris font-medium">Bandera</span>
        <select
          className={SELECT}
          value={bandera}
          onChange={(e) => setBandera(e.target.value as never)}
        >
          {!banderas && <option value="Todas">Todas</option>}
          {opcionesBandera.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-micro text-gris font-medium">Categoría</span>
        <select
          className={SELECT}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as never)}
        >
          {!categorias && <option value="Todas">Todas</option>}
          {opcionesCategoria.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-micro text-gris font-medium">Mes</span>
        <select
          className={SELECT}
          value={mes}
          onChange={(e) => setMes(e.target.value as never)}
        >
          {MESES.map((m) => (
            <option key={m} value={m}>
              {m} 2026
            </option>
          ))}
        </select>
      </label>

      {(banderas || categorias) && (
        <p className="text-micro text-gris pb-2 max-w-[40ch] leading-relaxed">
          Las opciones que no aparecen quedan fuera del alcance que Unity Catalog
          asignó a {usuario.nombre}.
        </p>
      )}
    </div>
  );
}

export const clp = (n: number) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: 0 });
