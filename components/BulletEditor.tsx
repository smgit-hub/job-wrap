"use client";

// BulletEditor — inline per-bullet edit/delete/move/reorder for report sections.
// Receives and emits the same \n-delimited bullet string format used throughout the app.
// Drag-to-reorder uses @dnd-kit/sortable with pointer events (touch + mouse).

import { useState, useEffect, useRef } from "react";
import { Trash2, Plus, Check, ArrowRightLeft, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Types ────────────────────────────────────────────────────────────────────

interface BulletItem {
  id: string;
  text: string;
}

interface BulletEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMove?: (text: string) => void;
  placeholder?: string;
  emptyState?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let _idSeq = 0;
function genId() { return `bi_${++_idSeq}`; }

function parseItems(value: string): BulletItem[] {
  return value
    .split("\n")
    .map((l) => l.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean)
    .map((text) => ({ id: genId(), text }));
}

function serializeItems(items: BulletItem[]): string {
  return items.filter((i) => i.text).map((i) => `• ${i.text}`).join("\n");
}

// ── Sortable bullet row ──────────────────────────────────────────────────────

interface SortableBulletProps {
  item: BulletItem;
  isEditing: boolean;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder: string;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onMove?: (text: string) => void;
}

function SortableBullet({
  item,
  isEditing,
  editValue,
  inputRef,
  placeholder,
  onStartEdit,
  onEditChange,
  onCommit,
  onCancel,
  onRemove,
  onMove,
}: SortableBulletProps) {
  const [armed, setArmed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: isDragging ? "relative" : undefined,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex items-start gap-1.5"
    >
      {/* Drag handle — listeners only here so page scrolling still works everywhere else */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 mt-2 text-slate-500 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Bullet dot */}
      <span className="text-slate-500 shrink-0 mt-2.5 text-sm leading-none select-none">•</span>

      {isEditing ? (
        /* ── Edit mode ── */
        <div className="flex-1 flex items-center gap-1.5 py-1">
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onCommit(); }
              if (e.key === "Escape") { e.preventDefault(); onCancel(); }
            }}
            placeholder={placeholder}
            className="flex-1 text-sm text-slate-900 border border-orange-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-100 bg-white"
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); onCommit(); }}
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
            onClick={onStartEdit}
            className="flex-1 text-left text-sm text-slate-800 leading-relaxed py-2 active:text-slate-900"
          >
            {item.text}
          </button>
          <div className="flex items-center shrink-0 pt-1">
            {onMove && !armed && (
              <button
                onClick={() => onMove(item.text)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 active:text-blue-400 active:bg-blue-50 transition-colors"
                aria-label="Move to another section"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {armed ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setArmed(false)}
                  className="h-7 px-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onRemove}
                  className="h-7 px-2 rounded-lg text-xs font-semibold bg-red-500 text-white active:bg-red-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            ) : (
              <button
                onClick={() => setArmed(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 active:text-red-400 active:bg-red-50 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function BulletEditor({
  value,
  onChange,
  onMove,
  placeholder = "Add item…",
  emptyState,
}: BulletEditorProps) {
  const [items, setItems] = useState<BulletItem[]>(() => parseItems(value));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Sync when parent value changes (e.g. after AI regeneration)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(parseItems(value));
    setEditingId(null);
  }, [value]);

  // Auto-focus input when edit mode starts
  useEffect(() => {
    if (editingId !== null) inputRef.current?.focus();
  }, [editingId]);

  function startEdit(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setEditValue(item.text);
  }

  function commit() {
    if (!editingId) return;
    const trimmed = editValue.trim();
    const next = trimmed
      ? items.map((item) => item.id === editingId ? { ...item, text: trimmed } : item)
      : items.filter((item) => item.id !== editingId);
    setItems(next);
    setEditingId(null);
    onChange(serializeItems(next));
  }

  function cancel() {
    if (!editingId) return;
    const item = items.find((i) => i.id === editingId);
    if (item?.text === "") {
      const next = items.filter((i) => i.id !== editingId);
      setItems(next);
      onChange(serializeItems(next));
    }
    setEditingId(null);
  }

  function remove(id: string) {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    onChange(serializeItems(next));
  }

  function addItem() {
    const newItem: BulletItem = { id: genId(), text: "" };
    const next = [...items, newItem];
    setItems(next);
    setEditingId(newItem.id);
    setEditValue("");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    onChange(serializeItems(next));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {items.length === 0 && emptyState && (
            <p className="text-sm text-slate-500 italic pb-1">{emptyState}</p>
          )}

          {items.map((item) => (
            <SortableBullet
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              editValue={editValue}
              inputRef={inputRef}
              placeholder={placeholder}
              onStartEdit={() => startEdit(item.id)}
              onEditChange={setEditValue}
              onCommit={commit}
              onCancel={cancel}
              onRemove={() => remove(item.id)}
              onMove={onMove}
            />
          ))}

          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-sm text-slate-500 active:text-orange-500 transition-colors pt-1 pb-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add item
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
}
