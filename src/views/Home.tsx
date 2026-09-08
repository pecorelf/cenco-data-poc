import { useStore } from "../lib/store";
import { Boton, Panel } from "../components/UI";
import { Contador } from "../components/Graficos";
import {
  cumplimiento,
  filtrar,
  margenPonderado,
  sharePonderado,
  sumaVenta,
} from "../data/comercial";

// Home posterior al ingreso. La pieza central es la oferta de valor de BIA:
// el asistente no es un botón escondido, es la puerta de entrada al portal.

const VALOR = [
  {
    titulo: "Respuestas al instante",
    detalle:
      "Obtén cifras claras sobre venta, margen o participación sin esperar a que alguien arme el reporte.",
  },
  {
    titulo: "Descubre y explora",
    detalle:
      "Encuentra reportes, métricas y definiciones, y pide el cruce que necesites en lenguaje natural.",
  },
  {
    titulo: "Confiable y seguro",
    detalle:
      "Cada cifra cita su indicador, versión y responsable, y respeta el alcance que Unity Catalog te asignó.",
  },
];

const ACCESOS = [
  {
    id: "certificados" as const,
    titulo: "KPIs y reportes certificados",
    detalle: "Venta contra plan, margen y participación, con sello oficial.",
  },
  {
    id: "constructor" as const,
    titulo: "Reportería personalizada",
    detalle: "Cruza dimensiones y métricas certificadas sin depender del equipo BI.",
  },
  {
    id: "graficos" as const,
    titulo: "Mis gráficos",
    detalle: "Lo que guardaste, con la pregunta que lo originó.",
  },
  {
    id: "cargas" as const,
    titulo: "Portal de ingesta certificada",
    detalle: "Carga archivos complementarios con plantilla, validación y traza.",
  },
  {
    id: "interoperabilidad" as const,
    titulo: "Portal, Power BI y BIA",
    detalle: "La misma definición resuelta en los tres motores de consumo.",
  },
];

export default function Home() {
  const { usuario, setVista, alternarChat } = useStore();
  const mes = filtrar({ mes: "Ago" });

  return (
    <div className="pb-14">
      {/* Oferta de valor de BIA */}
      <section className="bg-gradient-to-br from-cenco-deep via-cenco to-cenco-deep text-white">
        <div className="px-8 py-11 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-10 items-center">
          <div>
            <span className="inline-block border border-white/25 rounded-full px-3.5 py-1.5 text-micro font-semibold tracking-wider uppercase">
              Agente BIA
            </span>
            <h1 className="mt-5 text-[36px] font-semibold leading-[1.1] tracking-[-0.015em]">
              Tu asistente inteligente
              <span className="block text-white/70">para datos y análisis</span>
            </h1>
            <p className="mt-4 text-[15.5px] text-white/75 leading-relaxed max-w-[58ch]">
              Consulta información, encuentra reportes, comprende tus datos y obtén
              respuestas con lenguaje natural, en segundos. BIA responde sobre la capa
              semántica, así que su cifra es la misma que la del informe oficial.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                onClick={alternarChat}
                className="estado inline-flex items-center gap-2.5 bg-naranjo text-white rounded-full px-6 py-3 text-[14.5px] font-semibold shadow-alto hover:bg-naranjo-deep"
              >
                Chatear con BIA
                <span aria-hidden>→</span>
              </button>
              <span className="text-[13px] text-white/60">
                También está siempre abajo a la derecha.
              </span>
            </div>
          </div>

          <ul className="space-y-3">
            {VALOR.map((v, i) => (
              <li
                key={v.titulo}
                className="bg-white/10 border border-white/15 rounded-card px-5 py-4 anim-aparecer"
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <div className="text-[14.5px] font-semibold">{v.titulo}</div>
                <p className="mt-1 text-[13px] text-white/70 leading-relaxed">
                  {v.detalle}
                </p>
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
              <div className="num text-[30px] font-semibold text-cenco-deep leading-none">
                <Contador valor={sumaVenta(mes)} decimales={0} />
                <span className="text-[16px] font-normal text-gris ml-0.5"> MM</span>
              </div>
              <div className="mt-2 text-[12.5px] text-gris">Venta neta</div>
            </div>
            <div>
              <div className="num text-[30px] font-semibold text-naranjo-deep leading-none">
                <Contador valor={cumplimiento(mes)} />
                <span className="text-[16px] font-normal text-gris ml-0.5">%</span>
              </div>
              <div className="mt-2 text-[12.5px] text-gris">Cumplimiento de plan</div>
            </div>
            <div>
              <div className="num text-[30px] font-semibold text-cenco-deep leading-none">
                <Contador valor={margenPonderado(mes)} />
                <span className="text-[16px] font-normal text-gris ml-0.5">%</span>
              </div>
              <div className="mt-2 text-[12.5px] text-gris">Margen bruto</div>
            </div>
            <div>
              <div className="num text-[30px] font-semibold text-certif leading-none">
                <Contador valor={sharePonderado(mes)} />
                <span className="text-[16px] font-normal text-gris ml-0.5">%</span>
              </div>
              <div className="mt-2 text-[12.5px] text-gris">Participación</div>
            </div>
          </div>
          <p className="mt-5 text-[13px] text-gris leading-relaxed max-w-[76ch]">
            Cifras certificadas dentro del alcance de {usuario.nombre}. Si quieres saber
            por qué el margen viene cayendo desde mayo, pregúntaselo a BIA.
          </p>
        </Panel>

        {/* Accesos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {ACCESOS.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setVista(a.id)}
              className="estado text-left bg-white border border-cenco-line rounded-card shadow-suave p-6 hover:border-cenco/50 hover:shadow-alto anim-aparecer"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="text-[15px] font-semibold text-cenco-deep leading-snug">
                {a.titulo}
              </div>
              <p className="mt-2 text-[13px] text-gris leading-relaxed">{a.detalle}</p>
              <span className="mt-4 inline-block text-[13px] font-semibold text-cenco">
                Entrar →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
