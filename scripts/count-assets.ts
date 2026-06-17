import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type AssetItem = {
  id?: string;
  url?: string;
  bunnyUrl?: string;
  type?: "image" | "video";
  bytes?: number;
};

const fmt = (n: number) => n.toLocaleString("en-US");
const mb = (b: number) => (b / 1024 / 1024).toFixed(1) + " MB";

async function run() {
  console.log("\n📊 JBR Content Calendar — Asset Audit\n");
  console.log("─".repeat(60));

  const totalEntries = await prisma.contentEntry.count();
  console.log(`📋 Total entries:               ${fmt(totalEntries)}`);

  const allEntries = await prisma.contentEntry.findMany({
    select: { id: true, clientId: true, month: true, assets: true, assetLink: true },
  });

  let entriesWithAssets = 0;
  let entriesNoClient = 0;
  let totalAssets = 0;
  let cloudinaryAssets = 0;
  let bunnyAssets = 0;
  let alreadyMigrated = 0;
  let otherAssets = 0;
  let legacyAssetLink = 0;
  let totalBytesKnown = 0;
  let imageCount = 0;
  let videoCount = 0;

  const monthCounts: Record<string, number> = {};
  const clientCounts: Record<string, number> = {};

  for (const e of allEntries) {
    const assets = (e.assets as AssetItem[] | null) ?? [];
    if (assets.length > 0) entriesWithAssets++;
    if (!e.clientId && assets.length > 0) entriesNoClient++;

    for (const a of assets) {
      totalAssets++;
      const url = a.url ?? "";
      if (url.includes("res.cloudinary.com")) cloudinaryAssets++;
      else if (url.includes(".b-cdn.net")) bunnyAssets++;
      else otherAssets++;

      if (a.bunnyUrl) alreadyMigrated++;
      if (a.type === "image") imageCount++;
      if (a.type === "video") videoCount++;
      if (typeof a.bytes === "number") totalBytesKnown += a.bytes;

      monthCounts[e.month] = (monthCounts[e.month] ?? 0) + 1;
      const cKey = e.clientId ?? "(no-client)";
      clientCounts[cKey] = (clientCounts[cKey] ?? 0) + 1;
    }

    if (e.assetLink && e.assetLink.includes("res.cloudinary.com")) legacyAssetLink++;
  }

  console.log(`📋 Entries with assets:         ${fmt(entriesWithAssets)}`);
  console.log(`📋 Entries with NO client:      ${fmt(entriesNoClient)} ${entriesNoClient > 0 ? "← will go to _orphan/" : ""}`);
  console.log("─".repeat(60));
  console.log(`📦 Total assets in JSON:        ${fmt(totalAssets)}`);
  console.log(`   ├─ Cloudinary URLs:          ${fmt(cloudinaryAssets)} ← to migrate`);
  console.log(`   ├─ Bunny URLs (b-cdn.net):   ${fmt(bunnyAssets)}`);
  console.log(`   ├─ Already has bunnyUrl:     ${fmt(alreadyMigrated)} ← already done (skipped)`);
  console.log(`   └─ Other / unknown:          ${fmt(otherAssets)}`);
  console.log("─".repeat(60));
  console.log(`🖼  Images:                     ${fmt(imageCount)}`);
  console.log(`🎬 Videos:                     ${fmt(videoCount)}`);
  console.log(`📊 Legacy assetLink (cloudinary): ${fmt(legacyAssetLink)}`);
  console.log("─".repeat(60));
  console.log(`💾 Known total size:            ${mb(totalBytesKnown)} (only counts assets with bytes field)`);
  console.log("─".repeat(60));

  console.log("\n📅 Assets per month:");
  for (const [m, c] of Object.entries(monthCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${m.padEnd(8)} ${fmt(c)}`);
  }

  console.log("\n👥 Assets per client:");
  const clients = await prisma.client.findMany({ select: { id: true, name: true, slug: true } });
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  for (const [cid, c] of Object.entries(clientCounts).sort((a, b) => b[1] - a[1])) {
    const client = clientMap.get(cid);
    const label = client ? `${client.name} (${client.slug})` : cid;
    console.log(`   ${label.padEnd(30)} ${fmt(c)}`);
  }

  console.log("\n" + "═".repeat(60));
  console.log("🎯 To migrate:");
  console.log(`   ${fmt(cloudinaryAssets)} cloudinary assets in ${fmt(entriesWithAssets)} entries`);
  if (legacyAssetLink > 0) {
    console.log(`   + ${fmt(legacyAssetLink)} legacy assetLink (will be handled separately)`);
  }
  console.log("═".repeat(60) + "\n");

  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error("💥 Error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
