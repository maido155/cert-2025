"use client";

import { Clock3, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { HistoryEntry } from "@/lib/types";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

type Props = {
  onClose: () => void;
  onRevert: (historyId: number) => Promise<void>;
};

const actionLabels: Record<string, string> = {
  edit: "editó",
  create: "compartió",
  hide: "ocultó",
  unhide: "mostró",
  delete: "borró",
  restore: "restauró",
  revert: "revirtió un cambio de",
};

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function HistoryPanel({ onClose, onRevert }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/history?limit=200", { cache: "no-store" });
      const data = (await res.json()) as { entries?: HistoryEntry[] };
      setEntries(data.entries ?? []);
    } catch {
      setEntries([]);
    }
  }

  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  useEffect(() => {
    load();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleRevert(id: number) {
    setBusyId(id);
    await onRevert(id);
    await load();
    setBusyId(null);
  }

  return (
    <div className="modalBackdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className="historyPanel" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <div className="historyHeader">
          <div>
            <h2 id="history-title">Historial de cambios</h2>
            <p>Quién cuidó cada práctica. Puedes deshacer un cambio si hizo falta.</p>
          </div>
          <button className="iconButton" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="historyBody">
          {entries === null ? (
            <p className="historyEmpty">Cargando…</p>
          ) : entries.length === 0 ? (
            <p className="historyEmpty">Todavía no hay cambios registrados.</p>
          ) : (
            <ul>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <div className="historyLine">
                    <span className="historyWho">{entry.editor}</span>
                    <span className="historyWhat">
                      {actionLabels[entry.action] ?? entry.action}{" "}
                      <strong>{entry.title || "una práctica"}</strong>
                    </span>
                  </div>
                  <div className="historyMeta">
                    <Clock3 size={13} /> {relativeTime(entry.createdAt)}
                    {entry.action !== "revert" ? (
                      <button
                        className="historyRevert"
                        onClick={() => handleRevert(entry.id)}
                        type="button"
                        disabled={busyId === entry.id}
                      >
                        <RotateCcw size={13} /> {busyId === entry.id ? "Deshaciendo…" : "Deshacer"}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
