"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ClientType = "social" | "article";

export type ClientItem = {
  id: string;
  name: string;
  slug: string;
  color: string;
  type: ClientType;
  archived: boolean;
  createdAt: Date;
};

export type ClientWithCount = ClientItem & {
  totalEntries: number;
  activeMonths: string[];
};

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getClients(): Promise<ClientWithCount[]> {
  const clients = await prisma.client.findMany({
    where: { archived: { not: true } },
    orderBy: { createdAt: "asc" },
  });

  const entries = await prisma.contentEntry.findMany({
    select: { clientId: true, month: true },
  });

  return clients.map((c) => {
    const clientEntries = entries.filter((e) => e.clientId === c.id);
    const months = [...new Set(clientEntries.map((e) => e.month))];
    return {
      ...c,
      type: (c.type === "article" ? "article" : "social") as ClientType,
      totalEntries: clientEntries.length,
      activeMonths: months,
    };
  });
}

export async function getArchivedClients(): Promise<ClientWithCount[]> {
  const clients = await prisma.client.findMany({
    where: { archived: true },
    orderBy: { updatedAt: "desc" },
  });

  const entries = await prisma.contentEntry.findMany({
    select: { clientId: true, month: true },
  });

  return clients.map((c) => {
    const clientEntries = entries.filter((e) => e.clientId === c.id);
    const months = [...new Set(clientEntries.map((e) => e.month))];
    return {
      ...c,
      type: (c.type === "article" ? "article" : "social") as ClientType,
      totalEntries: clientEntries.length,
      activeMonths: months,
    };
  });
}

export async function getClientBySlug(slug: string): Promise<ClientItem | null> {
  const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  const client = await prisma.client.findUnique({ where: { slug: decoded } });
  if (!client) return null;
  return {
    ...client,
    type: (client.type === "article" ? "article" : "social") as ClientType,
  };
}

// ─── ARCHIVE / RESTORE ────────────────────────────────────────────────────────

export async function archiveClient(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.client.update({ where: { id }, data: { archived: true } });
    revalidatePath("/");
    revalidatePath("/archive");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند الأرشفة" };
  }
}

export async function unarchiveClient(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.client.update({ where: { id }, data: { archived: false } });
    revalidatePath("/");
    revalidatePath("/archive");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند الاسترجاع" };
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createClient(data: {
  name: string;
  slug: string;
  color: string;
  type: ClientType;
}): Promise<{ success: true; slug: string } | { success: false; error: string }> {
  if (!data.name.trim()) return { success: false, error: "الاسم مطلوب" };
  if (!data.slug.trim()) return { success: false, error: "المسار مطلوب" };
  if (!/^[a-z0-9؀-ۿ-]+$/.test(data.slug)) {
    return { success: false, error: "المسار: حروف عربية أو إنجليزية وأرقام وشرطة فقط" };
  }
  if (data.type !== "social" && data.type !== "article") {
    return { success: false, error: "نوع غير صالح" };
  }
  try {
    const client = await prisma.client.create({ data });
    revalidatePath("/");
    return { success: true, slug: client.slug };
  } catch {
    return { success: false, error: "هذا المسار مستخدم بالفعل، جرّب مساراً آخر" };
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateClient(
  id: string,
  data: { name: string; color: string; type: ClientType }
): Promise<{ success: true } | { success: false; error: string }> {
  if (!data.name.trim()) return { success: false, error: "الاسم مطلوب" };
  if (data.type !== "social" && data.type !== "article") {
    return { success: false, error: "نوع غير صالح" };
  }
  try {
    await prisma.client.update({ where: { id }, data });
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند التعديل" };
  }
}

// ─── HARD DELETE (used only from the archive page) ────────────────────────────

export async function deleteClient(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.contentEntry.deleteMany({ where: { clientId: id } });
    await prisma.client.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/archive");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند الحذف" };
  }
}
