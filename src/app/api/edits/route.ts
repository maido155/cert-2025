import { NextRequest, NextResponse } from "next/server";
import { cloudEnabled, query } from "@/lib/d1";
import type { EditRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EditDbRow = {
  video_id: string;
  overlay: string;
  is_new: number;
  deleted: number;
};

function parseOverlay(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function GET() {
  if (!cloudEnabled()) return NextResponse.json({ rows: [], cloud: false });
  const rows = await query<EditDbRow>("SELECT video_id, overlay, is_new, deleted FROM edits");
  const parsed: EditRow[] = rows.map((row) => ({
    videoId: row.video_id,
    overlay: parseOverlay(row.overlay),
    isNew: Boolean(row.is_new),
    deleted: Boolean(row.deleted),
  }));
  return NextResponse.json({ rows: parsed, cloud: true });
}

export async function POST(request: NextRequest) {
  if (!cloudEnabled()) return NextResponse.json({ error: "cloud-disabled" }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.videoId !== "string") {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const videoId: string = body.videoId;
  const editor: string = String(body.editor ?? "").trim() || "Anónimo";
  const action: string = String(body.action ?? "edit");
  const title: string | null = body.title ?? null;
  const overlay = body.overlay ?? {};
  const isNew = body.isNew ? 1 : 0;
  const deleted = body.deleted ? 1 : 0;
  const now = new Date().toISOString();

  const existing = await query<{ overlay: string }>("SELECT overlay FROM edits WHERE video_id = ?", [videoId]);
  const before = existing[0]?.overlay ?? null;
  const overlayJson = JSON.stringify(overlay);

  await query(
    `INSERT INTO edits (video_id, overlay, is_new, deleted, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(video_id) DO UPDATE SET
       overlay = excluded.overlay,
       is_new = excluded.is_new,
       deleted = excluded.deleted,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
    [videoId, overlayJson, isNew, deleted, now, editor],
  );

  await query(
    `INSERT INTO history (video_id, title, editor, action, before, after, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [videoId, title, editor, action, before, overlayJson, now],
  );

  return NextResponse.json({ ok: true });
}
