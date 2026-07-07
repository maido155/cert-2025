import type { EditableVideo, Pose } from "@/lib/types";

export const groupLabels: Record<string, string> = {
  sun: "Saludos",
  standing: "De pie",
  seated: "Sentadas",
  "arm-balance": "Brazos",
  backbend: "Extensiones",
  finishing: "Cierre",
  transition: "Transiciones",
  teaching: "Enseñanza",
  review: "Para revisar",
};

export const tagLabels: Record<string, string> = {
  "certificacion-2025": "Certificación 2025",
  balance: "Balance",
  demo: "Demostración",
  standing: "De pie",
  seated: "Sentada",
  "leg-extension": "Pierna extendida",
  "short-clip": "Breve",
  colaborador: "Comunidad",
  prueba: "Prueba",
};

export function formatMb(mb: number) {
  if (!Number.isFinite(mb)) return "";
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

export function formatDate(value: string) {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function shortDate(value: string) {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

export function sessionDate(value: string) {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const label = new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function humanTag(tag: string) {
  return tagLabels[tag] ?? tag.replaceAll("-", " ");
}

export function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function cleanTags(text: string) {
  return Array.from(
    new Set(
      text
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const rawTitlePattern = /^(vid|img|mov|pxl|mvi)[-_ ]|\.(mp4|mov|m4v|webm)$|^\d{4,}/i;

export function isRawTitle(title: string) {
  return rawTitlePattern.test(title.trim());
}

export function autoTitle(video: EditableVideo) {
  if (!isRawTitle(video.title)) return video.title;
  const pose = video.poses[0];
  const extra = video.poses.length > 1 ? ` +${video.poses.length - 1}` : "";
  const base = pose ? `${pose.sanskrit}${extra}` : "Práctica";
  return `${base} — ${shortDate(video.date)}`;
}

export function uniquePoseMap(videos: EditableVideo[]) {
  const map = new Map<string, Pose & { count: number }>();
  for (const video of videos) {
    if (video.hidden) continue;
    for (const pose of video.poses) {
      const current = map.get(pose.slug);
      map.set(pose.slug, { ...pose, count: (current?.count ?? 0) + 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.group.localeCompare(b.group) || a.sanskrit.localeCompare(b.sanskrit));
}

export function matchesText(video: EditableVideo, query: string) {
  const text = normalize(
    [
      video.title,
      autoTitle(video),
      video.date,
      formatDate(video.date),
      video.source,
      video.durationLabel,
      video.orientation,
      video.contributor,
      video.tags.join(" "),
      video.notes,
      video.poses.map((pose) => `${pose.sanskrit} ${pose.spanish}`).join(" "),
    ].join(" "),
  );
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => text.includes(part));
}
