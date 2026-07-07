"use client";

import { SearchX } from "lucide-react";
import type { EditableVideo } from "@/lib/types";
import { sessionDate } from "@/lib/format";
import VideoCard from "@/components/video-card";

type Props = {
  videos: EditableVideo[];
  groupBySession: boolean;
  onOpen: (id: string) => void;
  onClear: () => void;
  commentCounts?: Record<string, number>;
};

export default function VideoGrid({ videos, groupBySession, onOpen, onClear, commentCounts }: Props) {
  if (videos.length === 0) {
    return (
      <div className="emptyState">
        <SearchX size={30} />
        <p>No encontré esa práctica. Prueba con una postura, una fecha o una intención distinta.</p>
        <button className="ghostButton" onClick={onClear} type="button">
          Ver toda la biblioteca
        </button>
      </div>
    );
  }

  if (!groupBySession) {
    return (
      <div className="videoGrid">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onOpen={onOpen} comments={commentCounts?.[video.id] ?? 0} />
        ))}
      </div>
    );
  }

  const sessions = new Map<string, EditableVideo[]>();
  for (const video of videos) {
    const list = sessions.get(video.date) ?? [];
    list.push(video);
    sessions.set(video.date, list);
  }

  return (
    <>
      {Array.from(sessions.entries()).map(([date, list]) => (
        <section key={date} className="sessionBlock">
          <div className="sessionHeader">
            <h2>{sessionDate(date)}</h2>
            <span>
              {list.length} {list.length === 1 ? "práctica" : "prácticas"}
            </span>
          </div>
          <div className="videoGrid">
            {list.map((video) => (
              <VideoCard key={video.id} video={video} onOpen={onOpen} comments={commentCounts?.[video.id] ?? 0} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
