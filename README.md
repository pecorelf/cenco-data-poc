# Portal BI & Analytics Unificado 360° — POC Cencosud

Demo construida por **Deloitte Digital** para el RFP de Migración y Portal BI Unificado
de Cencosud (Subgerencia Advanced Analytics & BI · Marcas Propias & Supermercados Chile).

## Qué demuestra

La tesis de la demo no es que se puede hacer un dashboard bonito. Es que **una métrica
tiene una sola definición, un solo responsable y un solo linaje**, y que tres motores de
consumo distintos devuelven exactamente la misma cifra.

El recorrido tiene nueve pantallas, agrupadas en entender, gobernar y consumir:

1. **Diagnóstico** — tres áreas reportan el margen de marca propia de agosto con tres
   cifras distintas. Ninguna calculó mal; cada una respondió a una definición que nunca
   se acordó. Al revelar la cifra certificada se explica por qué cada una difiere.
2. **Catálogo unificado** (CR-06) — los 14 activos que hoy viven repartidos entre Power BI,
   MicroStrategy, Looker Studio y el Centralizador, buscables desde un solo lugar y
   clasificados en mantener, converger, reemplazar o descontinuar. Es la racionalización
   del Frente 4 hecha pantalla: migrar los catorce cuesta lo mismo que migrar nueve y
   apagar cinco, con la diferencia de que la deuda no viaja.
3. **Capa semántica** — el catálogo de indicadores. Cada uno con su fórmula, su owner
   nombrado, su linaje hasta las tablas Gold, qué considera y qué deja fuera, y qué
   motores lo consumen. Es el equivalente a Unity Catalog Metric Views.
4. **Portal, Power BI y agente** (SH-19, SH-21) — la misma métrica resuelta al mismo tiempo
   en los tres motores, con la cadena Gold → Metric View → mirroring a OneLake → Direct
   Lake. Un botón publica la versión 2.2 de la definición y las tres cifras cambian a la
   vez, sin tocar el portal ni reescribir DAX.
5. **Cargas manuales gobernadas** (SH-13) — el plan regional por categoría, que hoy se
   mantiene a mano en el Centralizador. Se arrastra un CSV, se parsea y se valida de
   verdad en el navegador contra los maestros: columnas, valores permitidos, números,
   duplicados y el alcance RLS del usuario, porque el control de acceso aplica también al
   escribir. Las filas rechazadas se muestran con el motivo y no se cargan; el archivo
   nunca entra a medias en silencio. Cada carga queda en una bitácora con autor y hora.
   Trae dos archivos de ejemplo, uno limpio y otro con siete errores distintos, para que
   la demo no dependa de tener un CSV a mano.
6. **Informes certificados** — venta contra plan, margen y participación, los tres
   reportes que el RFP nombra textualmente. Todo resuelve contra la capa semántica.
7. **Informes personalizados** (MH-06) — armador de dimensión por métricas que calcula de
   verdad sobre el dataset: se elige agrupar por mes, categoría o bandera, se marcan las
   métricas y la vista previa se rearma. Incluye el modelo de dos velocidades: se puede
   usar una métrica sin certificar, el sistema lo permite, lo marca y bloquea la
   publicación hasta que el owner la revise.
8. **Cuenco** (NH-12) — el copiloto. Anclado a la capa semántica, cita de qué indicador y versión
   salió cada cifra, advierte cuando algo no está certificado y respeta el alcance RLS
   del usuario. Además arma gráficos a demanda: se le pide un cruce en lenguaje natural
   y devuelve la especificación, que el portal dibuja y el usuario puede guardar.
9. **Mis gráficos** — la galería personal. Cada gráfico guardado conserva la pregunta que
   lo originó y los indicadores de los que salió, para poder auditarlo después.

El selector de sesión de la cabecera cubre CR-01 y cambia el alcance heredado de Unity Catalog: con la
jefa de categoría de Lácteos, las demás banderas y categorías desaparecen de los filtros
y Cuenco se niega a responder por ellas.

## Diseño

Los tokens salen del design system de Cencosud, no de un tema genérico:

| Token | Valor | Origen |
|---|---|---|
| Azul corporativo | `#095AA5` | muestreado del logo oficial |
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

## Cómo Cuenco genera gráficos

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
