import "server-only";

const ZONE = process.env.BUNNY_STORAGE_ZONE_NAME!;
const HOST = process.env.BUNNY_STORAGE_HOSTNAME!;
const KEY = process.env.BUNNY_STORAGE_PASSWORD!;
const CDN = process.env.BUNNY_PULL_ZONE_HOSTNAME!;

function assertEnv() {
  if (!ZONE || !HOST || !KEY || !CDN) {
    throw new Error(
      "Bunny env missing: BUNNY_STORAGE_ZONE_NAME / BUNNY_STORAGE_HOSTNAME / BUNNY_STORAGE_PASSWORD / BUNNY_PULL_ZONE_HOSTNAME",
    );
  }
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "").replace(/\/+/g, "/");
}

export function getBunnyPublicUrl(path: string): string {
  assertEnv();
  return `https://${CDN}/${normalizePath(path)}`;
}

export function extractBunnyPath(url: string): string | null {
  if (!url) return null;
  const prefix = `https://${CDN}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length).split("?")[0] ?? null;
}

export function isBunnyUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith(`https://${CDN}/`);
}

export async function uploadToBunny(
  body: Buffer | Uint8Array | ArrayBuffer | Blob,
  remotePath: string,
  contentType?: string,
): Promise<{ url: string; path: string }> {
  assertEnv();
  const path = normalizePath(remotePath);
  const storageUrl = `https://${HOST}/${ZONE}/${path}`;

  const res = await fetch(storageUrl, {
    method: "PUT",
    headers: {
      AccessKey: KEY,
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body: body as BodyInit,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Bunny upload failed (${res.status}): ${txt || res.statusText}`);
  }

  return { url: getBunnyPublicUrl(path), path };
}

export async function deleteFromBunny(remotePath: string): Promise<void> {
  assertEnv();
  const path = normalizePath(remotePath);
  const storageUrl = `https://${HOST}/${ZONE}/${path}`;

  const res = await fetch(storageUrl, {
    method: "DELETE",
    headers: { AccessKey: KEY },
  });

  if (!res.ok && res.status !== 404) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Bunny delete failed (${res.status}): ${txt || res.statusText}`);
  }
}

export async function deleteBunnyUrl(url: string): Promise<boolean> {
  const path = extractBunnyPath(url);
  if (!path) return false;
  await deleteFromBunny(path);
  return true;
}
