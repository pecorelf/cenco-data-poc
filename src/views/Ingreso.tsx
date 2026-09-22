import { useStore } from "../lib/store";
import { Boton } from "../components/UI";
import {
  IconoReportes,
  IconoIngesta,
  IconoDestellos,
  IconoLupa,
  IconoIndicador,
  IconoCampana,
} from "../components/Iconos";

// Home de ingreso. La portada admite una foto real: basta dejar
// public/portada.jpg y se usa encima del fondo gráfico, sin tocar código.

const MODULOS = [
  { Icono: IconoReportes, titulo: "KPIs y Reportes Certificados", detalle: "Venta, margen y participación" },
  { Icono: IconoIngesta, titulo: "Portal de ingesta certificada", detalle: "Cargas con plantilla y traza" },
  { Icono: IconoDestellos, titulo: "Analítica conversacional", detalle: "Preguntas en lenguaje natural" },
  { Icono: IconoLupa, titulo: "Explorador de Datos", detalle: "SQL, constructor y asistente" },
  { Icono: IconoIndicador, titulo: "Mis alertas", detalle: "Métrica, condición y canal" },
  { Icono: IconoCampana, titulo: "Centro de notificaciones", detalle: "Incidentes, cargas y frescura" },
];

export default function Ingreso() {
  const iniciarSesion = useStore((s) => s.iniciarSesion);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.15fr_minmax(0,520px)]">
      {/* Portada */}
      <div className="relative overflow-hidden bg-cenco-deep min-h-[280px] flex items-end">
        {/* Fondo gráfico: sirve solo, y hace de base si hay foto. */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 800 600"
          aria-hidden
        >
          <defs>
            <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#064174" />
              <stop offset="55%" stopColor="#095AA5" />
              <stop offset="100%" stopColor="#043057" />
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#fondo)" />
          {/* Estanterías abstractas: la sala de venta como estructura de datos. */}
          {Array.from({ length: 9 }).map((_, f) => (
            <g key={f} opacity={0.13}>
              <line
                x1="0"
                x2="800"
                y1={90 + f * 58}
                y2={90 + f * 58}
                stroke="#fff"
                strokeWidth="1.5"
              />
              {Array.from({ length: 14 }).map((_, c) => {
                const alto = 14 + ((f * 7 + c * 11) % 30);
                return (
                  <rect
                    key={c}
                    x={18 + c * 56}
                    y={90 + f * 58 - alto}
                    width={34}
                    height={alto}
                    fill="#fff"
                    opacity={0.55}
                    rx={2}
                  />
                );
              })}
            </g>
          ))}
          <circle cx="640" cy="150" r="120" fill="#FF690A" opacity="0.14" />
        </svg>

        {/* Foto opcional: si no existe el archivo, no se ve nada y queda el fondo. */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/portada.jpg)" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-cenco-deep via-cenco-deep/70 to-cenco-deep/30"
          aria-hidden
        />

        <div className="relative p-10 lg:p-14 max-w-[46ch]">
          <img
            src="/cencosud.webp"
            alt="Cencosud"
            className="h-11 w-auto rounded-control mb-8"
          />
          <h1 className="text-white text-[34px] lg:text-[42px] font-semibold leading-[1.12] tracking-[-0.015em]">
            Portal BI &amp; Analytics Unificado 360°
          </h1>
          <p className="mt-4 text-[16px] text-white/75 leading-relaxed">
            Los indicadores certificados de Marcas Propias y Supermercados Chile en un
            solo lugar, con una definición por indicador y un responsable por definición.
          </p>
          <div className="mt-8 inline-block border border-white/25 rounded-full px-4 py-2 text-micro font-semibold text-white/80">
            Data &amp; Analytics · Supermercados
          </div>
        </div>
      </div>

      {/* Acceso */}
      <div className="bg-white flex items-center justify-center px-8 py-14">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-control bg-cenco-soft flex items-center justify-center">
              <span className="w-3.5 h-3.5 rounded-full bg-cenco" />
            </span>
            <span className="text-[14px] font-bold tracking-[0.14em] text-cenco-deep uppercase">
              Data Hub
            </span>
          </div>

          <h2 className="mt-9 text-[30px] font-semibold text-cenco-deep leading-tight">
            Bienvenido
          </h2>
          <p className="mt-2.5 text-[14.5px] text-gris leading-relaxed">
            Entra con tu cuenta corporativa. Lo que veas después depende de tu rol, país,
            bandera y dominio.
          </p>

          <div className="mt-7">
            <Boton ancho onClick={iniciarSesion}>
              Iniciar sesión
            </Boton>
          </div>

          <p className="mt-3 text-micro text-gris leading-relaxed">
            Acceso vía Active Directory. Los perfiles y permisos se heredan desde Unity
            Catalog; el portal no define accesos propios.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <span className="h-px flex-1 bg-cenco-line" />
            <span className="text-micro font-semibold text-gris uppercase tracking-wider">
              Módulos habilitados
            </span>
            <span className="h-px flex-1 bg-cenco-line" />
          </div>

          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MODULOS.map((m, i) => (
              <li
                key={m.titulo}
                className="border border-cenco-line rounded-control px-4 py-3 anim-aparecer flex items-start gap-2.5"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <m.Icono size={16} className="text-cenco mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-cenco-deep leading-snug">
                    {m.titulo}
                  </div>
                  <div className="text-micro text-gris mt-0.5">{m.detalle}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center justify-between gap-4">
            <span className="text-micro text-gris">© 2026 Cencosud S.A.</span>
            <img
              src="/deloitte-digital.png"
              alt="Deloitte Digital"
              className="h-6 w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
