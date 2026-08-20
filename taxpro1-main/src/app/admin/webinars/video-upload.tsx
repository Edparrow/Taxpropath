"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Film, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB, matching the bucket limit
const ACCEPTED = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];

/**
 * Uploads straight from the browser to Supabase Storage rather than through a
 * route handler — video files are far too large to buffer through a serverless
 * function. Storage RLS restricts writes to admins.
 */
export function VideoUpload({
  webinarId,
  initialPath,
  initialUrl,
}: {
  webinarId: string | null;
  initialPath: string | null;
  initialUrl: string;
}) {
  const [path, setPath] = useState(initialPath);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use an MP4, WebM, MOV, or MKV file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is larger than the 5 GB limit.");
      return;
    }

    // Key on the webinar id so re-uploads replace rather than accumulate.
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
    const key = `${webinarId ?? "unsaved"}/recording.${ext}`;

    setProgress(0);
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("webinar-videos")
      .upload(key, file, { upsert: true, contentType: file.type });

    setProgress(null);

    if (uploadError) {
      console.error("[admin] video upload failed", uploadError);
      setError(
        uploadError.message.includes("row-level security")
          ? "You don't have permission to upload videos."
          : "Upload failed. Please try again.",
      );
      return;
    }
    setPath(key);
  }

  return (
    <div>
      {/* Submitted with the form so the server records which object to use. */}
      <input type="hidden" name="video_path" value={path ?? ""} />

      {webinarId === null && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
          Save the webinar first, then upload a recording to it.
        </p>
      )}

      {path ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <CheckCircle2 className="size-5 shrink-0 text-brand-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-navy-950">Recording attached</p>
            <p className="truncate font-mono text-[12px] text-ink-muted">{path}</p>
          </div>
          <button
            type="button"
            onClick={() => setPath(null)}
            aria-label="Remove recording"
            className="cursor-pointer rounded-lg p-1.5 text-ink-muted transition-colors duration-200 hover:bg-white hover:text-red-700"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            disabled={webinarId === null || progress !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
            className="sr-only"
            id="video-file"
          />
          <label
            htmlFor="video-file"
            className={`flex items-center justify-center gap-2.5 rounded-xl border border-dashed px-4 py-8 text-[14px] font-semibold transition-colors duration-200 ${
              webinarId === null || progress !== null
                ? "cursor-not-allowed border-slate-200 text-slate-400"
                : "cursor-pointer border-slate-300 text-navy-950 hover:border-brand-400 hover:bg-brand-50/40"
            }`}
          >
            {progress !== null ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Uploading… this can take a while for large files
              </>
            ) : (
              <>
                <Upload className="size-4" aria-hidden />
                Choose a video file
              </>
            )}
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13.5px] font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-navy-950">
            <Film className="size-4" aria-hidden />
            Or link an externally hosted video
          </span>
          <input
            name="video_url"
            type="url"
            defaultValue={initialUrl}
            placeholder="https://player.vimeo.com/video/…"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500"
          />
          <span className="mt-1 block text-[12.5px] text-ink-muted">
            Used when no file is uploaded. Direct MP4 links play inline; Vimeo and
            YouTube links open in an embed.
          </span>
        </label>
      </div>
    </div>
  );
}
