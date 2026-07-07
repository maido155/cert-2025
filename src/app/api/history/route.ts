import { NextRequest, NextResponse } from "next/server";
import { cloudEnabled, query } from "@/lib/d1";
import type { HistoryEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HistoryDbRow = {
  id: number;
  video_id: string;
  title: string | null;
  editor: string;
  action: string;
  before: string | null;
  after: string | null;
  created_at: string;
};

function parse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!cloudEnabled()) return NextResponse.json({ entries: [], cloud: false });
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200;

  const rows = await query<HistoryDbRow>(
    "SELECT id, video_id, title, editor, action, before, after, created_at FROM history ORDER BY id DESC LIMIT ?",
    [limit],
  );

  const entries: HistoryEntry[] = rows.map((row) => ({
    id: row.id,
    videoId: row.video_id,
    title: row.title,
    editor: row.editor,
    action: row.action as HistoryEntry["action"],
    before: parse(row.before),
    after: parse(row.after),
    createdAt: row.created_at,
  }));

  return NextResponse.json({ entries, cloud: true });
}
