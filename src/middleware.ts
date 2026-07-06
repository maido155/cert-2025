import { NextRequest, NextResponse } from "next/server";

async function accessHash(code: string) {
  const bytes = new TextEncoder().encode(`cert-2025:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const code = process.env.ACCESS_CODE?.trim();
  if (!code) return NextResponse.next();

  const cookie = request.cookies.get("acceso")?.value;
  if (cookie && cookie === (await accessHash(code))) {
    // Sesión deslizante: cada visita renueva la cookie al máximo que permite
    // el navegador (400 días), así el acceso no caduca mientras la app se use.
    const response = NextResponse.next();
    response.cookies.set("acceso", cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
    });
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/acceso";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|thumbs|icon\\.svg|favicon\\.ico|acceso|api/acceso).*)"],
};
