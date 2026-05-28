"use client";

// BulletEditor — inline per-bullet edit/delete/add for report sections.
// Receives and emits the same \n-delimited bullet string format used
// throughout the app. Syncs with the parent when value changes externally
// (e.g. after AI regeneration).

import { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, Plus, Check } from "lucide-react";

interface BulletEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyState?: string;
}

function parseItems(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);
}

function serializeItems(items: string[]): string {
  return items
    .filter(Boolean)
    .map((i) => `• ${i}`)
    .join("\n");
}

export default function BulletEditor({
  value,
  onChange,
  placeholder = "Add item…",
  emptyState,
}: BulletEditorProps) {
  const [items, setItems] = useState<string[]>(() => parseItems(value));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when parent value changes (e.g. after AI regeneration)
  useEffect(() => {
    setItems(parseItems(value));
    setEditingIndex(null);
  }, [value]);

  // Auto-focus input when edit mode starts
  useEffect(() => {
    if (editingIndex !== null) {
      inputRef.current?.focus();
    }
  }, [editingIndex]);

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(items[index] ?? "");
  }

  function commit() {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    const next = trimmed
      ? items.map((item, i) => (i === editingIndex ? trimmed : item))
      : items.filter((_, i) => i !== editingIndex); // empty → remove
    setItems(next);
    setEditingIndex(null);
    onChange(serializeItems(next));
  }

  function cancel() {
    if (editingIndex === null) return;
    // Newly added empty slot — remove it on cancel
    if (items[editingIndex] === "") {
      const next = items.filter((_, i) => i !== editingIndex);
      setItems(next);
      onChange(serializeItems(next));
    }
    setEditingIndex(null);
  }

  function remove(index: number) {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    onChange(serializeItems(next));
  }

  function addItem() {
    const next = [...items, ""];
    setItems(next);
    setEditingIndex(next.length - 1);
    setEditValue("");
  }

  return (
    <div className="space-y-0.5">
      {items.length === 0 && emptyState && (
        <p className="text-sm text-slate-400 italic pb-1">{emptyState}</p>
      )}

      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {/* Bullet dot */}
          <span className="text-slate-400 shrink-0 mt-2.5 text-sm leading-none select-none">•</span>

          {editingIndex === i ? (
            /* ── Edit mode ── */
            <div className="flex-1 flex items-center gap-1.5 py-1">
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commit(); }
                  if (e.key === "Escape") { e.preventDefault(); cancel(); }
                }}
                placeholder={placeholder}
                className="flex-1 text-sm text-slate-900 border border-orange-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-100 bg-white"
              />
              <button
                onMouseDown={(e) => { e.preventDefault(); commit(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-orange-500 active:bg-orange-600 shrink-0"
                aria-label="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* ── Display mode ── */
            <>
              <button
                onClick={() => startEdit(i)}
                className="flex-1 text-left text-sm text-slate-800 leading-relaxed py-2 active:text-slate-900"
              >
                {item}
              </button>
              <div className="flex items-center shrink-0 pt-1">
                <button
                  onClick={() => startEdit(i)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 active:text-orange-400 active:bg-orange-50 transition-colors"
                  aria-label="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(i)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 active:text-red-400 active:bg-red-50 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Add item */}
      <button
        onClick={addItem}
        className="flex items-center gap-1.5 text-sm text-slate-400 active:text-orange-500 transition-colors pt-1 pb-0.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Add item
      </button>
    </div>
  );
}
