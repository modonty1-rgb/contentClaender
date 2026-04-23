export async function downloadWithProgress(
  url: string,
  filename: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  const target = url.includes("res.cloudinary.com")
    ? url.replace("/upload/", "/upload/fl_attachment/")
    : url;

  const res = await fetch(target);
  if (!res.ok || !res.body) throw new Error("fetch failed");

  const contentLength = res.headers.get("Content-Length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total > 0) onProgress(Math.min(99, Math.round((received / total) * 100)));
  }

  onProgress(100);

  const blob = new Blob(chunks);
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}
