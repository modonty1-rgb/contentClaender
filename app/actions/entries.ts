"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  assetLink: string | null;

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
  return rows as unknown as EntryListItem[];
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
    select: { month: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
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
  const rows = await prisma.contentEntry.findMany({
    where: clientId ? { month, clientId } : { month },
    select: { status: true },
  });
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
    select: { status: true },
  });
  return {
    total:          rows.length,
    published:      rows.filter((r) => r.status === "تم النشر").length,
    pending:        rows.filter((r) => r.status === "قيد الإنتاج").length,
    readyToPublish: rows.filter((r) => r.status === "جاهز للنشر").length,
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

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteEntry(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "معرّف غير صالح" };
  try {
    await prisma.contentEntry.delete({ where: { id } });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند الحذف" };
  }
}
