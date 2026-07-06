"use client";

import { ArrowUpDown, ChevronDown, X } from "lucide-react";
import { groupLabels, shortDate } from "@/lib/format";

export type SortKey = "date" | "duration" | "size" | "title";

export type FilterToken = {
  key: string;
  label: string;
  onRemove: () => void;
};

type Props = {
  dates: Array<[string, number]>;
  activeDate: string;
  activeGroup: string;
  onDate: (value: string) => void;
  onGroup: (value: string) => void;
  sort: SortKey;
  onSort: (value: SortKey) => void;
  tokens: FilterToken[];
  hasFilters: boolean;
  onClearAll: () => void;
};

export default function FilterChips({ dates, activeDate, activeGroup, onDate, onGroup, sort, onSort, tokens, hasFilters, onClearAll }: Props) {
  return (
    <div className="railBar">
      <div className="railInner">
        <div className="rail" role="toolbar" aria-label="Filtros rápidos">
          <button className={`chip ${hasFilters ? "" : "active"}`} onClick={onClearAll} type="button">
            Todo
          </button>
          {dates.map(([value, count]) => (
            <button
              key={value}
              className={`chip ${activeDate === value ? "active" : ""}`}
              onClick={() => onDate(activeDate === value ? "" : value)}
              type="button"
            >
              {shortDate(value)} <strong>{count}</strong>
            </button>
          ))}
          {Object.entries(groupLabels).map(([value, label]) => (
            <button
              key={value}
              className={`chip ${activeGroup === value ? "active" : ""}`}
              onClick={() => onGroup(activeGroup === value ? "" : value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="sortWrap">
          <ArrowUpDown className="lead" size={14} />
          <select value={sort} onChange={(event) => onSort(event.target.value as SortKey)} aria-label="Ordenar prácticas">
            <option value="date">Más recientes</option>
            <option value="duration">Más largas</option>
            <option value="size">Más pesadas</option>
            <option value="title">Nombre A-Z</option>
          </select>
          <ChevronDown className="tail" size={14} />
        </div>
      </div>

      {tokens.length > 0 ? (
        <div className="activeChips">
          {tokens.map((token) => (
            <span key={token.key} className="filterToken">
              {token.label}
              <button onClick={token.onRemove} type="button" aria-label={`Quitar filtro ${token.label}`}>
                <X size={13} />
              </button>
            </span>
          ))}
          <button className="clearAll" onClick={onClearAll} type="button">
            Limpiar todo
          </button>
        </div>
      ) : null}
    </div>
  );
}
