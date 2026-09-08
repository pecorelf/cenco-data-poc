import { useRef, useState } from "react";
import {
  COLUMNAS,
  EJEMPLO_CON_ERRORES,
  EJEMPLO_LIMPIO,
  plantillaCSV,
  validar,
  type Resultado,
} from "../data/plantilla";
import { Boton, Encabezado, Panel, Sello } from "../components/UI";
import { useStore, alcance } from "../lib/store";

export default function Cargas() {
  const { usuario, cargas, registrarCarga } = useStore();
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [confirmada, setConfirmada] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { banderas, categorias } = alcance(usuario);

  const procesar = (texto: string, nombre: string) => {
    setConfirmada(false);
    setResultado(validar(texto, nombre, { banderas, categorias }));
  };

  const alSoltar = async (archivo: File | undefined) => {
    if (!archivo) return;
    procesar(await archivo.text(), archivo.name);
  };

  const descargarPlantilla = () => {
    const blob = new Blob([plantillaCSV()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_plan_regional_2026.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmar = () => {
    if (!resultado) return;
    registrarCarga({
      id: `C-${String(cargas.length + 1).padStart(3, "0")}`,
      archivo: resultado.archivo,
      usuario: usuario.nombre,
      fecha: new Date().toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      aceptadas: resultado.aceptadas.length,
      rechazadas: resultado.rechazadas.length,
    });
    setConfirmada(true);
  };

  const cabeceraMala =
    resultado && resultado.columnasFaltantes.length > 0;

  return (
    <div className="pb-14">
      <Encabezado
        titulo="Cargas manuales gobernadas"
        bajada="El plan regional por categoría no vive en ningún sistema: hoy se mantiene a mano en el Centralizador. Acá se sube igual de rápido, pero validado contra los maestros y con registro de quién cargó qué."
      />

      <div className="p-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          {/* Zona de carga */}
          <Panel
            titulo="Plan regional por categoría · 2026"
            accion={
              <Boton variante="sutil" onClick={descargarPlantilla}>
                Descargar plantilla
              </Boton>
            }
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                void alSoltar(e.dataTransfer.files[0]);
              }}
              className={`estado border-2 border-dashed rounded-card px-6 py-10 text-center ${
                arrastrando
                  ? "border-cenco bg-cenco-soft"
                  : "border-cenco-line bg-papel"
              }`}
            >
              <p className="text-[14.5px] text-tuna">
                Arrastra tu archivo CSV o
                <button
                  onClick={() => inputRef.current?.click()}
                  className="ml-1.5 text-cenco font-semibold underline underline-offset-4"
                >
                  búscalo en tu equipo
                </button>
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => void alSoltar(e.target.files?.[0])}
              />
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <Boton
                  variante="contorno"
                  onClick={() => procesar(EJEMPLO_LIMPIO, "plan_regional_sep.csv")}
                >
                  Usar archivo correcto
                </Boton>
                <Boton
                  variante="contorno"
                  onClick={() =>
                    procesar(EJEMPLO_CON_ERRORES, "plan_regional_sep_v2.csv")
                  }
                >
                  Usar archivo con errores
                </Boton>
              </div>
            </div>
          </Panel>

          {/* Resultado */}
          {resultado && (
            <Panel
              titulo={`Validación · ${resultado.archivo}`}
              accion={
                <Sello
                  estado={
                    cabeceraMala || resultado.rechazadas.length
                      ? "exploratorio"
                      : "certificado"
                  }
                />
              }
            >
              {cabeceraMala ? (
                <div className="border border-naranjo/35 bg-naranjo-soft rounded-card p-5">
                  <div className="text-[14px] font-semibold text-naranjo-deep">
                    El archivo no corresponde a esta plantilla
                  </div>
                  <p className="mt-2 text-[13.5px] text-tuna leading-relaxed">
                    Faltan las columnas{" "}
                    <span className="num">
                      {resultado.columnasFaltantes.join(", ")}
                    </span>
                    . Nada se cargó. Descarga la plantilla y vuelve a intentarlo.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="num text-[30px] font-semibold text-tuna leading-none">
                        {resultado.filas.length}
                      </div>
                      <div className="text-[12.5px] text-gris mt-1.5">Filas leídas</div>
                    </div>
                    <div>
                      <div className="num text-[30px] font-semibold text-certif leading-none">
                        {resultado.aceptadas.length}
                      </div>
                      <div className="text-[12.5px] text-gris mt-1.5">Aceptadas</div>
                    </div>
                    <div>
                      <div className="num text-[30px] font-semibold text-naranjo-deep leading-none">
                        {resultado.rechazadas.length}
                      </div>
                      <div className="text-[12.5px] text-gris mt-1.5">Rechazadas</div>
                    </div>
                  </div>

                  {resultado.columnasSobrantes.length > 0 && (
                    <p className="mt-4 text-[13px] text-gris leading-relaxed">
                      Se ignoraron columnas que la plantilla no contempla:{" "}
                      <span className="num">
                        {resultado.columnasSobrantes.join(", ")}
                      </span>
                      .
                    </p>
                  )}

                  {resultado.rechazadas.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-[13.5px] font-semibold text-naranjo-deep mb-3">
                        Qué se rechazó y por qué
                      </h3>
                      <ul className="border border-cenco-line rounded-control divide-y divide-cenco-line overflow-hidden">
                        {resultado.rechazadas.map((f) => (
                          <li key={f.linea} className="px-4 py-3">
                            <div className="num text-micro text-gris">
                              Línea {f.linea} · {f.valores.pais} · {f.valores.bandera} ·{" "}
                              {f.valores.categoria} · {f.valores.mes}
                            </div>
                            <ul className="mt-1.5 space-y-1">
                              {f.errores.map((e) => (
                                <li
                                  key={e}
                                  className="text-[13px] text-tuna leading-relaxed pl-4 relative"
                                >
                                  <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-naranjo" />
                                  {e}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resultado.aceptadas.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-[13.5px] font-semibold text-certif mb-3">
                        Listo para cargar
                      </h3>
                      <div className="overflow-x-auto border border-cenco-line rounded-control">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="bg-papel border-b border-cenco-line text-left">
                              {COLUMNAS.map((c) => (
                                <th
                                  key={c.id}
                                  className="px-4 py-2.5 font-semibold text-cenco-deep"
                                >
                                  {c.etiqueta}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.aceptadas.map((f) => (
                              <tr key={f.linea} className="border-b border-cenco-line last:border-0">
                                {COLUMNAS.map((c) => (
                                  <td
                                    key={c.id}
                                    className={`px-4 py-2.5 ${
                                      c.tipo === "numero" ? "num" : ""
                                    }`}
                                  >
                                    {f.valores[c.id]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {!confirmada ? (
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <Boton onClick={confirmar}>
                            Cargar {resultado.aceptadas.length}{" "}
                            {resultado.aceptadas.length === 1 ? "fila" : "filas"}
                          </Boton>
                          <span className="text-[13px] text-gris">
                            Las rechazadas no se cargan. El archivo no se carga a medias en
                            silencio.
                          </span>
                        </div>
                      ) : (
                        <div className="mt-5 border border-certif/35 bg-certif-soft rounded-card p-4">
                          <div className="text-[13.5px] font-semibold text-certif">
                            Carga registrada
                          </div>
                          <p className="mt-1.5 text-[13px] text-tuna leading-relaxed">
                            Quedó en la bitácora con tu nombre, la hora y el detalle de lo
                            aceptado y rechazado. En la implementación real la escritura va
                            a una tabla de la capa Gold marcada como origen manual, para
                            distinguirla de un dato de sistema.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Panel>
          )}

          {/* Bitácora */}
          <Panel titulo="Bitácora de cargas">
            <ul className="divide-y divide-cenco-line -my-2">
              {cargas.map((c) => (
                <li key={c.id} className="py-3 flex flex-wrap gap-4 items-start">
                  <div className="flex-1 min-w-[220px]">
                    <div className="text-[14px] text-tuna">{c.archivo}</div>
                    <div className="num text-micro text-gris mt-0.5">
                      {c.id} · {c.usuario} · {c.fecha}
                    </div>
                  </div>
                  <div className="num text-[13px] text-gris">
                    <span className="text-certif font-medium">{c.aceptadas}</span> aceptadas
                    {c.rechazadas > 0 && (
                      <>
                        {" · "}
                        <span className="text-naranjo-deep font-medium">
                          {c.rechazadas}
                        </span>{" "}
                        rechazadas
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Plantilla */}
        <div className="space-y-4 xl:sticky xl:top-6">
          <Panel titulo="Qué exige la plantilla">
            <ul className="space-y-3.5">
              {COLUMNAS.map((c) => (
                <li key={c.id}>
                  <div className="num text-[13.5px] font-semibold text-cenco-deep">
                    {c.id}
                  </div>
                  <div className="text-[12.5px] text-gris leading-relaxed mt-0.5">
                    {c.regla}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 pt-4 border-t border-cenco-line text-[12.5px] text-gris leading-relaxed">
              Además se rechazan las filas duplicadas y las que caen fuera del alcance que
              Unity Catalog te asignó. El control de acceso aplica también al escribir, no
              solo al leer.
            </p>
          </Panel>

          <div className="border border-cenco-line bg-white rounded-card shadow-suave p-5">
            <h3 className="text-[13.5px] font-semibold text-cenco-deep">
              Qué cambia respecto del Centralizador
            </h3>
            <p className="mt-2 text-[12.5px] text-gris leading-relaxed">
              La carga sigue siendo manual. Lo que cambia es que se valida antes de entrar
              y queda registrada: quién cargó, cuándo, qué se aceptó y qué se rechazó.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
