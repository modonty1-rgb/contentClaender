"use client";

import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ExternalLink, CheckCircle2, Link2, AlertCircle, Plus, Trash2, Film, ImageIcon, Upload, Loader2, Copy, Check, XCircle } from "lucide-react";
import {
  FaVideo, FaLayerGroup, FaImage, FaMobileScreen, FaClapperboard,
  FaBullhorn, FaThumbsUp, FaClipboardUser, FaBagShopping,
} from "react-icons/fa6";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url";
import { toast } from "@/app/components/ui/sonner";
import { updateEntry, updateStatus } from "@/app/actions/entries";
import { sendTelegramNotification } from "@/app/actions/telegram";
import { ChannelIcon } from "@/app/components/ui/channel-icon";
import { MONTHS } from "@/lib/constants";
import type { EntryListItem, AssetItem } from "@/app/actions/entries";
import type { MonthValue } from "@/lib/constants";

// ─── Metadata ─────────────────────────────────────────────────────────────────

const MONTH_INDEX: Record<MonthValue, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const CONTENT_TYPE_META: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}> = {
  vid:      { icon: FaVideo,        label: "فيديو"   },
  carousel: { icon: FaLayerGroup,   label: "كاروسيل" },
  post:     { icon: FaImage,        label: "بوست"    },
  story:    { icon: FaMobileScreen, label: "ستوري"   },
  reel:     { icon: FaClapperboard, label: "ريل"     },
};

const STAGE_META: Record<string, {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = {
  awareness:  { label: "توعية",  icon: FaBullhorn      },
  engagement: { label: "تفاعل",  icon: FaThumbsUp      },
  leads:      { label: "عملاء",  icon: FaClipboardUser },
  conversion: { label: "تحويل",  icon: FaBagShopping   },
};

// ─── Layout primitives ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, multiline, isLink }: {
  label: string;
  value?: string | null;
  multiline?: boolean;
  isLink?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">{label}</p>
      {!value ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-amber-600 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs font-medium">لم يُحدَّد بعد — تواصل مع كاتب المحتوى</span>
        </div>
      ) : isLink || value.startsWith("http") ? (
        <a href={value} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline break-all">
          {value.length > 70 ? value.slice(0, 70) + "…" : value}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : multiline ? (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{value}</p>
      ) : (
        <p className="text-sm text-foreground">{value}</p>
      )}
    </div>
  );
}

