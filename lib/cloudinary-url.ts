/**
 * Insert Cloudinary transformations into an upload URL.
 * Non-Cloudinary URLs and already-transformed URLs are returned unchanged.
 *
 * Examples:
 *   optimize(url, { width: 500 })   → /upload/f_auto,q_auto,w_500,c_fit/v.../...
 *   optimize(url, { width: 1200 })  → /upload/f_auto,q_auto,w_1200,c_fit/v.../...
 *   optimize(url)                   → /upload/f_auto,q_auto/v.../...
 */
export function optimizeCloudinaryUrl(
  url: string | undefined | null,
  opts?: { width?: number; height?: number; quality?: string },
): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;

  // Detect if a transformation segment already exists between /upload/ and /v{digits}/
  // Untransformed: .../upload/v123/folder/file.png
  // Transformed:   .../upload/f_auto,q_auto/v123/folder/file.png
  const afterUpload = url.split("/upload/")[1] ?? "";
  const firstSegment = afterUpload.split("/")[0] ?? "";
  if (!/^v\d+$/.test(firstSegment)) return url; // already has transformations or unknown shape

  const tx: string[] = [];
  tx.push("f_auto");
  tx.push(opts?.quality ? `q_${opts.quality}` : "q_auto");
  if (opts?.width) tx.push(`w_${opts.width}`);
  if (opts?.height) tx.push(`h_${opts.height}`);
  if (opts?.width || opts?.height) tx.push("c_fit");

  return url.replace("/upload/", `/upload/${tx.join(",")}/`);
}
