import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";

/**
 * En Vercel, los archivos de /api se despliegan solos como funciones serverless
 * y reciben las variables de entorno del proyecto. En local no ocurre ninguna de
 * las dos cosas, así que este plugin monta los mismos handlers sobre el dev
 * server y carga el .env en process.env para que los lean igual que en Vercel.
 */
function apiEnDesarrollo(modo: string): PluginOption {
  return {
    name: "api-en-desarrollo",
    configureServer(server) {
      // loadEnv sin prefijo trae todas las variables, no solo las VITE_.
      Object.assign(process.env, loadEnv(modo, process.cwd(), ""));

      for (const ruta of ["chat", "graficos"]) {
        server.middlewares.use(`/api/${ruta}`, async (req, res, next) => {
          try {
            const { default: handler } = await server.ssrLoadModule(`/api/${ruta}.ts`);
            await handler(req, res);
          } catch (e) {
            next(e);
          }
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), apiEnDesarrollo(mode)],
  server: { port: 5173 },
}));
