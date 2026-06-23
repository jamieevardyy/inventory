"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

/** Comma/Enter separated tag editor used for keywords, aliases, common names. */
export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter…",
  className,
  id,
}: TagInputProps) {
  const [draft, setDraft] = React.useState("");

  const addTags = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="rounded-full hover:text-destructive"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTags(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            remove(value[value.length - 1]);
          }
        }}
        onBlur={() => addTags(draft)}
        placeholder={value.length ? "" : placeholder}
        className="flex-1 min-w-[8ch] bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
