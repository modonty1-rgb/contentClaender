/**
 * Import JBR Content Calendar Excel → MongoDB
 *
 * Usage:
 *   pnpm tsx scripts/import-excel.ts
 *
 * Handles 3 sheet formats:
 *  - feb  : old format (JS001-JS015), no explicit day → uses row index
 *  - march: new format (day, idea, funnel, type, org/paid, caption, script, tov, ref, publishing, channels, links, date)
 *  - april: new format + extra "day of week" column
 */

import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXCEL_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "jbr content calendar.xlsx"
);

// ── Sheet name → month value ──────────────────────────────────────────────────
const SHEET_TO_MONTH: Record<string, string> = {
  jan: "jan",
  feb: "feb",
  march: "mar",
  april: "apr",
  may: "may",
  jun: "jun",
  jul: "jul",
  august: "aug",
  sep: "sep",
  oct: "oct",
  nov: "nov",
  dec: "dec",
};

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeType(raw: string): string {
  if (!raw) return "";
  const v = raw.toLowerCase().trim();
  if (v.includes("vid") || v.includes("فيديو") || v.includes("فديو"))
    return "vid";
  if (v.includes("carousel") || v.includes("كاروسيل")) return "carousel";
  if (v.includes("reel") || v.includes("ريل")) return "reel";
  if (v.includes("story") || v.includes("ستوري")) return "story";
  if (v.includes("post") || v.includes("تصميم") || v.includes("بوست"))
    return "post";
  return "";
}

function normalizePublishing(raw: string): string {
  if (!raw) return "لم يتم النشر";
  const v = raw.trim();
  if (v.includes("تم النشر") || v.includes("الجدولة")) return "تم النشر";
  if (v.includes("قيد المراجعة") || v === "قيد المراجعة") return "قيد المراجعة";
  if (v.includes("مجدول")) return "مجدول";
  return "لم يتم النشر";
}

function normalizeOrgPaid(raw: string): string {
  if (!raw) return "organic";
  const v = raw.toLowerCase().trim();
  if (
    v.includes("sponsor") ||
    v.includes("paid") ||
    v.includes("مدفوع") ||
    v.includes("سبونسر")
  )
    return "sponsored";
  return "organic";
}

function normalizeFunnel(raw: string): string[] {
  if (!raw) return [];
  const valid = ["awareness", "engagement", "leads", "conversion"];
  return raw
    .split(/[,،\n\/]+/)
    .map((f) => f.trim().toLowerCase())
    .filter((f) => valid.includes(f));
}

function normalizeChannels(raw: string): string[] {
  if (!raw) return [];
  const result: string[] = [];
  const v = raw.toLowerCase();
  if (v.includes("instagram") || v.includes("انستجرام") || v.includes("insta"))
    result.push("instagram");
  if (v.includes("tiktok") || v.includes("تيك")) result.push("tiktok");
  if (/\bx\b/.test(v) || v.includes("twitter") || v.includes("تويتر"))
    result.push("x");
  if (v.includes("facebook") || v.includes("fb") || v.includes("فيسبوك"))
    result.push("facebook");
  if (v.includes("youtube") || v.includes("يوتيوب")) result.push("youtube");
  if (v.includes("linkedin") || v.includes("لينكد")) result.push("linkedin");
  if (v.includes("snapchat") || v.includes("سناب")) result.push("snapchat");
  return [...new Set(result)];
}

