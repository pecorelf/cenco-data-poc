import { useStore, alcance } from "../lib/store";
import { Boton, Panel } from "../components/UI";
import { BadgeOrigen } from "../components/BadgeOrigen";
import { Contador } from "../components/Graficos";
import {
  ICONO_SECCION,
  IconoRayo,
  IconoCheckEscudo,
  IconoCheck,
  IconoMoneda,
  IconoReportes,
  IconoInsignia,
} from "../components/Iconos";
import {
  cumplimiento,
  filtrar,
  margenPonderado,
  sharePonderado,
  sumaVenta,
  serieMensual,
} from "../data/comercial";
import { valorVigente, cumpleCondicion } from "../data/alertas";

// Home posterior al ingreso. Encabeza BIA porque es la vía más corta a una
// respuesta; debajo van el estado del mes y los accesos a cada módulo.

const VALOR = [
  {
    Icono: IconoRayo,
    titulo: "Responde sin que nadie arme el reporte",
    detalle:
      "Venta, margen, participación o quiebre, por mes, categoría o bandera. Si el cruce sirve, lo grafica.",
  },
  {
    Icono: IconoCheckEscudo,
    titulo: "Dice de dónde sale cada cifra",
    detalle:
      "Cita el indicador, su versión y quién responde por él. Si algo no está certificado, lo advierte antes.",
  },
  {
    Icono: IconoCheck,
    titulo: "No inventa",
    detalle:
      "Solo usa indicadores definidos en la capa semántica y dentro de tu alcance. Lo que no existe, lo dice.",
  },
];



