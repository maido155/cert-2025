"use client";

import { Check, EyeOff, Save, Trash2, Upload, X } from "lucide-react";
import { useEffect } from "react";
import type { Draft, Pose } from "@/lib/types";
import { groupLabels } from "@/lib/format";

type Props = {
  mode: "edit" | "new";
  draft: Draft;
  onDraft: (draft: Draft) => void;
  allPoses: Pose[];
  newFile: File | null;
  onFile: (file: File | null) => void;
  titlePlaceholder?: string;
  onSave: () => void;
  onHide?: () => void;
  onDelete?: () => void;
  onClose: () => void;
};

export default function PracticeModal({ mode, draft, onDraft, allPoses, newFile, onFile, titlePlaceholder, onSave, onHide, onDelete, onClose }: Props) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function togglePose(slug: string) {
    onDraft({
      ...draft,
      poses: draft.poses.includes(slug) ? draft.poses.filter((item) => item !== slug) : [...draft.poses, slug],
    });
  }

  const poseGroups = new Map<string, Pose[]>();
  for (const pose of allPoses) {
    const list = poseGroups.get(pose.group) ?? [];
    list.push(pose);
    poseGroups.set(pose.group, list);
  }

  return (
    <div className="modalBackdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="practice-modal-title">
        <div className="modalHeader">
          <div>
            <h2 id="practice-modal-title">{mode === "new" ? "Compartir una práctica" : "Cuidar esta práctica"}</h2>
            <p>Completa solo lo necesario. La intención es que la biblioteca sea fácil de encontrar y recordar.</p>
          </div>
          <button className="iconButton" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modalBody">
          <label className="field">
            <span>Nombre de la práctica</span>
            <input value={draft.title} onChange={(event) => onDraft({ ...draft, title: event.target.value })} placeholder={titlePlaceholder} />
          </label>
          <div className="fieldRow">
            <label className="field">
              <span>Fecha del encuentro</span>
              <input type="date" value={draft.date} onChange={(event) => onDraft({ ...draft, date: event.target.value })} />
            </label>
            <label className="field">
              <span>Origen</span>
              <input value={draft.source} onChange={(event) => onDraft({ ...draft, source: event.target.value })} />
            </label>
          </div>
          <div className="fieldRow">
            <label className="field">
              <span>Hermano/a que comparte</span>
              <input value={draft.contributor} onChange={(event) => onDraft({ ...draft, contributor: event.target.value })} placeholder="Nombre" />
            </label>
            <label className="field">
              <span>Enlace del video</span>
              <input value={draft.remoteUrl} onChange={(event) => onDraft({ ...draft, remoteUrl: event.target.value })} placeholder="https://..." />
            </label>
          </div>
          <label className="field">
            <span>Etiquetas de intención</span>
            <textarea
              value={draft.tagsText}
              onChange={(event) => onDraft({ ...draft, tagsText: event.target.value })}
              placeholder="certificación 2025, ajustes, respiración, puentes..."
            />
          </label>
          <label className="field">
            <span>Notas para recordar</span>
            <textarea
              value={draft.notes}
              onChange={(event) => onDraft({ ...draft, notes: event.target.value })}
              placeholder="Qué se practicó, quién aparece, qué detalle vale la pena recordar..."
            />
          </label>
          {mode === "new" ? (
            <label className="field">
              <span>Video desde mi computadora</span>
              <div className="filePicker">
                <strong>
                  <Upload size={15} /> Elegir video
                </strong>
                <em>{newFile?.name ?? "Ningún video elegido"}</em>
                <input type="file" accept="video/*" onChange={(event) => onFile(event.target.files?.[0] ?? null)} />
              </div>
            </label>
          ) : null}
          <div className="field">
            <span>Posturas que aparecen</span>
            <div className="poseGroups">
              {Array.from(poseGroups.entries()).map(([group, poses]) => (
                <div key={group} className="poseGroup">
                  <span>{groupLabels[group] ?? group}</span>
                  <div>
                    {poses.map((pose) => (
                      <button key={pose.slug} className={`poseChip ${draft.poses.includes(pose.slug) ? "active" : ""}`} onClick={() => togglePose(pose.slug)} type="button">
                        {draft.poses.includes(pose.slug) ? <Check size={13} /> : null}
                        {pose.sanskrit}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modalFooter">
          {mode === "edit" && onHide ? (
            <button className="ghostButton" onClick={onHide} type="button">
              <EyeOff size={15} /> Ocultar
            </button>
          ) : null}
          {mode === "edit" && onDelete ? (
            <button className="dangerButton" onClick={onDelete} type="button">
              <Trash2 size={15} /> Borrar
            </button>
          ) : null}
          <button className="primaryButton" onClick={onSave} type="button">
            <Save size={15} /> <span>{mode === "new" ? "Compartir práctica" : "Guardar cambios"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
