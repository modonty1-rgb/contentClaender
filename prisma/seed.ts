import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parsePlatforms(raw: string): string[] {
  if (!raw) return [];
  const map: Record<string, string> = {
    fb: "facebook", facebook: "facebook", فيسبوك: "facebook",
    instagram: "instagram", انستجرام: "instagram", ig: "instagram",
    tiktok: "tiktok", "tik tok": "tiktok",
    youtube: "youtube",
    x: "twitter", twitter: "twitter",
    pinterest: "pinterest",
    linkedin: "linkedin",
    snapchat: "snapchat",
    threads: "threads",
  };
  const results: string[] = [];
  const parts = raw.toLowerCase().replace(/[\\-]/g, ",").split(/[,،\s]+/);
  for (const p of parts) {
    const trimmed = p.trim();
    if (map[trimmed]) {
      const val = map[trimmed];
      if (!results.includes(val)) results.push(val);
    }
  }
  return results;
}

function mapType(raw: string): string {
  const t = raw.toLowerCase().trim();
  if (t === "vid" || t === "فيديو") return "vid";
  if (t === "carousel") return "carousel";
  if (t === "reel" || t === "ريل") return "reel";
  if (t === "story" || t === "ستوري") return "story";
  return "post";
}

function isPublished(status: string): boolean {
  return status.includes("تم النشر");
}

