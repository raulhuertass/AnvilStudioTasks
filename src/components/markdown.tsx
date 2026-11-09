import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

/**
 * Markdown solo junta las líneas en blanco seguidas en una. Aquí cada línea en
 * blanco extra se conserva como un párrafo vacío, salvo dentro de bloques de código.
 */
function keepBlankLines(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/(```[\s\S]*?```)/g)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(/\n{3,}/g, (run) => `\n\n${"&nbsp;\n\n".repeat(run.length - 2)}`),
    )
    .join("");
}

/** Markdown de usuario: el HTML incrustado se ignora y las URLs peligrosas se eliminan. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown text-sm">
      <ReactMarkdown
        // remark-breaks convierte cada salto de línea en un salto visible.
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ children: label, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ),
        }}
      >
        {keepBlankLines(children)}
      </ReactMarkdown>
    </div>
  );
}
