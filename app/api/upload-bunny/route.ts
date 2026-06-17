import { NextRequest, NextResponse } from "next/server";
import { uploadToBunny, getBunnyPublicUrl } from "@/lib/bunny";

export const runtime = "nodejs";
export const maxDuration = 60;

const MB = 1024 * 1024;
const IMAGE_LIMIT = 10 * MB;
const VIDEO_LIMIT = 500 * MB;

function getExt(name: string, type: string): string {
  const m = name.match(/\.([a-zA-Z0-9]{2,5})$/);
  if (m) return m[1].toLowerCase();
  if (type.startsWith("video/")) return "mp4";
  return "bin";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    const slug = fd.get("slug") as string | null;
    const month = fd.get("month") as string | null;
    const entryId = fd.get("entryId") as string | null;
    const assetId = fd.get("assetId") as string | null;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!slug || !month || !entryId || !assetId) {
      return NextResponse.json({ error: "Missing path params" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const limit = isVideo ? VIDEO_LIMIT : IMAGE_LIMIT;
    if (file.size > limit) {
      const sizeMB = (file.size / MB).toFixed(1);
      const limitMB = isVideo ? 500 : 10;
      return NextResponse.json(
        { error: `حجم الملف ${sizeMB}MB أكبر من الحد (${limitMB}MB)` },
        { status: 413 },
      );
    }

    const ext = getExt(file.name, file.type);
    const remotePath = `clients/${slug}/${month}/${entryId}/${assetId}.${ext}`;
    const contentType = file.type || (isVideo ? "video/mp4" : "image/jpeg");

    const buf = Buffer.from(await file.arrayBuffer());
    await uploadToBunny(buf, remotePath, contentType);

    const url = getBunnyPublicUrl(remotePath);

    return NextResponse.json({
      url,
      bunnyUrl: url,
      type: isVideo ? "video" : "image",
      bytes: file.size,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
