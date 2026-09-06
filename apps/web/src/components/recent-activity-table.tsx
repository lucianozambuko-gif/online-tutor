import Link from "next/link";

export interface RecentItem {
  id: string;
  title: string;
  subject: string | null;
  type: "Note" | "Flashcards" | "Quiz";
  createdAt: string;
  href: string;
  result: string;
}

const TYPE_STYLE: Record<RecentItem["type"], string> = {
  Note: "bg-sky-100 text-sky-700",
  Flashcards: "bg-gold-300/35 text-gold-600",
  Quiz: "bg-ink-700/8 text-ink-700",
};

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

export function RecentActivityTable({ items, search }: { items: RecentItem[]; search: string }) {
  const query = search.trim().toLowerCase();
  const filtered = query
    ? items.filter((item) => item.title.toLowerCase().includes(query) || item.subject?.toLowerCase().includes(query))
    : items;

  return (
    <div className="rounded-2xl border border-ink-700/10 bg-white p-6 shadow-sm sm:p-7">
      <p className="text-base font-semibold text-ink-900">Recent activity</p>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[3fr_1.4fr_1fr_1fr_1.2fr] gap-3 border-b border-ink-700/10 pb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">Title</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">Subject</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">Type</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">Created</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">Result</span>
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-300">
              {items.length === 0 ? "Nothing generated yet — start with a note, flashcard set or quiz." : "No items match your search."}
            </p>
          ) : (
            filtered.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.href}
                className="grid grid-cols-[3fr_1.4fr_1fr_1fr_1.2fr] items-center gap-3 border-b border-ink-700/6 py-3.5 transition last:border-0 hover:bg-cream-soft"
              >
                <span className="truncate text-sm font-medium text-ink-900">{item.title}</span>
                <span className="truncate text-[13px] text-ink-500">{item.subject ?? "General"}</span>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${TYPE_STYLE[item.type]}`}
                >
                  {item.type}
                </span>
                <span className="text-[13px] text-ink-500">{timeAgo(item.createdAt)}</span>
                <span className="truncate text-[13px] font-medium text-ink-700">{item.result}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
