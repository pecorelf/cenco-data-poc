import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-sonnet-4-6";

const REGLAS = `Eres Cuenco, el agente del Portal BI Unificado 360° de Cencosud, para Marcas Propias y Supermercados Chile.

Tu única fuente de verdad es la capa semántica que viene en el contexto. Reglas que no puedes romper:

1. Responde solo con los indicadores y las cifras del contexto. Si te preguntan algo que la capa semántica no define, dilo y ofrece lo más cercano que sí exista. Nunca estimes ni inventes un número.
2. Cada vez que entregues una cifra, di de qué indicador viene, en qué versión y quién responde por él. Una línea, al final, sin ceremonia.
3. Si el indicador no está certificado, adviértelo antes de dar el número.
4. Respeta el alcance del usuario en sesión. Si pregunta por una bandera o categoría fuera de su alcance, explícale que Unity Catalog no se lo permite y no entregues la cifra.
5. Eres un agente de navegación y consulta, no un analista que opina. Puedes describir lo que muestran los datos y sugerir a qué informe ir. No propongas acciones comerciales ni proyecciones.

Escribe en español neutro, sin voseo. Frases cortas. Sin marketing. Nada de listas largas: dos o tres párrafos como máximo.`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Usa POST." }));
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error:
          "Falta ANTHROPIC_API_KEY. Agrégala en las variables de entorno del proyecto en Vercel, o en .env para desarrollo local.",
      })
    );
    return;
  }

  // El body puede venir ya parseado (Vercel) o como stream (dev server).
  let body = req.body;
  if (!body || typeof body === "string") {
    const crudo =
      typeof body === "string"
        ? body
        : await new Promise<string>((resolve) => {
            let d = "";
            req.on("data", (c: Buffer) => (d += c));
            req.on("end", () => resolve(d));
          });
    try {
      body = JSON.parse(crudo || "{}");
    } catch {
      body = {};
    }
  }

  const { messages = [], contexto = "" } = body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    contexto: string;
  };

  const limpios = messages
    .filter((m) => m && m.content && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  if (!limpios.length) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "No llegó ninguna pregunta." }));
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const enviar = (p: unknown) => {
    try {
      res.write(`data: ${JSON.stringify(p)}\n\n`);
    } catch {
      /* conexión ya cerrada */
    }
  };

  // Heartbeat: mantiene viva la conexión mientras el modelo piensa.
  const latido = setInterval(() => enviar({ type: "ping" }), 3000);

  // res.on, no req.on: en Node moderno req 'close' dispara al terminar de
  // consumir el body, no al cortarse la conexión.
  let abortado = false;
  res.on("close", () => {
    abortado = true;
    clearInterval(latido);
  });

  try {
    const anthropic = new Anthropic({ apiKey: key });

    // Llamada sin streaming y troceo manual: más estable entre versiones de Node.
    const r = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1200,
      system: `${REGLAS}\n\n=== CONTEXTO DE LA CAPA SEMÁNTICA ===\n${contexto}`,
      messages: limpios,
    });

    const texto = r.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    for (let i = 0; i < texto.length && !abortado; i += 18) {
      enviar({ type: "text", text: texto.slice(i, i + 18) });
      await new Promise((s) => setTimeout(s, 12));
    }

    clearInterval(latido);
    if (!abortado) {
      enviar({ type: "done" });
      res.end();
    }
  } catch (err: any) {
    clearInterval(latido);
    enviar({
      type: "error",
      error: `${err?.status ?? ""} ${err?.message ?? String(err)}`.trim(),
    });
    try {
      res.end();
    } catch {
      /* ya cerrada */
    }
  }
}
