import type { ReactNode } from "react";

// BIA escribe prosa corta con **negrita** ocasional y `código` para nombres
// de columnas o indicadores. Esto es un parser propio, no una librería de
// markdown completa: solo reconoce lo que el prompt de BIA puede producir,
// y nunca usa dangerouslySetInnerHTML.

interface Bloque {
  tipo: "parrafo" | "lista";
  lineas: string[];
}

function agruparBloques(texto: string): Bloque[] {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const bloques: Bloque[] = [];
  let actual: Bloque | null = null;

  for (const linea of lineas) {
    const esItem = /^[-•]\s+/.test(linea.trim());
    if (esItem) {
      const contenido = linea.trim().replace(/^[-•]\s+/, "");
      if (actual?.tipo === "lista") actual.lineas.push(contenido);
      else {
        actual = { tipo: "lista", lineas: [contenido] };
        bloques.push(actual);
      }
    } else if (linea.trim() === "") {
      actual = null;
    } else if (actual?.tipo === "parrafo") {
      actual.lineas.push(linea.trim());
    } else {
      actual = { tipo: "parrafo", lineas: [linea.trim()] };
      bloques.push(actual);
    }
  }
  return bloques;
}

function inline(texto: string, clave: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = regex.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      partes.push(
        <strong key={`${clave}-b${i++}`} className="font-semibold text-cenco-deep">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      partes.push(
        <code
          key={`${clave}-c${i++}`}
          className="px-1.5 py-0.5 rounded bg-cenco-soft text-cenco-deep text-[12px] font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    ultimo = m.index + token.length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

export function TextoFormateado({ texto }: { texto: string }) {
  const bloques = agruparBloques(texto);
  return (
    <>
      {bloques.map((b, bi) =>
        b.tipo === "lista" ? (
          <ul key={bi} className={`space-y-1 ${bi > 0 ? "mt-2" : ""}`}>
            {b.lineas.map((l, li) => (
              <li key={li} className="pl-4 relative">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-cenco" />
                {inline(l, `${bi}-${li}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={bi} className={bi > 0 ? "mt-2" : ""}>
            {inline(b.lineas.join(" "), `${bi}`)}
          </p>
        )
      )}
    </>
  );
}
