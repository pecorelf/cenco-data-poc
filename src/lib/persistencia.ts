import type { GraficoGuardado } from "./store";

// Dos niveles: primero el almacenamiento compartido, y si no está configurado
// o falla, el navegador. La demo nunca se queda sin guardar.

export type Modo = "compartido" | "local";

const clave = (usuario: string) => `cenco.misGraficos.${usuario}`;

function leerLocal(usuario: string): GraficoGuardado[] {
  try {
    const crudo = localStorage.getItem(clave(usuario));
    return crudo ? (JSON.parse(crudo) as GraficoGuardado[]) : [];
  } catch {
    return [];
  }
}

function escribirLocal(usuario: string, graficos: GraficoGuardado[]) {
  try {
    localStorage.setItem(clave(usuario), JSON.stringify(graficos));
  } catch {
    /* cuota llena o almacenamiento bloqueado */
  }
}

export async function cargar(
  usuario: string
): Promise<{ graficos: GraficoGuardado[]; modo: Modo }> {
  try {
    const r = await fetch(`/api/graficos?usuario=${encodeURIComponent(usuario)}`);
    const d = await r.json();
    if (d?.compartido) {
      // El compartido manda: se refleja también en local por si se cae la red.
      escribirLocal(usuario, d.graficos ?? []);
      return { graficos: d.graficos ?? [], modo: "compartido" };
    }
  } catch {
    /* sin red o sin función desplegada: seguimos en local */
  }
  return { graficos: leerLocal(usuario), modo: "local" };
}

export async function guardar(
  usuario: string,
  graficos: GraficoGuardado[]
): Promise<Modo> {
  // Local primero: es instantáneo y garantiza que nada se pierda.
  escribirLocal(usuario, graficos);
  try {
    const r = await fetch(`/api/graficos?usuario=${encodeURIComponent(usuario)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, graficos }),
    });
    const d = await r.json();
    return d?.compartido ? "compartido" : "local";
  } catch {
    return "local";
  }
}
