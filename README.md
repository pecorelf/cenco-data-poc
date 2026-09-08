# Portal BI & Analytics Unificado 360° — POC Cencosud

Demo construida por **Deloitte Digital** para el RFP de Migración y Portal BI Unificado
de Cencosud (Subgerencia Advanced Analytics & BI · Marcas Propias & Supermercados Chile).

## Qué demuestra

La tesis de la demo no es que se puede hacer un dashboard bonito. Es que **una métrica
tiene una sola definición, un solo responsable y un solo linaje**, y que tres motores de
consumo distintos devuelven exactamente la misma cifra.

El recorrido parte en el **home de ingreso**: acceso vía Active Directory con los módulos
habilitados a la vista, y perfiles heredados desde Unity Catalog. Después del login, el
portal tiene seis pantallas y un copiloto flotante:

0. **Inicio** — la oferta de valor de BIA como puerta de entrada, con el pulso del negocio
   y los accesos a cada módulo.

1. **Informes certificados** — venta contra plan, margen y participación, los tres
   reportes que el RFP nombra textualmente. Cada cifra resuelve contra la capa semántica.
2. **Informes personalizados** (MH-06) — armador de dimensión por métricas que calcula de
   verdad sobre el dataset: se elige agrupar por mes, categoría o bandera, se marcan las
   métricas y la vista previa se rearma. Incluye el modelo de dos velocidades: se puede
   usar una métrica sin certificar, el sistema lo permite, lo marca y bloquea la
   publicación hasta que el owner la revise.
3. **Mis gráficos** — la galería personal. Cada gráfico guardado conserva la pregunta que
   lo originó y los indicadores de los que salió, para poder auditarlo después.
4. **Explorador de datos** (SH-07, SH-08) — tres formas de llegar al mismo motor gobernado:
   Asistente (atajos a consultas predefinidas y acceso directo a BIA para preguntas
   libres), Constructor visual (pills de métricas y dimensiones que arman SQL real) y
   SQL (editor de solo lectura). `src/data/sql.ts` separa el parseo de la ejecución
   para que la interpretación de la consulta y la estimación de consumo se calculen
   sobre exactamente lo que se va a correr, venga de donde venga.

   Antes de ejecutar, muestra complejidad, tiempo y filas estimadas, y el costo en
   créditos — y lo descuenta de un presupuesto real por usuario. Si la consulta supera
   la cuota disponible, bloquea la ejecución en vez de solo advertir. El alcance RLS
   del usuario también abarata el costo estimado: un perfil acotado escanea menos.

   *Nota de transparencia:* la base de "filas en producción" (340.000) usada para la
   estimación es un supuesto documentado en el código, no una cifra real — el dataset
   de la demo tiene 168 filas. Existe para que la experiencia de estimar-antes-de-
   ejecutar se sienta como la de un lakehouse real; conviene decirlo en voz alta si se
   muestra al cliente.

5. **Portal de ingesta certificada** (SH-13) — el plan regional por categoría, que hoy se
   mantiene a mano en el Centralizador. Se arrastra un CSV, se parsea y se valida de
   verdad en el navegador contra los maestros: columnas, valores permitidos, números,
   duplicados y el alcance RLS del usuario, porque el control de acceso aplica también al
   escribir. Las filas rechazadas se muestran con el motivo y no se cargan. Cada carga
   queda en una bitácora con autor y hora.

El **centro de notificaciones y alertas** vive como campana en la cabecera, no como
pestaña: incidentes, cargas, frescura, cambios de definición y las alertas por umbral del
propio usuario.

Un informe que incluya una métrica sin certificar se puede guardar en el espacio personal
pero no publicar como oficial: la promoción la decide el owner del indicador.

**BIA** (CR-06, NH-12) es el copiloto, disponible como ventana emergente abajo a la
derecha desde cualquier pantalla. Está anclado a la capa semántica: cita de qué indicador
y versión salió cada cifra, advierte cuando algo no está certificado y respeta el alcance
RLS del usuario. Arma gráficos a demanda y permite guardarlos con nombre. El panel no se
desmonta al cerrarse, así que la conversación y los gráficos generados siguen ahí al
reabrirlo; si responde con el panel cerrado, la burbuja lo avisa con un contador.


El selector de sesión de la cabecera cubre CR-01 y cambia el alcance heredado de Unity Catalog: con la
jefa de categoría de Lácteos, las demás banderas y categorías desaparecen de los filtros
y BIA se niega a responder por ellas.

## La portada del ingreso

El panel izquierdo del login trae un fondo gráfico generado en SVG (estanterías
abstractas en azul corporativo). Si se quiere usar una foto real de sala, basta dejar el
archivo en `public/portada.jpg`: se superpone automáticamente sobre el fondo, con su
degradado de legibilidad ya aplicado. Si el archivo no existe, no pasa nada y queda el
fondo gráfico.

## Iconografía y heurísticas de usabilidad

`src/components/Iconos.tsx` define un set propio de íconos de línea (trazo 1.75,
puntas redondeadas, 24×24) — no una librería importada, para mantener el estilo
uniforme y el bundle liviano. `ICONO_SECCION` mapea cada sección a un único símbolo,
reutilizado sin variación en el nav, en las tarjetas del Inicio y en los módulos del
login: el mismo ícono para lo mismo en toda la app (heurística de consistencia y
reconocimiento antes que memoria).

