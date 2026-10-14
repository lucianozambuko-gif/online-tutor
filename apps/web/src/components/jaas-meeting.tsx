"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMeetingToken, ApiError, type MeetingToken } from "@/lib/api";
import { buttonClass, ErrorText } from "@/components/ui";

// Minimal typing for the 8x8 JaaS iframe API loaded from external_api.js.
interface JitsiApi {
  addListener(event: string, fn: (...args: unknown[]) => void): void;
  dispose(): void;
}
declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

function loadJaasScript(appId: string): Promise<void> {
  const src = `https://8x8.vc/${appId}/external_api.js`;
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Couldn't load the video service. Check your connection and try again.")));
    if (!existing) {
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

/**
 * Embedded 8x8 JaaS video room for one booking. The API decides who can
 * enter (only that booking's tutor and student) and signs a token for that
 * room only; the tutor joins as moderator.
 */
export function JaasMeeting({ bookingId, backHref }: { bookingId: string; backHref: string }) {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingToken | null>(null);
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let api: JitsiApi | null = null;

    (async () => {
      try {
        const t = await getMeetingToken(bookingId);
        if (cancelled) return;
        setMeeting(t);

        await loadJaasScript(t.roomName.split("/")[0]);
        if (cancelled || !container.current || !window.JitsiMeetExternalAPI) return;

        const isTutor = t.role === "tutor";
        api = new window.JitsiMeetExternalAPI(t.domain, {
          roomName: t.roomName,
          jwt: t.jwt,
          parentNode: container.current,
          width: "100%",
          height: "100%",
          configOverwrite: {
            prejoinPageEnabled: true, // camera/mic check before entering
            disableDeepLinking: true, // stay in the browser on phones
            startWithAudioMuted: !isTutor,
            disableInviteFunctions: true,
            toolbarButtons: [
              "microphone",
              "camera",
              "desktop",
              "chat",
              "raisehand",
              "whiteboard",
              "tileview",
              "fullscreen",
              "settings",
              "hangup",
              ...(isTutor ? ["participants-pane", "mute-everyone", "security"] : []),
            ],
          },
          interfaceConfigOverwrite: { MOBILE_APP_PROMO: false },
        });

        // The iframe shows its own pre-join screen from here on.
        setRoomLoaded(true);
        api.addListener("readyToClose", () => {
          api?.dispose();
          api = null;
          router.push(backHref);
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError || err instanceof Error ? err.message : "Couldn't open this session.");
        }
      }
    })();

    return () => {
      cancelled = true;
      api?.dispose();
    };
  }, [bookingId, backHref, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Link href={backHref} className="text-sm text-sky-700 hover:text-sky-800">
          &larr; Back to sessions
        </Link>
        <ErrorText>{error}</ErrorText>
        <button onClick={() => location.reload()} className={buttonClass("primary")}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={backHref} className="text-sm text-sky-700 hover:text-sky-800">
            &larr; Back to sessions
          </Link>
          {meeting && (
            <h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink-900">
              {meeting.subject} · with {meeting.otherPartyName}
            </h1>
          )}
        </div>
        {meeting && (
          <span className="text-xs text-ink-500">
            Scheduled to end {new Date(meeting.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="relative h-[calc(100dvh-11rem)] min-h-[420px] w-full overflow-hidden rounded-2xl bg-ink-900">
        {!roomLoaded && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/70">
            {meeting ? "Opening the room…" : "Preparing your session…"}
          </div>
        )}
        <div ref={container} className="h-full w-full" />
      </div>
    </div>
  );
}
