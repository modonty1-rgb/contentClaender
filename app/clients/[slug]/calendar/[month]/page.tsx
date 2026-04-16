import { notFound } from "next/navigation";
import { MonthTabs } from "@/app/components/MonthTabs";
import { CalendarPageClient } from "./CalendarPageClient";
import {
  getEntriesByMonth,
  getMonthStats,
  getAllMonthCounts,
} from "@/app/actions/entries";
import { getClientBySlug } from "@/app/actions/clients";
import { MONTHS } from "@/lib/constants";
import type { MonthValue } from "@/lib/constants";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = { params: Promise<{ slug: string; month: string }> };

export default async function ClientCalendarPage({ params }: Props) {
  const { slug, month } = await params;

  const [client, monthMeta] = await Promise.all([
    getClientBySlug(slug),
    Promise.resolve(MONTHS.find((m) => m.value === month)),
  ]);

  if (!client) notFound();
  if (!monthMeta) notFound();

  const [entries, stats, monthCounts] = await Promise.all([
    getEntriesByMonth(month, client.id),
    getMonthStats(month, client.id),
    getAllMonthCounts(client.id),
  ]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-screen-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Back to dashboard */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1.5 transition-colors -m-1.5"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
            {/* Client color dot */}
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: client.color }}
            />
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">
                {client.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Content Calendar</p>
            </div>
          </div>
          <div className="flex gap-2">
            <StatBadge label="الإجمالي" value={stats.total} color="text-foreground" bg="bg-muted/40" />
            <StatBadge label="منشور" value={stats.published} color="text-green-700" bg="bg-green-50 border-green-200" />
            <StatBadge label="معلق" value={stats.pending} color="text-orange-600" bg="bg-orange-50 border-orange-200" />
            <StatBadge label="مدفوع" value={stats.sponsored} color="text-blue-600" bg="bg-blue-50 border-blue-200" />
          </div>
        </div>
      </header>

      {/* Month Tabs */}
      <MonthTabs slug={slug} counts={monthCounts} />

      {/* Content */}
      <main className="mx-auto max-w-screen-2xl p-4">
        <CalendarPageClient
          slug={slug}
          clientId={client.id}
          month={month as MonthValue}
          monthLabel={monthMeta.label}
          initialEntries={entries}
        />
      </main>
    </div>
  );
}

function StatBadge({
  label, value, color = "text-foreground", bg = "bg-muted/30",
}: { label: string; value: number; color?: string; bg?: string }) {
  return (
    <div className={`rounded-lg border border-border px-4 py-2 min-w-16 text-center ${bg}`}>
      <p className={`text-2xl font-bold leading-none tabular-nums ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