/** Extract leading integer from strings like "1 مارس", "15 إبريل" */
function extractDay(raw: string | number): number | null {
  const match = String(raw).match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

// ── Row parsers ───────────────────────────────────────────────────────────────

type EntryInput = {
  month: string;
  day: number;
  idea: string;
  funnel: string[];
  typeOfContent: string;
  orgPaid: string;
  captionSA: string | null;
  captionEG: string | null;
  script: string | null;
  tov: string | null;
  reference: string | null;
  publishing: string;
  channels: string[];
  postVidLinks: string | null;
  reelLink: string | null;
  publishingDate: Date | null;
  publishingTime: string | null;
  code: string | null;
  notes: string | null;
  reviewed: string | null;
  readyToPublish: string | null;
  contentLink: string | null;
  storyboard: string | null;
  material: string | null;
  size: string | null;
};

/**
 * feb sheet — old format
 * Cols: 0=code, 1=date, 3=status, 7=idea, 9=captionSA, 10=captionEG,
 *       11=script, 13=type, 15=vidLink, 17=ref, 18=tov, 20=platforms,
 *       21=orgPaid
 */
function parseFebRow(
  row: unknown[],
  rowIndex: number,
  month: string
): EntryInput | null {
  const idea = str(row[7]);
  if (!idea) return null;

  // Channels from col 20 (المنصة) or individual cols 22-31
  let channelsRaw = str(row[20]);
  if (!channelsRaw) {
    // Individual platform columns: 22=FB, 23=IG, 24=LI, 25=X, 26=TT, 27=SC, 28=threads, 29=Pinterest, 30=YT
    const platforms: Record<number, string> = {
      22: "facebook",
      23: "instagram",
      24: "linkedin",
      25: "x",
      26: "tiktok",
      27: "snapchat",
      30: "youtube",
    };
    const ch: string[] = [];
    for (const [colIdx, name] of Object.entries(platforms)) {
      if (str(row[Number(colIdx)])) ch.push(name);
    }
    channelsRaw = ch.join(", ");
  }

  return {
    month,
    day: rowIndex,
    idea,
    funnel: [],
    typeOfContent: normalizeType(str(row[13])),
    orgPaid: normalizeOrgPaid(str(row[21])),
    captionSA: str(row[9]) || null,
    captionEG: str(row[10]) || null,
    script: str(row[11]) || null,
    tov: str(row[18]) || null,
    reference: str(row[17]) || null,
    publishing: normalizePublishing(str(row[3])),
    channels: normalizeChannels(channelsRaw),
    postVidLinks: str(row[15]) || null,
    reelLink: str(row[16]) || null,
    publishingDate: null,
    publishingTime: str(row[2]) || null,
    code: str(row[0]) || null,
    notes: str(row[5]) || null,
    reviewed: str(row[4]) || null,
    readyToPublish: str(row[6]) || null,
    contentLink: str(row[8]) || null,
    storyboard: str(row[12]) || null,
    material: str(row[14]) || null,
    size: str(row[19]) || null,
  };
}

/**
 * march sheet — new format
 * Cols: 0=day, 1=idea, 2=funnel, 3=type, 4=org/paid, 5=captionSA,
 *       6=script, 7=tov, 8=ref, 9=publishing, 10=channels, 11=links, 12=date
 */
function parseMarchRow(row: unknown[], month: string): EntryInput | null {
  const dayNum = extractDay(row[0]);
  const idea = str(row[1]);
  if (!dayNum || !idea) return null;

  return {
    month,
    day: dayNum,
    idea,
    funnel: normalizeFunnel(str(row[2])),
    typeOfContent: normalizeType(str(row[3])),
    orgPaid: normalizeOrgPaid(str(row[4])),
    captionSA: str(row[5]) || null,
    captionEG: null,
    script: str(row[6]) || null,
    tov: str(row[7]) || null,
    reference: str(row[8]) || null,
    publishing: normalizePublishing(str(row[9])),
    channels: normalizeChannels(str(row[10])),
    postVidLinks: str(row[11]) || null,
    reelLink: null,
    publishingDate: null,
    publishingTime: null,
    code: null,
    notes: null,
    reviewed: null,
    readyToPublish: null,
    contentLink: null,
    storyboard: null,
    material: null,
    size: null,
  };
}

/**
 * april sheet — new format with extra "day of week" col
 * Cols: 0=date, 1=dayOfWeek, 2=idea, 3=funnel, 4=type, 5=org/paid,
 *       6=caption, 7=script, 8=tov, 9=ref, 10=publishing, 11=channels, 12=links
 */
function parseAprilRow(row: unknown[], month: string): EntryInput | null {
  const dayNum = extractDay(row[0]);
  const idea = str(row[2]);
  if (!dayNum || !idea) return null;

  return {
    month,
    day: dayNum,
    idea,
    funnel: normalizeFunnel(str(row[3])),
    typeOfContent: normalizeType(str(row[4])),
    orgPaid: normalizeOrgPaid(str(row[5])),
    captionSA: str(row[6]) || null,
    captionEG: null,
    script: str(row[7]) || null,
    tov: str(row[8]) || null,
    reference: str(row[9]) || null,
    publishing: normalizePublishing(str(row[10])),
    channels: normalizeChannels(str(row[11])),
    postVidLinks: str(row[12]) || null,
    reelLink: null,
    publishingDate: null,
    publishingTime: null,
    code: null,
    notes: null,
    reviewed: null,
    readyToPublish: null,
    contentLink: null,
    storyboard: null,
    material: null,
    size: null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ File not found: ${EXCEL_PATH}`);
    process.exit(1);
  }

  console.log(`📂 Reading: ${EXCEL_PATH}`);
  const wb = XLSX.readFile(EXCEL_PATH, {
    cellStyles: true,
    cellHTML: true,
    cellText: true,
    sheetStubs: true,
  });

  const allEntries: EntryInput[] = [];

  for (const sheetName of wb.SheetNames) {
    const month = SHEET_TO_MONTH[sheetName];
    if (!month) {
      console.log(`  ⚠️  Unknown sheet: ${sheetName} — skipped`);
      continue;
    }

    const ws = wb.Sheets[sheetName];
    if (!ws["!ref"]) {
      console.log(`  ⏭️  ${sheetName}: empty — skipped`);
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
    });

    let sheetEntries: EntryInput[] = [];

    if (sheetName === "feb") {
      // Skip header row (row 0), data starts at row 1
      rows.slice(1).forEach((row, i) => {
        const entry = parseFebRow(row as unknown[], i + 1, month);
        if (entry) sheetEntries.push(entry);
      });
    } else if (sheetName === "march") {
      // Skip header row (row 0), data starts at row 1
      rows.slice(1).forEach((row) => {
        const entry = parseMarchRow(row as unknown[], month);
        if (entry) sheetEntries.push(entry);
      });
    } else if (sheetName === "april") {
      // Row 0 = title, row 1 = headers, data starts at row 2
      // But we skip non-data rows (week labels, empty rows)
      rows.slice(2).forEach((row) => {
        const entry = parseAprilRow(row as unknown[], month);
        if (entry) sheetEntries.push(entry);
      });
    } else {
      // Future sheets: try march-style parsing
      rows.slice(1).forEach((row) => {
        const entry = parseMarchRow(row as unknown[], month);
        if (entry) sheetEntries.push(entry);
      });
    }

    console.log(
      `  ✅ ${sheetName.padEnd(8)} → ${month}: ${sheetEntries.length} entries`
    );
    allEntries.push(...sheetEntries);
  }

  console.log(`\n📊 Total entries parsed: ${allEntries.length}`);

  if (allEntries.length === 0) {
    console.log("Nothing to import.");
    return;
  }

  // Check existing records
  const existing = await prisma.contentEntry.count();
  if (existing > 0) {
    console.log(`\n⚠️  Database already has ${existing} records.`);
    console.log(
      "   Delete them first if you want a clean import, or run again to add on top."
    );
  }

  console.log("\n⏳ Inserting into MongoDB...");
  let inserted = 0;
  let failed = 0;

  for (const entry of allEntries) {
    try {
      await prisma.contentEntry.create({ data: entry });
      inserted++;
      process.stdout.write(`\r   ${inserted}/${allEntries.length} inserted...`);
    } catch (err) {
      failed++;
      console.error(
        `\n   ❌ Failed (month=${entry.month}, day=${entry.day}, idea="${entry.idea.slice(0, 30)}"): ${err}`
      );
    }
  }

  console.log(
    `\n\n✅ Done! Inserted: ${inserted} | Failed: ${failed} | Total: ${allEntries.length}`
  );

  // Summary by month
  console.log("\n📅 By month:");
  const grouped = allEntries.reduce<Record<string, number>>((acc, e) => {
    acc[e.month] = (acc[e.month] ?? 0) + 1;
    return acc;
  }, {});
  for (const [m, count] of Object.entries(grouped)) {
    console.log(`   ${m}: ${count} entries`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
