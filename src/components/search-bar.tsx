"use client";

import { CalendarDays, Search, Shapes, Sparkles, Tag, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Pose } from "@/lib/types";
import { formatDate, groupLabels, humanTag, normalize } from "@/lib/format";

export type SuggestionKind = "pose" | "date" | "group" | "tag" | "contributor";

export type Suggestion = {
  kind: SuggestionKind;
  value: string;
  label: string;
  detail?: string;
};

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  onPick: (suggestion: Suggestion) => void;
  poses: Array<Pose & { count: number }>;
  dates: Array<[string, number]>;
  tags: Array<[string, number]>;
  contributors: Array<[string, number]>;
};

const groupMeta: Record<SuggestionKind, { title: string; icon: typeof Search }> = {
  pose: { title: "Posturas", icon: Sparkles },
  date: { title: "Encuentros", icon: CalendarDays },
  group: { title: "Familias", icon: Shapes },
  tag: { title: "Intenciones", icon: Tag },
  contributor: { title: "Hermanos", icon: UserRound },
};

export default function SearchBar({ query, onQueryChange, onPick, poses, dates, tags, contributors }: Props) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    function handleOutside(event: PointerEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", handleOutside);
    return () => window.removeEventListener("pointerdown", handleOutside);
  }, []);

  const suggestions = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return [] as Suggestion[];
    const found: Suggestion[] = [];
    for (const pose of poses) {
      if (normalize(`${pose.sanskrit} ${pose.spanish}`).includes(needle)) {
        found.push({ kind: "pose", value: pose.slug, label: pose.sanskrit, detail: `${pose.spanish} · ${pose.count}` });
      }
    }
    for (const [value, count] of dates) {
      if (normalize(formatDate(value)).includes(needle) || value.includes(needle)) {
        found.push({ kind: "date", value, label: formatDate(value), detail: `${count} prácticas` });
      }
    }
    for (const [value, label] of Object.entries(groupLabels)) {
      if (normalize(label).includes(needle)) {
        found.push({ kind: "group", value, label });
      }
    }
    for (const [value, count] of tags) {
      if (normalize(humanTag(value)).includes(needle)) {
        found.push({ kind: "tag", value, label: humanTag(value), detail: `${count}` });
      }
    }
    for (const [value, count] of contributors) {
      if (normalize(value).includes(needle)) {
        found.push({ kind: "contributor", value, label: value, detail: `${count}` });
      }
    }
    const byKind = new Map<SuggestionKind, Suggestion[]>();
    for (const item of found) {
      const list = byKind.get(item.kind) ?? [];
      if (list.length < 5) list.push(item);
      byKind.set(item.kind, list);
    }
    return Array.from(byKind.values()).flat();
  }, [contributors, dates, poses, query, tags]);

  const grouped = useMemo(() => {
    const map = new Map<SuggestionKind, Suggestion[]>();
    for (const item of suggestions) {
      const list = map.get(item.kind) ?? [];
      list.push(item);
      map.set(item.kind, list);
    }
    return Array.from(map.entries());
  }, [suggestions]);

  const showPanel = open && suggestions.length > 0;

  return (
    <div className="searchBox" ref={boxRef}>
      <div className="searchField">
        <Search size={17} />
        <input
          ref={inputRef}
          size={1}
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
            if (event.key === "Enter") setOpen(false);
          }}
          placeholder="Buscar postura, fecha, hermano, intención..."
          aria-label="Buscar prácticas"
        />
        {query ? (
          <button className="searchClear" onClick={() => onQueryChange("")} type="button" aria-label="Limpiar búsqueda">
            <X size={15} />
          </button>
        ) : (
          <span className="searchKbd">/</span>
        )}
      </div>

      {showPanel ? (
        <div className="suggestPanel">
          {grouped.map(([kind, items]) => {
            const meta = groupMeta[kind];
            const Icon = meta.icon;
            return (
              <div key={kind}>
                <p className="suggestGroup">{meta.title}</p>
                {items.map((item) => (
                  <button
                    key={`${item.kind}-${item.value}`}
                    className="suggestItem"
                    onClick={() => {
                      onPick(item);
                      setOpen(false);
                    }}
                    type="button"
                  >
                    <Icon size={15} />
                    {item.label}
                    {item.detail ? <em>{item.detail}</em> : null}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
