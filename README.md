# Portal BI & Analytics Unificado 360° — POC Cencosud

Demo construida por **Deloitte Digital** para el RFP de Migración y Portal BI Unificado
de Cencosud (Subgerencia Advanced Analytics & BI · Marcas Propias & Supermercados Chile).

## Qué demuestra

La tesis de la demo no es que se puede hacer un dashboard bonito. Es que **una métrica
tiene una sola definición, un solo responsable y un solo linaje**, y que tres motores de
consumo distintos devuelven exactamente la misma cifra.

El recorrido tiene cinco pantallas:

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
5. **Cuenco** — el agente. Anclado a la capa semántica, cita de qué indicador y versión
   salió cada cifra, advierte cuando algo no está certificado y respeta el alcance RLS
   del usuario en sesión.

El selector de sesión de la cabecera cambia el alcance heredado de Unity Catalog: con la
jefa de categoría de Lácteos, las demás banderas y categorías desaparecen de los filtros
y Cuenco se niega a responder por ellas.

## Stack

React 18 · Vite · TypeScript · Tailwind · Zustand · Recharts · Anthropic SDK.
La API es una función serverless en `api/chat.ts` que corre igual en Vercel y en local
(un plugin de Vite la monta sobre el dev server).

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
