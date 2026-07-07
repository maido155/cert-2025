import { NextRequest, NextResponse } from "next/server";
import { cloudEnabled, query } from "@/lib/d1";
import type { Comment } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommentDbRow = {
  id: number;
  video_id: string;
  author: string;
  body: string;
  created_at: string;
};

function toComment(row: CommentDbRow): Comment {
  return { id: row.id, videoId: row.video_id, author: row.author, body: row.body, createdAt: row.created_at };
}

export async function GET(request: NextRequest) {
  if (!cloudEnabled()) return NextResponse.json({ comments: [], cloud: false });
  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ comments: [] });
  const rows = await query<CommentDbRow>(
    "SELECT id, video_id, author, body, created_at FROM comments WHERE video_id = ? ORDER BY id ASC",
    [videoId],
  );
  return NextResponse.json({ comments: rows.map(toComment), cloud: true });
}

export async function POST(request: NextRequest) {
  if (!cloudEnabled()) return NextResponse.json({ error: "cloud-disabled" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const videoId = String(body?.videoId ?? "").trim();
  const text = String(body?.body ?? "").trim().slice(0, 2000);
  const author = String(body?.author ?? "").trim() || "Anónimo";
  if (!videoId || !text) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const now = new Date().toISOString();
  const inserted = await query<CommentDbRow>(
    "INSERT INTO comments (video_id, author, body, created_at) VALUES (?, ?, ?, ?) RETURNING id, video_id, author, body, created_at",
    [videoId, author, text, now],
  );
  return NextResponse.json({ comment: inserted[0] ? toComment(inserted[0]) : null });
}

export async function DELETE(request: NextRequest) {
  if (!cloudEnabled()) return NextResponse.json({ error: "cloud-disabled" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const author = String(body?.author ?? "").trim();
  if (!Number.isFinite(id) || !author) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  // Solo el autor puede borrar su propio comentario.
  const deleted = await query<{ id: number }>("DELETE FROM comments WHERE id = ? AND author = ? RETURNING id", [id, author]);
  return NextResponse.json({ ok: deleted.length > 0 });
}
