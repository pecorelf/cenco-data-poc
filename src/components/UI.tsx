import type { ReactNode } from "react";
import type { EstadoIndicador } from "../data/semantica";
import { BANDERAS, CATEGORIAS, MESES } from "../data/comercial";
import { useStore, alcance } from "../lib/store";

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
    <div className="px-8 pt-7 pb-5 bg-white border-b border-cenco-line">
      <h1 className="text-[26px] font-semibold text-cenco-deep leading-tight">
        {titulo}
      </h1>
      <p className="mt-1.5 text-[14px] text-gris max-w-[68ch] leading-relaxed">
        {bajada}
      </p>
      {children}
    </div>
  );
}

const SELLO: Record<
  EstadoIndicador,
  { texto: string; clase: string }
> = {
  certificado: {
    texto: "Certificado",
    clase: "bg-certifsoft text-certif border-certif/30",
  },
  en_certificacion: {
    texto: "En certificación",
    clase: "bg-cenco-soft text-cenco-deep border-cenco/30",
  },
  exploratorio: {
    texto: "Sin certificar",
    clase: "bg-orange-50 text-naranjo border-naranjo/40",
  },
};

export function Sello({ estado }: { estado: EstadoIndicador }) {
  const s = SELLO[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-sm px-2 py-0.5 text-micro font-medium ${s.clase}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
      {s.texto}
    </span>
  );
}

export function Cifra({
  valor,
  unidad,
  etiqueta,
  tono = "neutro",
}: {
  valor: string | number;
  unidad?: string;
  etiqueta: string;
  tono?: "neutro" | "positivo" | "alerta";
}) {
  const color =
    tono === "positivo"
      ? "text-certif"
      : tono === "alerta"
      ? "text-naranjo"
      : "text-cenco-deep";
  return (
    <div>
      <div className={`num text-[30px] font-semibold leading-none ${color}`}>
        {valor}
        {unidad && (
          <span className="text-[16px] font-normal ml-0.5 text-gris">
            {unidad}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[12.5px] text-gris">{etiqueta}</div>
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
    <section className="bg-white border border-cenco-line">
      {titulo && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-cenco-line">
          <h2 className="text-[14px] font-medium text-cenco-deep">{titulo}</h2>
          {accion}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Filtros que respetan el RLS del usuario en sesión. */
export function Filtros() {
  const { usuario, bandera, categoria, mes, setBandera, setCategoria, setMes } =
    useStore();
  const { banderas, categorias } = alcance(usuario);

  const opcionesBandera = banderas ?? BANDERAS;
  const opcionesCategoria = categorias ?? CATEGORIAS;

  const sel =
    "border border-cenco-line bg-white rounded-sm px-3 py-1.5 text-[13px] text-tinta";

  return (
    <div className="mt-5 flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-micro text-gris">Bandera</span>
        <select
          className={sel}
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

      <label className="flex flex-col gap-1">
        <span className="text-micro text-gris">Categoría</span>
        <select
          className={sel}
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

      <label className="flex flex-col gap-1">
        <span className="text-micro text-gris">Mes</span>
        <select
          className={sel}
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
        <p className="text-micro text-gris pb-1.5 max-w-[42ch] leading-relaxed">
          Las opciones que no aparecen quedan fuera del alcance que Unity Catalog
          asignó a {usuario.nombre}.
        </p>
      )}
    </div>
  );
}

export const clp = (n: number) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: 0 });
