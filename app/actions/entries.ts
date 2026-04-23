"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetItem = {
  id: string;
  url: string;
  type: "image" | "video";
  label?: string;
  width?: number;
  height?: number;
  bytes?: number;
};

export type EntryListItem = {
  id:         string;
  clientId:   string | null;
  month:      string;
  day:        number;

  // Status
  status:          string;
  statusUpdatedAt: Date;

  // Timeline
  productionStartedAt:   Date | null;
  productionCompletedAt: Date | null;
  publishedAt:           Date | null;

  // كاتب المحتوى
  contentType:   string;
  customerStage: string[];
  channels:      string[];
  idea:          string;
  text:          string | null;
  hook:          string | null;
  cta:           string | null;
  script:        string | null;
  voiceTone:     string | null;
  inspiration:   string | null;
  notes:         string | null;

  // الإنتاج
  assetLink:     string | null;
  assets:        AssetItem[] | null;
  rejectionNote: string | null;

  // الميديا باير
  orgPaid:       string | null;
  budget:        number | null;
  currency:      string | null;
  adDuration:    number | null;
  scheduledDate: Date | null;
  scheduledTime: string | null;
  channelLinks:  Record<string, string> | null;

  createdAt: Date;
  updatedAt: Date;
};

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export type CreateEntryResult =
  | { success: true; id: string }
  | { success: false; error: string };

// ─── Validation Schemas ───────────────────────────────────────────────────────

const entrySchema = z.object({
  clientId:      z.string().optional(),
  month:         z.string().min(1),
  day:           z.coerce.number().int().min(1).max(31),

  // كاتب المحتوى
  contentType:   z.string().default(""),
  customerStage: z.array(z.string()).default([]),
  channels:      z.array(z.string()).default([]),
  idea:          z.string().default(""),
  text:          z.string().nullable().optional(),
  hook:          z.string().nullable().optional(),
  cta:           z.string().nullable().optional(),
  script:        z.string().nullable().optional(),
  voiceTone:     z.string().nullable().optional(),
  inspiration:   z.string().nullable().optional(),
  notes:         z.string().nullable().optional(),

  // الإنتاج
  assetLink: z.string().nullable().optional(),
  assets: z.array(z.object({
    id:    z.string(),
    url:   z.string(),
    type:  z.enum(["image", "video"]),
    label: z.string().optional(),
  })).nullable().optional(),

  // الميديا باير
  orgPaid:       z.string().nullable().optional(),
  budget:        z.coerce.number().nullable().optional(),
  currency:      z.string().nullable().optional(),
  adDuration:    z.coerce.number().int().nullable().optional(),
  scheduledDate: z.coerce.date().nullable().optional(),
  scheduledTime: z.string().nullable().optional(),
  channelLinks:  z.record(z.string(), z.string()).nullable().optional(),
});

type EntryInput = z.infer<typeof entrySchema>;

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getEntriesByMonth(
  month: string,
  clientId?: string,
): Promise<EntryListItem[]> {
  const rows = await prisma.contentEntry.findMany({
    where: clientId ? { month, clientId } : { month },
    orderBy: [{ day: "asc" }, { createdAt: "asc" }],
  });
  return rows.filter((r) => r.archived !== true) as unknown as EntryListItem[];
}

export async function getEntryById(id: string): Promise<EntryListItem | null> {
  try {
    const row = await prisma.contentEntry.findUnique({ where: { id } });
    return row as unknown as EntryListItem | null;
  } catch {
    return null;
  }
}

