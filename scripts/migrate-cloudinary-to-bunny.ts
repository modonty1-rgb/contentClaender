/**
 * Migration: Cloudinary → Bunny.net
 *
 * Dual-write strategy: adds `bunnyUrl` field to each asset in `assets[]`
 * without touching the existing `url` field. Cloudinary remains untouched.
 *
 * Modes:
 *   pnpm exec tsx scripts/migrate-cloudinary-to-bunny.ts --dry-run     # preview only
 *   pnpm exec tsx scripts/migrate-cloudinary-to-bunny.ts --entry <id>  # one entry only
 *   pnpm exec tsx scripts/migrate-cloudinary-to-bunny.ts               # full real run
 *
 * Resumable: skips assets already in state file.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFile, writeFile, appendFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const ENTRY_FILTER_IDX = process.argv.indexOf("--entry");
const ENTRY_FILTER = ENTRY_FILTER_IDX !== -1 ? process.argv[ENTRY_FILTER_IDX + 1] : null;

const STATE_FILE = resolve(process.cwd(), "scripts/.migration-state.json");
const MANIFEST_CSV = resolve(process.cwd(), "scripts/migration-manifest.csv");

const ZONE = process.env.BUNNY_STORAGE_ZONE_NAME!;
const HOST = process.env.BUNNY_STORAGE_HOSTNAME!;
const KEY = process.env.BUNNY_STORAGE_PASSWORD!;
const CDN = process.env.BUNNY_PULL_ZONE_HOSTNAME!;

if (!ZONE || !HOST || !KEY || !CDN) {
  console.error("❌ Missing bunny env vars. Check .env");
  process.exit(1);
}

const prisma = new PrismaClient();

type AssetItem = {
  id: string;
  url: string;
  bunnyUrl?: string;
  bunnyError?: string;
  type: "image" | "video";
  label?: string;
  width?: number;
  height?: number;
  bytes?: number;
};

type State = {
  processed: string[]; // composite key: `${entryId}:${assetId}`
  failed: { key: string; error: string; at: string }[];
  startedAt: string;
  lastUpdatedAt: string;
};

type WorkItem = {
  entryId: string;
  clientSlug: string;
  month: string;
  asset: AssetItem;
  assetIndex: number;
  assetsCount: number; // total assets in this entry
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("en-US");
const kb = (b: number) => (b / 1024).toFixed(1) + " KB";
const mb = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";
const dur = (ms: number) => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs}s`;
};

function getExtension(url: string, type: "image" | "video"): string {
  const m = url.match(/\.([a-zA-Z0-9]{2,5})(?:\?.*)?$/);
  if (m) return "." + m[1].toLowerCase();
  return type === "video" ? ".mp4" : ".jpg";
}

function buildBunnyPath(item: WorkItem): string {
  const ext = getExtension(item.asset.url, item.asset.type);
  const slug = item.clientSlug || "_orphan";
  return `clients/${slug}/${item.month}/${item.entryId}/${item.asset.id}${ext}`;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadState(): Promise<State> {
  if (await fileExists(STATE_FILE)) {
    const raw = await readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw) as State;
  }
  return {
    processed: [],
    failed: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

async function saveState(state: State): Promise<void> {
  if (DRY_RUN) return;
  state.lastUpdatedAt = new Date().toISOString();
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

async function appendManifest(row: string[]): Promise<void> {
  if (DRY_RUN) return;
  const exists = await fileExists(MANIFEST_CSV);
  if (!exists) {
    await writeFile(
      MANIFEST_CSV,
      "timestamp,entryId,clientSlug,month,assetId,assetType,cloudinaryUrl,bunnyUrl,bytes\n",
      "utf-8",
    );
  }
  await appendFile(MANIFEST_CSV, row.map((c) => `"${c.replace(/"/g, '""')}"`).join(",") + "\n", "utf-8");
}

// ─── MIGRATION CORE ───────────────────────────────────────────────────────────

async function migrateOne(item: WorkItem, idx: number, total: number): Promise<{ ok: boolean; bunnyUrl?: string; error?: string }> {
  const pct = ((idx + 1) / total * 100).toFixed(1);
  const path = buildBunnyPath(item);
  const cdnUrl = `https://${CDN}/${path}`;

  console.log(`\n[${idx + 1}/${total}] (${pct}%) ${item.clientSlug}/${item.month}/${item.entryId.slice(-6)}/${item.asset.id.slice(-6)} (${item.assetIndex + 1}/${item.assetsCount})`);
  console.log(`   📄 type: ${item.asset.type}  •  ext: ${getExtension(item.asset.url, item.asset.type)}`);
  console.log(`   📍 path: ${path}`);

  // ─── 1. Download from Cloudinary ────────────────────────────────────────────
  const t1 = Date.now();
  const cloudinaryRes = await fetch(item.asset.url);
  if (!cloudinaryRes.ok) {
    return { ok: false, error: `cloudinary download failed: ${cloudinaryRes.status}` };
  }
  const buffer = Buffer.from(await cloudinaryRes.arrayBuffer());
  const size = buffer.length;
  const downloadMs = Date.now() - t1;
  console.log(`   ⬇️  Downloaded: ${mb(size)} in ${dur(downloadMs)}`);

  if (DRY_RUN) {
    console.log(`   🔍 DRY-RUN: would upload to ${cdnUrl}`);
    return { ok: true, bunnyUrl: cdnUrl };
  }

  // ─── 2. Upload to Bunny ─────────────────────────────────────────────────────
  const t2 = Date.now();
  const storageUrl = `https://${HOST}/${ZONE}/${path}`;
  const contentType = item.asset.type === "video" ? "video/mp4" : "image/jpeg";
  const uploadRes = await fetch(storageUrl, {
    method: "PUT",
    headers: { AccessKey: KEY, "Content-Type": contentType },
    body: buffer,
  });
  if (!uploadRes.ok) {
    return { ok: false, error: `bunny upload failed: ${uploadRes.status} ${await uploadRes.text().catch(() => "")}` };
  }
  const uploadMs = Date.now() - t2;
  console.log(`   ⬆️  Uploaded in ${dur(uploadMs)}`);

  // ─── 3. Verify via storage API (size match) ─────────────────────────────────
  const verifyRes = await fetch(storageUrl, {
    method: "GET",
    headers: { AccessKey: KEY },
  });
  if (!verifyRes.ok) {
    return { ok: false, error: `verify download failed: ${verifyRes.status}` };
  }
  const verifyBuffer = Buffer.from(await verifyRes.arrayBuffer());
  if (verifyBuffer.length !== size) {
    return { ok: false, error: `size mismatch: uploaded ${size}, got ${verifyBuffer.length}` };
  }
  console.log(`   ✅ Verified: size matches (${mb(size)})`);

  // ─── 4. Verify CDN URL responds 200 ─────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 500)); // small delay for CDN propagation
  const cdnRes = await fetch(cdnUrl, { method: "HEAD" });
  if (!cdnRes.ok) {
    console.log(`   ⚠️  CDN HEAD returned ${cdnRes.status} — retrying after 2s...`);
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await fetch(cdnUrl, { method: "HEAD" });
    if (!retry.ok) {
      return { ok: false, error: `CDN not responding: ${retry.status}` };
    }
  }
  console.log(`   🌍 CDN: ${cdnUrl}`);

  return { ok: true, bunnyUrl: cdnUrl };
}

async function updateDbSuccess(entryId: string, assetId: string, bunnyUrl: string): Promise<void> {
  if (DRY_RUN) return;
  const entry = await prisma.contentEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error(`entry ${entryId} not found`);
  const assets = (entry.assets as AssetItem[] | null) ?? [];
  const updated = assets.map((a) =>
    a.id === assetId ? { ...a, bunnyUrl, bunnyError: undefined } : a,
  );
  await prisma.contentEntry.update({
    where: { id: entryId },
    data: { assets: updated as object[] },
  });
}

async function updateDbError(entryId: string, assetId: string, error: string): Promise<void> {
  if (DRY_RUN) return;
  const entry = await prisma.contentEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error(`entry ${entryId} not found`);
  const assets = (entry.assets as AssetItem[] | null) ?? [];
  const updated = assets.map((a) =>
    a.id === assetId ? { ...a, bunnyError: error } : a,
  );
  await prisma.contentEntry.update({
    where: { id: entryId },
    data: { assets: updated as object[] },
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n🐰 Migration: Cloudinary → Bunny");
  if (DRY_RUN) console.log("   ⚠️  DRY-RUN MODE (no uploads, no DB writes)");
  if (ENTRY_FILTER) console.log(`   🎯 SINGLE ENTRY: ${ENTRY_FILTER}`);
  console.log("─".repeat(70));

  const state = await loadState();
  const skip = new Set(state.processed);
  console.log(`📋 State: ${state.processed.length} already processed, ${state.failed.length} failed`);

  // ── Load entries + clients ──
  const clients = await prisma.client.findMany({ select: { id: true, slug: true } });
  const clientSlugById = new Map(clients.map((c) => [c.id, c.slug]));

  const entries = await prisma.contentEntry.findMany({
    where: ENTRY_FILTER ? { id: ENTRY_FILTER } : {},
    select: { id: true, clientId: true, month: true, assets: true },
  });

  // ── Build work queue ──
  const queue: WorkItem[] = [];
  for (const e of entries) {
    const assets = (e.assets as AssetItem[] | null) ?? [];
    if (assets.length === 0) continue;
    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];
      if (a.bunnyUrl) continue; // already migrated
      if (!a.url || !a.url.includes("res.cloudinary.com")) continue;
      const key = `${e.id}:${a.id}`;
      if (skip.has(key)) continue;
      queue.push({
        entryId: e.id,
        clientSlug: e.clientId ? clientSlugById.get(e.clientId) ?? "_orphan" : "_orphan",
        month: e.month,
        asset: a,
        assetIndex: i,
        assetsCount: assets.length,
      });
    }
  }

  console.log(`📦 Work queue: ${fmt(queue.length)} assets to migrate\n`);
  if (queue.length === 0) {
    console.log("✨ Nothing to migrate. All done.");
    await prisma.$disconnect();
    return;
  }

  const startTime = Date.now();
  let succeeded = 0;
  let failedNow = 0;
  let bytesTransferred = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const key = `${item.entryId}:${item.asset.id}`;
    try {
      const result = await migrateOne(item, i, queue.length);
      if (result.ok && result.bunnyUrl) {
        await updateDbSuccess(item.entryId, item.asset.id, result.bunnyUrl);
        await appendManifest([
          new Date().toISOString(),
          item.entryId,
          item.clientSlug,
          item.month,
          item.asset.id,
          item.asset.type,
          item.asset.url,
          result.bunnyUrl,
          String(item.asset.bytes ?? ""),
        ]);
        state.processed.push(key);
        succeeded++;
        bytesTransferred += item.asset.bytes ?? 0;
        console.log(`   💾 DB updated (bunnyUrl)`);
      } else {
        const errMsg = result.error ?? "unknown";
        await updateDbError(item.entryId, item.asset.id, errMsg);
        state.processed.push(key);
        state.failed.push({ key, error: errMsg, at: new Date().toISOString() });
        failedNow++;
        console.log(`   ❌ FAILED → bunnyError saved: ${errMsg}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      state.failed.push({ key, error: msg, at: new Date().toISOString() });
      failedNow++;
      console.log(`   💥 EXCEPTION: ${msg}`);
    }

    // Save state every 5 items
    if ((i + 1) % 5 === 0 || i === queue.length - 1) {
      await saveState(state);
    }

    // ETA
    const elapsed = Date.now() - startTime;
    const rate = (i + 1) / (elapsed / 1000);
    const remaining = queue.length - (i + 1);
    const etaSec = remaining / rate;
    if ((i + 1) % 5 === 0 && remaining > 0) {
      console.log(`\n   📊 Progress: ${i + 1}/${queue.length}  •  rate: ${rate.toFixed(1)}/s  •  ETA: ${dur(etaSec * 1000)}`);
    }
  }

  const totalTime = Date.now() - startTime;
  console.log("\n" + "═".repeat(70));
  console.log("🎉 Migration finished");
  console.log(`   ✅ Succeeded:        ${succeeded}/${queue.length}`);
  console.log(`   ❌ Failed:           ${failedNow}`);
  console.log(`   💾 Bytes (known):    ${mb(bytesTransferred)}`);
  console.log(`   ⏱  Total time:       ${dur(totalTime)}`);
  if (!DRY_RUN) {
    console.log(`   📋 Manifest:         ${MANIFEST_CSV}`);
    console.log(`   💾 State:            ${STATE_FILE}`);
  }
  if (failedNow > 0) {
    console.log(`\n   ⚠️  Failed items are in state file. Rerun to retry (they're NOT in processed).`);
  }
  console.log("═".repeat(70) + "\n");

  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error("💥 Fatal:", err);
  await prisma.$disconnect();
  process.exit(1);
});
