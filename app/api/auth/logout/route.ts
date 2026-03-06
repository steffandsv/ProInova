export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/login", baseUrl));
  // Clear the session cookie
  response.cookies.set("proinova_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
