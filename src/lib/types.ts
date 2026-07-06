export type PoseGroup =
  | "sun"
  | "standing"
  | "seated"
  | "arm-balance"
  | "backbend"
  | "finishing"
  | "transition"
  | "teaching"
  | "review";

export type Pose = {
  slug: string;
  sanskrit: string;
  spanish: string;
  group: PoseGroup;
};

export type VideoRecord = {
  id: string;
  title: string;
  date: string;
  source: string;
  durationSec: number | null;
  durationLabel: string;
  orientation: string;
  sizeMb: number;
  width: number | null;
  height: number | null;
  thumbnail: string;
  videoFileName: string;
  remoteKey: string;
  playbackUrl: string;
  poses: Pose[];
  tags: string[];
  tagConfidence: "low" | "medium" | "high";
  notes: string;
};

export type EditableVideo = VideoRecord & {
  contributor?: string;
  createdAt?: string;
  uploaded?: boolean;
  hidden?: boolean;
  remoteUrl?: string;
  temporaryUrl?: string;
};

export type Draft = {
  title: string;
  date: string;
  source: string;
  tagsText: string;
  notes: string;
  contributor: string;
  remoteUrl: string;
  poses: string[];
};

export type AppData = {
  generatedAt: string;
  storageStrategy: {
    localDev: string;
    production: string;
    recommended: string;
  };
  primarySeries: Pose[];
  stats: {
    count: number;
    totalMb: number;
    byDate: Record<string, number>;
    byPose: Record<string, number>;
  };
  sessions: Array<{ date: string; videoIds: string[] }>;
  videos: VideoRecord[];
};
