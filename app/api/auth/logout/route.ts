export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  // Location relativo: no contêiner, request.url traz o HOSTNAME do servidor (0.0.0.0), não o domínio público
  const response = new NextResponse(null, { status: 307, headers: { Location: "/login" } });
  // Clear the session cookie
  response.cookies.set("proinova_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
