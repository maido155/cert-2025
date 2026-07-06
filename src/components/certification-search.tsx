"use client";

import { Download, FileUp, MoreVertical, RotateCcw, Triangle, Upload } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { AppData, Draft, EditableVideo, Pose } from "@/lib/types";
import { autoTitle, cleanTags, matchesText, uniquePoseMap } from "@/lib/format";
import { useLibrary } from "@/lib/use-library";
import SearchBar, { type Suggestion } from "@/components/search-bar";
import FilterChips, { type FilterToken, type SortKey } from "@/components/filter-chips";
import VideoGrid from "@/components/video-grid";
import PlayerOverlay from "@/components/player-overlay";
import PracticeModal from "@/components/practice-modal";

type Props = {
  data: AppData;
};

const gratitudeTitle = "gracias maestro Alex por todas tus enseñanzas y gracias hermanos por este hermosísimo viaje";

function emptyDraft(): Draft {
  return {
    title: "",
    date: new Date().toISOString().slice(0, 10),
    source: "Comunidad",
    tagsText: "certificación 2025, comunidad",
    notes: "",
    contributor: "",
    remoteUrl: "",
    poses: [],
  };
}

function toDraft(video: EditableVideo): Draft {
  return {
    title: video.title,
    date: video.date,
    source: video.source,
    tagsText: video.tags.join(", "),
    notes: video.notes,
    contributor: video.contributor ?? "",
    remoteUrl: video.remoteUrl ?? (video.playbackUrl.startsWith("http") ? video.playbackUrl : ""),
    poses: video.poses.map((pose) => pose.slug),
  };
}

