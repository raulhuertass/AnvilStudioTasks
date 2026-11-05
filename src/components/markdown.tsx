import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Markdown de usuario: el HTML incrustado se ignora y las URLs peligrosas se eliminan. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children: label, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
