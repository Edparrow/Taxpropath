"use client";

import { useState } from "react";
import { Loader2, Lock, PlayCircle } from "lucide-react";

type Load =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; url: string; kind: string }
  | { state: "error"; message: string };

function toEmbed(url: string): string | null {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return null;
}

/**
 * Recordings are paid content, so the URL is never rendered into the page up
 * front — it's fetched on demand and the server decides whether this viewer is
 * entitled to it.
 */
export function WebinarVideo({ slug }: { slug: string }) {
  const [load, setLoad] = useState<Load>({ state: "idle" });

  async function play() {
    setLoad({ state: "loading" });
    try {
      const res = await fetch(`/api/webinar-video?slug=${encodeURIComponent(slug)}`);
      const body = await res.json();
      if (!res.ok) {
        setLoad({ state: "error", message: body.error ?? "Could not load video." });
        return;
      }
      setLoad({ state: "ready", url: body.url, kind: body.kind });
    } catch {
      setLoad({ state: "error", message: "Could not load video." });
    }
  }

  if (load.state === "ready") {
    const embed = toEmbed(load.url);
    return (
      <div className="overflow-hidden rounded-2xl bg-navy-950">
        {embed ? (
          <iframe
            src={embed}
            title="Webinar recording"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        ) : (
          <video src={load.url} controls autoPlay className="aspect-video w-full">
            Your browser does not support video playback.
          </video>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-navy-950 px-6 py-14 text-center">
      {load.state === "error" ? (
        <>
          <Lock className="mx-auto size-8 text-white/40" aria-hidden />
          <p className="mt-3 text-[14.5px] font-semibold text-white">{load.message}</p>
          <button
            type="button"
            onClick={play}
            className="mt-4 cursor-pointer text-[13.5px] font-semibold text-brand-400 hover:underline"
          >
            Try again
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={play}
          disabled={load.state === "loading"}
          className="mx-auto flex cursor-pointer flex-col items-center gap-3 disabled:cursor-wait"
        >
          {load.state === "loading" ? (
            <Loader2 className="size-10 animate-spin text-white/70" aria-hidden />
          ) : (
            <PlayCircle
              className="size-14 text-white/80 transition-transform duration-200 hover:scale-105"
              aria-hidden
            />
          )}
          <span className="text-[14.5px] font-bold text-white">
            {load.state === "loading" ? "Loading…" : "Watch the recording"}
          </span>
        </button>
      )}
    </div>
  );
}
