"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EditAction, EditableVideo, EditOverlay, EditRow, VideoRecord } from "@/lib/types";
import { autoTitle } from "@/lib/format";

const STORAGE_KEY = "certificacion-ashtanga-editor-v1";
const NAME_KEY = "cert-editor-name";
const CLOUD = process.env.NEXT_PUBLIC_CLOUD_EDITS === "1";

function fromStorage(base: VideoRecord[]) {
  if (typeof window === "undefined") return base as EditableVideo[];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base as EditableVideo[];
    const parsed = JSON.parse(raw) as EditableVideo[];
    return parsed.length ? parsed : (base as EditableVideo[]);
  } catch {
    return base as EditableVideo[];
  }
}

function persistLocal(videos: EditableVideo[]) {
  if (typeof window === "undefined") return;
  const safe = videos.map(({ temporaryUrl: _t, ...video }) => ({
    ...video,
    playbackUrl: video.remoteUrl || video.playbackUrl,
  }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

function sanitize(video: EditableVideo): EditOverlay {
  const { temporaryUrl: _t, playbackUrl: _p, ...rest } = video;
  return rest;
}

function mergeCloud(base: VideoRecord[], rows: EditRow[]): EditableVideo[] {
  const map = new Map(rows.map((row) => [row.videoId, row]));
  const out: EditableVideo[] = [];

  for (const video of base as EditableVideo[]) {
    const row = map.get(video.id);
    if (!row) {
      out.push(video);
      continue;
    }
    map.delete(video.id);
    if (row.deleted) continue;
    const merged = { ...video, ...row.overlay } as EditableVideo;
    merged.playbackUrl = row.overlay.remoteUrl || video.playbackUrl;
    out.push(merged);
  }

  // Filas restantes = prácticas nuevas creadas en la nube.
  const created: EditableVideo[] = [];
  for (const row of map.values()) {
    if (row.deleted || !row.isNew) continue;
    const video = { ...(row.overlay as EditableVideo) };
    video.playbackUrl = video.remoteUrl || video.playbackUrl || "";
    created.push(video);
  }

  return [...created, ...out];
}

type SaveArgs = {
  next: EditableVideo[];
  video: EditableVideo;
  action: EditAction;
  isNew?: boolean;
  deleted?: boolean;
};

export function useCloudLibrary(base: VideoRecord[]) {
  const [videos, setVideos] = useState<EditableVideo[]>(() => base as EditableVideo[]);
  const [editorName, setEditorNameState] = useState("");
  const editorRef = useRef("");
  const baseRef = useRef(base);
  baseRef.current = base;

  const refresh = useCallback(async () => {
    if (!CLOUD) return;
    try {
      const res = await fetch("/api/edits", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { rows?: EditRow[] };
      if (Array.isArray(data.rows)) setVideos(mergeCloud(baseRef.current, data.rows));
    } catch {
      // Sin conexión: conservamos lo que ya está en pantalla.
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(NAME_KEY) ?? "";
      editorRef.current = stored;
      setEditorNameState(stored);
    }
    if (CLOUD) refresh();
    else setVideos(fromStorage(base));
  }, [base, refresh]);

  useEffect(() => {
    if (!CLOUD) return;
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(refresh, 45000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [refresh]);

  function setEditorName(name: string) {
    const clean = name.trim();
    editorRef.current = clean;
    setEditorNameState(clean);
    if (typeof window !== "undefined") window.localStorage.setItem(NAME_KEY, clean);
  }

  function save({ next, video, action, isNew, deleted }: SaveArgs) {
    setVideos(next);
    if (!CLOUD) {
      persistLocal(next);
      return;
    }
    fetch("/api/edits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: video.id,
        title: autoTitle(video),
        action,
        overlay: sanitize(video),
        isNew: Boolean(isNew),
        deleted: Boolean(deleted),
        editor: editorRef.current,
      }),
    })
      .then(() => refresh())
      .catch(() => refresh());
  }

  async function revert(historyId: number) {
    if (!CLOUD) return;
    await fetch("/api/revert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historyId, editor: editorRef.current }),
    }).catch(() => {});
    await refresh();
  }

  function restoreBase() {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    setVideos(base as EditableVideo[]);
  }

  function hasLocalEdits() {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  }

  async function pushLocalToCloud() {
    if (!CLOUD || typeof window === "undefined") return;
    const local = fromStorage(base);
    const baseIds = new Map((base as EditableVideo[]).map((v) => [v.id, v]));
    for (const video of local) {
      const original = baseIds.get(video.id);
      const isNew = !original;
      if (!isNew && JSON.stringify(sanitize(video)) === JSON.stringify(sanitize(original as EditableVideo))) continue;
      await fetch("/api/edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          title: autoTitle(video),
          action: isNew ? "create" : "edit",
          overlay: sanitize(video),
          isNew,
          deleted: false,
          editor: editorRef.current,
        }),
      }).catch(() => {});
    }
    window.localStorage.removeItem(STORAGE_KEY);
    await refresh();
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(videos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificacion-ashtanga-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(file: File, onDone?: (videos: EditableVideo[]) => void) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as EditableVideo[];
        if (!Array.isArray(parsed)) return;
        setVideos(parsed);
        if (!CLOUD) persistLocal(parsed);
        onDone?.(parsed);
      } catch {
        // Ignoramos respaldos malformados para no romper la biblioteca actual.
      }
    };
    reader.readAsText(file);
  }

  return {
    videos,
    cloud: CLOUD,
    editorName,
    setEditorName,
    save,
    revert,
    refresh,
    restoreBase,
    exportBackup,
    importBackup,
    hasLocalEdits,
    pushLocalToCloud,
  };
}
