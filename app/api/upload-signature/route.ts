import { NextResponse } from "next/server";

// Phase 2 — Cloudinary upload-signature is disabled.
// All uploads now go to /api/upload-bunny.
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Endpoint disabled. Use /api/upload-bunny." },
    { status: 410 },
  );
}
