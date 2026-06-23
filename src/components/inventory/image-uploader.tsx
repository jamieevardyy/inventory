"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

interface Props {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  /** Called when the first/primary image changes, for AI suggestions. */
  onPrimaryUploaded?: (img: ProductImage) => void;
}

export function ImageUploader({ images, onChange, onPrimaryUploaded }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const uploaded: ProductImage[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const img = await api<ProductImage>("/api/upload", {
          method: "POST",
          body: form,
        });
        uploaded.push(img);
      }
      const next = [...images, ...uploaded];
      onChange(next);
      if (onPrimaryUploaded && uploaded[0]) onPrimaryUploaded(uploaded[0]);
      toast.success(`Uploaded ${uploaded.length} image(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div
            key={img.storagePath || img.url}
            className="group relative h-24 w-24 overflow-hidden rounded-md border bg-muted"
          >
            {/* Use plain img to support local /uploads and arbitrary CDN hosts */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.fileName}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-primary/80 py-0.5 text-center text-[10px] text-primary-foreground">
                Primary
              </span>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            uploading && "opacity-60",
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="text-xs">{uploading ? "Uploading" : "Upload"}</span>
        </button>
      </div>

      {!images.length && !uploading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          The first image is used for AI suggestions.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
