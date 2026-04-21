import { notFound } from "next/navigation";
import { MonthSidebar } from "@/app/components/MonthSidebar";
import { CalendarPageClient } from "./CalendarPageClient";
import {
  getEntriesByMonth,
  getMonthStats,
  getAllMonthCounts,
  getAllStats,
} from "@/app/actions/entries";
import { getClientBySlug } from "@/app/actions/clients";
import { MONTHS } from "@/lib/constants";
import type { MonthValue } from "@/lib/constants";
import Link from "next/link";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";

type Props = { params: Promise<{ slug: string; month: string }> };

export default async function ClientCalendarPage({ params }: Props) {
  const { slug, month } = await params;

  const [client, monthMeta] = await Promise.all([
    getClientBySlug(slug),
    Promise.resolve(MONTHS.find((m) => m.value === month)),
  ]);

  if (!client) notFound();
  if (!monthMeta) notFound();

  const [entries, stats, totalStats, monthCounts] = await Promise.all([
    getEntriesByMonth(month, client.id),
    getMonthStats(month, client.id),
    getAllStats(client.id),
    getAllMonthCounts(client.id),
  ]);

  return (
    <div className="h-screen bg-background flex flex-col" dir="rtl">
      {/* Colored accent bar */}
      <div className="h-0.5 shrink-0" style={{ backgroundColor: client.color }} />

      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between px-5 h-14 gap-6">

          {/* Client identity */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-5 w-px bg-border shrink-0" />
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ backgroundColor: client.color }}
              >
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 leading-none">
                <h1 className="text-sm font-semibold text-foreground truncate">{client.name}</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">Content Calendar</p>
              </div>
            </div>
          </div>

          {/* Stats + CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Month stats */}
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-[11px]">
              <span className="font-semibold text-foreground">{monthMeta.labelEn}</span>
              <span className="h-3 w-px bg-border" />
              <StatChip value={stats.total} label="total" />
              <StatChip value={stats.published} label="published" color="text-green-600" />
              <StatChip value={stats.pending} label="pending" color="text-orange-500" />
              {stats.readyToPublish > 0 && <StatChip value={stats.readyToPublish} label="جاهز" color="text-blue-500" />}
            </div>

            <div className="h-6 w-px bg-border shrink-0" />

            {/* All months stats */}
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-[11px]">
              <span className="font-medium text-muted-foreground">All months</span>
              <span className="h-3 w-px bg-border" />
              <StatChip value={totalStats.total} label="total" />
              <StatChip value={totalStats.published} label="published" color="text-green-600" />
              <StatChip value={totalStats.pending} label="pending" color="text-orange-500" />
            </div>

            {/* Flow guide */}
            <Link
              href="/flow"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              الفلو
            </Link>

            {/* New task CTA */}
            <Link
              href={`/clients/${slug}/calendar/${month}/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              منشور جديد
            </Link>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Month Sidebar */}
        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4">
          <CalendarPageClient
            slug={slug}
            clientId={client.id}
            month={month as MonthValue}
            monthLabel={monthMeta.label}
            initialEntries={entries}
          />
        </main>

        {/* Month Sidebar — left side */}
        <MonthSidebar slug={slug} counts={monthCounts} />
      </div>
    </div>
  );
}

function StatChip({
  value, label, color = "text-foreground",
}: { value: number; label: string; color?: string }) {
  return (
    <span className="text-muted-foreground/80">
      <span className={`font-bold tabular-nums ${color}`}>{value}</span>{" "}
      {label}
    </span>
  );
}
