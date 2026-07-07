import { NextRequest, NextResponse } from "next/server";
import { cloudEnabled, query } from "@/lib/d1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!cloudEnabled()) return NextResponse.json({ error: "cloud-disabled" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const historyId = Number(body?.historyId);
  if (!Number.isFinite(historyId)) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const editor: string = String(body?.editor ?? "").trim() || "Anónimo";
  const now = new Date().toISOString();

  const entryRows = await query<{ video_id: string; title: string | null; before: string | null }>(
    "SELECT video_id, title, before FROM history WHERE id = ?",
    [historyId],
  );
  const entry = entryRows[0];
  if (!entry) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const videoId = entry.video_id;
  const target = entry.before; // estado al que regresamos (JSON o null)

  const currentRows = await query<{ overlay: string; is_new: number }>(
    "SELECT overlay, is_new FROM edits WHERE video_id = ?",
    [videoId],
  );
  const current = currentRows[0]?.overlay ?? null;
  const isNew = currentRows[0]?.is_new ?? 0;

  if (target === null) {
    // No había overlay previo: quitar la fila devuelve el video a su estado base
    // (o elimina la práctica si había sido creada en la nube).
    await query("DELETE FROM edits WHERE video_id = ?", [videoId]);
  } else {
    await query(
      `INSERT INTO edits (video_id, overlay, is_new, deleted, updated_at, updated_by)
       VALUES (?, ?, ?, 0, ?, ?)
       ON CONFLICT(video_id) DO UPDATE SET
         overlay = excluded.overlay,
         deleted = 0,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
      [videoId, target, isNew, now, editor],
    );
  }

  await query(
    `INSERT INTO history (video_id, title, editor, action, before, after, created_at)
     VALUES (?, ?, ?, 'revert', ?, ?, ?)`,
    [videoId, entry.title, editor, current, target, now],
  );

  return NextResponse.json({ ok: true });
}
