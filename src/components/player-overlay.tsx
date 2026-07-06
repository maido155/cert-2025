"use client";

import { CalendarDays, ChevronLeft, ChevronRight, CirclePlay, Clock3, Pencil, UserRound, X } from "lucide-react";
import { useEffect } from "react";
import type { EditableVideo } from "@/lib/types";
import { autoTitle, formatDate, isRawTitle } from "@/lib/format";

type Props = {
  video: EditableVideo;
  index: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  onEdit: () => void;
  onPickPose: (slug: string) => void;
};

export default function PlayerOverlay({ video, index, total, onPrev, onNext, onClose, onEdit, onPickPose }: Props) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev?.();
      if (event.key === "ArrowRight") onNext?.();
    }
    window.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, onNext, onPrev]);

  const playback = video.remoteUrl || video.temporaryUrl || video.playbackUrl;
  const orientation = video.orientation === "horizontal" ? "horizontal" : "vertical";
  const title = autoTitle(video);

  return (
    <div className="theaterBackdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className="theater" role="dialog" aria-modal="true" aria-label={title}>
        <div className="theaterStage">
          {playback ? (
            <video key={video.id} src={playback} className={orientation} controls autoPlay playsInline preload="metadata" poster={video.thumbnail} />
          ) : (
            <div className="videoMissing">
              <CirclePlay size={40} />
              <p>Esta práctica necesita un enlace o un archivo para reproducirse.</p>
            </div>
          )}
          {onPrev ? (
            <button className="theaterNav prev" onClick={onPrev} type="button" aria-label="Práctica anterior">
              <ChevronLeft size={22} />
            </button>
          ) : null}
          {onNext ? (
            <button className="theaterNav next" onClick={onNext} type="button" aria-label="Práctica siguiente">
              <ChevronRight size={22} />
            </button>
          ) : null}
        </div>

        <div className="theaterInfo">
          <div className="theaterTop">
            <div>
              <h2>{title}</h2>
              {isRawTitle(video.title) ? <small>{video.title}</small> : null}
            </div>
            <button className="iconButton" onClick={onClose} type="button" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          <div className="metaRow">
            <span>
              <CalendarDays size={15} /> {formatDate(video.date)}
            </span>
            {video.durationLabel ? (
              <span>
                <Clock3 size={15} /> {video.durationLabel}
              </span>
            ) : null}
            <span>
              <UserRound size={15} /> {video.contributor || video.source}
            </span>
          </div>

          {video.poses.length > 0 ? (
            <div className="poseChips">
              {video.poses.map((pose) => (
                <button key={pose.slug} className="poseChip" onClick={() => onPickPose(pose.slug)} type="button">
                  {pose.sanskrit}
                </button>
              ))}
            </div>
          ) : null}

          {video.notes ? <p className="notes">{video.notes}</p> : null}

          <div className="theaterActions">
            <button className="ghostButton" onClick={onEdit} type="button">
              <Pencil size={15} /> Cuidar esta práctica
            </button>
            <span className="counter" style={{ marginLeft: "auto", alignSelf: "center" }}>
              {index + 1} de {total}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
