// Persistencia de Mis gráficos.
// Usa la API REST de Upstash, así que no necesita SDK ni conexión TCP persistente:
// encaja con el modelo serverless de Vercel. Si no está configurada, responde
// que no lo está y el cliente cae a almacenamiento local sin romperse.

// Se leen dentro de la petición, no al cargar el módulo: en desarrollo el .env
// se inyecta después de que Vite construye el servidor.
const credenciales = () => ({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const configurado = () => {
  const { url, token } = credenciales();
  return Boolean(url && token);
};

const clave = (usuario: string) => `cenco:graficos:${usuario}`;

async function redis(comando: string[]): Promise<unknown> {
  const { url, token } = credenciales();
  const r = await fetch(url!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(comando),
  });
  if (!r.ok) throw new Error(`Upstash respondió ${r.status}`);
  const { result } = (await r.json()) as { result: unknown };
  return result;
}

async function leerCuerpo(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") return req.body;
  const crudo =
    typeof req.body === "string"
      ? req.body
      : await new Promise<string>((resolve) => {
          let d = "";
          req.on("data", (c: Buffer) => (d += c));
          req.on("end", () => resolve(d));
        });
  try {
    return JSON.parse(crudo || "{}");
  } catch {
    return {};
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const responder = (estado: number, cuerpo: unknown) => {
    res.statusCode = estado;
    res.end(JSON.stringify(cuerpo));
  };

  // Sin credenciales el portal sigue funcionando: el cliente guarda local.
  if (!configurado()) {
    responder(200, {
      compartido: false,
      graficos: [],
      motivo:
        "Almacenamiento compartido no configurado. Define UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN para que los gráficos se vean desde cualquier equipo.",
    });
    return;
  }

  try {
    const url = new URL(req.url ?? "", "http://local");
    const usuario = (url.searchParams.get("usuario") ?? "").trim();

    if (req.method === "GET") {
      if (!usuario) return responder(400, { error: "Falta el parámetro usuario." });
      const crudo = (await redis(["GET", clave(usuario)])) as string | null;
      const graficos = crudo ? JSON.parse(crudo) : [];
      return responder(200, { compartido: true, graficos });
    }

    if (req.method === "PUT") {
      const cuerpo = await leerCuerpo(req);
      const id = String(cuerpo.usuario ?? usuario).trim();
      if (!id) return responder(400, { error: "Falta el identificador de usuario." });
      if (!Array.isArray(cuerpo.graficos)) {
        return responder(400, { error: "El cuerpo debe traer un arreglo de gráficos." });
      }
      // La lista completa se reemplaza: para una demo es más predecible que
      // reconciliar operaciones parciales entre asistentes.
      await redis(["SET", clave(id), JSON.stringify(cuerpo.graficos)]);
      return responder(200, { compartido: true, guardados: cuerpo.graficos.length });
    }

    return responder(405, { error: "Método no soportado. Usa GET o PUT." });
  } catch (e: unknown) {
    return responder(200, {
      compartido: false,
      graficos: [],
      motivo: `No se pudo acceder al almacenamiento compartido: ${
        e instanceof Error ? e.message : String(e)
      }`,
    });
  }
}
