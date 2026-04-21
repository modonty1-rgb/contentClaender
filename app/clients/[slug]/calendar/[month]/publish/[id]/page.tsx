import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getEntryById } from "@/app/actions/entries";
import { getClientBySlug } from "@/app/actions/clients";
import { MONTHS } from "@/lib/constants";
import type { MonthValue } from "@/lib/constants";
import { PublishForm } from "./PublishForm";

type Props = { params: Promise<{ slug: string; month: string; id: string }> };

export default async function PublishPage({ params }: Props) {
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
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link
            href={`/clients/${slug}/calendar/${month}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors -mx-2"
          >
            <ArrowRight className="h-4 w-4" />
            {monthMeta.label}
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold shrink-0">
              نشر
            </span>
            <h1 className="text-sm font-semibold text-foreground truncate">
              يوم {entry.day} — {entry.idea || "بدون فكرة"}
            </h1>
          </div>
          <span className="mr-auto text-xs text-muted-foreground font-mono opacity-60 shrink-0">{client.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4 pt-6">
        <PublishForm
          entry={entry}
          slug={slug}
          month={month as MonthValue}
        />
      </main>
    </div>
  );
}
