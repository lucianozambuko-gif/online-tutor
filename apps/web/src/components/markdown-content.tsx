import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// The model sometimes writes literal HTML tags (e.g. <br> inside a table
// cell) alongside markdown — react-markdown escapes raw HTML as plain text
// by default (a safe default), so rehype-raw is needed to actually render it.
// rehype-katex runs before sanitize (it needs to see the math nodes it's
// converting; sanitizing first could strip them before it gets the chance),
// so sanitize ends up cleaning KaTeX's own output too, not just raw HTML from
// the model — hence extending the schema with what KaTeX's HTML+MathML output
// actually relies on (span/div class + inline style, and the MathML tags in
// its accessibility layer), while still blocking script/iframe/on*/etc.
const mathmlTags = [
  "math",
  "semantics",
  "mrow",
  "mi",
  "mn",
  "mo",
  "msup",
  "msub",
  "msubsup",
  "mfrac",
  "msqrt",
  "mroot",
  "mtext",
  "mspace",
  "mtable",
  "mtr",
  "mtd",
  "mstyle",
  "mpadded",
  "mphantom",
  "annotation",
];

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...mathmlTags],
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), "className", "style"],
    div: [...(defaultSchema.attributes?.div ?? []), "className", "style"],
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className"],
  },
};

// The system prompt asks the model for $...$ / $$...$$ math delimiters (what
// remark-math expects), but models occasionally default back to \( \) / \[ \]
// out of habit — normalize those too rather than showing raw LaTeX brackets.
function normalizeMathDelimiters(text: string): string {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => `$$${expr}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => `$${expr}$`);
}

// Shared renderer for anything AI-generated (chat replies, notes, flashcards,
// quiz text) — the model naturally writes GFM markdown (tables, headings,
// math); react-markdown otherwise renders unstyled semantic HTML, which runs
// together with no spacing, and doesn't support tables at all without
// remark-gfm (they'd render as raw "| a | b |" text instead).
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-[0.95em] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, [rehypeSanitize, sanitizeSchema]]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-ink-900">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-ink-700/8 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
          ),
          h1: ({ children }) => (
            <h1 className="font-display text-lg font-semibold text-ink-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display text-base font-semibold text-ink-900">{children}</h2>
          ),
          h3: ({ children }) => <h3 className="text-sm font-semibold text-ink-900">{children}</h3>,
          hr: () => <hr className="border-ink-700/10" />,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-ink-700/15">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 font-semibold text-ink-900">{children}</th>,
          td: ({ children }) => <td className="border-t border-ink-700/10 px-3 py-2 align-top">{children}</td>,
        }}
      >
        {normalizeMathDelimiters(content)}
      </ReactMarkdown>
    </div>
  );
}
