/**
 * One-time migration: convert assetLink → assets[0]
 * Run: npx tsx scripts/migrate-assets.ts
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.contentEntry.findMany({
    where: { assetLink: { not: null } },
    select: { id: true, assetLink: true, assets: true },
  });

  console.log(`Found ${entries.length} entries with assetLink`);

  let migrated = 0;
  for (const entry of entries) {
    if (!entry.assetLink) continue;

    // Skip if already has assets array populated
    const existing = entry.assets as unknown[] | null;
    if (existing && existing.length > 0) {
      console.log(`  skip ${entry.id} — already has assets`);
      continue;
    }

    await prisma.contentEntry.update({
      where: { id: entry.id },
      data: {
        assets: [
          {
            id: randomUUID(),
            url: entry.assetLink,
            type: "video",
            label: "",
          },
        ],
      },
    });
    migrated++;
    console.log(`  migrated ${entry.id}`);
  }

  console.log(`Done. Migrated ${migrated} entries.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
