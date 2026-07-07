-- Esquema de la biblioteca compartida (Cloudflare D1).
-- edits: capa de ediciones sobre el dataset base (una fila por video tocado).
-- history: registro append-only de cambios para ver y revertir.

CREATE TABLE IF NOT EXISTS edits (
  video_id   TEXT PRIMARY KEY,
  overlay    TEXT NOT NULL,
  is_new     INTEGER NOT NULL DEFAULT 0,
  deleted    INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id   TEXT NOT NULL,
  title      TEXT,
  editor     TEXT NOT NULL,
  action     TEXT NOT NULL,
  before     TEXT,
  after      TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_created ON history (created_at DESC);
