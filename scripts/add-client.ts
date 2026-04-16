import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Creating JBR SEO client...");

  // Create the default client
  const client = await prisma.client.upsert({
    where: { slug: "jbrseo" },
    update: {},
    create: {
      name: "JBR SEO",
      slug: "jbrseo",
      color: "#6366f1",
    },
  });

  console.log(`✅ Client created: ${client.name} (${client.id})`);

  // Link all existing entries to this client
  const result = await prisma.contentEntry.updateMany({
    where: { clientId: null },
    data: { clientId: client.id },
  });

  console.log(`✅ Linked ${result.count} entries to JBR SEO`);
  console.log("🎉 Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