Mejoras de usabilidad aplicadas en esta pasada:
- **El Sello ya no depende solo del color** — cada estado (certificado, en
  certificación, sin certificar) tiene además una forma de ícono distinta, para que
  se lea igual con dificultad para distinguir colores.
- **Confirmación en dos pasos antes de borrar** — en Mis gráficos y en Consultas
  guardadas, "Eliminar" pide un segundo clic ("¿Eliminar?") antes de ejecutar, y se
  desarma solo a los 3 segundos si no se confirma.
- **Tooltips en los controles deshabilitados** — Mercado, Producto de datos y los
  dominios "Próximamente" explican por qué están apagados en vez de solo mostrarse
  grises.
- **Estados vacíos con ícono** en Historial, Consultas guardadas y Mis gráficos, en
  vez de una línea de texto sola.
- **Indicador de carga visible** — un ícono de spinner acompaña los botones mientras
  hay una acción asíncrona en curso (enviar a BIA, cargar Mis gráficos).

## Diseño

Los tokens salen del design system de Cencosud, no de un tema genérico:

| Token | Valor | Origen |
|---|---|---|
| Azul corporativo | `#095AA5` | muestreado del logo oficial; es el mismo de la barra superior, para que el logo no se recorte contra ella |
| Naranjo | `#FF690A` | muestreado del punto del logo |
| Neutro de texto | `#3B3D40` | guía de marca (Tuna) |
| Tipografía | Raleway | tipografía corporativa de Cencosud |

Los controles son redondeados (`rounded-full` en botones, `10px` en campos, `14px` en
tarjetas), con elevación suave que sube al pasar el cursor y se hunde al presionar.

## Gráficos

No se usa librería de charting. Los gráficos son SVG propio con animación CSS
(`src/components/Graficos.tsx`): las barras crecen escalonadas, las líneas se trazan con
`stroke-dashoffset`, la dona se compone por segmentos y las cifras cuentan hacia arriba.
Todo respeta `prefers-reduced-motion`. Tipos disponibles: `barras`, `lineas`,
`barras_horizontal`, `dona` y `combo`.

## Cómo BIA genera gráficos

El copiloto puede devolver, junto a su respuesta en prosa, un bloque delimitado con la
especificación del gráfico:

    ```grafico
    { "tipo": "lineas", "titulo": "...", "categorias": [...], "series": [...] }
    ```

`src/lib/espec.ts` lo separa de la prosa y lo valida campo por campo con `JSON.parse`
—nunca `eval` ni `new Function`—: verifica el tipo, que cada serie traiga tantos valores
como categorías y que los colores estén en la paleta. Si algo no cuadra, se muestra el
motivo en vez de dibujar un gráfico equivocado. Un bloque a medio llegar durante el
streaming simplemente todavía no se dibuja.

## Stack

React 18 · Vite · TypeScript · Tailwind · Zustand · Anthropic SDK. Sin librería de
gráficos. La API es una función serverless en `api/chat.ts` que corre igual en Vercel y
en local (un plugin de Vite la monta sobre el dev server).

## Persistencia de Mis gráficos

Dos niveles, con degradación limpia:

- **Compartido** — si el proyecto tiene credenciales de Redis, los gráficos se guardan
  con clave por usuario
  (`cenco:graficos:<id>`) y se ven desde cualquier equipo que abra el portal con esa
  sesión. Es lo que se necesita cuando la demo la miran varios asistentes a la vez.
- **Local** — sin esas variables, o si la red falla, todo sigue funcionando contra
  `localStorage`. La vista Mis gráficos dice en qué modo está.

Se escribe siempre en local primero (es instantáneo y garantiza que nada se pierda) y
después se sincroniza con el compartido.

Los nombres de variable varían según cómo se conecte el almacenamiento, así que se
aceptan tres pares: `UPSTASH_REDIS_REST_URL`/`_TOKEN`, `KV_REST_API_URL`/`_TOKEN` o
`REDIS_REST_URL`/`_TOKEN`. Si conectas el almacenamiento desde el panel de Vercel, las
variables se crean solas y no hay que renombrar nada.

Para verificar que quedó conectado, `GET /api/graficos?usuario=gg` devuelve
`{"compartido": true, "origen": "<nombre de la variable detectada>"}`. Si devuelve
`compartido: false`, el campo `variablesDetectadas` muestra cuáles encontró, sin exponer
sus valores.

## Correr en local

```bash
npm install
cp .env.example .env      # pega tu ANTHROPIC_API_KEY
npm run dev               # http://localhost:5173
```

El `.env` se inyecta en `process.env` desde `vite.config.ts` con `loadEnv` sin prefijo:
Vite por defecto solo expone variables `VITE_`, y las funciones de `/api` necesitan
leerlas igual que lo harían en Vercel.

## Desplegar en Vercel

Importa el repo, framework Vite. Agrega `ANTHROPIC_API_KEY` en Environment Variables y,
si quieres persistencia compartida, las dos variables de Upstash. El resto es
automático.

## Sobre los datos

**Todos los datos de este repositorio son sintéticos.** Las cifras, categorías, nombres
de responsables y estructuras de tablas son verosímiles para un negocio de marca propia
en supermercados, pero no provienen de Cencosud ni pretenden representar su realidad.
Están para sostener la narrativa de gobierno, no para afirmar nada sobre el negocio.
