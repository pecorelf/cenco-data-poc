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

## Verificación visual — y sus límites reales en este entorno

Antes de dar por buenos los badges de Origen, intenté conseguir una captura de pantalla
real en vez de solo razonar sobre las clases CSS. Tres intentos, en orden:

1. **Playwright** — instala su propio Chromium, pero lo descarga desde `cdn.playwright.dev`,
   que no está en la lista de dominios permitidos de este entorno. Falla con un 403 explícito.
2. **`apt install chromium`** — en Ubuntu 24.04 ese paquete es un stub que reenvía a un snap
   (`snap install chromium`), y `snapd` no funciona dentro de este contenedor. Se instala
   pero el binario real nunca llega.
3. **`wkhtmltoimage`** — este sí estaba preinstalado y sí genera un PNG real, sin depender de
   internet. Pero corre sobre un motor QtWebKit de 2012 que no ejecuta el JavaScript moderno
   de una SPA en React: la página carga en blanco tanto contra el dev server como contra el
   build de producción.

Ningún camino dio una captura real utilizable. Lo que sí hice en su reemplazo: recalculé a
mano, con números reales (ancho de columnas, padding, caracteres por pixel), el layout en
cada lugar donde toqué CSS esta sesión — y ese ejercicio encontró dos bugs genuinos, no
hipotéticos, que quedaron corregidos:

- **`BadgeOrigen` dependía de `hidden sm:inline`**, una clase que reacciona al ancho del
  *viewport*, no del contenedor. Tailwind v3 (la versión de este proyecto) no tiene container
  queries por defecto, así que en el panel angosto de 320px "Mi presupuesto" el texto largo
  del detalle igual intentaba mostrarse y se cortaba, invisible, contra el borde redondeado
  del panel. Se resolvió sacando ese texto por completo — el detalle vive solo en el `title`
  nativo ahora, igual que en `Sello`.
- **El selector de "Sesión" en la cabecera no tenía ancho máximo** y crecía con el nombre más
  largo ("Rodrigo Meza · Subgerente de Planificación Comercial", ~350px). Sumado al nuevo
  botón "Origen", el cálculo total de la fila derecha superaba lo que cabe en una pantalla de
  laptop común. Se acotó el selector a 190px con truncado y `title` para el nombre completo,
  y el header pasó de altura fija a altura mínima, para que crecer en vez de recortar sea el
  peor caso posible si algún día no cabe.

Vale la pena decir esto sin rodeos: no hay reemplazo real para que alguien lo abra en un
navegador de verdad antes de una reunión. Esto reduce el riesgo, no lo elimina.

## Interruptor "Origen": qué es nativo de Databricks y qué es a medida

Un botón "Origen" en la cabecera revela, panel por panel, si esa pieza de la demo vendría
gratis con la plataforma, si es ingeniería nuestra encima, o una mezcla de las dos — sin
ensuciar la demo por defecto, porque `components/BadgeOrigen.tsx` no renderiza nada hasta
que se activa el interruptor (`mostrarOrigen` en el store).

Tres categorías, cada una con su color, ícono y una frase de qué feature de Databricks
resuelve (o por qué no hay una):

| | Qué significa | Ejemplos en esta demo |
|---|---|---|
| **Nativo Databricks** | Ya viene con la plataforma | El resumen de KPIs (Unity Catalog Metric Views), el modo SQL y el modo Asistente de Explorador de Datos (SQL warehouse y Genie, respectivamente) |
| **Construido a medida** | No existe en Databricks, es ingeniería nuestra | Reportería Personalizados completo (drag & drop, eje doble, exportar PNG), el Constructor visual de Explorador de Datos, el tour guiado |
| **Híbrido** | El dato o mecanismo es nativo, la experiencia es nuestra | Mi presupuesto (system tables existen, la estimación previa y el bloqueo no), Mis alertas (SQL Alerts existe, el back-test no), BIA (Genie resuelve, la orquestación y el formato son nuestros) |

La clasificación completa, con el razonamiento detrás de cada caso, quedó en la conversación
que preparó este cambio — vale la pena revisarla antes de usar el interruptor en una reunión,
por si surge una pregunta sobre un caso específico que no está en esta tabla.

## Ícono "(i)" por indicador

`components/InfoIndicador.tsx` — un botón "(i)" chico que, al pasar el mouse, enfocar con
teclado o tocar, muestra un popover con la definición del indicador en lenguaje simple y qué
implica su estado de certificación (`EXPLICACION_ESTADO` en `data/semantica.ts`). Aplicado en
KPIs y Reportes Certificados (las 4 cifras del resumen), el checklist de Métricas certificadas
en Explorador de Datos, la fila de tipo por métrica del gráfico mixto en Reportería
Personalizados, y el selector de métrica en Mis alertas.