async function main() {
  console.log("🌱 Starting seed...");

  // ── Create clients ─────────────────────────────────────────────────────────
  const sa = await prisma.client.upsert({
    where: { slug: "jbrseo-sa" },
    update: { name: "JBRSEO SA", color: "#16a34a" },
    create: { name: "JBRSEO SA", slug: "jbrseo-sa", color: "#16a34a" },
  });
  console.log("✅ Client: JBRSEO SA →", sa.id);

  const eg = await prisma.client.upsert({
    where: { slug: "jbrseo-eg" },
    update: { name: "JBRSEO EG", color: "#dc2626" },
    create: { name: "JBRSEO EG", slug: "jbrseo-eg", color: "#dc2626" },
  });
  console.log("✅ Client: JBRSEO EG →", eg.id);

  // ── Delete existing entries for these clients ──────────────────────────────
  await prisma.contentEntry.deleteMany({ where: { clientId: sa.id } });
  await prisma.contentEntry.deleteMany({ where: { clientId: eg.id } });
  console.log("🗑️  Cleared existing entries");

  const now = new Date();

  // ── JBRSEO SA — February (JS series) ──────────────────────────────────────
  const saFeb: Array<{
    day: number; idea: string; contentType: string;
    assetLink?: string; channels?: string[]; status?: string; orgPaid?: string;
  }> = [
    {
      day: 1, idea: "teaser", contentType: "vid",
      assetLink: "https://drive.google.com/file/d/17Pe9SmO2IJUUl32zBH8Y_exfhV",
      status: "تم النشر",
    },
    {
      day: 2, idea: "المشكلة مش في المحتوى المشكلة في وصوله للعميل", contentType: "post",
      assetLink: "https://drive.google.com/file/d/12DNutcB2iqJ2Z-tjzSnwpigfOGV",
      channels: ["facebook", "instagram"], status: "تم النشر",
    },
    {
      day: 3, idea: "ليه الإعتماد على الكلمات المفتاحية بس لموقعك مش كفاية", contentType: "vid",
      assetLink: "https://drive.google.com/file/d/1pQhMJWluU6f0Lbg6Hkwe2RqPfC",
      status: "قيد الإنتاج",
    },
    {
      day: 4, idea: "أهمية المقالات في ظهور الموقع", contentType: "post",
      assetLink: "https://drive.google.com/file/d/1D2M0zkqwhXgoIarxW4NJ0C4mI7t",
      status: "تم النشر",
    },
    {
      day: 5, idea: "العميل السعودي بيدور على إيه وهو بيبحث في جوجل", contentType: "vid",
      assetLink: "https://drive.google.com/file/d/1N7UfUXR3nlj9hQ4zEeWTpsk7CfQ",
      status: "تم النشر",
    },
    {
      day: 6, idea: "مشكلة عدم الوصول للعميل", contentType: "post",
      assetLink: "https://drive.google.com/file/d/1-Yj0Zzd4fDnxYCHG1xyAj7uYCOh",
      status: "تم النشر",
    },
    {
      day: 7, idea: "use case افتراضي عن مشروع سعودي بيقدم خدمة قوية جدا بس مش بيظهر للعملاء،", contentType: "vid",
      assetLink: "https://drive.google.com/file/d/1QK7qd6lRqGZXYdRZuIW1wPLAgwt",
      status: "تم النشر",
    },
    {
      day: 8, idea: "الفرق بين محتوى يجيب تفاعل ومحتوى يجيب عميل", contentType: "post",
      assetLink: "https://drive.google.com/file/d/1U5EdhXFN1PFXmmCJaUH-u-lAJSc",
      status: "تم النشر",
    },
    {
      day: 10, idea: "soft intro مين jbrseo", contentType: "post",
      assetLink: "https://drive.google.com/file/d/1u-IyPG_JV2py72tgJAdALiMIr-",
      status: "تم النشر",
    },
  ];

  for (const e of saFeb) {
    const published = e.status === "تم النشر";
    await prisma.contentEntry.create({
      data: {
        clientId: sa.id,
        month: "feb",
        day: e.day,
        idea: e.idea,
        contentType: e.contentType,
        channels: e.channels ?? [],
        customerStage: [],
        assetLink: e.assetLink ?? null,
        orgPaid: null,
        status: published ? "تم النشر" : "قيد الإنتاج",
        statusUpdatedAt: now,
        productionStartedAt: now,
        productionCompletedAt: published ? now : null,
        publishedAt: published ? now : null,
      },
    });
  }
  console.log(`✅ SA Feb: ${saFeb.length} entries`);

  // ── JBRSEO SA — March ──────────────────────────────────────────────────────
  const saMar: Array<{
    day: number; idea: string; contentType: string;
    assetLink?: string; channels?: string[]; status?: string; orgPaid?: string;
  }> = [
    {
      day: 1, idea: "أفضل عيادات المملكة", contentType: "vid", orgPaid: "sponsored",
      assetLink: "https://drive.google.com/file/d/13t3NjbTaX00uftymL3Wna3Hya_",
      status: "قيد الإنتاج",
    },
    {
      day: 2, idea: "عيّن فريق تسويق في 30 دقيقية", contentType: "vid", orgPaid: "sponsored",
      assetLink: "https://drive.google.com/file/d/18Exe1QnqoT3G1g3bIm9BzafxJr6",
      status: "قيد الإنتاج",
    },
    {
      day: 3, idea: "الفرق بين البحث والإعلانات", contentType: "carousel", orgPaid: "organic",
      assetLink: "https://drive.google.com/drive/folders/15yuidAXZrTzyVAc-lg07",
      status: "قيد الإنتاج",
    },
    {
      day: 4, idea: "الفرق بين البحث والإعلانات (فيديو)", contentType: "vid", orgPaid: "organic",
      assetLink: "https://drive.google.com/file/d/1kzgU-ipprxD1Au_kEbc2__hx",
      status: "قيد الإنتاج",
    },
    {
      day: 29, idea: "يعني إيه SEO في 30 ثانية", contentType: "carousel", orgPaid: "organic",
      status: "قيد الإنتاج",
    },
    {
      day: 31, idea: "موقعك موجود… بس محدش بيكلمك ليه؟", contentType: "post", orgPaid: "organic",
      status: "قيد الإنتاج",
    },
  ];

  for (const e of saMar) {
    await prisma.contentEntry.create({
      data: {
        clientId: sa.id,
        month: "mar",
        day: e.day,
        idea: e.idea,
        contentType: e.contentType,
        channels: e.channels ?? [],
        customerStage: [],
        assetLink: e.assetLink ?? null,
        orgPaid: e.orgPaid ?? null,
        status: "قيد الإنتاج",
        statusUpdatedAt: now,
        productionStartedAt: now,
        productionCompletedAt: null,
        publishedAt: null,
      },
    });
  }
  console.log(`✅ SA Mar: ${saMar.length} entries`);

  // ── JBRSEO SA — April (SA track) ──────────────────────────────────────────
  const saApr: Array<{
    day: number; idea: string; contentType: string;
    assetLink?: string; channels?: string[]; status?: string; orgPaid?: string;
  }> = [
    {
      day: 1, idea: "تيزر الحملة", contentType: "post",
      channels: parsePlatforms("FB, Instagram, tiktok, pinterest"),
      assetLink: "https://drive.google.com/file/d/1_9zu0TzJiv_8FNuHJnMr-UcrH",
      status: "تم النشر",
    },
    {
      day: 2, idea: "الفرق بين البحث والإعلان (نسخة السعودية)", contentType: "carousel", orgPaid: "organic",
      channels: parsePlatforms("facebook, instagram, pinterest, tik tok"),
      assetLink: "https://drive.google.com/drive/folders/15yuidAXZrTzyVAc-lg07",
      status: "قيد الإنتاج",
    },
    {
      day: 3, idea: "ليه 90% من المواقع مش بتجيب عملاء؟", contentType: "vid", orgPaid: "organic",
      channels: parsePlatforms("FB, Instagram, tiktok, youtube, x"),
      assetLink: "https://drive.google.com/file/d/1Je0dJkFJnQI0heEgPPsViQPbCwD",
      status: "تم النشر",
    },
    {
      day: 6, idea: "فيديو (36000000 بحث يومي)", contentType: "vid", orgPaid: "organic",
      channels: parsePlatforms("Instagram, tiktok, FB"),
      assetLink: "https://drive.google.com/file/d/1T896x2MLQn7KJm6Ku-f0sBfuRnV",
      status: "تم النشر",
    },
    {
      day: 7, idea: "السوشيال ميديا وحدها ما تكفي", contentType: "carousel", orgPaid: "organic",
      channels: parsePlatforms("Instagram, FB"),
      assetLink: "https://drive.google.com/drive/folders/1FlhKIk_T2vu1h6ZK2Zi",
      status: "تم النشر",
    },
    {
      day: 8, idea: "مقارنة", contentType: "post", orgPaid: "organic",
      status: "قيد الإنتاج",
    },
    {
      day: 9, idea: "كيف مقال واحد يحوّل عميلك ليد المنافس؟", contentType: "carousel", orgPaid: "organic",
      status: "قيد الإنتاج",
    },
    {
      day: 10, idea: "3 خطوات لثقة العميل السعودي", contentType: "vid", orgPaid: "organic",
      status: "قيد الإنتاج",
    },
  ];

  for (const e of saApr) {
    const published = e.status === "تم النشر";
    await prisma.contentEntry.create({
      data: {
        clientId: sa.id,
        month: "apr",
        day: e.day,
        idea: e.idea,
        contentType: e.contentType,
        channels: e.channels ?? [],
        customerStage: [],
        assetLink: e.assetLink ?? null,
        orgPaid: e.orgPaid ?? null,
        status: published ? "تم النشر" : "قيد الإنتاج",
        statusUpdatedAt: now,
        productionStartedAt: now,
        productionCompletedAt: published ? now : null,
        publishedAt: published ? now : null,
      },
    });
  }
  console.log(`✅ SA Apr: ${saApr.length} entries`);

  // ── JBRSEO EG — April (EG track) ──────────────────────────────────────────
  const egApr: Array<{
    day: number; idea: string; contentType: string;
    assetLink?: string; channels?: string[]; status?: string; orgPaid?: string;
  }> = [
    {
      day: 1, idea: "المودريتور", contentType: "post", orgPaid: "organic",
      channels: parsePlatforms("FB, Instagram"),
      assetLink: "https://drive.google.com/file/d/1NWk9syPsa4nBqIBKOBJlINQBcXk",
      status: "تم النشر",
    },
    {
      day: 2, idea: "الفرق بين الإعلان والبحث (نسخة مصرية)", contentType: "carousel", orgPaid: "organic",
      channels: parsePlatforms("facebook, instagram"),
      status: "تم النشر",
    },
    {
      day: 3, idea: "ليه 90% من المواقع مش بتجيب عملاء؟", contentType: "vid", orgPaid: "organic",
      channels: parsePlatforms("FB, Instagram, tiktok, youtube, x"),
      assetLink: "https://drive.google.com/file/d/1Je0dJkFJnQI0heEgPPsViQPbCwD",
      status: "تم النشر",
    },
    {
      day: 6, idea: "في عميل سعودي بحث عنك النهاردة", contentType: "vid", orgPaid: "organic",
      assetLink: "https://drive.google.com/file/d/1kpqlQVED1Pk6NVwPFiIuXV3Ufmf",
      status: "قيد الإنتاج",
    },
    {
      day: 7, idea: "أكتر من مليون سعودي زار مصر", contentType: "carousel", orgPaid: "organic",
      assetLink: "https://drive.google.com/drive/folders/1qMGTR01Bdkwnxj3JMNGI",
      status: "تم النشر",
    },
    {
      day: 8, idea: "خدمات مدونتي لشركتك", contentType: "post", orgPaid: "organic",
      assetLink: "https://drive.google.com/file/d/1syUN3RSyKUaOnjY0RP8QwLu2vqm",
      status: "قيد الإنتاج",
    },
    {
      day: 9, idea: "ازاي مقال واحد ممكن يضيع منك عميل سعودي", contentType: "carousel", orgPaid: "organic",
      status: "قيد الإنتاج",
    },
    {
      day: 10, idea: "3 علامات لو بتستهدف السوق السعودي", contentType: "vid", orgPaid: "organic",
      status: "قيد الإنتاج",
    },
  ];

  for (const e of egApr) {
    const published = e.status === "تم النشر";
    await prisma.contentEntry.create({
      data: {
        clientId: eg.id,
        month: "apr",
        day: e.day,
        idea: e.idea,
        contentType: e.contentType,
        channels: e.channels ?? [],
        customerStage: [],
        assetLink: e.assetLink ?? null,
        orgPaid: e.orgPaid ?? null,
        status: published ? "تم النشر" : "قيد الإنتاج",
        statusUpdatedAt: now,
        productionStartedAt: now,
        productionCompletedAt: published ? now : null,
        publishedAt: published ? now : null,
      },
    });
  }
  console.log(`✅ EG Apr: ${egApr.length} entries`);

  console.log("\n🎉 Seed complete!");
  console.log(`   JBRSEO SA: ${saFeb.length + saMar.length + saApr.length} entries`);
  console.log(`   JBRSEO EG: ${egApr.length} entries`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
