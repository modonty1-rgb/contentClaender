"use client";

import type { ReactElement } from "react";
import { Fragment, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, Share2, Eye, Pencil, Trash2 } from "lucide-react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/app/components/ui/sonner";
import { STATUS_OPTIONS, TYPE_OPTIONS, TYPE_LABELS, CUSTOMER_STAGE_LABELS } from "@/lib/constants";
import type { EntryListItem } from "@/app/actions/entries";
import type { MonthValue } from "@/lib/constants";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  if (status === "تم النشر")       return "bg-green-100 text-green-800 border-green-200";
  if (status === "جاهز للنشر")     return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "جاهز للمراجعة")  return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "قيد الإنتاج")    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  return "bg-muted text-muted-foreground border-border";
}

function typeColor(t: string): string {
  if (t === "vid")      return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300";
  if (t === "carousel") return "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300";
  if (t === "post")     return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
  if (t === "story")    return "bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300";
  if (t === "reel")     return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300";
  return "bg-muted text-muted-foreground";
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({ entry }: { entry: EntryListItem }): ReactElement {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="عرض التفاصيل">
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>يوم {entry.day} — {entry.idea || "بدون فكرة"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <Row label="الفكرة" value={entry.idea} />
          <Row label="مرحلة العميل" value={entry.customerStage.join(", ")} />
          <Row label="نوع المحتوى" value={entry.contentType} />
          <Row label="الحالة" value={entry.status} />
          <Row label="القنوات" value={entry.channels.join(", ")} />
          {entry.text ? <Row label="النص" value={entry.text} multiline /> : null}
          {entry.hook ? <Row label="الخطاف" value={entry.hook} /> : null}
          {entry.cta ? <Row label="الدعوة" value={entry.cta} /> : null}
          {entry.script ? <Row label="السكريبت" value={entry.script} link={entry.script.startsWith("http") ? entry.script : undefined} /> : null}
          {entry.voiceTone ? <Row label="نبرة الصوت" value={entry.voiceTone} /> : null}
          {entry.inspiration ? <Row label="الإلهام" value={entry.inspiration} /> : null}
          {entry.assetLink ? <Row label="رابط الملف" value={entry.assetLink} link={entry.assetLink} /> : null}
          {entry.scheduledDate ? <Row label="موعد النشر" value={new Date(entry.scheduledDate).toLocaleDateString("ar-SA")} /> : null}
          {entry.notes ? <Row label="ملحوظات" value={entry.notes} multiline /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, multiline, link }: { label: string; value: string; multiline?: boolean; link?: string }): ReactElement {
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

// ─── Share Button ─────────────────────────────────────────────────────────────

function ShareEntryButton({ entryId }: { entryId: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/view/entry/${entryId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("تم نسخ رابط المنشور");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذّر النسخ");
    }
  }, [entryId]);

  return (
    <Button type="button" size="sm" variant="ghost" onClick={handleShare}
      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="نسخ رابط المشاركة">
      {copied ? <span className="text-[10px] font-bold text-green-600">✓</span> : <Share2 className="h-3.5 w-3.5" />}
    </Button>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export type CalendarTableProps = {
  entries: EntryListItem[];
  month: MonthValue;
  monthLabel: string;
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
};

export function CalendarTable({ entries, month, loading, onDelete }: CalendarTableProps): ReactElement {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus]     = useState<string>("الكل");
  const [filterType, setFilterType]         = useState<string>("الكل");
  const [searchQ, setSearchQ]               = useState("");

  const filtered = useMemo(() => {
    let list = entries;
    if (filterStatus !== "الكل") list = list.filter((e) => e.status === filterStatus);
    if (filterType !== "الكل")   list = list.filter((e) => e.contentType === filterType);
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      list = list.filter((e) => e.idea.toLowerCase().includes(q) || e.text?.toLowerCase().includes(q));
    }
    return list;
  }, [entries, filterStatus, filterType, searchQ]);

  const groupedByDay = useMemo(() => {
    const map = new Map<number, EntryListItem[]>();
    for (const entry of filtered) {
      const arr = map.get(entry.day) ?? [];
      arr.push(entry);
      map.set(entry.day, arr);
    }
    return map;
  }, [filtered]);

  const sortedDays = useMemo(() => [...groupedByDay.keys()].sort((a, b) => a - b), [groupedByDay]);

  const STATUS_FILTERS = ["الكل", ...STATUS_OPTIONS];
  const TYPE_FILTERS   = ["الكل", ...TYPE_OPTIONS];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input placeholder="ابحث..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
          className="h-9 w-full sm:w-64 text-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((s) => (
              <button key={s} type="button" onClick={() => setFilterStatus(s)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  filterStatus === s ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground")}>
                {s}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-border hidden sm:block" />
          <div className="flex flex-wrap gap-1">
            {TYPE_FILTERS.map((t) => (
              <button key={t} type="button" onClick={() => setFilterType(t)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  filterType === t ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground")}>
                {t}
              </button>
            ))}
          </div>
          <Link href={`/calendar/${month}/new`}>
            <Button size="sm" className="gap-1.5 font-semibold h-8 px-4">
              <span aria-hidden className="text-base leading-none">+</span>
              منشور جديد
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        {loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">جاري التحميل...</p>
        ) : sortedDays.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl mb-2" aria-hidden>📅</p>
            <p className="text-sm font-medium text-foreground">لا يوجد محتوى</p>
            <p className="mt-1 text-xs text-muted-foreground">أضف محتوى جديد أو غيّر الفلتر</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center p-2">اليوم</TableHead>
                <TableHead className="min-w-[160px] p-2">الفكرة</TableHead>
                <TableHead className="p-2">مرحلة العميل</TableHead>
                <TableHead className="p-2">النوع</TableHead>
                <TableHead className="p-2">القنوات</TableHead>
                <TableHead className="p-2">الحالة</TableHead>
                <TableHead className="w-36 p-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDays.map((day) => {
                const dayEntries = groupedByDay.get(day) ?? [];
                return dayEntries.map((entry, idx) => (
                  <Fragment key={entry.id}>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center p-2 font-bold text-primary">
                        {idx === 0 ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mx-auto text-sm">
                            {day}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="p-2 max-w-[200px]">
                        <p className="truncate text-sm font-medium text-foreground" title={entry.idea}>
                          {entry.idea || <span className="text-muted-foreground italic text-xs">بدون فكرة</span>}
                        </p>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {entry.customerStage.map((s) => (
                            <span key={s} className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-600">
                              {CUSTOMER_STAGE_LABELS[s] ?? s}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        {entry.contentType ? (
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", typeColor(entry.contentType))}>
                            {TYPE_LABELS[entry.contentType] ?? entry.contentType}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {entry.channels.slice(0, 3).map((ch) => (
                            <span key={ch} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              {ch}
                            </span>
                          ))}
                          {entry.channels.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{entry.channels.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", statusColor(entry.status))}>
                          {entry.status}
                        </span>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex items-center gap-0.5">
                          <ShareEntryButton entryId={entry.id} />
                          <ViewModal entry={entry} />
                          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
                            <Link href={`/calendar/${month}/edit/${entry.id}`}>
                              <Pencil className="h-3 w-3" />
                              تعديل
                            </Link>
                          </Button>
                          <div className="w-px h-4 bg-border mx-0.5 shrink-0" />
                          <Button type="button" size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTargetId(entry.id)} title="حذف">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ));
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المحتوى؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
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
