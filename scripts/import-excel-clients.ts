/**
 * Import Excel → JBRSEO SA + JBRSEO EG clients
 * - SA entries  : caption = captionSA column
 * - EG entries  : caption = captionEG column (fallback to captionSA if empty)
 * - Clears existing entries for both clients before import
 */

import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXCEL_PATH = path.join(process.cwd(), "public", "data", "jbr content calendar.xlsx");

const SHEET_TO_MONTH: Record<string, string> = {
  jan: "jan", feb: "feb", march: "mar", april: "apr",
  may: "may", jun: "jun", jul: "jul", august: "aug",
  sep: "sep", oct: "oct", nov: "nov", dec: "dec",
};

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeType(raw: string): string {
  const v = raw.toLowerCase().trim();
  if (v.includes("vid") || v.includes("فيديو") || v.includes("فديو")) return "vid";
  if (v.includes("carousel") || v.includes("كاروسيل")) return "carousel";
  if (v.includes("reel") || v.includes("ريل")) return "reel";
  if (v.includes("story") || v.includes("ستوري")) return "story";
  if (v.includes("post") || v.includes("تصميم") || v.includes("بوست")) return "post";
  return "";
}

function normalizePublishing(raw: string): string {
  if (!raw) return "لم يتم النشر";
  const v = raw.trim();
  if (v.includes("تم النشر") || v.includes("الجدولة")) return "تم النشر";
  if (v.includes("قيد المراجعة")) return "قيد المراجعة";
  if (v.includes("مجدول")) return "مجدول";
  return "لم يتم النشر";
}

function normalizeOrgPaid(raw: string): string {
  const v = raw.toLowerCase().trim();
  if (v.includes("sponsor") || v.includes("paid") || v.includes("مدفوع")) return "sponsored";
  return "organic";
}

function normalizeFunnel(raw: string): string[] {
  if (!raw) return [];
  const valid = ["awareness", "engagement", "leads", "conversion"];
  return raw.split(/[,،\n\/]+/).map((f) => f.trim().toLowerCase()).filter((f) => valid.includes(f));
}

function normalizeChannels(raw: string): string[] {
  if (!raw) return [];
  const result: string[] = [];
  const v = raw.toLowerCase();
  if (v.includes("instagram") || v.includes("انستجرام") || v.includes("insta")) result.push("instagram");
  if (v.includes("tiktok") || v.includes("تيك")) result.push("tiktok");
  if (/\bx\b/.test(v) || v.includes("twitter") || v.includes("تويتر")) result.push("x");
  if (v.includes("facebook") || v.includes("fb") || v.includes("فيسبوك")) result.push("facebook");
  if (v.includes("youtube") || v.includes("يوتيوب")) result.push("youtube");
  if (v.includes("linkedin") || v.includes("لينكد")) result.push("linkedin");
  if (v.includes("snapchat") || v.includes("سناب")) result.push("snapchat");
  return [...new Set(result)];
}

