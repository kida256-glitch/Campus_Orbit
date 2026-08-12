"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagPickerProps {
  /** Submitted as repeated form fields under this name. */
  name: string;
  options: readonly string[];
  defaultSelected?: string[];
  max?: number;
  /** Allow values outside `options`. */
  allowCustom?: boolean;
  label?: string;
  emptyHint?: string;
}

/**
 * Chip-based multi-select. Renders a hidden input per selection so it works
 * inside a plain Server Action form with no client-side state plumbing.
 */
export function TagPicker({
  name,
  options,
  defaultSelected = [],
  max = 20,
  allowCustom = false,
  label,
  emptyHint,
}: TagPickerProps) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [custom, setCustom] = useState("");

  const atLimit = selected.length >= max;

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length >= max
          ? current
          : [...current, value],
    );
  }

  function addCustom() {
    const value = custom.trim();
    if (!value || selected.includes(value) || atLimit) return;
    setSelected((current) => [...current, value]);
    setCustom("");
  }

  // Custom entries the student typed, shown alongside the catalog.
  const extras = selected.filter((item) => !options.includes(item));

  return (
    <div className="space-y-3">
      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      <div className="flex items-center justify-between">
        {label ? (
          <span className="text-sm font-medium text-navy-800">{label}</span>
        ) : (
          <span />
        )}
        <span
          className={cn(
            "text-xs tabular-nums",
            atLimit ? "font-medium text-amber-600" : "text-muted-foreground",
          )}
        >
          {selected.length}/{max}
        </span>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={label ?? name}
      >
        {[...options, ...extras].map((option) => {
          const isSelected = selected.includes(option);
          const disabled = !isSelected && atLimit;

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isSelected
                  ? "border-orbit-400 bg-orbit-50 font-medium text-orbit-700"
                  : "border-border text-navy-600 hover:border-orbit-200 hover:bg-secondary",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {isSelected ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <Plus className="size-3.5 opacity-50" aria-hidden />
              )}
              {option}
            </button>
          );
        })}
      </div>

      {selected.length === 0 && emptyHint ? (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      ) : null}

      {allowCustom ? (
        <div className="flex gap-2">
          <Input
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
            placeholder="Add your own…"
            aria-label="Add a custom value"
            disabled={atLimit}
            className="h-9"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustom}
            disabled={atLimit || !custom.trim()}
          >
            Add
          </Button>
        </div>
      ) : null}

      {extras.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {extras.map((extra) => (
            <span
              key={extra}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-navy-700"
            >
              {extra}
              <button
                type="button"
                onClick={() => toggle(extra)}
                aria-label={`Remove ${extra}`}
                className="rounded-full p-0.5 hover:bg-navy-200"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