function dayDetail(day: number, month: MonthValue): string {
  const year = new Date().getFullYear();
  const date = new Date(year, MONTH_INDEX[month], day);
  const weekday = date.toLocaleDateString("ar-SA", { weekday: "long" });
  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? "";
  return `${weekday} ${day} ${monthLabel}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Props = {
  entry: EntryListItem;
  slug: string;
  month: MonthValue;
};

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

function parseAssets(entry: EntryListItem): AssetItem[] {
  if (entry.assets && (entry.assets as AssetItem[]).length > 0) return entry.assets as AssetItem[];
  if (entry.assetLink) return [{ id: "legacy", url: entry.assetLink, type: "video", label: "" }];
  return [];
}

export function ProductionForm({ entry, slug, month }: Props): ReactElement {
  const router = useRouter();
  const [assets, setAssets] = useState<AssetItem[]>(() => parseAssets(entry));
  const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyUrl(assetId: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedId(assetId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleFileUpload(assetId: string, file: File) {
    const isVideo = file.type.startsWith("video/");
    const MB = 1024 * 1024;
    const limit = isVideo ? 100 * MB : 10 * MB;

    if (file.size > limit) {
      const sizeMB = (file.size / MB).toFixed(1);
      const limitMB = isVideo ? 100 : 10;
      toast.error(`حجم الملف ${sizeMB}MB أكبر من الحد المسموح (${limitMB}MB ${isVideo ? "للفيديو" : "للصور"}). اختر ملف أصغر.`);
      return;
    }

    setUploadingId(assetId);
    setUploadProgress((p) => ({ ...p, [assetId]: 0 }));

    const cleanup = (): void => {
      setTimeout(() => {
        setUploadingId(null);
        setUploadProgress((p) => { const n = { ...p }; delete n[assetId]; return n; });
      }, 800);
    };

    try {
      // 1) Get a signed signature from our API
      const sigRes = await fetch("/api/upload-signature", { method: "POST" });
      if (!sigRes.ok) {
        toast.error("فشل التحقق من الصلاحيات. تأكد من إعدادات Cloudinary.");
        cleanup();
        return;
      }
      const { signature, timestamp, folder, apiKey, cloudName } = await sigRes.json();

      // 2) Upload directly to Cloudinary (bypasses Vercel 4.5MB limit)
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("folder", folder);

      const resourceType = isVideo ? "video" : "image";
      const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 95);
          setUploadProgress((p) => ({ ...p, [assetId]: pct }));
        }
      };

      xhr.onload = () => {
        setUploadProgress((p) => ({ ...p, [assetId]: 100 }));
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText) as { secure_url: string; width?: number; height?: number; bytes?: number };
          updateAsset(assetId, {
            url:    data.secure_url,
            type:   resourceType,
            width:  data.width,
            height: data.height,
            bytes:  data.bytes,
          });
          toast.success("تم رفع الملف");
        } else {
          let msg = `فشل الرفع (HTTP ${xhr.status})`;
          try {
            const err = JSON.parse(xhr.responseText) as { error?: { message?: string } };
            if (err.error?.message) msg = `Cloudinary: ${err.error.message}`;
          } catch {}
          toast.error(msg);
        }
        cleanup();
      };

      xhr.onerror = () => {
        toast.error("فشل الاتصال أثناء الرفع. تحقق من الإنترنت وحاول مرة أخرى.");
        cleanup();
      };

      xhr.open("POST", cloudUrl);
      xhr.send(fd);
    } catch (e) {
      toast.error(`خطأ غير متوقع: ${(e as Error).message}`);
      cleanup();
    }
  }

  const isFullyLocked = entry.status === "جاهز للنشر" || entry.status === "تم النشر";
  const isReview      = entry.status === "جاهز للمراجعة";
  const isDone        = isReview || isFullyLocked;
  const canSubmit     = assets.some((a) => a.url.trim().length > 0);
  const typeMeta      = entry.contentType ? CONTENT_TYPE_META[entry.contentType] : null;
  const TypeIcon      = typeMeta?.icon;
  const stageItems    = entry.customerStage.map((s) => STAGE_META[s]).filter(Boolean);

  function addAsset() {
    setAssets((prev) => [...prev, { id: crypto.randomUUID(), url: "", type: "video", label: entry.idea }]);
  }

  function removeAsset(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAsset(id: string, patch: Partial<AssetItem>) {
    setAssets((prev) => prev.map((a) => a.id === id ? { ...a, ...patch } : a));
  }

  function cleanAssets(): AssetItem[] {
    return assets.filter((a) => a.url.trim().length > 0);
  }

  async function handleMarkReady() {
    setSaving(true);
    try {
      const clean = cleanAssets();
      await updateEntry(entry.id, { assets: clean, assetLink: clean[0]?.url ?? null });
      const result = await updateStatus(entry.id, "جاهز للمراجعة");
      if (result.success) {
        toast.success("تم تحديث الحالة إلى جاهز للمراجعة");
        void sendTelegramNotification(
          `🎨 <b>جاهز للمراجعة</b>\n\n💡 <b>الفكرة:</b> ${entry.idea}\n📅 يوم ${entry.day}\n👤 العميل: ${slug}\n\nالإبداع جاهز (${clean.length} ملف) — يرجى المراجعة والموافقة.`
        );
        window.location.href = `/clients/${slug}/calendar/${month}`;
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <div className="space-y-5 pb-24">

      {/* Status banner */}
      {isDone && (
        <div className={cn(
          "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium",
          entry.status === "تم النشر"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-amber-200 bg-amber-50 text-amber-700",
        )}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          هذا المنشور في مرحلة: <span className="font-bold">{entry.status}</span>
        </div>
      )}

      {/* Rejection note banner */}
      {entry.rejectionNote && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-4 py-3 text-sm">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">سبب الرفض</p>
            <p className="text-red-600 dark:text-red-300 mt-0.5 whitespace-pre-wrap leading-relaxed">{entry.rejectionNote}</p>
          </div>
        </div>
      )}

      {/* ── Info row ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">

        <div className="flex items-center gap-1.5 text-sm shrink-0">
          <span className="font-semibold text-foreground">{dayDetail(entry.day, month)}</span>
        </div>

        {typeMeta && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              {TypeIcon && <TypeIcon size={12} className="text-primary" />}
              <span className="text-sm font-semibold text-primary">{typeMeta.label}</span>
            </div>
          </>
        )}

        {entry.channels.length > 0 && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <div className="flex items-center gap-1.5">
              {entry.channels.map((ch) => <ChannelIcon key={ch} channel={ch} />)}
            </div>
          </>
        )}

        {stageItems.length > 0 && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {stageItems.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1">
                    <Icon size={9} className="text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-foreground">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* ── الفكرة ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary/20 bg-primary/3 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/50 mb-1.5">الفكرة</p>
        <p className="text-base font-bold text-foreground leading-snug">{entry.idea}</p>
      </div>

      {/* ── المحتوى المكتوب ──────────────────────────────────────────── */}
      <Section title="المحتوى المكتوب">
        <Field label="النص" value={entry.text} multiline />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Field label="الخطاف Hook" value={entry.hook} />
          <Field label="الدعوة للتصرف CTA" value={entry.cta} />
        </div>
      </Section>

      {/* ── تفاصيل الإنتاج ───────────────────────────────────────────── */}
      <Section title="تفاصيل الإنتاج">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="نبرة الصوت Voice Tone" value={entry.voiceTone} />
          <Field label="الإلهام Reference" value={entry.inspiration} />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">السيناريو Script</p>
          {entry.script ? (
            <a href={entry.script} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline break-all">
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              {entry.script.length > 70 ? entry.script.slice(0, 70) + "…" : entry.script}
            </a>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-amber-600 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">لم يُحدَّد بعد — تواصل مع كاتب المحتوى</span>
            </div>
          )}
        </div>

        <Field label="ملحوظات للمصمم Notes" value={entry.notes} multiline />
      </Section>

      {/* ── الإبداع ─────────────────────────────────────────────────── */}
      <Section title="الإبداع">
        <div className="space-y-3">
          {assets.map((asset, idx) => (
            <div key={asset.id} className="rounded-xl border border-border bg-muted/20 overflow-hidden">
              {/* Asset preview (image/video) if uploaded to Cloudinary */}
              {asset.url.trim() && isCloudinaryUrl(asset.url) && (
                <div className="relative bg-black/5 border-b border-border">
                  {asset.type === "image" ? (
                    <Image
                      src={optimizeCloudinaryUrl(asset.url, { width: 800 })}
                      alt={asset.label || `ملف ${idx + 1}`}
                      width={asset.width || 800}
                      height={asset.height || 800}
                      unoptimized
                      className="w-full max-h-64 object-contain h-auto"
                    />
                  ) : (
                    <video
                      src={asset.url}
                      controls
                      className="w-full max-h-64"
                      preload="metadata"
                    />
                  )}
                </div>
              )}

              {/* Upload progress bar */}
              {uploadingId === asset.id && (
                <div className="px-3 pt-2.5 pb-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-primary">
                      {uploadProgress[asset.id] === 100 ? "✓ اكتمل الرفع" : "جاري الرفع..."}
                    </span>
                    <span className="text-[11px] font-bold text-primary tabular-nums">
                      {uploadProgress[asset.id] ?? 0}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress[asset.id] ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Controls row */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                {/* Type badge */}
                <button
                  type="button"
                  disabled={isFullyLocked}
                  onClick={() => updateAsset(asset.id, { type: asset.type === "video" ? "image" : "video" })}
                  className={cn(
                    "shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border transition-colors",
                    asset.type === "video"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-emerald-300 bg-emerald-50 text-emerald-600",
                    isFullyLocked && "opacity-50 cursor-not-allowed",
                  )}
                  title={asset.type === "video" ? "فيديو — اضغط للتغيير لصورة" : "صورة — اضغط للتغيير لفيديو"}
                >
                  {asset.type === "video" ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                </button>

                {/* Copy URL */}
                {asset.url.trim() && (
                  <button
                    type="button"
                    onClick={() => copyUrl(asset.id, asset.url)}
                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="نسخ الرابط">
                    {copiedId === asset.id
                      ? <Check className="h-3.5 w-3.5 text-green-500" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}

                {/* Label input */}
                <Input
                  dir="rtl"
                  value={asset.label ?? ""}
                  onChange={(e) => updateAsset(asset.id, { label: e.target.value })}
                  placeholder="تسمية"
                  className="h-8 text-xs flex-1 min-w-0"
                  disabled={isFullyLocked}
                />

                {/* Upload button */}
                {!isFullyLocked && (
                  <label
                    className={cn(
                      "shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer",
                      uploadingId === asset.id && "pointer-events-none opacity-60",
                    )}
                    title="رفع ملف">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(asset.id, file);
                        e.target.value = "";
                      }}
                    />
                    {uploadingId === asset.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Upload className="h-3.5 w-3.5" />}
                  </label>
                )}


                {/* Open link */}
                {asset.url.trim() && (
                  <a href={asset.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="فتح">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                {/* Remove */}
                {!isFullyLocked && (
                  <button
                    type="button"
                    onClick={() => removeAsset(asset.id)}
                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {!isFullyLocked && (
            <button
              type="button"
              onClick={addAsset}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30 transition-colors">
              <Plus className="h-4 w-4" />
              إضافة ملف
            </button>
          )}

          {assets.length === 0 && isFullyLocked && (
            <p className="text-center text-sm text-muted-foreground/60 py-2">لا يوجد ملفات مرفقة</p>
          )}

        </div>
      </Section>

      {/* ── Fixed footer ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-6 py-3 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center gap-3 max-w-4xl mx-auto justify-end">
          {!isReview && !isFullyLocked && (
            <Button
              type="button"
              disabled={saving || !canSubmit}
              onClick={handleMarkReady}
              className="shrink-0 h-10 font-semibold gap-2 px-5">
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "جاري الحفظ..." : "جاهز للمراجعة"}
            </Button>
          )}
          <Button type="button" variant="outline" className="shrink-0 h-10"
            onClick={() => router.push(`/clients/${slug}/calendar/${month}`)}>
            رجوع
          </Button>
        </div>
      </div>

    </div>

    {/* ── Creative Preview Modal ── */}
    <Dialog open={!!previewAsset} onOpenChange={(o) => { if (!o) setPreviewAsset(null); }}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-semibold" dir="rtl">
            {previewAsset?.label || `ملف ${assets.findIndex((a) => a.id === previewAsset?.id) + 1}`} — {entry.idea}
          </DialogTitle>
          <button onClick={() => setPreviewAsset(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">✕</button>
        </DialogHeader>
        <div className="px-4 py-2 border-t border-border flex justify-end">
          {previewAsset && (
            <a href={previewAsset.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              فتح
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
