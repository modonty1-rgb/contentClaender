"use client";

import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/app/components/ui/sonner";
import { unarchiveEntry } from "@/app/actions/entries";
import { TYPE_LABELS, CUSTOMER_STAGE_LABELS, MONTHS } from "@/lib/constants";
import type { EntryListItem } from "@/app/actions/entries";

function statusColor(status: string): string {
  if (status === "تم النشر")       return "bg-green-50 text-green-700 border-green-200";
  if (status === "جاهز للنشر")     return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "جاهز للمراجعة")  return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-zinc-100 text-zinc-600 border-zinc-200";
}

function monthLabel(value: string): string {
  return MONTHS.find((m) => m.value === value)?.label ?? value;
}

export function ArchiveClient({ entries: initial, slug }: { entries: EntryListItem[]; slug: string }): ReactElement {
  const [entries, setEntries] = useState(initial);
  const [, startTransition] = useTransition();

  function handleUnarchive(id: string) {
    startTransition(async () => {
      const result = await unarchiveEntry(id);
      if (result.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        toast.success("تم الاسترجاع — المنشور عاد للجدول");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <RotateCcw className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">لا يوجد محتوى مؤرشف</p>
        <p className="text-xs text-muted-foreground/60">المحتوى المؤرشف سيظهر هنا ويمكنك استرجاعه في أي وقت</p>
      </div>
    );
  }

  // Group by month
  const grouped = entries.reduce<Record<string, EntryListItem[]>>((acc, e) => {
    const arr = acc[e.month] ?? [];
    arr.push(e);
    acc[e.month] = arr;
    return acc;
  }, {});

  return (
    <div className="p-5 space-y-6">
      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-3 px-1">
            {monthLabel(month)}
          </h3>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {items.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-4 py-3 bg-card hover:bg-muted/30 transition-colors">

                {/* Day */}
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0 tabular-nums">
                  {entry.day}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.idea || <span className="text-muted-foreground italic text-xs">بدون فكرة</span>}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.contentType && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-600">
                        {TYPE_LABELS[entry.contentType] ?? entry.contentType}
                      </span>
                    )}
                    {entry.customerStage.map((s) => (
                      <span key={s} className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-600">
                        {CUSTOMER_STAGE_LABELS[s] ?? s}
                      </span>
                    ))}
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusColor(entry.status))}>
                      {entry.status}
                    </span>
                  </div>
                </div>

                {/* Unarchive */}
                <button
                  type="button"
                  onClick={() => handleUnarchive(entry.id)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted hover:border-foreground/30 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  استرجاع
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
