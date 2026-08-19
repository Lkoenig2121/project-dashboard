"use client";

import { useRef, useState, type DragEvent, type ClipboardEvent } from "react";
import {
  filesToPromptImages,
  MAX_PROMPT_IMAGES,
  type PromptImage,
} from "@/lib/images";

export function ChatComposer({
  label,
  value,
  onChange,
  images,
  onImagesChange,
  placeholder,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  images: PromptImage[];
  onImagesChange: (images: PromptImage[]) => void;
  placeholder: string;
  rows?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const remaining = MAX_PROMPT_IMAGES - images.length;

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    if (remaining <= 0) {
      setImageError(`You can attach up to ${MAX_PROMPT_IMAGES} images.`);
      return;
    }
    try {
      const next = await filesToPromptImages(files, images.length);
      if (next.length === 0) {
        setImageError("Use a PNG, JPEG, WebP, or GIF.");
        return;
      }
      setImageError(null);
      onImagesChange([...images, ...next]);
    } catch (reason) {
      setImageError(reason instanceof Error ? reason.message : "Could not add that image");
    }
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (files.length === 0) return;
    event.preventDefault();
    void addFiles(files);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void addFiles(event.dataTransfer.files);
  }

  return (
    <div
      className={`border ${dragging ? "border-accent bg-accent-soft" : "border-line bg-background"}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={onDrop}
    >
      <label className="block px-3 pt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onPaste={onPaste}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted/70"
      />

      {images.length > 0 ? (
        <ul className="flex flex-wrap gap-2 border-t border-line px-3 py-2">
          {images.map((image) => (
            <li key={image.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.dataUrl}
                alt={image.name}
                className="h-16 w-16 border border-line object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  onImagesChange(images.filter((item) => item.id !== image.id))
                }
                className="absolute -right-1 -top-1 bg-foreground px-1.5 text-[10px] leading-4 text-white"
                aria-label={`Remove ${image.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={remaining <= 0}
          className="border border-line px-2.5 py-1 text-xs text-foreground disabled:opacity-50"
        >
          Add image
        </button>
        <p className="text-xs text-muted">
          Paste or drop · {images.length}/{MAX_PROMPT_IMAGES}
        </p>
      </div>
      {imageError ? (
        <p className="px-3 pb-2 text-xs leading-5 text-foreground">{imageError}</p>
      ) : null}
    </div>
  );
}
