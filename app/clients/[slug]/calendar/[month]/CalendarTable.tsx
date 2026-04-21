"use client";

import type { ReactElement } from "react";
import { Fragment, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, Share2, Eye, Pencil, Trash2, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Columns, Search, X, Clapperboard, Send, CheckCircle2, PlayCircle, Lock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "@/app/components/ui/sonner";
import { STATUS_OPTIONS, TYPE_OPTIONS, TYPE_LABELS, DAYS_IN_MONTH } from "@/lib/constants";
import type { EntryListItem } from "@/app/actions/entries";
import { ChannelIcon } from "@/app/components/ui/channel-icon";
import type { MonthValue } from "@/lib/constants";

// ─── Drive preview helper ─────────────────────────────────────────────────────

function getDriveEmbedUrl(url: string): string | null {
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
}

// ─── Creative Cell ────────────────────────────────────────────────────────────

function CreativeCell({ entry }: { entry: EntryListItem }): ReactElement {
  const [open, setOpen] = useState(false);
  const embedUrl = entry.assetLink ? getDriveEmbedUrl(entry.assetLink) : null;

  if (!embedUrl || entry.status === "قيد الإنتاج") {
    return (
      <div className="flex items-center justify-center">
        <span
          className="text-muted-foreground/25"
          title={entry.status === "قيد الإنتاج" ? "الكريتيف قيد الإنتاج" : "لا يوجد كريتيف"}>
          <Lock className="h-3.5 w-3.5" />
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          className="text-primary/60 hover:text-primary transition-colors"
          title="معاينة الكريتيف">
          <PlayCircle className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden gap-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
            <DialogTitle className="text-sm font-semibold" dir="rtl">
              {entry.idea || `يوم ${entry.day}`}
            </DialogTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-sm p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="إغلاق">
              <X className="h-4 w-4" />
            </button>
          </div>
          <iframe
            src={embedUrl}
            className="w-full"
            style={{ height: "70vh", border: "none" }}
            allow="autoplay"
          />
          <div className="px-4 py-2 border-t border-border flex justify-end">
            <a href={entry.assetLink!} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              فتح في Drive
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
  return "bg-violet-50 text-violet-600";
}

function typeColor(_t: string): string {
  return "bg-zinc-100 text-zinc-600";
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
  entry, slug, month, onDelete,
}: {
  entry: EntryListItem;
  slug: string;
  month: MonthValue;
  onDelete: () => void;
}): ReactElement {
  const [viewOpen,    setViewOpen]    = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/view/entry/${entry.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط المنشور");
    } catch {
      toast.error("تعذّر النسخ");
    }
  }, [entry.id]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setViewOpen(true)}>
            <Eye className="h-3.5 w-3.5" />
            عرض التفاصيل
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/clients/${slug}/calendar/${month}/edit/${entry.id}`}>
              <Pencil className="h-3.5 w-3.5" />
              تعديل
            </Link>
          </DropdownMenuItem>
          {entry.status === "جاهز للمراجعة" && (
            <DropdownMenuItem asChild>
              <Link href={`/clients/${slug}/calendar/${month}/production/${entry.id}`}
                className="text-amber-600 focus:text-amber-700 focus:bg-amber-50">
                <CheckCircle2 className="h-3.5 w-3.5" />
                مراجعة والموافقة
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={`/clients/${slug}/calendar/${month}/production/${entry.id}`}>
              <Clapperboard className="h-3.5 w-3.5" />
              صفحة الإنتاج
            </Link>
          </DropdownMenuItem>
          {entry.status === "جاهز للنشر" || entry.status === "تم النشر" ? (
            <DropdownMenuItem asChild>
              <Link href={`/clients/${slug}/calendar/${month}/publish/${entry.id}`}>
                <Send className="h-3.5 w-3.5" />
                صفحة النشر
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled className="opacity-40 cursor-not-allowed">
              <Send className="h-3.5 w-3.5" />
              <span>صفحة النشر</span>
              <span className="mr-auto text-[10px] font-normal">
                {entry.status === "قيد الإنتاج" ? "لسه قيد الإنتاج" : "بانتظار موافقة الكاتب"}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
            نسخ رابط المشاركة
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>يوم {entry.day} — {entry.idea || "بدون فكرة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <Row label="الفكرة" value={entry.idea} />
            <Row label="مرحلة العميل" value={entry.customerStage.join(", ")} />
            <Row label="نوع المحتوى" value={entry.contentType} />
            <Row label="الحالة" value={entry.status} />
            <Row label="القنوات" value={entry.channels.join(", ")} />
            {entry.text        ? <Row label="النص"       value={entry.text}       multiline /> : null}
            {entry.hook        ? <Row label="الخطاف"     value={entry.hook} /> : null}
            {entry.cta         ? <Row label="الدعوة"     value={entry.cta} /> : null}
            {entry.script      ? <Row label="السكريبت"   value={entry.script} link={entry.script.startsWith("http") ? entry.script : undefined} /> : null}
            {entry.voiceTone   ? <Row label="نبرة الصوت" value={entry.voiceTone} /> : null}
            {entry.inspiration ? <Row label="الإلهام"    value={entry.inspiration} /> : null}
            {entry.assetLink   ? <Row label="رابط الملف" value={entry.assetLink} link={entry.assetLink} /> : null}
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

      {/* ── Creative Preview ── */}
      {entry.assetLink && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-3xl p-0 overflow-hidden gap-0">
            <DialogHeader className="px-4 py-3 border-b border-border">
              <DialogTitle className="text-sm font-semibold" dir="rtl">
                {entry.idea || `يوم ${entry.day}`}
              </DialogTitle>
            </DialogHeader>
            {getDriveEmbedUrl(entry.assetLink) ? (
              <iframe
                src={getDriveEmbedUrl(entry.assetLink)!}
                className="w-full"
                style={{ height: "70vh", border: "none" }}
                allow="autoplay"
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                لا يمكن معاينة هذا النوع من الملفات
              </div>
            )}
            <div className="px-4 py-2 border-t border-border flex justify-end">
              <a href={entry.assetLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                فتح في Drive
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
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
  entries, slug, month, loading, onDelete,
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
    { id: "customerStage", label: "مرحلة العميل" },
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
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="border-b border-gray-300" style={{ backgroundColor: '#e2e8f0' }}>
                <TableHead className="w-24 text-center px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">اليوم</TableHead>
                <TableHead className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  <button type="button" onClick={() => toggleSort("idea")}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                    الفكرة
                    {sortCol === "idea" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                  </button>
                </TableHead>
                {isVisible("contentType") && (
                  <TableHead className="w-24 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    <button type="button" onClick={() => toggleSort("contentType")}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                      النوع
                      {sortCol === "contentType" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                    </button>
                  </TableHead>
                )}
                {isVisible("customerStage") && (
                  <TableHead className="w-36 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    <button type="button" onClick={() => toggleSort("customerStage")}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                      مرحلة العميل
                      {sortCol === "customerStage" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                    </button>
                  </TableHead>
                )}
                {isVisible("channels") && (
                  <TableHead className="w-28 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">القنوات</TableHead>
                )}
                {isVisible("status") && (
                  <TableHead className="w-40 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    <button type="button" onClick={() => toggleSort("status")}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                      الحالة
                      {sortCol === "status" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                    </button>
                  </TableHead>
                )}
                <TableHead className="w-12 text-center px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">كريتيف</TableHead>
                <TableHead className="w-10 px-2 py-2.5" />
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
                      "group transition-all duration-150 border-r-2 cursor-pointer hover:bg-muted/40",
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
                              <span key={f} className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", customerStageColor(f))}>{f}</span>
                            ))}
                          </div>
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
                      {isVisible("status") && (
                        <TableCell className="px-3 py-2.5">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", statusColor(entry.status))}>
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot(entry.status))} />
                            {entry.status}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="px-2 py-2.5 text-center">
                        <CreativeCell entry={entry} />
                      </TableCell>
                      <TableCell className="px-2 py-2.5">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <ActionsMenu entry={entry} slug={slug} month={month} onDelete={() => setDeleteTargetId(entry.id)} />
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
                        "group transition-all duration-150 border-r-2 cursor-pointer hover:bg-muted/40",
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
                                <span key={f} className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold", customerStageColor(f))}>{f}</span>
                              ))}
                            </div>
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
                        {isVisible("status") && (
                          <TableCell className="px-3 py-2.5">
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", statusColor(entry.status))}>
                              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot(entry.status))} />
                              {entry.status}
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="px-2 py-2.5 text-center">
                          <CreativeCell entry={entry} />
                        </TableCell>
                        <TableCell className="px-2 py-2.5">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <ActionsMenu entry={entry} slug={slug} month={month} onDelete={() => setDeleteTargetId(entry.id)} />
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
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المحتوى؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">إلغاء</AlertDialogCancel>
            <AlertDialogAction type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTargetId) void onDelete(deleteTargetId); setDeleteTargetId(null); }}>
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
