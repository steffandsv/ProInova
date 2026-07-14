export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  // Clear the session cookie
  response.cookies.set("proinova_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
