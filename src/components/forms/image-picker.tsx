"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Link2, Loader2, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImagePickerProps {
  /** The form field name the resolved URL is submitted under. */
  name: string;
  /** Pre-filled URL (for editing). */
  defaultValue?: string | null;
  label?: string;
  hint?: string;
  error?: string;
}

type Mode = "idle" | "link" | "uploading" | "done" | "error";

/**
 * Dual-mode image picker: paste a URL or upload a file.
 *
 * On upload the file goes to Supabase Storage (`images` bucket) and the
 * returned public URL is written into the hidden input so the form action
 * receives a single URL string regardless of which path was used.
 */
export function ImagePicker({
  name,
  defaultValue,
  label = "Image",
  hint,
  error,
}: ImagePickerProps) {
  const [mode, setMode] = useState<Mode>(defaultValue ? "done" : "idle");
  const [url, setUrl] = useState(defaultValue ?? "");
  const [linkInput, setLinkInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const resolved = url || "";
  const displayError = error ?? uploadError;

  async function handleFile(file: File) {
    setMode("uploading");
    setUploadError("");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("images")
        .upload(path, file, { upsert: false });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data } = supabase.storage.from("images").getPublicUrl(path);
      setUrl(data.publicUrl);
      setMode("done");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setMode("error");
    }
  }

  function handleLinkConfirm() {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    setUrl(trimmed);
    setMode("done");
    setLinkInput("");
  }

  function clear() {
    setUrl("");
    setMode("idle");
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-sm font-medium leading-none text-navy-800">{label}</p>
      ) : null}

      {/* Hidden field the form action reads */}
      <input type="hidden" name={name} value={resolved} />

      {mode === "done" && resolved ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <div className="relative aspect-[16/9] w-full bg-secondary">
            <Image
              src={resolved}
              alt="Selected image"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 480px"
            />
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="destructive"
            className="absolute right-2 top-2"
            onClick={clear}
            aria-label="Remove image"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : mode === "uploading" ? (
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-border bg-secondary">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <p className="text-xs">Uploading…</p>
          </div>
        </div>
      ) : mode === "link" ? (
        <div className="flex gap-2">
          <Input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleLinkConfirm())}
            placeholder="https://example.com/image.jpg"
            autoFocus
            className="flex-1"
          />
          <Button type="button" size="sm" onClick={handleLinkConfirm} disabled={!linkInput.trim()}>
            Use
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode("idle")}>
            Cancel
          </Button>
        </div>
      ) : (
        /* idle or error state */
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            "cursor-pointer hover:border-orbit-300 hover:bg-orbit-50/40",
            displayError ? "border-destructive" : "border-border",
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload an image or drag and drop"
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-navy-500">
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-navy-800">
              Drag &amp; drop or click to upload
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              JPG, PNG, WebP — max 5 MB
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px w-12 bg-border" />
            <span>or</span>
            <span className="h-px w-12 bg-border" />
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setMode("link");
            }}
          >
            <Link2 className="size-3.5" aria-hidden />
            Paste a link
          </Button>

          {displayError ? (
            <p className="text-xs text-destructive">{displayError}</p>
          ) : null}
        </div>
      )}

      {/* Native file input — hidden, triggered by the drop zone */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {hint && !displayError ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
