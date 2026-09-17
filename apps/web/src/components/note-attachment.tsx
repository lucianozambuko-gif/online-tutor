import type { TutorNote } from "@/lib/api";

function PaperclipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 9.5 12.5 18a4 4 0 0 1-5.7-5.7L15 4a2.7 2.7 0 0 1 3.8 3.8L10 16.5a1.3 1.3 0 0 1-1.9-1.8L15.5 7" />
    </svg>
  );
}

export function NoteAttachment({ note }: { note: TutorNote }) {
  if (!note.attachmentData) return null;
  const src = `data:${note.attachmentMimeType};base64,${note.attachmentData}`;
  const isImage = note.attachmentMimeType?.startsWith("image/");

  if (isImage) {
    return (
      <a href={src} download={note.attachmentName ?? "attachment"} className="mt-3 block w-fit">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={note.attachmentName ?? "Attachment"} className="max-h-40 rounded-lg border border-ink-700/10" />
      </a>
    );
  }

  return (
    <a
      href={src}
      download={note.attachmentName ?? "attachment"}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-ink-700/15 px-3 py-1.5 text-sm text-sky-700 hover:border-sky-400/50"
    >
      <PaperclipIcon />
      {note.attachmentName ?? "Download attachment"}
    </a>
  );
}
