"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntryListItem = {
  id: string;
  clientId: string | null;
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
  createdAt: Date;
  updatedAt: Date;
};

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export type CreateEntryResult =
  | { success: true; id: string }
  | { success: false; error: string };

// ─── Validation Schema ────────────────────────────────────────────────────────

const entrySchema = z.object({
  clientId:       z.string().optional(),
  month:          z.string().min(1),
  day:            z.coerce.number().int().min(1).max(31),
  idea:           z.string().default(""),
  funnel:         z.array(z.string()).default([]),
  typeOfContent:  z.string().default(""),
  orgPaid:        z.string().default(""),
  captionSA:      z.string().nullable().optional(),
  captionEG:      z.string().nullable().optional(),
  script:         z.string().nullable().optional(),
  tov:            z.string().nullable().optional(),
  reference:      z.string().nullable().optional(),
  publishing:     z.string().default("لم يتم النشر"),
  channels:       z.array(z.string()).default([]),
  postVidLinks:   z.string().nullable().optional(),
  publishingDate: z.coerce.date().nullable().optional(),
  reelLink:       z.string().nullable().optional(),
  publishingTime: z.string().nullable().optional(),
  code:           z.string().nullable().optional(),
  notes:          z.string().nullable().optional(),
  reviewed:       z.string().nullable().optional(),
  readyToPublish: z.string().nullable().optional(),
  contentLink:    z.string().nullable().optional(),
  storyboard:     z.string().nullable().optional(),
  material:       z.string().nullable().optional(),
  size:           z.string().nullable().optional(),
});

type EntryInput = z.infer<typeof entrySchema>;

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getEntriesByMonth(
  month: string,
  clientId?: string
): Promise<EntryListItem[]> {
  const rows = await prisma.contentEntry.findMany({
    where: clientId ? { month, clientId } : { month },
    orderBy: [{ day: "asc" }, { createdAt: "asc" }],
  });
  return rows as EntryListItem[];
}

export async function getEntryById(id: string): Promise<EntryListItem | null> {
  const row = await prisma.contentEntry.findUnique({ where: { id } });
  return row as EntryListItem | null;
}

export async function getAllMonthCounts(
  clientId?: string
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
  clientId?: string
): Promise<{
  total: number;
  published: number;
  pending: number;
  sponsored: number;
  organic: number;
}> {
  const rows = await prisma.contentEntry.findMany({
    where: clientId ? { month, clientId } : { month },
    select: { publishing: true, orgPaid: true },
  });
  return {
    total:     rows.length,
    published: rows.filter((r) => r.publishing === "تم النشر").length,
    pending:   rows.filter((r) => r.publishing !== "تم النشر").length,
    sponsored: rows.filter((r) => r.orgPaid === "sponsored").length,
    organic:   rows.filter((r) => r.orgPaid === "organic").length,
  };
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createEntry(data: EntryInput): Promise<CreateEntryResult> {
  const validated = entrySchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: "بيانات غير صحيحة" };
  }
  try {
    const row = await prisma.contentEntry.create({ data: validated.data });
    revalidatePath("/", "layout");
    return { success: true, id: row.id };
  } catch {
    return { success: false, error: "حدث خطأ عند الإضافة" };
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateEntry(
  id: string,
  data: Partial<EntryInput>
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
