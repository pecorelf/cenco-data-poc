import { useState } from "react";
import {
  EJEMPLOS,
  OBJETOS,
  OBJETO_PRINCIPAL,
  ejecutar,
  ErrorConsulta,
  type Resultado,
} from "../data/sql";
import { Boton, Encabezado, Panel } from "../components/UI";
import { useStore, alcance } from "../lib/store";

export default function ConsultasSQL() {
  const { usuario, consultas, guardarConsulta, borrarConsulta } = useStore();
  const { banderas, categorias } = alcance(usuario);

  const [sql, setSql] = useState(EJEMPLOS[0].sql);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<{ mensaje: string; sugerencia?: string } | null>(
    null
  );
  const [nombre, setNombre] = useState("");

  const correr = () => {
    try {
      setError(null);
      setResultado(ejecutar(sql, { banderas, categorias }));
    } catch (e) {
      setResultado(null);
      setError(
        e instanceof ErrorConsulta
          ? { mensaje: e.message, sugerencia: e.sugerencia }
          : { mensaje: e instanceof Error ? e.message : String(e) }
      );
    }
  };

  const guardar = () => {
    guardarConsulta({
      id: crypto.randomUUID(),
      nombre: nombre.trim() || `Consulta ${consultas.length + 1}`,
      sql,
      creadaPor: usuario.nombre,
      creadaEn: new Date().toLocaleDateString("es-CL"),
    });
    setNombre("");
  };

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Consultas SQL gobernadas"
        bajada="Para perfiles que necesitan bajar al dato. Se consulta sobre los objetos que Unity Catalog te autorizó, el filtro de tu alcance se aplica solo, y hay un tope de cómputo por consulta."
      />

      <div className="p-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="space-y-6">
          <Panel
            titulo="Editor"
            accion={
              <div className="flex flex-wrap gap-2">
                {EJEMPLOS.map((e) => (
                  <button
                    key={e.titulo}
                    onClick={() => {
                      setSql(e.sql);
                      setResultado(null);
                      setError(null);
                    }}
                    className="estado text-micro border border-cenco-line rounded-full px-3 py-1.5 text-gris hover:border-cenco/50 hover:text-cenco-deep"
                  >
                    {e.titulo}
                  </button>
                ))}
              </div>
            }
          >
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) correr();
              }}
              spellCheck={false}
              rows={7}
              className="w-full border border-cenco-line rounded-control px-4 py-3 text-[13px] leading-relaxed font-mono text-tuna bg-papel focus:border-cenco"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Boton onClick={correr}>Ejecutar</Boton>
              <span className="text-micro text-gris">
                Ctrl + Enter también ejecuta. Solo lectura: el editor rechaza cualquier
                escritura.
              </span>
            </div>
          </Panel>

          {error && (
            <div className="border border-naranjo/35 bg-naranjo-soft rounded-card p-5">
              <div className="text-[14px] font-semibold text-naranjo-deep">
                {error.mensaje}
              </div>
              {error.sugerencia && (
                <p className="mt-2 text-[13.5px] text-tuna leading-relaxed">
                  {error.sugerencia}
                </p>
              )}
            </div>
          )}

          {resultado && (
            <Panel
              titulo={`${resultado.filas.length} ${
                resultado.filas.length === 1 ? "fila" : "filas"
              } · ${resultado.filasLeidas} leídas`}
            >
              {resultado.rlsAplicado && (
                <div className="mb-4 border border-cenco/25 bg-cenco-soft rounded-control px-4 py-3">
                  <div className="text-micro font-semibold text-cenco-deep">
                    Filtro aplicado por Unity Catalog
                  </div>
                  <code className="block mt-1 text-[12.5px] text-tuna font-mono">
                    {resultado.rlsAplicado}
                  </code>
                  <p className="mt-1.5 text-micro text-gris leading-relaxed">
                    No lo escribiste tú y no se puede quitar desde el editor.
                  </p>
                </div>
              )}

              {resultado.advertencias.map((a) => (
                <p key={a} className="mb-3 text-[13px] text-gris leading-relaxed">
                  {a}
                </p>
              ))}

              <div className="overflow-x-auto border border-cenco-line rounded-control">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-papel border-b border-cenco-line text-left">
                      {resultado.columnas.map((c) => (
                        <th
                          key={c}
                          className="px-4 py-2.5 font-semibold text-cenco-deep font-mono text-[12px]"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.filas.map((f, i) => (
                      <tr key={i} className="border-b border-cenco-line last:border-0">
                        {resultado.columnas.map((c) => (
                          <td
                            key={c}
                            className={`px-4 py-2 ${
                              typeof f[c] === "number" ? "num text-right" : ""
                            }`}
                          >
                            {typeof f[c] === "number"
                              ? (f[c] as number).toLocaleString("es-CL")
                              : String(f[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details className="mt-4">
                <summary className="text-[13px] text-cenco cursor-pointer">
                  Ver la consulta que se ejecutó realmente
                </summary>
                <pre className="mt-2 bg-papel border border-cenco-line rounded-control p-4 text-[12px] font-mono text-tuna overflow-x-auto whitespace-pre-wrap">
                  {resultado.sqlEfectivo}
                </pre>
              </details>

              <div className="mt-5 pt-4 border-t border-cenco-line flex flex-wrap gap-2 items-center">
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre para guardarla"
                  className="border border-cenco-line px-3.5 py-2 text-[13.5px] min-w-[220px]"
                />
                <Boton variante="contorno" onClick={guardar}>
                  Guardar consulta
                </Boton>
              </div>
            </Panel>
          )}

          {consultas.length > 0 && (
            <Panel titulo={`Mis consultas (${consultas.length})`}>
              <ul className="divide-y divide-cenco-line -my-2">
                {consultas.map((c) => (
                  <li key={c.id} className="py-3 flex items-start justify-between gap-4">
                    <button
                      onClick={() => {
                        setSql(c.sql);
                        setResultado(null);
                        setError(null);
                      }}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className="text-[14px] text-tuna">{c.nombre}</div>
                      <div className="text-micro text-gris mt-0.5 truncate font-mono">
                        {c.sql.replace(/\s+/g, " ")}
                      </div>
                      <div className="text-micro text-gris mt-0.5">
                        {c.creadaPor} · {c.creadaEn}
                      </div>
                    </button>
                    <Boton variante="sutil" onClick={() => borrarConsulta(c.id)}>
                      Eliminar
                    </Boton>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {/* Catálogo de objetos */}
        <div className="space-y-4 xl:sticky xl:top-6">
          <Panel titulo="Objetos disponibles">
            <ul className="space-y-4">
              {OBJETOS.map((o) => (
                <li key={o.nombre}>
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        o.autorizado ? "bg-certif" : "bg-naranjo"
                      }`}
                    />
                    <div className="min-w-0">
                      <code className="text-[12.5px] font-mono text-cenco-deep break-all">
                        {o.nombre}
                      </code>
                      <p className="text-micro text-gris mt-1 leading-relaxed">
                        {o.autorizado ? o.descripcion : o.motivo}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel titulo="Columnas">
            <ul className="space-y-2.5">
              {OBJETO_PRINCIPAL.columnas.map((c) => (
                <li key={c.nombre}>
                  <code className="text-[12.5px] font-mono text-cenco-deep">
                    {c.nombre}
                  </code>
                  <span className="text-micro text-gris ml-2">{c.tipo}</span>
                  <div className="text-micro text-gris leading-relaxed">
                    {c.descripcion}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="border border-cenco-line bg-white rounded-card shadow-suave p-5">
            <h3 className="text-[13.5px] font-semibold text-cenco-deep">
              Qué soporta este editor
            </h3>
            <p className="mt-2 text-[12.5px] text-gris leading-relaxed">
              SELECT con WHERE, GROUP BY, ORDER BY y LIMIT, y las funciones SUM, AVG,
              COUNT, MIN y MAX. Lo que no soporta lo dice en vez de devolver un resultado
              equivocado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
