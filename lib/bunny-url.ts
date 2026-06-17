/**
 * Append Bunny Optimizer query parameters to an image URL.
 * Non-Bunny URLs and already-transformed URLs are returned unchanged.
 *
 * Requires the Bunny Optimizer add-on enabled on the Pull Zone for
 * the parameters to take effect. Without it, the URL is still valid
 * but the parameters are ignored (raw image is served).
 *
 * Docs: https://docs.bunny.net/optimizer/dynamic-images
 *
 * Examples:
 *   optimize(url, { width: 500 })   → /file.jpg?width=500&format=auto&quality=auto
 *   optimize(url, { width: 1200 })  → /file.jpg?width=1200&format=auto&quality=auto
 *   optimize(url)                   → /file.jpg?format=auto&quality=auto
 */
function isBunnyCdnUrl(url: string): boolean {
  return /^https:\/\/[^/]+\.b-cdn\.net\//.test(url);
}

export function optimizeBunnyUrl(
  url: string | undefined | null,
  opts?: { width?: number; height?: number; quality?: number | "auto" },
): string {
  if (!url) return "";
  if (!isBunnyCdnUrl(url)) return url;
  if (url.includes("?")) return url;

  const params = new URLSearchParams();
  params.set("format", "auto");
  params.set("quality", String(opts?.quality ?? "auto"));
  if (opts?.width) params.set("width", String(opts.width));
  if (opts?.height) params.set("height", String(opts.height));

  return `${url}?${params.toString()}`;
}

/**
 * Unified optimizer — works for both Cloudinary (legacy) and Bunny URLs.
 * Detects the source from the URL and applies the right transformation.
 * Use this in components during the migration period.
 */
import { optimizeCloudinaryUrl } from "./cloudinary-url";

export function optimizeAssetUrl(
  url: string | undefined | null,
  opts?: { width?: number; height?: number; quality?: number | "auto" },
): string {
  if (!url) return "";
  if (isBunnyCdnUrl(url)) {
    return optimizeBunnyUrl(url, opts);
  }
  if (url.includes("res.cloudinary.com")) {
    return optimizeCloudinaryUrl(url, {
      width: opts?.width,
      height: opts?.height,
      quality: typeof opts?.quality === "number" ? String(opts.quality) : undefined,
    });
  }
  return url;
}
