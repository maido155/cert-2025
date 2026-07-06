import { NextRequest, NextResponse } from "next/server";

async function accessHash(code: string) {
  const bytes = new TextEncoder().encode(`cert-2025:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  const code = process.env.ACCESS_CODE;
  const form = await request.formData();
  const attempt = String(form.get("clave") ?? "").trim();

  if (!code || attempt !== code) {
    return NextResponse.redirect(new URL("/acceso?error=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set("acceso", await accessHash(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });
  return response;
}
