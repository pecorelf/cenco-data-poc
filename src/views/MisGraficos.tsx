import { useState } from "react";
import { Boton, Encabezado, Sello } from "../components/UI";
import { Grafico } from "../components/Graficos";
import { useStore } from "../lib/store";

export default function MisGraficos() {
  const {
    graficos,
    borrarGrafico,
    renombrarGrafico,
    usuario,
    alternarChat,
    modoGuardado,
    cargandoGraficos,
  } = useStore();
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState("");

  if (cargandoGraficos) {
    return (
      <div className="pb-14">
        <Encabezado
          titulo="Mis gráficos"
          bajada="Acá se guardan los gráficos que armas con BIA o en Informes personalizados."
        />
        <div className="px-8 py-14">
          <p className="anim-pulso text-[14px] text-gris">Cargando tus gráficos…</p>
        </div>
      </div>
    );
  }

  if (!graficos.length) {
    return (
      <div className="pb-14">
        <Encabezado
          titulo="Mis gráficos"
          bajada="Los gráficos que armas con BIA o en Reportería Personalizados. Cada uno guarda la pregunta que lo originó y los indicadores de los que salió."
        />
        <div className="px-8 py-14">
          <div className="max-w-[54ch] bg-white border border-cenco-line rounded-card shadow-suave p-8">
            <h2 className="text-[17px] font-semibold text-cenco-deep">
              Todavía no guardas ninguno
            </h2>
            <p className="mt-2.5 text-[14px] text-gris leading-relaxed">
              Pídele un cruce a BIA —margen contra participación, venta contra plan— o
              ármalo en Informes personalizados. Cuando aparezca el gráfico, ponle nombre
              y guárdalo. Vuelve acá cuando quieras y estará tal como lo dejaste.
            </p>
            <div className="mt-6">
              <Boton onClick={alternarChat}>Preguntar a BIA</Boton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Mis gráficos"
        bajada={`${graficos.length} ${
          graficos.length === 1 ? "gráfico guardado" : "gráficos guardados"
        }. Cada uno conserva la pregunta que lo originó y de qué indicadores salió, para que se pueda auditar después.`}
      />

      <div className="p-8 space-y-6">
        {graficos.map((g) => (
          <article
            key={g.id}
            className="bg-white border border-cenco-line rounded-card shadow-suave overflow-hidden"
          >
            <header className="flex flex-wrap items-start justify-between gap-4 px-6 py-4 border-b border-cenco-line">
              <div className="min-w-0">
                {editando === g.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={borrador}
                      onChange={(e) => setBorrador(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && borrador.trim()) {
                          renombrarGrafico(g.id, borrador.trim());
                          setEditando(null);
                        }
                        if (e.key === "Escape") setEditando(null);
                      }}
                      className="border border-cenco-line px-3 py-1.5 text-[15px]"
                    />
                    <Boton
                      variante="sutil"
                      onClick={() => {
                        if (borrador.trim()) renombrarGrafico(g.id, borrador.trim());
                        setEditando(null);
                      }}
                    >
                      Listo
                    </Boton>
                  </div>
                ) : (
                  <h2 className="text-[16px] font-semibold text-cenco-deep truncate">
                    {g.nombre}
                  </h2>
                )}
                <p className="mt-1 text-micro text-gris">
                  {g.creadoPor} · {g.creadoEn}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Sello estado={g.certificado ? "certificado" : "exploratorio"} />
                <Boton
                  variante="sutil"
                  onClick={() => {
                    setEditando(g.id);
                    setBorrador(g.nombre);
                  }}
                >
                  Renombrar
                </Boton>
                <Boton variante="sutil" onClick={() => borrarGrafico(g.id)}>
                  Eliminar
                </Boton>
              </div>
            </header>

            <div className="px-6 py-6">
              <Grafico e={g.espec} />
            </div>

            <footer className="px-6 py-3.5 bg-papel border-t border-cenco-line">
              <p className="text-[12.5px] text-gris leading-relaxed">
                Nació de la pregunta: «{g.pregunta}»
                {g.espec.indicadores?.length ? (
                  <> · Indicadores: {g.espec.indicadores.join(", ")}</>
                ) : null}
              </p>
            </footer>
          </article>
        ))}

        <p className="text-micro text-gris max-w-[76ch] leading-relaxed">
          {modoGuardado === "compartido" ? (
            <>
              Los gráficos de {usuario.nombre} están en el almacenamiento compartido: se
              ven desde cualquier equipo que abra el portal con esta sesión. En la
              implementación real viven en su perfil dentro del portal, con el mismo
              control de acceso que el resto de sus activos.
            </>
          ) : (
            <>
              Los gráficos de {usuario.nombre} se guardan solo en este navegador. Para que
              se vean desde cualquier equipo, configura el almacenamiento compartido en las
              variables de entorno del proyecto.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
