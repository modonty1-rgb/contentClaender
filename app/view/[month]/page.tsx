import { notFound } from "next/navigation";
import Link from "next/link";
import { getEntriesByMonth, getMonthStats, getAllMonthCounts } from "@/app/actions/entries";
import { MONTHS } from "@/lib/constants";
import type { MonthValue } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ViewTable } from "./ViewTable";

type Props = { params: Promise<{ month: string }> };

export function generateStaticParams() {
  return MONTHS.map((m) => ({ month: m.value }));
}

export default async function ViewMonthPage({ params }: Props) {
  const { month } = await params;

  const monthMeta = MONTHS.find((m) => m.value === month);
  if (!monthMeta) notFound();

  const [entries, stats, monthCounts] = await Promise.all([
    getEntriesByMonth(month),
    getMonthStats(month),
    getAllMonthCounts(),
  ]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-screen-2xl flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">JBR Content Calendar</h1>
            <p className="text-xs text-muted-foreground">محتوى {monthMeta.label}</p>
          </div>

          {/* Read-only badge */}
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
            عرض فقط 👁
          </span>

          {/* Stats */}
          <div className="flex gap-3 text-center">
            <StatBadge label="إجمالي"  value={stats.total}     />
            <StatBadge label="منشور"   value={stats.published} color="text-green-600" />
            <StatBadge label="معلق"    value={stats.pending}   color="text-yellow-600" />
            <StatBadge label="سبونسر"  value={stats.sponsored} color="text-blue-600" />
          </div>
        </div>
      </header>

      {/* Month Tabs */}
      <div className="overflow-x-auto border-b border-border bg-card">
        <div className="flex min-w-max gap-1 px-4 py-2">
          {MONTHS.map((m) => {
            const count = monthCounts[m.value] ?? 0;
            const isActive = m.value === month;
            return (
              <Link
                key={m.value}
                href={`/view/${m.value}`}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {m.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -left-1 min-w-4.5 h-4.5 rounded-full px-1 text-[10px] font-bold leading-4.5 text-center",
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <main className="mx-auto max-w-screen-2xl p-4">
        <ViewTable entries={entries} />
      </main>
    </div>
  );
}

function StatBadge({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 min-w-[56px]">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
    </div>
  );
}