export default function Home() {
  const { usuario, setVista, alternarChat, alertas, notificaciones, graficos } = useStore();
  const uc = alcance(usuario);
  const enAlcance = { enBanderas: uc.banderas, enCategorias: uc.categorias };
  const mes = filtrar({ mes: "Ago", ...enAlcance });
  const serie = serieMensual(enAlcance);
  const dMargen = +(serie[serie.length - 1].margen - serie[0].margen).toFixed(1);
  const dShare = +(serie[serie.length - 1].share - serie[0].share).toFixed(1);
  const lectura =
    dMargen < 0 && dShare > 0
      ? `Desde enero el margen cae ${Math.abs(dMargen)} pts mientras la participación sube ${dShare} pts.`
      : `Desde enero el margen varía ${dMargen > 0 ? "+" : ""}${dMargen} pts y la participación ${dShare > 0 ? "+" : ""}${dShare} pts.`;

  const activas = alertas.filter((a) => a.activa);
  const disparadas = activas.filter((a) =>
    cumpleCondicion(valorVigente(a), a.operador, a.umbral)
  ).length;
  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  const ATENCION = [
    {
      id: "avisos" as const,
      cifra: sinLeer,
      texto: sinLeer === 1 ? "notificación sin leer" : "notificaciones sin leer",
      tono: sinLeer ? "alerta" : "neutro",
    },
    {
      id: "alertas" as const,
      cifra: disparadas,
      texto: `de ${activas.length} ${activas.length === 1 ? "alerta activa" : "alertas activas"} con la condición cumplida`,
      tono: disparadas ? "alerta" : "neutro",
    },
    {
      id: "graficos" as const,
      cifra: graficos.length,
      texto: graficos.length === 1 ? "gráfico guardado" : "gráficos guardados",
      tono: "neutro",
    },
  ];

  return (
    <div className="pb-14">
      {/* Oferta de valor de BIA */}
      <section className="bg-gradient-to-br from-cenco-deep via-cenco to-cenco-deep text-white">
        <div className="px-8 py-11 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-10 items-center">
          <div>
            <span className="inline-block border border-white/25 rounded-full px-3.5 py-1.5 text-micro font-semibold">
              Agente BIA
            </span>
            <h1 className="mt-5 text-[36px] font-semibold leading-[1.1] tracking-[-0.015em]">
              Pregunta por tus indicadores
              <span className="block text-white/70">en lenguaje natural</span>
            </h1>
            <p className="mt-4 text-[15.5px] text-white/75 leading-relaxed max-w-[58ch]">
              BIA lee las mismas definiciones que los informes oficiales, así que su
              respuesta trae la misma cifra. No es un buscador aparte ni un modelo con
              copia de los datos.
            </p>
            <div className="mt-4">
              <BadgeOrigen
                tipo="hibrido"
                detalle="Genie responde en la plataforma; la orquestación y el formato de BIA son nuestros"
              />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={alternarChat}
                className="estado inline-flex items-center gap-2.5 bg-naranjo text-white rounded-full px-6 py-3 text-[14.5px] font-semibold shadow-alto hover:bg-naranjo-deep"
              >
                Chatear con BIA
              </button>
              <span className="text-[13px] text-white/60">
                Queda abierto abajo a la derecha en cualquier pantalla.
              </span>
            </div>
          </div>

          <ul className="space-y-3">
            {VALOR.map((v, i) => (
              <li
                key={v.titulo}
                className="bg-white/10 border border-white/15 rounded-card px-5 py-4 anim-aparecer flex gap-3.5"
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <span className="mt-0.5 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <v.Icono size={16} />
                </span>
                <div>
                  <div className="text-[14.5px] font-semibold">{v.titulo}</div>
                  <p className="mt-1 text-[13px] text-white/70 leading-relaxed">
                    {v.detalle}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="p-8 space-y-6">
        {/* Pulso del negocio */}
        <Panel titulo="Cómo va marca propia · agosto 2026">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <IconoMoneda size={16} className="text-gris" />
              <div className="num text-[30px] font-semibold text-cenco-deep leading-none mt-1.5">
                <Contador valor={sumaVenta(mes)} decimales={0} clave="home-venta" />
                <span className="text-[16px] font-normal text-gris ml-0.5"> MM</span>
              </div>
              <div className="mt-1 text-[12.5px] text-gris">Venta neta</div>
            </div>
            <div>
              <IconoCheckEscudo size={16} className="text-gris" />
              <div className="num text-[30px] font-semibold text-naranjo-deep leading-none mt-1.5">
                <Contador valor={cumplimiento(mes)} clave="home-cumpl" />
                <span className="text-[16px] font-normal text-gris ml-0.5">%</span>
              </div>
              <div className="mt-1 text-[12.5px] text-gris">Cumplimiento de plan</div>
            </div>
            <div>
              <IconoReportes size={16} className="text-gris" />
              <div className="num text-[30px] font-semibold text-cenco-deep leading-none mt-1.5">
                <Contador valor={margenPonderado(mes)} clave="home-margen" />
                <span className="text-[16px] font-normal text-gris ml-0.5">%</span>
              </div>
              <div className="mt-1 text-[12.5px] text-gris">Margen bruto</div>
            </div>
            <div>
              <IconoInsignia size={16} className="text-gris" />
              <div className="num text-[30px] font-semibold text-certif leading-none mt-1.5">
                <Contador valor={sharePonderado(mes)} clave="home-share" />
                <span className="text-[16px] font-normal text-gris ml-0.5">%</span>
              </div>
              <div className="mt-1 text-[12.5px] text-gris">Participación</div>
            </div>
          </div>
          <p className="mt-5 text-[13px] text-gris leading-relaxed max-w-[76ch]">
            Cifras certificadas, dentro del alcance de {usuario.nombre}. {lectura} El
            detalle está en KPIs y Reportes Certificados.
          </p>
        </Panel>

        {/* Requiere atención: lo que la navegación lateral no puede decir */}
        <Panel titulo="Requiere atención">
          <ul className="divide-y divide-cenco-line -my-2">
            {ATENCION.map((a) => {
              const Icono = ICONO_SECCION[a.id];
              return (
                <li key={a.id}>
                  <button
                    onClick={() => setVista(a.id)}
                    className="fila-accion w-full flex items-center gap-4 py-3 text-left"
                  >
                    <Icono size={17} className="text-cenco shrink-0" />
                    <span
                      className={`num text-[22px] font-semibold w-10 text-right ${
                        a.tono === "alerta" ? "text-naranjo-deep" : "text-cenco-deep"
                      }`}
                    >
                      <Contador valor={a.cifra} decimales={0} clave={`home-${a.id}`} />
                    </span>
                    <span className="text-[13.5px] text-tuna flex-1">{a.texto}</span>
                    <span className="fila-accion-ir text-[12.5px] font-semibold text-cenco">
                      Abrir
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
