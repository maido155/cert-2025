"use client";

import Image from "next/image";
import type { EditableVideo } from "@/lib/types";
import { isRawTitle, shortDate } from "@/lib/format";

type Props = {
  video: EditableVideo;
  onOpen: (id: string) => void;
};

export default function VideoCard({ video, onOpen }: Props) {
  const pose = video.poses[0];
  const extra = video.poses.length > 1 ? ` +${video.poses.length - 1}` : "";
  const title = isRawTitle(video.title) ? (pose ? `${pose.sanskrit}${extra}` : "Práctica") : video.title;
  return (
    <button className="videoCard" onClick={() => onOpen(video.id)} type="button" aria-label={`Ver ${title}`}>
      <Image src={video.thumbnail || "/thumbs/02207.jpg"} alt="" fill sizes="(max-width: 720px) 50vw, 220px" />
      <span className="cardShade" />
      {video.durationLabel ? <span className="durationBadge">{video.durationLabel}</span> : null}
      {video.uploaded ? <span className="uploadBadge">Aporte</span> : null}
      <span className="cardBody">
        <span className="cardTitle">{title}</span>
        <span className="cardMeta">
          {pose ? `${pose.spanish} · ` : ""}
          {shortDate(video.date)}
        </span>
      </span>
    </button>
  );
}
