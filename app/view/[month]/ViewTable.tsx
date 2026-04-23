"use client";

import type { ReactElement } from "react";
import { Fragment, useState, useMemo } from "react";
import { ExternalLink, Eye } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS, TYPE_OPTIONS, TYPE_LABELS, CUSTOMER_STAGE_LABELS } from "@/lib/constants";
import type { EntryListItem } from "@/app/actions/entries";

// ─── Color helpers ────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === "تم النشر")       return "bg-green-100 text-green-800 border-green-200";
  if (s === "جاهز للنشر")     return "bg-blue-100 text-blue-800 border-blue-200";
  if (s === "جاهز للمراجعة")  return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "قيد الإنتاج")    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  return "bg-muted text-muted-foreground border-border";
}

function customerStageColor(f: string) {
  if (f === "awareness")  return "bg-purple-100 text-purple-700";
  if (f === "engagement") return "bg-orange-100 text-orange-700";
  if (f === "leads")      return "bg-blue-100 text-blue-700";
  if (f === "conversion") return "bg-green-100 text-green-700";
  return "bg-muted text-muted-foreground";
}

function typeColor(t: string) {
  if (t === "vid")      return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300";
  if (t === "carousel") return "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300";
  if (t === "post")     return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
  if (t === "story")    return "bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300";
  if (t === "reel")     return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300";
  return "bg-muted text-muted-foreground";
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
  label, value, multiline, link,
}: {
  label: string; value?: string | null; multiline?: boolean; link?: string;
}): ReactElement {
  if (!value) return <></>;
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 border-b border-border/40 pb-2 last:border-0">
      <span className="text-xs font-semibold text-muted-foreground pt-0.5">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="text-primary underline text-xs inline-flex items-center gap-1 break-all">
          {value.length > 60 ? value.slice(0, 60) + "…" : value}
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

// ─── Full-detail modal ────────────────────────────────────────────────────────

function EntryModal({ entry }: { entry: EntryListItem }): ReactElement {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
          title="عرض التفاصيل">
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            يوم {entry.day} — {entry.idea || "بدون فكرة"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-2 text-sm">
          <DetailRow label="الفكرة"       value={entry.idea} />
          <DetailRow label="مرحلة العميل" value={entry.customerStage.join("، ")} />
          <DetailRow label="نوع المحتوى"  value={entry.contentType} />
          <DetailRow label="الحالة"        value={entry.status} />
          <DetailRow label="القنوات"       value={entry.channels.join("، ")} />
          <DetailRow label="النص"          value={entry.text}        multiline />
          <DetailRow label="الخطاف"        value={entry.hook} />
          <DetailRow label="الدعوة"        value={entry.cta} />
          <DetailRow label="السكريبت"      value={entry.script}
            link={entry.script?.startsWith("http") ? entry.script : undefined} />
          <DetailRow label="نبرة الصوت"   value={entry.voiceTone} />
          <DetailRow label="الإلهام"       value={entry.inspiration} />
          <DetailRow label="رابط الملف"   value={entry.assetLink}
            link={entry.assetLink?.startsWith("http") ? entry.assetLink : undefined} />
          {entry.scheduledDate ? (
            <DetailRow label="موعد النشر"
              value={new Date(entry.scheduledDate).toLocaleDateString("ar-SA")} />
          ) : null}
          <DetailRow label="وقت النشر"    value={entry.scheduledTime} />
          <DetailRow label="ملحوظات"       value={entry.notes} multiline />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main read-only table ─────────────────────────────────────────────────────

type Props = { entries: EntryListItem[] };

export function ViewTable({ entries }: Props): ReactElement {
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterType,   setFilterType]   = useState("الكل");
  const [searchQ,      setSearchQ]      = useState("");

  const filtered = useMemo(() => {
    let list = entries;
    if (filterStatus !== "الكل") list = list.filter((e) => e.status === filterStatus);
    if (filterType   !== "الكل") list = list.filter((e) => e.contentType === filterType);
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      list = list.filter(
        (e) => e.idea.toLowerCase().includes(q) || e.text?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [entries, filterStatus, filterType, searchQ]);

  const groupedByDay = useMemo(() => {
    const map = new Map<number, EntryListItem[]>();
    for (const e of filtered) {
      const arr = map.get(e.day) ?? [];
      arr.push(e);
      map.set(e.day, arr);
    }
    return map;
  }, [filtered]);

  const sortedDays = useMemo(
    () => [...groupedByDay.keys()].sort((a, b) => a - b),
    [groupedByDay],
  );

  const STATUS_FILTERS = ["الكل", ...STATUS_OPTIONS];
  const TYPE_FILTERS   = ["الكل", ...TYPE_OPTIONS];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="بحث في الأفكار..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="h-8 w-56 text-sm"
        />
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button key={s} type="button" onClick={() => setFilterStatus(s)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
                filterStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
              )}>
              {s}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex flex-wrap gap-1">
          {TYPE_FILTERS.map((t) => (
            <button key={t} type="button" onClick={() => setFilterType(t)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
                filterType === t
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
              )}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        {sortedDays.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl mb-2" aria-hidden>📅</p>
            <p className="text-sm font-medium text-foreground">لا يوجد محتوى</p>
            <p className="mt-1 text-xs text-muted-foreground">غيّر الفلتر للعرض</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center p-2">اليوم</TableHead>
                <TableHead className="min-w-[180px] p-2">الفكرة</TableHead>
                <TableHead className="p-2">مرحلة العميل</TableHead>
                <TableHead className="p-2">النوع</TableHead>
                <TableHead className="p-2">القنوات</TableHead>
                <TableHead className="p-2">الحالة</TableHead>
                <TableHead className="w-16 p-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDays.map((day) =>
                (groupedByDay.get(day) ?? []).map((entry, idx) => (
                  <Fragment key={entry.id}>
                    <TableRow className={cn(
                      "hover:bg-muted/30 transition-colors",
                      entry.status === "تم النشر"   && "bg-green-50/50",
                      entry.status === "قيد الإنتاج" && "bg-zinc-50/30",
                    )}>
                      <TableCell className="text-center p-2 font-bold text-primary">
                        {idx === 0 ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mx-auto text-sm">
                            {day}
                          </div>
                        ) : null}
                      </TableCell>

                      <TableCell className="p-2 max-w-[220px]">
                        <p className="truncate text-sm font-medium" title={entry.idea}>
                          {entry.idea || <span className="text-muted-foreground italic text-xs">بدون فكرة</span>}
                        </p>
                      </TableCell>

                      <TableCell className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {entry.customerStage.map((f) => (
                            <span key={f} className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", customerStageColor(f))}>
                              {CUSTOMER_STAGE_LABELS[f] ?? f}
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
                        <EntryModal entry={entry} />
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
