"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ClientItem = {
  id: string;
  name: string;
  slug: string;
  color: string;
  createdAt: Date;
};

export type ClientWithCount = ClientItem & {
  totalEntries: number;
  activeMonths: string[];
};

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getClients(): Promise<ClientWithCount[]> {
  const clients = await prisma.client.findMany({
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
      totalEntries: clientEntries.length,
      activeMonths: months,
    };
  });
}

export async function getClientBySlug(slug: string): Promise<ClientItem | null> {
  const client = await prisma.client.findUnique({ where: { slug } });
  return client as ClientItem | null;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createClient(data: {
  name: string;
  slug: string;
  color: string;
}): Promise<{ success: true; slug: string } | { success: false; error: string }> {
  if (!data.name.trim()) return { success: false, error: "الاسم مطلوب" };
  if (!data.slug.trim()) return { success: false, error: "المسار مطلوب" };
  if (!/^[a-z0-9-]+$/.test(data.slug)) {
    return { success: false, error: "المسار: أحرف إنجليزية صغيرة وأرقام وشرطة فقط" };
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
  data: { name: string; color: string }
): Promise<{ success: true } | { success: false; error: string }> {
  if (!data.name.trim()) return { success: false, error: "الاسم مطلوب" };
  try {
    await prisma.client.update({ where: { id }, data });
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند التعديل" };
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteClient(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.contentEntry.deleteMany({ where: { clientId: id } });
    await prisma.client.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ عند الحذف" };
  }
}
