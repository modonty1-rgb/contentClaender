"use client";

import type { ReactElement } from "react";
import { Fragment, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, Share2, Eye, Pencil, Archive, ArrowUpDown, ArrowUp, ArrowDown, Columns, Search, X, Clapperboard, Send, CheckCircle2, Lock, XCircle, Film, ImageIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/app/components/ui/dialog";

import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "@/app/components/ui/sonner";
import { STATUS_OPTIONS, TYPE_OPTIONS, TYPE_LABELS, CUSTOMER_STAGE_LABELS, DAYS_IN_MONTH } from "@/lib/constants";
import type { EntryListItem, AssetItem } from "@/app/actions/entries";
import { updateStatus, rejectEntry, archiveEntry } from "@/app/actions/entries";
import { sendTelegramNotification } from "@/app/actions/telegram";
import { ChannelIcon } from "@/app/components/ui/channel-icon";
import type { MonthValue } from "@/lib/constants";

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

// ─── Creative Cell ────────────────────────────────────────────────────────────

function getEntryAssets(entry: EntryListItem): AssetItem[] {
  if (entry.assets && (entry.assets as AssetItem[]).length > 0) return entry.assets as AssetItem[];
  if (entry.assetLink) return [{ id: "legacy", url: entry.assetLink, type: "video" }];
  return [];
}

function CreativeCell({ entry }: { entry: EntryListItem }): ReactElement {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const entryAssets = getEntryAssets(entry);

  if (entryAssets.length === 0 || entry.status === "قيد الإنتاج") {
    return (
      <div className="flex items-center justify-center">
        <span
          className="text-muted-foreground/25"
          title={entry.status === "قيد الإنتاج" ? "الإبداع قيد الإنتاج" : "لا يوجد إبداع"}>
          <Lock className="h-3.5 w-3.5" />
        </span>
      </div>
    );
  }

  const active = entryAssets[activeIdx] ?? entryAssets[0];

  return (
    <>
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setActiveIdx(0); setOpen(true); }}
          className="inline-flex items-center gap-1 text-primary/60 hover:text-primary transition-colors"
          title="معاينة الإبداع">
          {active.type === "video"
            ? <Film className="h-4 w-4" />
            : <ImageIcon className="h-4 w-4" />}
          {entryAssets.length > 1 && (
            <span className="text-[10px] font-bold tabular-nums">{entryAssets.length}</span>
          )}
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden gap-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <DialogTitle className="text-sm font-semibold truncate" dir="rtl">
                {entry.idea || `يوم ${entry.day}`}
              </DialogTitle>
              {entryAssets.length > 1 && (
                <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">
                  {activeIdx + 1} / {entryAssets.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-sm p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Asset tabs (if multiple) */}
          {entryAssets.length > 1 && (
            <div className="flex gap-1 px-4 py-2 border-b border-border bg-muted/20 overflow-x-auto">
              {entryAssets.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                    i === activeIdx
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}>
                  {a.label || `ملف ${i + 1}`}
                </button>
              ))}
            </div>
          )}

          {active.type === "image" ? (
            <div className="flex items-center justify-center bg-black/5 p-2" style={{ minHeight: "40vh", maxHeight: "65vh", overflow: "auto" }}>
              <img src={active.url} alt={active.label || "ملف"} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
            </div>
          ) : (
            <video src={active.url} controls autoPlay className="w-full" style={{ maxHeight: "65vh" }} />
          )}

          <div className="px-4 py-2 border-t border-border flex justify-end">
            <a href={active.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              فتح
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Day helpers ──────────────────────────────────────────────────────────────

const MONTH_INDEX: Record<MonthValue, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getDayName(month: MonthValue, day: number): string {
  const year = new Date().getFullYear();
  return DAY_NAMES[new Date(year, MONTH_INDEX[month], day).getDay()];
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  if (status === "تم النشر")       return "bg-green-50  text-green-700  border-green-200";
  if (status === "جاهز للنشر")     return "bg-blue-50   text-blue-700   border-blue-200";
  if (status === "جاهز للمراجعة")  return "bg-amber-50  text-amber-700  border-amber-200";
  if (status === "قيد الإنتاج")    return "bg-zinc-100  text-zinc-600   border-zinc-200";
  return "bg-zinc-100 text-zinc-500 border-zinc-200";
}

function statusDot(status: string): string {
  if (status === "تم النشر")       return "bg-green-500";
  if (status === "جاهز للنشر")     return "bg-blue-500";
  if (status === "جاهز للمراجعة")  return "bg-amber-400";
  return "bg-zinc-400";
}

function customerStageColor(_f: string): string {
  return "bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-300";
}

function typeColor(_t: string): string {
  return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";
}

function statusHref(slug: string, month: MonthValue, id: string, status: string): string {
  if (status === "جاهز للنشر" || status === "تم النشر") {
    return `/clients/${slug}/calendar/${month}/publish/${id}`;
  }
  return `/clients/${slug}/calendar/${month}/production/${id}`;
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

function DayCell({ month, day, muted }: { month: MonthValue; day: number; muted?: boolean }): ReactElement {
  const today = new Date();
  const isToday = today.getMonth() === MONTH_INDEX[month] && today.getDate() === day;

  if (muted) {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground/30 tabular-nums w-5 text-center">{day}</span>
        <span className="text-[10px] text-muted-foreground/25">{getDayName(month, day)}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className={cn(
        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        isToday
          ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
          : "bg-primary/8 text-primary",
      )}>
        {day}
      </div>
      <span className={cn("text-[10px] font-medium", isToday ? "text-primary font-semibold" : "text-muted-foreground")}>
        {getDayName(month, day)}
      </span>
    </div>
  );
}

function Row({
  label, value, multiline, link,
}: { label: string; value: string; multiline?: boolean; link?: string }): ReactElement {
  if (!value) return <></>;
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-xs font-medium text-muted-foreground pt-0.5">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="text-primary underline text-xs inline-flex items-center gap-1 break-all">
          {value.length > 50 ? value.slice(0, 50) + "..." : value}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : multiline ? (
        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{value}</p>
      ) : (
        <p className="text-xs text-foreground">{value}</p>
      )}
    </div>
  );
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────────

function ActionsMenu({
  entry, slug, month, onDelete, onReload,
}: {
  entry: EntryListItem;
  slug: string;
  month: MonthValue;
  onDelete: () => void;
  onReload: () => void;
}): ReactElement {
  const [viewOpen,     setViewOpen]     = useState(false);
  const [approveOpen,  setApproveOpen]  = useState(false);
  const [approving,    setApproving]    = useState(false);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejecting,    setRejecting]    = useState(false);
  const [rejectNote,   setRejectNote]   = useState("");

  async function handleApprove() {
    setApproving(true);
    try {
      const result = await updateStatus(entry.id, "جاهز للنشر");
      if (result.success) {
        toast.success("تمت الموافقة — جاهز للنشر");
        void sendTelegramNotification(
          `✅ <b>جاهز للنشر</b>\n\n💡 <b>الفكرة:</b> ${entry.idea}\n📅 يوم ${entry.day}\n👤 العميل: ${slug}\n\nتمت الموافقة على الإبداع — جاهز للميديا باير.`
        );
        setApproveOpen(false);
        onReload();
      } else {
        toast.error(result.error);
      }
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      const result = await rejectEntry(entry.id, rejectNote);
      if (result.success) {
        toast.success("تم الرفض — رجع لـ قيد الإنتاج");
        setRejectOpen(false);
        setRejectNote("");
        onReload();
      } else {
        toast.error(result.error);
      }
    } finally {
      setRejecting(false);
    }
  }

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/view/entry/${entry.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط المنشور");
    } catch {
      toast.error("تعذّر النسخ");
    }
  }, [entry.id]);

  const btn = "h-6 w-6 p-0 inline-flex items-center justify-center rounded-md transition-colors";

  return (
    <>
      <div className="flex items-center gap-0.5">

        {/* ── Status-based primary action ── */}
        {entry.status === "قيد الإنتاج" && (
          <Link href={`/clients/${slug}/calendar/${month}/production/${entry.id}`}
            className={cn(btn, "text-muted-foreground hover:text-orange-600 hover:bg-orange-50")}
            title="صفحة الإنتاج">
            <Clapperboard className="h-3.5 w-3.5" />
          </Link>
        )}
        {entry.status === "جاهز للمراجعة" && (
          <>
            <button type="button" onClick={() => setApproveOpen(true)}
              className={cn(btn, "text-muted-foreground hover:text-amber-600 hover:bg-amber-50")}
              title="منح الموافقة">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setRejectOpen(true)}
              className={cn(btn, "text-muted-foreground hover:text-destructive hover:bg-destructive/10")}
              title="رفض الإبداع">
              <XCircle className="h-3.5 w-3.5" />
            </button>
            <Link href={`/clients/${slug}/calendar/${month}/production/${entry.id}`}
              className={cn(btn, "text-muted-foreground hover:text-orange-600 hover:bg-orange-50")}
              title="صفحة الإنتاج">
              <Clapperboard className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
        {(entry.status === "جاهز للنشر" || entry.status === "تم النشر") && (
          <>
            <Link href={`/clients/${slug}/calendar/${month}/publish/${entry.id}`}
              className={cn(btn, "text-muted-foreground hover:text-blue-600 hover:bg-blue-50")}
              title="صفحة النشر">
              <Send className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/clients/${slug}/calendar/${month}/production/${entry.id}`}
              className={cn(btn, "text-muted-foreground hover:text-orange-600 hover:bg-orange-50")}
              title="صفحة الإنتاج">
              <Clapperboard className="h-3.5 w-3.5" />
            </Link>
          </>
        )}

        {/* ── Always present ── */}
        <button type="button" onClick={() => setViewOpen(true)}
          className={cn(btn, "text-muted-foreground hover:text-foreground hover:bg-muted")}
          title="عرض التفاصيل">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <Link href={`/clients/${slug}/calendar/${month}/edit/${entry.id}`}
          className={cn(btn, "text-muted-foreground hover:text-foreground hover:bg-muted")}
          title="تعديل">
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <button type="button" onClick={handleShare}
          className={cn(btn, "text-muted-foreground hover:text-foreground hover:bg-muted")}
          title="نسخ رابط المشاركة">
          <Share2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete}
          className={cn(btn, "text-muted-foreground hover:text-destructive hover:bg-destructive/10")}
          title="أرشفة">
          <Archive className="h-3.5 w-3.5" />
        </button>

      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>يوم {entry.day} — {entry.idea || "بدون فكرة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <Row label="الفكرة" value={entry.idea} />
            <Row label="نوع الحملة" value={entry.customerStage.join(", ")} />
            <Row label="نوع المحتوى" value={entry.contentType} />
            <Row label="الحالة" value={entry.status} />
            <Row label="القنوات" value={entry.channels.join(", ")} />
            {entry.text        ? <Row label="النص"       value={entry.text}       multiline /> : null}
            {entry.hook        ? <Row label="الخطاف"     value={entry.hook} /> : null}
            {entry.cta         ? <Row label="الدعوة"     value={entry.cta} /> : null}
            {entry.script      ? <Row label="السكريبت"   value={entry.script} link={entry.script.startsWith("http") ? entry.script : undefined} /> : null}
            {entry.voiceTone   ? <Row label="نبرة الصوت" value={entry.voiceTone} /> : null}
            {entry.inspiration ? <Row label="الإلهام"    value={entry.inspiration} /> : null}
            {(() => {
              const viewAssets: AssetItem[] = entry.assets && (entry.assets as AssetItem[]).length > 0
                ? (entry.assets as AssetItem[])
                : entry.assetLink ? [{ id: "legacy", url: entry.assetLink, type: "video" }] : [];
              return viewAssets.length > 0 ? (
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-xs font-medium text-muted-foreground pt-0.5">الملفات ({viewAssets.length})</span>
                  <div className="space-y-1">
                    {viewAssets.map((a, i) => (
                      <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary underline text-xs">
                        {a.label || `ملف ${i + 1}`}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
            {entry.scheduledDate ? <Row label="موعد النشر" value={new Date(entry.scheduledDate).toLocaleDateString("ar-SA")} /> : null}
            {entry.scheduledTime ? <Row label="وقت النشر"  value={entry.scheduledTime} /> : null}
            {entry.channelLinks && Object.keys(entry.channelLinks as object).length > 0 ? (
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-xs font-medium text-muted-foreground pt-0.5">روابط النشر</span>
                <div className="space-y-1">
                  {Object.entries(entry.channelLinks as Record<string, string>).map(([ch, url]) => (
                    <div key={ch} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{ch}</span>
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="text-primary underline text-xs inline-flex items-center gap-1 break-all">
                        {url.length > 40 ? url.slice(0, 40) + "..." : url}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {entry.notes ? <Row label="ملحوظات" value={entry.notes} multiline /> : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Approval Dialog ── */}
      {(() => {
        const approveAssets = getEntryAssets(entry);
        return (
          <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0" dir="rtl">
              <DialogHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <DialogTitle className="text-sm font-semibold truncate">
                    منح الموافقة — {entry.idea || `يوم ${entry.day}`}
                  </DialogTitle>
                  {approveAssets.length > 0 && (
                    <span className="shrink-0 text-[11px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {approveAssets.length} {approveAssets.length === 1 ? "ملف" : "ملفات"}
                    </span>
                  )}
                </div>
                <button type="button" onClick={() => setApproveOpen(false)}
                  className="shrink-0 rounded-sm p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </DialogHeader>

              {/* Creative preview */}
              <div className="max-h-[55vh] overflow-y-auto">
                {approveAssets.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    لا يوجد إبداع مرفق
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {approveAssets.map((a, i) => (
                      <div key={a.id} className="rounded-xl border border-border overflow-hidden">
                        {a.type === "image" ? (
                          <img src={a.url} alt={a.label || `ملف ${i + 1}`} className="w-full max-h-64 object-contain bg-black/5" />
                        ) : (
                          <video src={a.url} controls className="w-full max-h-64" preload="metadata" />
                        )}
                        <div className="px-3 py-2 flex items-center justify-between border-t border-border">
                          <span className="text-xs text-muted-foreground">{a.label || `ملف ${i + 1}`}</span>
                          <a href={a.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                            فتح
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approve bar */}
              <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
                <Button type="button" variant="outline" size="sm" onClick={() => setApproveOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={approving}
                  onClick={handleApprove}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                  {approving ? "جاري الموافقة..." : "منح الموافقة — جاهز للنشر"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Rejection Dialog */}
      <Dialog open={rejectOpen} onOpenChange={(o) => { if (!o) { setRejectOpen(false); setRejectNote(""); } }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              رفض الإبداع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              سيرجع المنشور لحالة <span className="font-semibold text-foreground">قيد الإنتاج</span>. أضف سبب الرفض حتى يعرف الإبداع ما المطلوب.
            </p>
            <Textarea
              placeholder="سبب الرفض... (مثال: الألوان لا تتوافق مع الهوية، النص يحتاج مراجعة)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => { setRejectOpen(false); setRejectNote(""); }}>
              إلغاء
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={rejecting}
              onClick={handleReject}
              className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <XCircle className="h-4 w-4" />
              {rejecting ? "جاري الرفض..." : "رفض وإعادة للإنتاج"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export type CalendarTableProps = {
  entries: EntryListItem[];
  slug: string;
  month: MonthValue;
  monthLabel: string;
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  onReload: () => void;
};

export function CalendarTable({
  entries, slug, month, loading, onDelete, onReload,
}: CalendarTableProps): ReactElement {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("الكل");
  const [filterType, setFilterType]     = useState<string>("الكل");
  const [searchQ, setSearchQ]           = useState("");
  const [sortCol, setSortCol]           = useState<string | null>(null);
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");
  const [colVis, setColVis]             = useState<Record<string, boolean>>({});
  const [hideEmpty, setHideEmpty]       = useState(false);

  function toggleSort(col: string) {
    if (sortCol === col) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortCol(null); setSortDir("asc"); }
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function isVisible(id: string) { return colVis[id] !== false; }
  function toggleCol(id: string) { setColVis((prev) => ({ ...prev, [id]: prev[id] === false })); }

  const COL_TOGGLES = [
    { id: "contentType",   label: "النوع" },
    { id: "customerStage", label: "نوع الحملة" },
    { id: "channels",      label: "القنوات" },
    { id: "status",        label: "الحالة" },
  ];

  const isFiltered = filterStatus !== "الكل" || filterType !== "الكل" || searchQ.trim() !== "";

  const filtered = useMemo(() => {
    let list = entries;
    if (filterStatus !== "الكل") list = list.filter((e) => e.status === filterStatus);
    if (filterType !== "الكل")   list = list.filter((e) => e.contentType === filterType);
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      list = list.filter(
        (e) => e.idea.toLowerCase().includes(q) ||
               e.text?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [entries, filterStatus, filterType, searchQ]);

  const sortedFiltered = useMemo(() => {
    if (!sortCol) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av = "", bv = "";
      if      (sortCol === "idea")          { av = a.idea;                    bv = b.idea; }
      else if (sortCol === "contentType")   { av = a.contentType;             bv = b.contentType; }
      else if (sortCol === "status")        { av = a.status;                  bv = b.status; }
      else if (sortCol === "customerStage") { av = a.customerStage.join(","); bv = b.customerStage.join(","); }
      else if (sortCol === "channels")      { av = a.channels.join(",");      bv = b.channels.join(","); }
      const cmp = av.localeCompare(bv, "ar");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const groupedByDay = useMemo(() => {
    const map = new Map<number, EntryListItem[]>();
    for (const entry of filtered) {
      const arr = map.get(entry.day) ?? [];
      arr.push(entry);
      map.set(entry.day, arr);
    }
    return map;
  }, [filtered]);

  const daysInMonth = DAYS_IN_MONTH[month];
  const allDays = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const STATUS_FILTERS = ["الكل", ...STATUS_OPTIONS];
  const TYPE_FILTERS   = ["الكل", ...TYPE_OPTIONS];

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.status] = (counts[e.status] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  function rowBorderClass(status: string): string {
    if (status === "تم النشر")       return "border-r-green-400";
    if (status === "جاهز للنشر")     return "border-r-blue-400";
    if (status === "جاهز للمراجعة")  return "border-r-amber-400";
    return "border-r-zinc-200";
  }

  return (
    <div className="flex flex-col h-full">
    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Status filter */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 shrink-0 ml-1">الحالة</span>
          <div className="flex gap-1">
            {STATUS_FILTERS.map((s) => {
              const count = s === "الكل" ? entries.length : (statusCounts[s] ?? 0);
              return (
                <button key={s} type="button" onClick={() => setFilterStatus(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all border inline-flex items-center gap-1.5",
                    filterStatus === s
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-transparent text-muted-foreground border-transparent hover:border-border hover:text-foreground",
                  )}>
                  {s === "الكل" ? "الكل" : s}
                  <span className={cn(
                    "tabular-nums text-[10px] font-bold rounded-full min-w-4 text-center leading-4 px-1",
                    filterStatus === s
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Type filter */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 shrink-0 ml-1">النوع</span>
          <div className="flex gap-1">
            {TYPE_FILTERS.map((t) => (
              <button key={t} type="button" onClick={() => setFilterType(t)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all border",
                  filterType === t
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-transparent text-muted-foreground border-transparent hover:border-border hover:text-foreground",
                )}>
                {t === "الكل" ? "الكل" : (TYPE_LABELS[t] ?? t)}
              </button>
            ))}
          </div>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2.5">
              <Columns className="h-3.5 w-3.5" />
              الأعمدة
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {COL_TOGGLES.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={isVisible(col.id)}
                onCheckedChange={() => toggleCol(col.id)}>
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset filter */}
        {isFiltered && (
          <button type="button"
            onClick={() => { setFilterStatus("الكل"); setFilterType("الكل"); setSearchQ(""); }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-md px-2 py-1 hover:border-foreground/40">
            <X className="h-3 w-3" />
            إعادة تعيين
          </button>
        )}

        {/* Result count */}
        <span className="mr-auto text-[11px] text-muted-foreground tabular-nums">
          {sortedFiltered.length} {sortedFiltered.length === 1 ? "منشور" : "منشور"}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card">
            <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/30">
              <Search className="h-7 w-7" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">{monthLabel} — لا يوجد محتوى بعد</p>
              <p className="text-xs text-muted-foreground">ابدأ بإضافة أول منشور لهذا الشهر من الزر في الشريط الجانبي</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="border-b border-border bg-muted/60">
                <TableHead className="w-20 text-center px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">اليوم</TableHead>
                <TableHead className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <button type="button" onClick={() => toggleSort("idea")}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                    الفكرة
                    {sortCol === "idea" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                  </button>
                </TableHead>
                {isVisible("status") && (
                  <TableHead className="w-36 px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <button type="button" onClick={() => toggleSort("status")}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                      الحالة
                      {sortCol === "status" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                    </button>
                  </TableHead>
                )}
                {isVisible("channels") && (
                  <TableHead className="w-24 px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">القنوات</TableHead>
                )}
                <TableHead className="w-10 text-center px-2 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">إبداع</TableHead>
                {isVisible("contentType") && (
                  <TableHead className="w-20 px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <button type="button" onClick={() => toggleSort("contentType")}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                      النوع
                      {sortCol === "contentType" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                    </button>
                  </TableHead>
                )}
                {isVisible("customerStage") && (
                  <TableHead className="w-28 px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <button type="button" onClick={() => toggleSort("customerStage")}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors whitespace-nowrap">
                      نوع الحملة
                      {sortCol === "customerStage" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                    </button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortCol !== null ? (
                // ── Flat sorted view ──────────────────────────────────────────
                sortedFiltered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedFiltered.map((entry) => (
                    <TableRow key={entry.id} className={cn(
                      "group/row relative transition-all duration-150 border-r-2 cursor-pointer hover:bg-muted/40",
                      rowBorderClass(entry.status),
                    )}>
                      <TableCell className="text-center px-3 py-2.5">
                        <DayCell month={month} day={entry.day} />
                      </TableCell>
                      <TableCell className="px-3 py-2.5">
                        <p className="text-sm font-medium text-foreground leading-snug" title={entry.idea}>
                          {entry.idea || <span className="text-muted-foreground italic text-xs">بدون فكرة</span>}
                        </p>
                      </TableCell>
                      {isVisible("status") && (
                        <TableCell className="px-3 py-2.5">
                          <Link
                            href={statusHref(slug, month, entry.id, entry.status)}
                            onClick={(e) => e.stopPropagation()}
                            className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-75", statusColor(entry.status))}>
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot(entry.status))} />
                            {entry.status}
                          </Link>
                        </TableCell>
                      )}
                      {isVisible("channels") && (
                        <TableCell className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {entry.channels.slice(0, 4).map((ch) => (
                              <ChannelIcon key={ch} channel={ch} />
                            ))}
                            {entry.channels.length > 4 && (
                              <span className="text-[10px] text-muted-foreground font-medium">+{entry.channels.length - 4}</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="px-2 py-2.5 text-center">
                        <CreativeCell entry={entry} />
                      </TableCell>
                      {isVisible("contentType") && (
                        <TableCell className="px-3 py-2.5">
                          {entry.contentType ? (
                            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", typeColor(entry.contentType))}>
                              {TYPE_LABELS[entry.contentType] ?? entry.contentType}
                            </span>
                          ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                        </TableCell>
                      )}
                      {isVisible("customerStage") && (
                        <TableCell className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {entry.customerStage.map((f) => (
                              <span key={f} className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", customerStageColor(f))}>{CUSTOMER_STAGE_LABELS[f] ?? f}</span>
                            ))}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="w-0 p-0">
                        <div className="absolute left-0 inset-y-0 z-10 flex items-center gap-0.5 px-3 opacity-0 group-hover/row:opacity-100 group-hover/row:pointer-events-auto pointer-events-none transition-opacity duration-150 bg-card border-r border-border shadow-[-4px_0_8px_rgba(0,0,0,0.04)]">
                          <ActionsMenu entry={entry} slug={slug} month={month} onDelete={() => setDeleteTargetId(entry.id)} onReload={onReload} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : (
                // ── Day-grouped view ──────────────────────────────────────────
                allDays.map((day) => {
                  const dayEntries = groupedByDay.get(day) ?? [];
                  if (isFiltered && dayEntries.length === 0) return null;
                  if (dayEntries.length === 0) {
                    if (hideEmpty) return null;
                    return (
                      <TableRow key={`empty-${day}`} className="h-6 border-r-2 border-r-transparent hover:bg-muted/20 transition-colors">
                        <TableCell className="text-center px-3 py-0">
                          <DayCell month={month} day={day} muted />
                        </TableCell>
                        <TableCell colSpan={6} className="p-0" />
                      </TableRow>
                    );
                  }
                  return dayEntries.map((entry, idx) => (
                    <Fragment key={entry.id}>
                      <TableRow className={cn(
                        "group/row relative transition-all duration-150 border-r-2 cursor-pointer hover:bg-muted/40",
                        rowBorderClass(entry.status),
                      )}>
                        <TableCell className="text-center px-3 py-2.5">
                          {idx === 0
                            ? <DayCell month={month} day={day} />
                            : <DayCell month={month} day={day} muted />}
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <p className="text-sm font-medium text-foreground leading-snug" title={entry.idea}>
                            {entry.idea || <span className="text-muted-foreground italic text-xs">بدون فكرة</span>}
                          </p>
                        </TableCell>
                        {isVisible("status") && (
                          <TableCell className="px-3 py-2.5">
                            <Link
                              href={statusHref(slug, month, entry.id, entry.status)}
                              onClick={(e) => e.stopPropagation()}
                              className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-75", statusColor(entry.status))}>
                              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot(entry.status))} />
                              {entry.status}
                            </Link>
                          </TableCell>
                        )}
                        {isVisible("channels") && (
                          <TableCell className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              {entry.channels.map((ch) => (
                                <ChannelIcon
                                  key={ch}
                                  channel={ch}
                                  href={(entry.channelLinks as Record<string, string> | null)?.[ch]}
                                />
                              ))}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="px-2 py-2.5 text-center">
                          <CreativeCell entry={entry} />
                        </TableCell>
                        {isVisible("contentType") && (
                          <TableCell className="px-3 py-2.5">
                            {entry.contentType ? (
                              <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", typeColor(entry.contentType))}>
                                {TYPE_LABELS[entry.contentType] ?? entry.contentType}
                              </span>
                            ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                          </TableCell>
                        )}
                        {isVisible("customerStage") && (
                          <TableCell className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {entry.customerStage.map((f) => (
                                <span key={f} className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", customerStageColor(f))}>{CUSTOMER_STAGE_LABELS[f] ?? f}</span>
                              ))}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="w-0 p-0">
                          <div className="absolute left-0 inset-y-0 z-10 flex items-center gap-0.5 px-3 opacity-0 group-hover/row:opacity-100 group-hover/row:pointer-events-auto pointer-events-none transition-opacity duration-150 bg-card border-r border-border shadow-[-4px_0_8px_rgba(0,0,0,0.04)]">
                            <ActionsMenu entry={entry} slug={slug} month={month} onDelete={() => setDeleteTargetId(entry.id)} onReload={onReload} />
                          </div>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ));
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

    </div>{/* end scrollable area */}

      {/* Summary bar — fixed outside scroll */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <span className="text-xs font-semibold text-muted-foreground shrink-0">الإجمالي</span>
        <span className="text-sm font-bold text-foreground tabular-nums">{entries.length} منشور</span>
        <div className="h-4 w-px bg-border shrink-0" />
        {(["قيد الإنتاج", "جاهز للمراجعة", "جاهز للنشر", "تم النشر"] as const).map((s) => {
          const count = statusCounts[s] ?? 0;
          if (count === 0) return null;
          const cls =
            s === "تم النشر"      ? "bg-green-50 text-green-700 border-green-200" :
            s === "جاهز للنشر"    ? "bg-blue-50  text-blue-700  border-blue-200"  :
            s === "جاهز للمراجعة" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                     "bg-zinc-100 text-zinc-600  border-zinc-200";
          return (
            <div key={s} className="flex items-center gap-2">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums", cls)}>{count}</span>
              <span className="text-xs text-muted-foreground">{s}</span>
            </div>
          );
        })}
        {entries.length > 0 && (
          <>
            <div className="h-4 w-px bg-border shrink-0 mr-auto" />
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="بحث..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-8 w-full text-xs pr-8 pl-7"
              />
              {searchQ && (
                <button type="button" onClick={() => setSearchQ("")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Hide empty checkbox */}
            <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideEmpty}
                onChange={(e) => setHideEmpty(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
              />
              <span className="text-[11px] font-medium text-muted-foreground">{hideEmpty ? "عرض الكل" : "إخفاء الفارغة"}</span>
            </label>
          </>
        )}
      </div>

      {/* Delete Confirm */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الأرشفة</AlertDialogTitle>
            <AlertDialogDescription>
              سيُخفى هذا المحتوى من الجدول ويُحفظ في الأرشيف. يمكنك استرجاعه في أي وقت.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">إلغاء</AlertDialogCancel>
            <AlertDialogAction type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTargetId) void onDelete(deleteTargetId); setDeleteTargetId(null); }}>
              أرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