Dos decisiones técnicas por seguridad, no por gusto:
- Se renderiza en un **portal a `document.body`**, con posición calculada en píxeles reales
  de pantalla (no en el flujo normal del layout) — así nunca queda cortado por el `overflow`
  de una celda de tabla o un chip angosto, y se voltea hacia arriba solo si no hay espacio
  abajo. Probé la matemática de recorte con casos límite (ícono pegado a cada borde) antes de
  confiar en el render.
- El botón llama `preventDefault()` en su clic: varios de estos íconos terminan cerca de un
  `<label>` que envuelve un checkbox o un `<select>` (el patrón normal para asociar una
  etiqueta a su control), y sin ese `preventDefault()` un clic en "(i)" activaría también el
  control de al lado. Donde encontré ese riesgo, además separé el ícono del `<label>` — en
  Explorador de Datos como hermano fuera de él, en Mis alertas con `htmlFor`/`id` explícito en
  vez de anidamiento, así la asociación accesible se mantiene sin que el ícono quede adentro.
  El sello de certificación (`Sello`) también ganó un `title` nativo con la misma explicación,
  como respaldo en cualquier lugar donde no se agregó el ícono completo.

## Tour guiado (auto-play con 1x/2x/3x)

Un botón en la esquina inferior izquierda ("Tour guiado") arranca un recorrido de 10 pasos
por el portal, con velocidad ajustable. Diseñado a propósito para no arriesgar nada de lo
que ya funciona: `components/TourGuiado.tsx` solo orquesta dos acciones que ya existían y
ya estaban probadas — `setVista` (cambiar de pantalla) y `setUsuario` (cambiar de sesión).
No simula arrastrar un chip, no escribe SQL, no abre gráficos: en el paso de Reportería
Personalizados, el tour se autopausa (`pausarAlLlegar`) y espera un clic humano, porque ahí
es mejor mostrar el drag & drop en vivo que fingirlo.

Controles: anterior/siguiente, pausa, velocidad 1×/2×/3× (divide la duración de cada paso),
puntos de navegación directa, minimizar, y salir en cualquier momento — nunca bloquea la
interfaz, el menú y todo lo demás siguen funcionando si se quiere desviar del guion.

**Minimizar** colapsa la barra completa a una pastilla chica ("Tour · paso 4 de 10") para
liberar toda la pantalla, y a la vez pausa el avance automático — así nunca cambia de
pantalla mientras no se está mirando el contador. Volver a mostrarla no reanuda sola; hay
que darle play otra vez, a propósito. BIA se corre hacia arriba solo mientras la barra
completa está realmente ocupando espacio abajo (una bandera `tourActivo` en el store,
sincronizada por efecto con `activo && !minimizado`, no con el tour en sí) — minimizada, BIA
vuelve a su posición normal.

## Gráficos combinados con eje doble, y tooltip al pasar el mouse

Dos mejoras al motor de gráficos, ambas también disponibles para BIA porque comparten el
mismo `components/Graficos.tsx`:

**Eje doble de verdad.** El "combo" anterior apilaba dos gráficos independientes, cada uno
con su propia escala — visualmente parecido a un combo, pero no lo era. Ahora `Combo` es
un solo sistema de coordenadas: las métricas en barra o área comparten el eje izquierdo
(arranca en cero), las marcadas en línea tienen su propio eje derecho con su propia escala,
y las posiciones en X son las mismas para ambos. En Reportería Personalizados, con 2 o más
métricas aparece "Gráfico mixto — cada métrica con su tipo y su eje": Barra, Área o Línea
por métrica, con Cumplimiento de Plan arrancando en Línea por defecto (sigue siendo
editable). Sin esto, cruzar venta en millones con cumplimiento en porcentaje aplastaría el
cumplimiento contra el piso del gráfico — lo probé con datos reales antes de confiar en el
render.

**Tooltip con línea guía.** Barras, Líneas, Área y Combo ahora capturan el movimiento del
mouse en toda el área de trazado (un rectángulo invisible, no hay que acertarle a una línea
delgada ni a un punto), y muestran una guía vertical más una cajita con el valor de cada
serie en esa categoría. Barras horizontales y Dona no lo necesitaban — ya muestran el valor
siempre visible, dentro de la barra o en la leyenda.

## Tipo de gráfico y exportar a PNG en Reportería Personalizados

El tipo de gráfico ahora se elige, no se impone — pero solo entre los tipos que tienen
sentido para la forma actual de los datos. Una serie temporal (dimensión = Mes) ofrece
Líneas, Área o Barras. Una comparación entre categorías o banderas ofrece Barras y Barras
horizontales, y además Dona cuando hay exactamente una métrica (porque ahí sí es una
composición, no antes). El tipo Área es nuevo (`Areas` en `components/Graficos.tsx`),
construido igual que Líneas pero con el relleno bajo la curva.

