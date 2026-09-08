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

// Home posterior al ingreso. Encabeza BIA porque es la vía más corta a una
// respuesta; debajo van el estado del mes y los accesos a cada módulo.

const VALOR = [
  {
    titulo: "Responde sin que nadie arme el reporte",
    detalle:
      "Venta, margen, participación o quiebre, por mes, categoría o bandera. Si el cruce sirve, lo grafica.",
  },
  {
    titulo: "Dice de dónde sale cada cifra",
    detalle:
      "Cita el indicador, su versión y quién responde por él. Si algo no está certificado, lo advierte antes.",
  },
  {
    titulo: "No inventa",
    detalle:
      "Solo usa indicadores definidos en la capa semántica y dentro de tu alcance. Lo que no existe, lo dice.",
  },
];

const ACCESOS = [
  {
    id: "certificados" as const,
    titulo: "KPIs y Reportes Certificados",
    detalle: "Venta contra plan, margen y participación, con su definición y su owner.",
  },
  {
    id: "constructor" as const,
    titulo: "Reportería Personalizados",
    detalle: "Arma tu propio cruce de dimensiones y métricas, y guárdalo.",
  },
  {
    id: "graficos" as const,
    titulo: "Mis gráficos",
    detalle: "Lo que guardaste, con la pregunta que lo originó.",
  },
  {
    id: "sql" as const,
    titulo: "Consultas SQL Gobernadas",
    detalle: "Baja al dato con estimación de consumo antes de ejecutar.",
  },
  {
    id: "cargas" as const,
    titulo: "Portal de ingesta certificada",
    detalle: "Sube archivos complementarios con plantilla, validación y registro.",
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
              Pregunta por tus indicadores
              <span className="block text-white/70">en lenguaje natural</span>
            </h1>
            <p className="mt-4 text-[15.5px] text-white/75 leading-relaxed max-w-[58ch]">
              BIA lee las mismas definiciones que los informes oficiales, así que su
              respuesta trae la misma cifra. No es un buscador aparte ni un modelo con
              copia de los datos.
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
                Queda abierto abajo a la derecha en cualquier pantalla.
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
            Cifras certificadas, dentro del alcance de {usuario.nombre}. El margen viene
            cayendo desde mayo mientras la participación sube; el detalle está en KPIs y
            Reportes Certificados.
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
