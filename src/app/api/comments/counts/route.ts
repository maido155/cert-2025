import { NextResponse } from "next/server";
import { cloudEnabled, query } from "@/lib/d1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!cloudEnabled()) return NextResponse.json({ counts: {}, cloud: false });
  const rows = await query<{ video_id: string; n: number }>(
    "SELECT video_id, COUNT(*) AS n FROM comments GROUP BY video_id",
  );
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.video_id] = Number(row.n);
  return NextResponse.json({ counts, cloud: true });
}
