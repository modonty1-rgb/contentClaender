/**
 * Phase 2 — Bunny-only reads.
 * Returns the displayable URL for an asset. During this phase we deliberately
 * SKIP the cloudinary fallback to surface any code path that's still expecting
 * a cloudinary URL. Assets that failed migration (no bunnyUrl, has bunnyError)
 * intentionally show as empty so the team can fix them.
 */
export function assetSrc(asset: { url?: string; bunnyUrl?: string }): string {
  return asset.bunnyUrl ?? "";
}

export function hasAssetUrl(asset: { url?: string; bunnyUrl?: string }): boolean {
  return Boolean(asset.bunnyUrl);
}
