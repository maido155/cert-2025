"use client";

import { useEffect, useState } from "react";
import type { EditableVideo, VideoRecord } from "@/lib/types";

const STORAGE_KEY = "certificacion-ashtanga-editor-v1";

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

function persist(videos: EditableVideo[]) {
  const safeVideos = videos.map(({ temporaryUrl: _temporaryUrl, ...video }) => ({
    ...video,
    playbackUrl: video.remoteUrl || video.playbackUrl,
  }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeVideos));
}

export function useLibrary(base: VideoRecord[]) {
  const [videos, setVideos] = useState<EditableVideo[]>(() => base as EditableVideo[]);

  useEffect(() => {
    setVideos(fromStorage(base));
  }, [base]);

  function saveVideos(next: EditableVideo[]) {
    setVideos(next);
    persist(next);
  }

  function restoreBase() {
    window.localStorage.removeItem(STORAGE_KEY);
    setVideos(base as EditableVideo[]);
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
        saveVideos(parsed);
        onDone?.(parsed);
      } catch {
        // Ignore malformed backups so the current library remains intact.
      }
    };
    reader.readAsText(file);
  }

  return { videos, saveVideos, restoreBase, exportBackup, importBackup };
}