export async function getAllMonthCounts(
  clientId?: string,
): Promise<Record<string, number>> {
  const rows = await prisma.contentEntry.findMany({
    where: clientId ? { clientId } : undefined,
    select: { month: true, archived: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.archived === true) continue;
    counts[row.month] = (counts[row.month] ?? 0) + 1;
  }
  return counts;
}

export async function getMonthStats(
  month: string,
  clientId?: string,
): Promise<{
  total: number;
  published: number;
  pending: number;
  inProduction: number;
  readyToPublish: number;
}> {
  const allRows = await prisma.contentEntry.findMany({
    where: clientId ? { month, clientId } : { month },
    select: { status: true, archived: true },
  });
  const rows = allRows.filter((r) => r.archived !== true);
  return {
    total:          rows.length,
    published:      rows.filter((r) => r.status === "تم النشر").length,
    pending:        rows.filter((r) => r.status === "قيد الإنتاج").length,
    inProduction:   rows.filter((r) => r.status === "جاهز للمراجعة").length,
    readyToPublish: rows.filter((r) => r.status === "جاهز للنشر").length,
  };
}

export async function getAllStats(
  clientId?: string,
): Promise<{
  total: number;
  published: number;
  pending: number;
  readyToPublish: number;
}> {
  const rows = await prisma.contentEntry.findMany({
    where: clientId ? { clientId } : {},
    select: { status: true, archived: true },
  });
  const active = rows.filter((r) => r.archived !== true);
  return {
    total:          active.length,
    published:      active.filter((r) => r.status === "تم النشر").length,
    pending:        active.filter((r) => r.status === "قيد الإنتاج").length,
    readyToPublish: active.filter((r) => r.status === "جاهز للنشر").length,
  };
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createEntry(data: EntryInput): Promise<CreateEntryResult> {
  const validated = entrySchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: "بيانات غير صحيحة" };
  }
  try {
    const row = await prisma.contentEntry.create({
      data: {
        ...validated.data,
        status: "قيد الإنتاج",
        statusUpdatedAt: new Date(),
        productionStartedAt: new Date(),
      },
    });
    revalidatePath("/", "layout");
    return { success: true, id: row.id };
  } catch {
    return { success: false, error: "حدث خطأ عند الإضافة" };
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateEntry(
  id: string,
  data: Partial<EntryInput>,
): Promise<ActionResult> {
  if (!id) return { success: false, error: "معرّف غير صالح" };
  try {
    await prisma.contentEntry.update({ where: { id }, data });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند التعديل" };
  }
}

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────

export type StatusValue =
  | "قيد الإنتاج"
  | "جاهز للمراجعة"
  | "جاهز للنشر"
  | "تم النشر";

export async function updateStatus(
  id: string,
  status: StatusValue,
): Promise<ActionResult> {
  if (!id) return { success: false, error: "معرّف غير صالح" };
  try {
    const now = new Date();
    const extra: Record<string, Date> = { statusUpdatedAt: now };

    if (status === "جاهز للمراجعة") extra.productionCompletedAt = now;
    if (status === "تم النشر")       extra.publishedAt = now;

    await prisma.contentEntry.update({
      where: { id },
      data: { status, ...extra },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند تحديث الحالة" };
  }
}

// ─── GALLERY ─────────────────────────────────────────────────────────────────

export type GalleryEntry = {
  id:     string;
  month:  string;
  day:    number;
  idea:   string;
  status: string;
  assets: AssetItem[];
};

export async function getEntriesWithAssets(
  clientId: string,
): Promise<GalleryEntry[]> {
  const rows = await prisma.contentEntry.findMany({
    where: { clientId },
    orderBy: [{ month: "asc" }, { day: "asc" }],
    select: {
      id:        true,
      month:     true,
      day:       true,
      idea:      true,
      status:    true,
      assets:    true,
      assetLink: true,
    },
  });

  const results: GalleryEntry[] = [];
  for (const row of rows) {
    let assets: AssetItem[] = [];
    if (row.assets && (row.assets as AssetItem[]).length > 0) {
      assets = (row.assets as AssetItem[]).filter((a) =>
        a.url.includes("res.cloudinary.com"),
      );
    } else if (row.assetLink && row.assetLink.includes("res.cloudinary.com")) {
      assets = [{ id: "legacy", url: row.assetLink, type: "video" }];
    }
    if (assets.length > 0) {
      results.push({
        id:     row.id,
        month:  row.month,
        day:    row.day,
        idea:   row.idea,
        status: row.status,
        assets,
      });
    }
  }
  return results;
}

// ─── REJECT ───────────────────────────────────────────────────────────────────

export async function rejectEntry(
  id: string,
  note: string,
): Promise<ActionResult> {
  if (!id) return { success: false, error: "معرّف غير صالح" };
  try {
    await prisma.contentEntry.update({
      where: { id },
      data: {
        status:          "قيد الإنتاج",
        statusUpdatedAt: new Date(),
        rejectionNote:   note.trim() || null,
      },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند الرفض" };
  }
}

// ─── ARCHIVE / UNARCHIVE ──────────────────────────────────────────────────────

export async function archiveEntry(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "معرّف غير صالح" };
  try {
    await prisma.contentEntry.update({ where: { id }, data: { archived: true } });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند الأرشفة" };
  }
}

export async function unarchiveEntry(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "معرّف غير صالح" };
  try {
    await prisma.contentEntry.update({ where: { id }, data: { archived: false } });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند الاسترجاع" };
  }
}

export async function getArchivedEntries(clientId: string): Promise<EntryListItem[]> {
  const rows = await prisma.contentEntry.findMany({
    where: { clientId, archived: true },
    orderBy: [{ updatedAt: "desc" }],
  });
  return rows as unknown as EntryListItem[];
}
