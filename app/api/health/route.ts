export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[Health] Database check failed:", err);
    return NextResponse.json(
      { status: "error", message: "Database unreachable" },
      { status: 503 }
    );
  }
}