function extractDay(raw: string | number): number | null {
  const match = String(raw).match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

// ── Internal parsed row (keeps both captions) ────────────────────────────────

type ParsedRow = {
  month: string; day: number; idea: string;
  funnel: string[]; typeOfContent: string; orgPaid: string;
  captionSA: string | null; captionEG: string | null;
  script: string | null; tov: string | null; reference: string | null;
  publishing: string; channels: string[];
  postVidLinks: string | null; reelLink: string | null;
  publishingDate: Date | null; publishingTime: string | null;
  code: string | null; notes: string | null;
  reviewed: string | null; readyToPublish: string | null;
  contentLink: string | null; storyboard: string | null;
  material: string | null; size: string | null;
};

function parseFebRow(row: unknown[], rowIndex: number, month: string): ParsedRow | null {
  const idea = str(row[7]);
  if (!idea) return null;
  let channelsRaw = str(row[20]);
  if (!channelsRaw) {
    const platforms: Record<number, string> = { 22: "facebook", 23: "instagram", 24: "linkedin", 25: "x", 26: "tiktok", 27: "snapchat", 30: "youtube" };
    const ch: string[] = [];
    for (const [colIdx, name] of Object.entries(platforms)) {
      if (str(row[Number(colIdx)])) ch.push(name);
    }
    channelsRaw = ch.join(", ");
  }
  return {
    month, day: rowIndex, idea, funnel: [],
    typeOfContent: normalizeType(str(row[13])),
    orgPaid: normalizeOrgPaid(str(row[21])),
    captionSA: str(row[9]) || null,
    captionEG: str(row[10]) || null,
    script: str(row[11]) || null, tov: str(row[18]) || null,
    reference: str(row[17]) || null,
    publishing: normalizePublishing(str(row[3])),
    channels: normalizeChannels(channelsRaw),
    postVidLinks: str(row[15]) || null, reelLink: str(row[16]) || null,
    publishingDate: null, publishingTime: str(row[2]) || null,
    code: str(row[0]) || null, notes: str(row[5]) || null,
    reviewed: str(row[4]) || null, readyToPublish: str(row[6]) || null,
    contentLink: str(row[8]) || null, storyboard: str(row[12]) || null,
    material: str(row[14]) || null, size: str(row[19]) || null,
  };
}

function parseMarchRow(row: unknown[], month: string): ParsedRow | null {
  const dayNum = extractDay(row[0]);
  const idea = str(row[1]);
  if (!dayNum || !idea) return null;
  return {
    month, day: dayNum, idea,
    funnel: normalizeFunnel(str(row[2])),
    typeOfContent: normalizeType(str(row[3])),
    orgPaid: normalizeOrgPaid(str(row[4])),
    captionSA: str(row[5]) || null, captionEG: null,
    script: str(row[6]) || null, tov: str(row[7]) || null,
    reference: str(row[8]) || null,
    publishing: normalizePublishing(str(row[9])),
    channels: normalizeChannels(str(row[10])),
    postVidLinks: str(row[11]) || null, reelLink: null,
    publishingDate: null, publishingTime: null,
    code: null, notes: null, reviewed: null, readyToPublish: null,
    contentLink: null, storyboard: null, material: null, size: null,
  };
}

function parseAprilRow(row: unknown[], month: string): ParsedRow | null {
  const dayNum = extractDay(row[0]);
  const idea = str(row[2]);
  if (!dayNum || !idea) return null;
  return {
    month, day: dayNum, idea,
    funnel: normalizeFunnel(str(row[3])),
    typeOfContent: normalizeType(str(row[4])),
    orgPaid: normalizeOrgPaid(str(row[5])),
    captionSA: str(row[6]) || null, captionEG: null,
    script: str(row[7]) || null, tov: str(row[8]) || null,
    reference: str(row[9]) || null,
    publishing: normalizePublishing(str(row[10])),
    channels: normalizeChannels(str(row[11])),
    postVidLinks: str(row[12]) || null, reelLink: null,
    publishingDate: null, publishingTime: null,
    code: null, notes: null, reviewed: null, readyToPublish: null,
    contentLink: null, storyboard: null, material: null, size: null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ File not found: ${EXCEL_PATH}`); process.exit(1);
  }

  // Find clients
  const saudiClient = await prisma.client.findFirst({ where: { slug: "saudi" } });
  const egyptClient = await prisma.client.findFirst({ where: { slug: "egypt" } });
  if (!saudiClient || !egyptClient) {
    console.error("❌ ما لقينا JBRSEO SA أو JBRSEO EG — تأكد من وجودهم"); process.exit(1);
  }
  console.log(`✅ ${saudiClient.name} | ${egyptClient.name}`);

  // Clear existing entries
  const delSA = await prisma.contentEntry.deleteMany({ where: { clientId: saudiClient.id } });
  const delEG = await prisma.contentEntry.deleteMany({ where: { clientId: egyptClient.id } });
  console.log(`🗑️  حذفنا ${delSA.count} SA و${delEG.count} EG`);

  // Parse Excel
  console.log(`📂 Reading: ${EXCEL_PATH}`);
  const wb = XLSX.readFile(EXCEL_PATH, { cellStyles: true, cellText: true, sheetStubs: true });
  const allRows: ParsedRow[] = [];

  // april = مصر data, feb+march = السعودية data
  const EG_SHEETS  = new Set(["april"]);
  const SA_SHEETS  = new Set(["feb", "march"]);

  for (const sheetName of wb.SheetNames) {
    const month = SHEET_TO_MONTH[sheetName];
    if (!month) { console.log(`  ⚠️  Unknown sheet: ${sheetName} — skipped`); continue; }
    if (!SA_SHEETS.has(sheetName) && !EG_SHEETS.has(sheetName)) {
      console.log(`  ⏭️  ${sheetName} — skipped (no mapping)`); continue;
    }

    const ws = wb.Sheets[sheetName];
    if (!ws["!ref"]) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
    let parsed: ParsedRow[] = [];

    if (sheetName === "feb") {
      rows.slice(1).forEach((row, i) => { const r = parseFebRow(row as unknown[], i + 1, month); if (r) parsed.push(r); });
    } else if (sheetName === "march") {
      rows.slice(1).forEach((row) => { const r = parseMarchRow(row as unknown[], month); if (r) parsed.push(r); });
    } else if (sheetName === "april") {
      rows.slice(2).forEach((row) => { const r = parseAprilRow(row as unknown[], month); if (r) parsed.push(r); });
    }

    const target = EG_SHEETS.has(sheetName) ? "EG" : "SA";
    console.log(`  ✅ ${sheetName.padEnd(8)} → ${month} [${target}]: ${parsed.length} rows`);
    parsed.forEach(r => (r as ParsedRow & { _target: string })._target = target);
    allRows.push(...parsed);
  }

  console.log(`\n📊 Total rows: ${allRows.length}`);

  // Insert for each client
  let saCount = 0, egCount = 0;

  for (const row of allRows) {
    const { captionSA, captionEG, ...rest } = row;
    const target = (rest as unknown as { _target?: string })._target;
    delete (rest as unknown as { _target?: string })._target;

    if (target === "SA") {
      await prisma.contentEntry.create({
        data: { ...rest, clientId: saudiClient.id, caption: captionSA ?? null },
      });
      saCount++;
    } else if (target === "EG") {
      await prisma.contentEntry.create({
        data: { ...rest, clientId: egyptClient.id, caption: captionSA ?? null },
      });
      egCount++;
    }

    process.stdout.write(`\r   SA: ${saCount} | EG: ${egCount}`);
  }

  console.log(`\n\n🎉 Done! SA: ${saCount} | EG: ${egCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
