"use client";

import { useRef, useState, useTransition } from "react";
import { ImageUp, Loader2, X } from "lucide-react";
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES, IMAGE_MAX_LABEL, IMAGE_MIME_TYPES } from "@/lib/admin/image-upload";
import { uploadContentImage } from "./upload-actions";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14.5px] text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

/**
 * A link field with an "Upload image" button. Uploading stores the file and
 * puts its URL in the field; the URL is saved with the rest of the form.
 */
export function ImageField({
  resourceSlug,
  name,
  required,
  defaultValue,
}: {
  resourceSlug: string;
  name: string;
  required?: boolean;
  defaultValue: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const picker = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again after an error
    if (!file) return;

    setError(null);
    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Only WebP and PNG images are allowed.");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError(`The image must be ${IMAGE_MAX_LABEL} or smaller.`);
      return;
    }

    startUpload(async () => {
      const body = new FormData();
      body.append("file", file);
      const result = await uploadContentImage(resourceSlug, body);
      if ("error" in result) setError(result.error);
      else setUrl(result.url);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          id={name}
          name={name}
          type="text"
          required={required}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… or upload an image"
          className={`${INPUT} min-w-0 flex-1`}
        />
        <input
          ref={picker}
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={onPick}
          className="hidden"
          aria-hidden
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={() => picker.current?.click()}
          disabled={uploading}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-[13.5px] font-bold text-brand-700 transition-colors duration-200 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ImageUp className="size-4" aria-hidden />
          )}
          {uploading ? "Uploading…" : "Upload image"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800">
          {error}
        </p>
      )}

      {url && (
        <div className="relative inline-block max-w-full overflow-hidden rounded-xl border border-slate-200 bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Preview" className="max-h-56 w-auto max-w-full object-contain" />
          <button
            type="button"
            onClick={() => setUrl("")}
            aria-label="Remove image"
            className="absolute right-2 top-2 flex size-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:text-red-600"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
