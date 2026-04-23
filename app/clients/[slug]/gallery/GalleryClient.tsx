"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { X, ImageIcon, Film, ChevronLeft, ChevronRight, Upload, Download, Loader2 } from "lucide-react";
import { MONTHS } from "@/lib/constants";
import type { GalleryEntry, AssetItem } from "@/app/actions/entries";
import { downloadWithProgress } from "@/lib/download-with-progress";

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  "قيد الإنتاج":    "bg-zinc-100  text-zinc-600   border-zinc-200  dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  "جاهز للمراجعة": "bg-amber-50  text-amber-700  border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  "جاهز للنشر":    "bg-blue-50   text-blue-700   border-blue-200  dark:bg-blue-950  dark:text-blue-300  dark:border-blue-800",
  "تم النشر":       "bg-green-50  text-green-700  border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type PreviewState = {
  entry: GalleryEntry;
  assetIdx: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function monthLabel(value: string): string {
  return MONTHS.find((m) => m.value === value)?.label ?? value;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadUrl(url: string): string {
  // Cloudinary: add fl_attachment to force download
  if (url.includes("res.cloudinary.com")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
}

function AssetThumb({ asset, onClick }: { asset: AssetItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full aspect-square overflow-hidden rounded-xl border border-border bg-muted/40 hover:border-primary/50 hover:shadow-md transition-all group"
    >
      {asset.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={asset.label ?? ""}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <video
          src={asset.url}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          preload="metadata"
          muted
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {asset.type === "image" ? (
          <ImageIcon className="h-3 w-3 text-white" />
        ) : (
          <Film className="h-3 w-3 text-white" />
        )}
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Filters = {
  month: string;
  type: "all" | "image" | "video";
  status: string;
};

export function GalleryClient({ entries, slug }: { entries: GalleryEntry[]; slug: string }) {
  const [filters, setFilters] = useState<Filters>({ month: "all", type: "all", status: "all" });
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [dlProgress, setDlProgress] = useState<number | null>(null);

  const handleDownload = useCallback(async (asset: AssetItem, entryIdea: string) => {
    if (dlProgress !== null) return;
    try {
      await downloadWithProgress(
        asset.url,
        asset.label || entryIdea || "ملف",
        (pct) => setDlProgress(pct),
      );
    } catch { /* silent */ }
    finally { setTimeout(() => setDlProgress(null), 1200); }
  }, [dlProgress]);

  // Build unique month list from data
  const months = useMemo(() => {
    const seen = new Set<string>();
    for (const e of entries) seen.add(e.month);
    return MONTHS.filter((m) => seen.has(m.value));
  }, [entries]);

  // Flatten entries into asset cards
  const allCards = useMemo(() => {
    const cards: { entry: GalleryEntry; asset: AssetItem; assetIdx: number }[] = [];
    for (const entry of entries) {
      entry.assets.forEach((asset, idx) => {
        cards.push({ entry, asset, assetIdx: idx });
      });
    }
    return cards;
  }, [entries]);

  const filtered = useMemo(() => {
    return allCards.filter(({ entry, asset }) => {
      if (filters.month !== "all" && entry.month !== filters.month) return false;
      if (filters.type !== "all" && asset.type !== filters.type) return false;
      if (filters.status !== "all" && entry.status !== filters.status) return false;
      return true;
    });
  }, [allCards, filters]);

  function openPreview(entry: GalleryEntry, assetIdx: number) {
    setPreview({ entry, assetIdx });
  }

  function navigatePreview(dir: 1 | -1) {
    if (!preview) return;
    const curIdx = filtered.findIndex(
      (c) => c.entry.id === preview.entry.id && c.assetIdx === preview.assetIdx,
    );
    const next = filtered[curIdx + dir];
    if (next) setPreview({ entry: next.entry, assetIdx: next.assetIdx });
  }

  const previewActive = preview
    ? preview.entry.assets[preview.assetIdx]
    : null;

  const previewPos = preview
    ? filtered.findIndex(
        (c) => c.entry.id === preview.entry.id && c.assetIdx === preview.assetIdx,
      ) + 1
    : 0;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Filters bar */}
      <div className="shrink-0 border-b border-border bg-card px-5 py-2.5 flex items-center gap-3 flex-wrap">
        {/* Month */}
        <select
          value={filters.month}
          onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">كل الشهور</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Type */}
        <div className="flex rounded-lg border border-border overflow-hidden bg-background text-sm">
          {(["all", "image", "video"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, type: t }))}
              className={`px-3 h-8 transition-colors ${
                filters.type === t
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "all" ? "الكل" : t === "image" ? "صور" : "فيديو"}
            </button>
          ))}
        </div>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">كل الحالات</option>
          <option value="قيد الإنتاج">قيد الإنتاج</option>
          <option value="جاهز للمراجعة">جاهز للمراجعة</option>
          <option value="جاهز للنشر">جاهز للنشر</option>
          <option value="تم النشر">تم النشر</option>
        </select>

        <span className="text-xs text-muted-foreground mr-auto">
          {filtered.length} ملف
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {allCards.length === 0 ? (
          /* ── No files at all ── */
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/40">
              <ImageIcon className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">لا يوجد إبداع مرفوع بعد</p>
              <p className="text-xs text-muted-foreground mt-1">ارفع ملفات من صفحة الإنتاج لكل منشور</p>
            </div>
            <Link
              href={`/clients/${slug}/calendar/apr`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              اذهب للكالندر
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          /* ── Files exist but filtered out ── */
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-30" />
            <p className="text-sm">لا توجد ملفات مطابقة للفلاتر</p>
            <button
              type="button"
              onClick={() => setFilters({ month: "all", type: "all", status: "all" })}
              className="text-xs text-primary hover:underline"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(({ entry, asset, assetIdx }) => (
              <div key={`${entry.id}-${assetIdx}`} className="flex flex-col gap-1.5">
                <AssetThumb
                  asset={asset}
                  onClick={() => openPreview(entry, assetIdx)}
                />
                <div className="px-0.5">
                  <p className="text-xs font-medium text-foreground truncate leading-tight">
                    {entry.idea || `يوم ${entry.day}`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      {asset.type === "image"
                        ? <ImageIcon className="h-2.5 w-2.5" />
                        : <Film className="h-2.5 w-2.5" />}
                      {monthLabel(entry.month)} {entry.day}
                    </span>
                    {asset.bytes && (
                      <span className="text-[10px] text-muted-foreground/60">{formatBytes(asset.bytes)}</span>
                    )}
                  </div>
                  <div className="mt-0.5">
                    <span className={`text-[10px] font-semibold border rounded-full px-1.5 py-px ${STATUS_STYLE[entry.status] ?? ""}`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden gap-0 bg-background" dir="rtl">
          <DialogHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <DialogTitle className="text-sm font-semibold truncate">
                {preview?.entry.idea || `يوم ${preview?.entry.day}`}
              </DialogTitle>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {preview && `${monthLabel(preview.entry.month)} ${preview.entry.day}`}
              </span>
              {preview && (
                <span className={`shrink-0 text-[10px] font-semibold border rounded-full px-2 py-px ${STATUS_STYLE[preview.entry.status] ?? ""}`}>
                  {preview.entry.status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 mr-2">
              {previewActive && (
                <button
                  type="button"
                  disabled={dlProgress !== null}
                  onClick={() => handleDownload(previewActive, preview?.entry.idea ?? "")}
                  className="relative overflow-hidden h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed transition-colors min-w-[72px] justify-center"
                >
                  {dlProgress !== null && (
                    <span
                      className="absolute inset-0 bg-white/20 transition-all duration-200 ease-out"
                      style={{ transform: `scaleX(${(dlProgress) / 100})`, transformOrigin: "left" }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {dlProgress === null ? (
                      <><Download className="h-3.5 w-3.5" />تحميل</>
                    ) : dlProgress === 100 ? (
                      <>✓ تم</>
                    ) : (
                      <><Loader2 className="h-3 w-3 animate-spin" />{dlProgress}%</>
                    )}
                  </span>
                </button>
              )}
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {previewPos} / {filtered.length}
              </span>
              <button
                type="button"
                onClick={() => navigatePreview(-1)}
                disabled={previewPos <= 1}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigatePreview(1)}
                disabled={previewPos >= filtered.length}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="flex items-center justify-center bg-black/5 dark:bg-black/30 min-h-[50vh] max-h-[75vh] overflow-hidden p-3">
            {previewActive?.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewActive.url}
                alt={previewActive.label ?? ""}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            ) : previewActive ? (
              <video
                key={previewActive.url}
                src={previewActive.url}
                controls
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                preload="metadata"
              />
            ) : null}
          </div>

          {/* Metadata bar */}
          {previewActive && (previewActive.width || previewActive.bytes) && (
            <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
              {previewActive.width && previewActive.height && (
                <span>{previewActive.width} × {previewActive.height} px</span>
              )}
              {previewActive.width && previewActive.bytes && <span className="opacity-40">·</span>}
              {previewActive.bytes && (
                <span>{formatBytes(previewActive.bytes)}</span>
              )}
            </div>
          )}

          {preview && preview.entry.assets.length > 1 && (
            <div className="flex gap-2 px-4 py-3 border-t border-border overflow-x-auto">
              {preview.entry.assets.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setPreview((p) => p ? { ...p, assetIdx: i } : p)}
                  className={`shrink-0 h-12 w-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === preview.assetIdx ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  {a.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={a.url} className="w-full h-full object-cover" muted preload="metadata" />
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
