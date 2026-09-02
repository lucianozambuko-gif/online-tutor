import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// The system prompt asks the model for $...$ / $$...$$ math delimiters (what
// remark-math expects), but models occasionally default back to \( \) / \[ \]
// out of habit — normalize those too rather than showing raw LaTeX brackets.
function normalizeMathDelimiters(text: string): string {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => `$$${expr}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => `$${expr}$`);
}

// Minimal styling for AI chat replies — the model naturally writes markdown
// (bold, lists, headings, math); react-markdown otherwise renders unstyled
// semantic HTML, which just runs together with no spacing in a chat bubble.
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-[0.95em] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-ink-900">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-ink-700/8 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
          ),
          h1: ({ children }) => <p className="font-semibold text-ink-900">{children}</p>,
          h2: ({ children }) => <p className="font-semibold text-ink-900">{children}</p>,
          h3: ({ children }) => <p className="font-semibold text-ink-900">{children}</p>,
        }}
      >
        {normalizeMathDelimiters(content)}
      </ReactMarkdown>
    </div>
  );
}
