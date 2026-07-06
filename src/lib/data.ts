import rawData from "@/data/certification-videos.json";
import type { AppData, VideoRecord } from "@/lib/types";

type RawVideo = VideoRecord & { localVideoPath?: string };
type RawData = Omit<AppData, "videos"> & { videos: RawVideo[] };

const data = rawData as RawData;

function cdnUrl(remoteKey: string) {
  const base = process.env.NEXT_PUBLIC_VIDEO_BASE_URL?.trim().replace(/\/$/, "");
  return base ? `${base}/${remoteKey}` : "";
}

export function getClientData(): AppData {
  return {
    ...data,
    videos: data.videos.map(({ localVideoPath: _localVideoPath, ...video }) => ({
      ...video,
      playbackUrl: cdnUrl(video.remoteKey) || `/api/videos/${video.id}`,
    })),
  };
}

export function getRawVideo(id: string) {
  return data.videos.find((video) => video.id === id);
}
