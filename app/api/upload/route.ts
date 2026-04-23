import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isVideo = file.type.startsWith("video/");

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
      width?: number;
      height?: number;
      bytes: number;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "jbr-content",
          resource_type: isVideo ? "video" : "image",
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result as typeof resolve extends (v: infer V) => void ? V : never);
        },
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      url:    result.secure_url,
      type:   isVideo ? "video" : "image",
      width:  result.width,
      height: result.height,
      bytes:  result.bytes,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
