import { createReadStream, statSync } from "node:fs";
import { NextRequest } from "next/server";
import { getRawVideo } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 1024 * 1024;

function headersFor(size: number, extra?: HeadersInit) {
  return {
    "Accept-Ranges": "bytes",
    "Content-Type": "video/mp4",
    "Content-Length": String(size),
    "Cache-Control": "private, max-age=0, must-revalidate",
    ...extra,
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const video = getRawVideo(id);
  if (!video?.localVideoPath) {
    return new Response("Video not found", { status: 404 });
  }

  let stats;
  try {
    stats = statSync(video.localVideoPath);
  } catch {
    return new Response("Local video file is not available", { status: 404 });
  }

  const range = request.headers.get("range");
  if (!range) {
    const stream = createReadStream(video.localVideoPath);
    return new Response(stream as unknown as BodyInit, {
      status: 200,
      headers: headersFor(stats.size),
    });
  }

  const match = range.match(/bytes=(\d+)-(\d*)/);
  const start = match ? Number(match[1]) : 0;
  if (!Number.isFinite(start) || start < 0 || start >= stats.size) {
    return new Response("Invalid range", {
      status: 416,
      headers: {
        "Content-Range": `bytes */${stats.size}`,
      },
    });
  }
  const end = Math.min(start + CHUNK_SIZE, stats.size - 1);
  const contentLength = end - start + 1;
  const stream = createReadStream(video.localVideoPath, { start, end });

  return new Response(stream as unknown as BodyInit, {
    status: 206,
    headers: headersFor(contentLength, {
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
    }),
  });
}
