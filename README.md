# Portal BI & Analytics Unificado 360° — POC Cencosud

Demo construida por **Deloitte Digital** para el RFP de Migración y Portal BI Unificado
de Cencosud (Subgerencia Advanced Analytics & BI · Marcas Propias & Supermercados Chile).

## Qué demuestra

La tesis de la demo no es que se puede hacer un dashboard bonito. Es que **una métrica
tiene una sola definición, un solo responsable y un solo linaje**, y que tres motores de
consumo distintos devuelven exactamente la misma cifra.

El recorrido tiene seis pantallas:

1. **Diagnóstico** — tres áreas reportan el margen de marca propia de agosto con tres
   cifras distintas. Ninguna calculó mal; cada una respondió a una definición que nunca
   se acordó. Al revelar la cifra certificada se explica por qué cada una difiere.
2. **Capa semántica** — el catálogo de indicadores. Cada uno con su fórmula, su owner
   nombrado, su linaje hasta las tablas Gold, qué considera y qué deja fuera, y qué
   motores lo consumen. Es el equivalente a Unity Catalog Metric Views.
3. **Informes certificados** — venta contra plan, margen y participación, los tres
   reportes que el RFP nombra textualmente. Todo resuelve contra la capa semántica.
4. **Informes personalizados** — el report builder y el modelo de dos velocidades. Se
   puede usar un indicador sin certificar: el sistema lo permite, lo marca y bloquea su
   publicación hasta que el owner lo revise.
5. **Cuenco** — el copiloto. Anclado a la capa semántica, cita de qué indicador y versión
   salió cada cifra, advierte cuando algo no está certificado y respeta el alcance RLS
   del usuario. Además arma gráficos a demanda: se le pide un cruce en lenguaje natural
   y devuelve la especificación, que el portal dibuja y el usuario puede guardar.
6. **Mis gráficos** — la galería personal. Cada gráfico guardado conserva la pregunta que
   lo originó y los indicadores de los que salió, para poder auditarlo después.

El selector de sesión de la cabecera cambia el alcance heredado de Unity Catalog: con la
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

## Correr en local

```bash
npm install
cp .env.example .env      # pega tu ANTHROPIC_API_KEY
npm run dev               # http://localhost:5173
```

## Desplegar en Vercel

Importa el repo, framework Vite. Agrega `ANTHROPIC_API_KEY` en Environment Variables.
El resto es automático.

## Sobre los datos

**Todos los datos de este repositorio son sintéticos.** Las cifras, categorías, nombres
de responsables y estructuras de tablas son verosímiles para un negocio de marca propia
en supermercados, pero no provienen de Cencosud ni pretenden representar su realidad.
Están para sostener la narrativa de gobierno, no para afirmar nada sobre el negocio.
