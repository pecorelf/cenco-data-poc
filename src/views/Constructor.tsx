import { useState } from "react";
import { INDICADORES, porId } from "../data/semantica";
import { Boton, Encabezado, Panel, Sello } from "../components/UI";
import { useStore } from "../lib/store";

export default function Constructor() {
  const { usuario, reportes, guardarReporte } = useStore();
  const [seleccion, setSeleccion] = useState<string[]>([
    "venta_neta_mp",
    "margen_bruto_mp",
  ]);
  const [nombre, setNombre] = useState("Margen y venta por categoría");
  const [aviso, setAviso] = useState<{
    tono: "ok" | "bloqueo";
    texto: string;
  } | null>(null);

  const elegidos = seleccion.map((id) => porId(id)!).filter(Boolean);
  const hayExploratorio = elegidos.some((i) => i.estado !== "certificado");

  const alternar = (id: string) => {
    setAviso(null);
    setSeleccion((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  };

  const guardar = () => {
    guardarReporte({
      id: crypto.randomUUID(),
      nombre,
      creadoPor: usuario.nombre,
      creadoEn: new Date().toLocaleDateString("es-CL"),
      indicadores: elegidos.map((i) => i.nombre),
      estado: hayExploratorio ? "exploratorio" : "certificado",
      descripcion: `${elegidos.length} indicadores`,
    });
    setAviso({
      tono: "ok",
      texto: hayExploratorio
        ? "Guardado en tu espacio personal. Queda en el carril exploratorio porque incluye un indicador sin certificar."
        : "Guardado en tu espacio personal. Todos sus indicadores están certificados.",
    });
  };

  const publicar = () => {
    if (hayExploratorio) {
      const sinCertificar = elegidos.find((i) => i.estado !== "certificado")!;
      setAviso({
        tono: "bloqueo",
        texto: `No se puede publicar: "${sinCertificar.nombre}" no está certificado. La solicitud se envió a ${
          sinCertificar.owner.nombre === "Sin owner asignado"
            ? "la mesa de gobierno de indicadores para que le asigne un responsable"
            : sinCertificar.owner.nombre
        }. Mientras tanto el informe sigue disponible en tu espacio personal.`,
      });
      return;
    }
    if (!usuario.puedePublicar) {
      setAviso({
        tono: "bloqueo",
        texto: `Tus indicadores están todos certificados, pero tu perfil no tiene derecho de publicación. La solicitud quedó en cola para el owner de cada indicador.`,
      });
      return;
    }
    setAviso({
      tono: "ok",
      texto: "Publicado en el catálogo oficial. Queda visible para todos los usuarios cuyo alcance incluya estas categorías.",
    });
  };

  return (
    <div className="pb-12">
      <Encabezado
        titulo="Informes personalizados"
        bajada="Arma tu propio informe combinando indicadores de la capa semántica. Puedes usar cualquiera, incluidos los que no están certificados: el sistema no te lo impide, pero sí distingue entre lo que es tuyo y lo que es oficial."
      />

      <div className="p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-6">
          <Panel titulo="Elige los indicadores">
            <ul className="divide-y divide-cenco-line -my-2">
              {INDICADORES.map((i) => {
                const activo = seleccion.includes(i.id);
                return (
                  <li key={i.id}>
                    <label className="flex items-start gap-3 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={() => alternar(i.id)}
                        className="mt-1 w-4 h-4 accent-[#0B57A4]"
                      />
                      <span className="flex-1">
                        <span className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[14px] text-tuna">{i.nombre}</span>
                          <Sello estado={i.estado} />
                        </span>
                        <span className="block text-[12.5px] text-gris mt-0.5 leading-relaxed">
                          {i.owner.nombre === "Sin owner asignado"
                            ? "Sin responsable asignado"
                            : `Responde ${i.owner.nombre}`}{" "}
                          · {i.granularidad}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {reportes.length > 0 && (
            <Panel titulo={`Mis informes (${reportes.length})`}>
              <ul className="divide-y divide-cenco-line -my-2">
                {reportes.map((r) => (
                  <li key={r.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[14px] text-tuna">{r.nombre}</div>
                      <div className="text-micro text-gris mt-0.5">
                        {r.creadoPor} · {r.creadoEn} · {r.descripcion}
                      </div>
                    </div>
                    <Sello
                      estado={
                        r.estado === "certificado" ? "certificado" : "exploratorio"
                      }
                    />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {/* Panel de acción */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <Panel titulo="Tu informe">
            <label className="block">
              <span className="text-micro text-gris">Nombre</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full border border-cenco-line px-3.5 py-2.5 text-[14px]"
              />
            </label>

            <ul className="mt-4 space-y-1.5">
              {elegidos.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-2 text-[13px]"
                >
                  <span className="text-tuna truncate">{i.nombre}</span>
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${
                      i.estado === "certificado" ? "bg-certif" : "bg-naranjo"
                    }`}
                    aria-label={i.estado}
                  />
                </li>
              ))}
              {!elegidos.length && (
                <li className="text-[13px] text-gris">
                  Todavía no eliges ningún indicador.
                </li>
              )}
            </ul>

            <div className="mt-5 flex flex-col gap-2">
              <Boton ancho onClick={guardar} disabled={!elegidos.length}>Guardar en mi espacio</Boton>
              <Boton ancho variante="contorno" onClick={publicar} disabled={!elegidos.length}>Publicar como oficial</Boton>
            </div>

            {aviso && (
              <div
                role="status"
                className={`mt-4 p-4 border rounded-card text-[13px] leading-relaxed ${
                  aviso.tono === "ok"
                    ? "border-certif/40 bg-certif-soft text-certif"
                    : "border-naranjo/40 bg-naranjo-soft text-naranjo-deep"
                }`}
              >
                {aviso.texto}
              </div>
            )}
          </Panel>

          <div className="border border-cenco-line bg-white rounded-card shadow-suave p-5">
            <h3 className="text-[13px] font-medium text-cenco-deep">
              Cómo funcionan las dos velocidades
            </h3>
            <p className="mt-1.5 text-[12.5px] text-gris leading-relaxed">
              El carril exploratorio es libre: cualquiera arma lo que necesite y lo
              guarda. El carril certificado exige que cada indicador tenga
              definición acordada y responsable. Pasar de uno al otro es una
              decisión del owner, no un permiso de la herramienta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
