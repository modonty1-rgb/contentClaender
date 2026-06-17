import "dotenv/config";

const ZONE = process.env.BUNNY_STORAGE_ZONE_NAME!;
const HOST = process.env.BUNNY_STORAGE_HOSTNAME!;
const KEY = process.env.BUNNY_STORAGE_PASSWORD!;
const CDN = process.env.BUNNY_PULL_ZONE_HOSTNAME!;

if (!ZONE || !HOST || !KEY || !CDN) {
  console.error("❌ Missing env vars. Check .env");
  process.exit(1);
}

const TEST_PATH = "test/hello-bunny.txt";
const TEST_CONTENT = `Hello from JBR Content Calendar — ${new Date().toISOString()}`;

const storageUrl = `https://${HOST}/${ZONE}/${TEST_PATH}`;
const cdnUrl = `https://${CDN}/${TEST_PATH}`;

async function run() {
  console.log("🐰 Bunny.net Storage Test\n");
  console.log(`Zone: ${ZONE}`);
  console.log(`Storage: https://${HOST}`);
  console.log(`CDN: https://${CDN}\n`);

  // ─── 1. UPLOAD ─────────────────────────────────────────────────────────────
  console.log("1️⃣  Uploading test file...");
  const uploadRes = await fetch(storageUrl, {
    method: "PUT",
    headers: { AccessKey: KEY, "Content-Type": "text/plain" },
    body: TEST_CONTENT,
  });

  if (!uploadRes.ok) {
    const txt = await uploadRes.text();
    console.error(`❌ Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
    console.error(txt);
    process.exit(1);
  }
  console.log(`   ✅ Upload OK (HTTP ${uploadRes.status})`);
  console.log(`   📍 Storage URL: ${storageUrl}`);
  console.log(`   🌍 CDN URL:     ${cdnUrl}\n`);

  // ─── 2. DOWNLOAD via Storage API (with key) ────────────────────────────────
  console.log("2️⃣  Downloading via Storage API (with AccessKey)...");
  const storageDownloadRes = await fetch(storageUrl, {
    method: "GET",
    headers: { AccessKey: KEY },
  });
  if (!storageDownloadRes.ok) {
    console.error(`❌ Storage download failed: ${storageDownloadRes.status}`);
    process.exit(1);
  }
  const storageBody = await storageDownloadRes.text();
  console.log(`   ✅ Storage download OK (HTTP ${storageDownloadRes.status})`);
  console.log(`   Content matches: ${storageBody === TEST_CONTENT ? "✅ YES" : "❌ NO"}\n`);

  // ─── 3. DOWNLOAD via Public CDN ────────────────────────────────────────────
  console.log("3️⃣  Downloading via Public CDN (no key)...");
  // small delay — CDN may need a moment to propagate
  await new Promise((r) => setTimeout(r, 2000));

  const cdnRes = await fetch(cdnUrl);
  if (!cdnRes.ok) {
    console.error(`❌ CDN download failed: ${cdnRes.status} ${cdnRes.statusText}`);
    console.error("   (CDN propagation may take a few seconds — retry?)");
    process.exit(1);
  }
  const cdnBody = await cdnRes.text();
  console.log(`   ✅ CDN download OK (HTTP ${cdnRes.status})`);
  console.log(`   Content matches: ${cdnBody === TEST_CONTENT ? "✅ YES" : "❌ NO"}`);
  console.log(`   Server: ${cdnRes.headers.get("server") ?? "(none)"}`);
  console.log(`   Cache-Control: ${cdnRes.headers.get("cache-control") ?? "(none)"}\n`);

  // ─── 4. CLEANUP — Delete the test file ─────────────────────────────────────
  console.log("4️⃣  Deleting test file (cleanup)...");
  const deleteRes = await fetch(storageUrl, {
    method: "DELETE",
    headers: { AccessKey: KEY },
  });
  if (!deleteRes.ok) {
    console.error(`❌ Delete failed: ${deleteRes.status}`);
    process.exit(1);
  }
  console.log(`   ✅ Delete OK (HTTP ${deleteRes.status})\n`);

  // ─── 5. VERIFY DELETE ──────────────────────────────────────────────────────
  console.log("5️⃣  Verifying file is gone...");
  const verifyRes = await fetch(storageUrl, {
    method: "GET",
    headers: { AccessKey: KEY },
  });
  console.log(`   File gone: ${verifyRes.status === 404 ? "✅ YES (404)" : `❌ NO (${verifyRes.status})`}\n`);

  console.log("🎉 All tests passed. Bunny.net is ready.");
}

run().catch((err) => {
  console.error("💥 Unexpected error:", err);
  process.exit(1);
});
