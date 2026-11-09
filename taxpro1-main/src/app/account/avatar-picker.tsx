"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AVATAR_PRESETS, presetUrl } from "@/lib/avatar-presets";
import { UserAvatar } from "@/components/user-avatar";
import {
  chooseAvatar,
  removeAvatar,
  uploadAvatar,
  type AvatarResult,
} from "./actions";

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * The customer's profile picture with a camera button that opens a picker:
 * choose a ready-made avatar, upload a photo, or go back to initials.
 */
export function AvatarPicker({
  current,
  initials,
  variant = "avatar",
}: {
  current: string | null;
  initials: string;
  /** "avatar": the picture with a camera badge; "button": an "Add Avatar" button. */
  variant?: "avatar" | "button";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function run(key: string, action: () => Promise<AvatarResult>) {
    setError(null);
    setBusy(key);
    startTransition(async () => {
      const result = await action();
      setBusy(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("The photo must be 2 MB or smaller.");
      return;
    }
    const form = new FormData();
    form.append("photo", file);
    run("upload", () => uploadAvatar(form));
  }

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13.5px] font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white hover:text-navy-950"
        >
          <ImagePlus className="size-4 text-brand-300" aria-hidden />
          {current ? "Change Avatar" : "Add Avatar"}
        </button>
      ) : (
        <div className="relative">
          <UserAvatar
            src={current}
            initials={initials}
            className="size-24 text-2xl ring-4 ring-white shadow-md shadow-navy-950/10"
          />
          <button
            type="button"
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
            aria-label="Change profile picture"
            className="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center rounded-full bg-navy-950 text-white ring-4 ring-white transition-transform duration-200 hover:scale-110"
          >
            <Camera className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current && !pending) setOpen(false);
        }}
        aria-labelledby="avatar-picker-title"
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-3xl p-0 shadow-2xl backdrop:bg-navy-950/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="avatar-picker-title"
                className="text-xl font-bold text-navy-950"
              >
                Profile picture
              </h2>
              <p className="mt-1 text-[14px] text-ink-muted">
                Pick an avatar or upload your own photo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-navy-950"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13.5px] font-semibold text-red-700"
            >
              {error}
            </p>
          )}

          <p className="mt-6 text-[12px] font-bold uppercase tracking-wider text-slate-500">
            Choose an avatar
          </p>
          <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-8">
            {AVATAR_PRESETS.map((seed) => {
              const url = presetUrl(seed);
              const selected = current === url;
              return (
                <li key={seed}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(seed, () => chooseAvatar(seed))}
                    aria-label={`Use avatar ${seed}`}
                    aria-pressed={selected}
                    className={`relative block aspect-square w-full cursor-pointer overflow-hidden rounded-full transition-transform duration-200 hover:scale-110 disabled:cursor-wait ${
                      selected
                        ? "ring-[3px] ring-brand-500 ring-offset-2"
                        : "ring-1 ring-slate-200"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      loading="lazy"
                      className="size-full"
                    />
                    {(selected || busy === seed) && (
                      <span className="absolute inset-0 flex items-center justify-center bg-navy-950/40 text-white">
                        {busy === seed ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden
                          />
                        ) : (
                          <Check className="size-4" aria-hidden />
                        )}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onFile}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-navy-950 px-5 py-3 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
            >
              {busy === "upload" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-4" aria-hidden />
              )}
              Upload a photo
            </button>
            {current && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run("remove", removeAvatar)}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-[14px] font-semibold text-red-700 transition-colors duration-200 hover:border-red-300 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
              >
                {busy === "remove" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-4" aria-hidden />
                )}
                Remove
              </button>
            )}
          </div>
          <p className="mt-3 text-center text-[12.5px] text-slate-400">
            PNG, JPG or WebP, up to 2 MB. A square photo looks best.
          </p>
        </div>
      </dialog>
    </>
  );
}
