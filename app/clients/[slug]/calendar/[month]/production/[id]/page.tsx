import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getEntryById } from "@/app/actions/entries";
import { getClientBySlug } from "@/app/actions/clients";
import { MONTHS } from "@/lib/constants";
import type { MonthValue } from "@/lib/constants";
import { ProductionForm } from "./ProductionForm";
import { ModeToggle } from "@/app/components/mode-toggle";

type Props = { params: Promise<{ slug: string; month: string; id: string }> };

export default async function ProductionPage({ params }: Props) {
  const { slug, month, id } = await params;

  const [client, monthMeta, entry] = await Promise.all([
    getClientBySlug(slug),
    Promise.resolve(MONTHS.find((m) => m.value === month)),
    getEntryById(id),
  ]);

  if (!client) notFound();
  if (!monthMeta) notFound();
  if (!entry) notFound();

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <Link
            href={`/clients/${slug}/calendar/${month}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors -mx-2"
          >
            <ArrowRight className="h-4 w-4" />
            {monthMeta.label}
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold shrink-0">
              إنتاج
            </span>
            <h1 className="text-sm font-semibold text-foreground truncate">
              يوم {entry.day} — {entry.idea || "بدون فكرة"}
            </h1>
          </div>
          <Link href="/flow" className="mr-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
            <Sparkles className="h-3 w-3" />
            سير العمل
          </Link>
          <span className="text-xs text-muted-foreground font-mono opacity-60 shrink-0">{client.name}</span>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 pt-6">
        <ProductionForm
          entry={entry}
          slug={slug}
          month={month as MonthValue}
        />
      </main>
    </div>
  );
}