export default function CertificationSearch({ data }: Props) {
  const { videos, saveVideos, restoreBase, exportBackup, importBackup } = useLibrary(data.videos);
  const [query, setQuery] = useState("");
  const [pose, setPose] = useState("");
  const [group, setGroup] = useState("");
  const [date, setDate] = useState("");
  const [tag, setTag] = useState("");
  const [contributor, setContributor] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [watchingId, setWatchingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"edit" | "new" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("pointerdown", handleOutside);
    return () => window.removeEventListener("pointerdown", handleOutside);
  }, [menuOpen]);

  const allPoses = data.primarySeries;
  const visibleVideos = useMemo(() => videos.filter((video) => !video.hidden), [videos]);
  const poses = useMemo(() => uniquePoseMap(videos), [videos]);

  const dates = useMemo(() => {
    const counts = new Map<string, number>();
    for (const video of visibleVideos) counts.set(video.date, (counts.get(video.date) ?? 0) + 1);
    return Array.from(counts.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [visibleVideos]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const video of visibleVideos) {
      for (const item of video.tags) counts.set(item, (counts.get(item) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 24);
  }, [visibleVideos]);

  const contributors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const video of visibleVideos) {
      if (video.contributor) counts.set(video.contributor, (counts.get(video.contributor) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [visibleVideos]);

  const filtered = useMemo(() => {
    const rows = visibleVideos.filter((video) => {
      if (query && !matchesText(video, query)) return false;
      if (pose && !video.poses.some((item) => item.slug === pose)) return false;
      if (group && !video.poses.some((item) => item.group === group)) return false;
      if (date && video.date !== date) return false;
      if (tag && !video.tags.includes(tag)) return false;
      if (contributor && video.contributor !== contributor) return false;
      return true;
    });
    rows.sort((a, b) => {
      if (sort === "duration") return (b.durationSec ?? 0) - (a.durationSec ?? 0);
      if (sort === "size") return b.sizeMb - a.sizeMb;
      if (sort === "title") return autoTitle(a).localeCompare(autoTitle(b));
      return `${b.date}-${b.id}`.localeCompare(`${a.date}-${a.id}`);
    });
    return rows;
  }, [contributor, date, group, pose, query, sort, tag, visibleVideos]);

  const watching = watchingId ? filtered.find((video) => video.id === watchingId) ?? videos.find((video) => video.id === watchingId) : null;
  const watchingIndex = watching ? filtered.findIndex((video) => video.id === watching.id) : -1;
  const editing = editingId ? videos.find((video) => video.id === editingId) : null;

  const hasFilters = Boolean(query || pose || group || date || tag || contributor);

  function clearAll() {
    setQuery("");
    setPose("");
    setGroup("");
    setDate("");
    setTag("");
    setContributor("");
  }

  function pickSuggestion(suggestion: Suggestion) {
    if (suggestion.kind === "pose") setPose(suggestion.value);
    if (suggestion.kind === "date") setDate(suggestion.value);
    if (suggestion.kind === "group") setGroup(suggestion.value);
    if (suggestion.kind === "tag") setTag(suggestion.value);
    if (suggestion.kind === "contributor") setContributor(suggestion.value);
    setQuery("");
  }

  const tokens: FilterToken[] = [];
  const selectedPose = poses.find((item) => item.slug === pose);
  if (selectedPose) tokens.push({ key: "pose", label: selectedPose.sanskrit, onRemove: () => setPose("") });
  if (tag) tokens.push({ key: "tag", label: tag.replaceAll("-", " "), onRemove: () => setTag("") });
  if (contributor) tokens.push({ key: "contributor", label: contributor, onRemove: () => setContributor("") });

  function openEdit(video: EditableVideo) {
    setEditingId(video.id);
    setDraft(toDraft(video));
    setNewFile(null);
    setModalMode("edit");
  }

  function openNew() {
    setEditingId(null);
    setDraft(emptyDraft());
    setNewFile(null);
    setModalMode("new");
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
    setNewFile(null);
  }

  function saveDraft() {
    if (!editing) return;
    const selected = draft.poses.map((slug) => allPoses.find((item) => item.slug === slug)).filter(Boolean) as Pose[];
    const next = videos.map((video) =>
      video.id === editing.id
        ? {
            ...video,
            title: draft.title.trim() || video.title,
            date: draft.date || video.date,
            source: draft.source.trim() || video.source,
            tags: cleanTags(draft.tagsText),
            notes: draft.notes,
            contributor: draft.contributor,
            remoteUrl: draft.remoteUrl,
            playbackUrl: draft.remoteUrl || video.temporaryUrl || video.playbackUrl,
            poses: selected.length ? selected : video.poses,
          }
        : video,
    );
    saveVideos(next);
    closeModal();
  }

  function hideEditing() {
    if (!editing) return;
    saveVideos(videos.map((video) => (video.id === editing.id ? { ...video, hidden: true } : video)));
    if (watchingId === editing.id) setWatchingId(null);
    closeModal();
  }

  function deleteEditing() {
    if (!editing) return;
    saveVideos(videos.filter((video) => video.id !== editing.id));
    if (watchingId === editing.id) setWatchingId(null);
    closeModal();
  }

  function addVideo() {
    const now = new Date().toISOString();
    const selected = draft.poses.map((slug) => allPoses.find((item) => item.slug === slug)).filter(Boolean) as Pose[];
    const temporaryUrl = newFile ? URL.createObjectURL(newFile) : undefined;
    const title = draft.title.trim() || newFile?.name || "Nueva práctica";
    const item: EditableVideo = {
      id: `nuevo-${Date.now()}`,
      title,
      date: draft.date || now.slice(0, 10),
      source: draft.source.trim() || "Comunidad",
      durationSec: null,
      durationLabel: "",
      orientation: "",
      sizeMb: newFile ? Number((newFile.size / (1024 * 1024)).toFixed(2)) : 0,
      width: null,
      height: null,
      thumbnail: "/thumbs/02207.jpg",
      videoFileName: newFile?.name || title,
      remoteKey: `certificacion-2025/uploads/${newFile?.name || title}`.replace(/\s+/g, "-"),
      playbackUrl: draft.remoteUrl || temporaryUrl || "",
      remoteUrl: draft.remoteUrl,
      temporaryUrl,
      poses: selected.length ? selected : [allPoses.find((itemPose) => itemPose.slug === "paschimottanasana") ?? allPoses[0]],
      tags: cleanTags(`certificacion-2025, comunidad, ${draft.tagsText}`),
      tagConfidence: "low",
      notes: draft.notes || "Aporte nuevo de la comunidad. Revisar posturas y notas con calma.",
      contributor: draft.contributor,
      uploaded: true,
      createdAt: now,
    };
    saveVideos([item, ...videos]);
    closeModal();
    setWatchingId(item.id);
  }

  function importEdits(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) importBackup(file, () => setWatchingId(null));
    event.target.value = "";
  }

  function restore() {
    if (!window.confirm("Esto descarta tus ediciones locales y vuelve a la biblioteca original. ¿Continuar?")) return;
    restoreBase();
    setWatchingId(null);
    clearAll();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">
            <Triangle size={16} />
          </span>
          <span className="brandText">
            Certificación 2025
            <small>Ashtanga · Biblioteca viva</small>
          </span>
        </div>

        <SearchBar query={query} onQueryChange={setQuery} onPick={pickSuggestion} poses={poses} dates={dates} tags={tags} contributors={contributors} />

        <div className="topbarActions">
          <button className="primaryButton" onClick={openNew} type="button">
            <Upload size={16} /> <span>Subir práctica</span>
          </button>
          <div className="menuWrap" ref={menuRef}>
            <button className="iconButton" onClick={() => setMenuOpen((current) => !current)} type="button" aria-label="Más opciones" aria-expanded={menuOpen}>
              <MoreVertical size={19} />
            </button>
            {menuOpen ? (
              <div className="menu" role="menu">
                <button onClick={() => { exportBackup(); setMenuOpen(false); }} type="button">
                  <Download size={16} /> Respaldar biblioteca
                </button>
                <button onClick={() => { importRef.current?.click(); setMenuOpen(false); }} type="button">
                  <FileUp size={16} /> Cargar respaldo
                </button>
                <button className="menuDanger" onClick={() => { setMenuOpen(false); restore(); }} type="button">
                  <RotateCcw size={16} /> Volver al origen
                </button>
              </div>
            ) : null}
          </div>
          <input ref={importRef} className="hiddenInput" type="file" accept="application/json" onChange={importEdits} />
        </div>
      </header>

      <div className="gratitude">
        <p>{gratitudeTitle}</p>
      </div>

      <FilterChips
        dates={dates}
        activeDate={date}
        activeGroup={group}
        onDate={setDate}
        onGroup={setGroup}
        sort={sort}
        onSort={setSort}
        tokens={tokens}
        hasFilters={hasFilters}
        onClearAll={clearAll}
      />

      <section className="library">
        <p className="resultsBar">
          {hasFilters ? `${filtered.length} de ${visibleVideos.length} prácticas` : `${visibleVideos.length} prácticas · ${dates.length} encuentros · ${poses.length} posturas`}
        </p>
        <VideoGrid videos={filtered} groupBySession={sort === "date"} onOpen={setWatchingId} onClear={clearAll} />
      </section>

      {watching ? (
        <PlayerOverlay
          video={watching}
          index={Math.max(watchingIndex, 0)}
          total={filtered.length}
          onPrev={watchingIndex > 0 ? () => setWatchingId(filtered[watchingIndex - 1].id) : undefined}
          onNext={watchingIndex >= 0 && watchingIndex < filtered.length - 1 ? () => setWatchingId(filtered[watchingIndex + 1].id) : undefined}
          onClose={() => setWatchingId(null)}
          onEdit={() => openEdit(watching)}
          onPickPose={(slug) => {
            setPose(slug);
            setWatchingId(null);
          }}
        />
      ) : null}

      {modalMode ? (
        <PracticeModal
          mode={modalMode}
          draft={draft}
          onDraft={setDraft}
          allPoses={allPoses}
          newFile={newFile}
          onFile={setNewFile}
          titlePlaceholder={modalMode === "edit" && editing ? autoTitle(editing) : "Nueva práctica"}
          onSave={modalMode === "new" ? addVideo : saveDraft}
          onHide={modalMode === "edit" ? hideEditing : undefined}
          onDelete={modalMode === "edit" ? deleteEditing : undefined}
          onClose={closeModal}
        />
      ) : null}
    </main>
  );
}
