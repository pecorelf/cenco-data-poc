import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";

/**
 * En Vercel, /api/chat.ts se despliega solo como función serverless.
 * En local, este plugin monta el mismo handler sobre el dev server,
 * así el código es uno solo en los dos entornos.
 */
function apiEnDesarrollo(): PluginOption {
  return {
    name: "api-en-desarrollo",
    configureServer(server) {
      server.middlewares.use("/api/chat", async (req, res, next) => {
        try {
          const { default: handler } = await server.ssrLoadModule("/api/chat.ts");
          await handler(req, res);
        } catch (e) {
          next(e);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiEnDesarrollo()],
  server: { port: 5173 },
});
