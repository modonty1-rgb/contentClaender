import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 بدء الـ migration...");

  // 1. Find JBR SEO
  const jbrClient = await prisma.client.findFirst({ where: { slug: "jbrseo" } });
  if (!jbrClient) {
    console.log("⚠️  مافيش عميل jbrseo — تأكد من الاسم");
    return;
  }
  console.log(`✅ وجدنا: ${jbrClient.name} (${jbrClient.id})`);

  // 2. Create Saudi + Egypt clients
  const saudi = await prisma.client.upsert({
    where: { slug: "saudi" },
    update: {},
    create: { name: "السعودية", slug: "saudi", color: "#10b981" },
  });
  const egypt = await prisma.client.upsert({
    where: { slug: "egypt" },
    update: {},
    create: { name: "مصر", slug: "egypt", color: "#ef4444" },
  });
  console.log(`✅ عميل: ${saudi.name} | ${egypt.name}`);

  // 3. Get all JBR entries
  const entries = await prisma.contentEntry.findMany({
    where: { clientId: jbrClient.id },
  });
  console.log(`📋 ${entries.length} تاسك موجود في JBR SEO`);

  // 4. Duplicate to Saudi (captionSA → caption) and Egypt (captionEG → caption)
  let created = 0;
  for (const entry of entries) {
    const { id, clientId, captionSA, captionEG, caption: _c, createdAt, updatedAt, ...rest } = entry as typeof entry & { captionSA?: string | null; captionEG?: string | null };

    await prisma.contentEntry.create({
      data: { ...rest, clientId: saudi.id, caption: captionSA ?? null },
    });
    await prisma.contentEntry.create({
      data: { ...rest, clientId: egypt.id, caption: captionEG ?? null },
    });
    created += 2;
  }
  console.log(`✅ تم إنشاء ${created} تاسك جديد`);

  // 5. Delete JBR SEO entries + client
  await prisma.contentEntry.deleteMany({ where: { clientId: jbrClient.id } });
  await prisma.client.delete({ where: { id: jbrClient.id } });
  console.log(`🗑️  تم حذف JBR SEO وبياناته`);

  console.log("🎉 انتهى الـ migration بنجاح!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