**Exportar PNG** usa `html-to-image` en vez de serializar el SVG a mano: uno de los tipos
de gráfico (Barras horizontales) está hecho con divs de HTML/CSS, no con SVG, así que
"convertir el SVG a imagen" no habría alcanzado a cubrir todos los casos — se necesitaba
capturar el nodo del DOM tal cual se ve, sin importar de qué está hecho por dentro. La
exportación se genera a 2x de resolución sobre fondo blanco, y descarga directo sin pasar
por el servidor.

## Drag & drop real en Reportería Personalizados

Antes se elegía dimensión y métricas con clics sobre chips. Ahora se arrastran de verdad:
`@dnd-kit/core` maneja el gesto (mouse y touch, con umbral de 4px para que un clic simple
no se confunda con un arrastre), y cada chip sigue siendo clicable — el arrastre es un
gesto adicional, no un reemplazo, así nadie pierde funcionalidad si prefiere no arrastrar.
El panel "Disponibles" es en sí mismo el blanco de suelta para quitar algo ya elegido.
No se implementó reordenamiento por arrastre dentro de una zona (el orden queda por orden
de llegada); el RFP pide armar el informe arrastrando, no reordenarlo, así que se priorizó
esa parte con menos riesgo de que algo se sienta frágil en una demo en vivo.

## Mis alertas: editar, back-test y cierre del ciclo con notificaciones

Tres cosas nuevas sobre lo que ya existía:

- **Editar** una alerta ya configurada, no solo pausarla o borrarla.
- **Back-test antes de guardar** — un mini-histórico (`serieHistorica` en
  `data/alertas.ts`) muestra cómo se habría comportado la regla en los ocho meses de
  datos disponibles, con la línea de umbral marcada, para detectar un umbral mal
  calibrado (que dispara siempre, o que nunca dispara) antes de guardarlo.
- **Notificación real al guardar** — si la regla ya está incumplida en el momento de
  crearla o editarla, se registra al tiro un aviso en el Centro de notificaciones
  (`registrarNotificacion` en el store). Cierra el círculo entre Mis alertas y Centro de
  notificaciones, que antes eran dos pantallas con datos de ejemplo desconectados entre sí.

## Tres módulos marcados "a validar"

Explorador de Datos, Mis alertas y Centro de notificaciones se agregaron pensando en la
sesión de discovery con el equipo de BI de Cencosud, no como entregas cerradas. Cada uno
lleva un ícono de interrogación junto al nombre en el menú, y un panel `NotaDiscovery` al
abrir la pantalla con las preguntas de alcance que conviene hacer en esa sesión —por
ejemplo, si Explorador de Datos es para analistas que ya saben SQL o para gerentes que
solo quieren filtrar sin código, o si las alertas las configura cada usuario para sí
mismo o también un gerente para su equipo. La idea es que la demo sirva de instrumento
de la conversación, no que presente como decidido algo que todavía no se acordó.

- **Mis alertas** — reglas por usuario (métrica, condición, umbral, frecuencia, canal),
  con evaluación real contra el dataset vigente: si el umbral ya está cruzado, la regla
  se marca "Activa ahora" en vez de solo quedar configurada en el papel. Solo el canal
  Portal está conectado de verdad; Email, Slack y WhatsApp quedan seleccionables para la
  conversación de mañana.
- **Centro de notificaciones** — ahora también existe como página completa (además de la
  campana de la cabecera), con filtro por tipo y una sección que explica cómo se genera
  cada uno de los cinco tipos de aviso.
- **Explorador de Datos** — renombrado desde "Consultas SQL Gobernadas": el nombre previo
  describía solo uno de los tres modos (SQL); el nuevo cubre también Constructor visual
  y Asistente.

## Cómo cita BIA sus fuentes

BIA cierra sus respuestas con una línea `Fuente: <id>` — pero solo con el id, sin versión,
estado ni responsable. El resto de la cita (`src/lib/espec.ts:separarFuente`) se arma del
lado del cliente leyendo `semantica.ts` directamente: si el id no corresponde a un indicador
real, no se muestra ninguna cita. Así la versión y el owner que ves nunca pueden quedar
desactualizados ni ser inventados por el modelo — es la capa semántica la que responde, no
el texto libre que generó la respuesta.

El cuerpo de la respuesta se renderiza con `components/TextoFormateado.tsx`, un parser propio
de un subconjunto mínimo de markdown (negrita, código, listas cortas) — sin
`dangerouslySetInnerHTML` ni una librería de markdown completa, porque lo único que BIA
necesita marcar es una cifra por párrafo y algún nombre de columna o indicador.

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
