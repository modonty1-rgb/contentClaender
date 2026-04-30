import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getEntryById, getEntriesByMonth } from "@/app/actions/entries";
import { getClientBySlug } from "@/app/actions/clients";
import { MONTHS } from "@/lib/constants";
import type { MonthValue } from "@/lib/constants";
import { EntryPageForm } from "../../EntryPageForm";
import type { EntryPageFormData } from "../../EntryPageForm";

type Props = { params: Promise<{ slug: string; month: string; id: string }> };

export default async function EditEntryPage({ params }: Props) {
  const { slug, month, id } = await params;

  const [client, monthMeta, entry] = await Promise.all([
    getClientBySlug(slug),
    Promise.resolve(MONTHS.find((m) => m.value === month)),
    getEntryById(id),
  ]);

  if (!client) notFound();
  if (!monthMeta) notFound();
  if (!entry) notFound();

  const entries = await getEntriesByMonth(month, client.id);
  const entryDays = [...new Set(entries.map((e) => e.day))];

  const defaultValues: EntryPageFormData = {
    month:         month as MonthValue,
    day:           entry.day,
    idea:          entry.idea ?? "",
    customerStage: entry.customerStage ?? [],
    contentType:   entry.contentType ?? "",
    channels:      entry.channels ?? [],
    text:          entry.text ?? "",
    hook:          entry.hook ?? "",
    cta:           entry.cta ?? "",
    script:        entry.script ?? "",
    voiceTone:     entry.voiceTone ?? "",
    inspiration:   entry.inspiration ?? "",
    notes:         entry.notes ?? "",
  };

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl flex items-center gap-3">
          <Link
            href={`/clients/${slug}/calendar/${month}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors -mx-2"
          >
            <ArrowRight className="h-4 w-4" />
            {monthMeta.label}
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-sm font-semibold text-foreground truncate">
            تعديل — يوم {entry.day} — {entry.idea || "بدون فكرة"}
          </h1>
          <span className="mr-auto text-xs text-muted-foreground font-mono opacity-60">{client.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 pt-6">
        <EntryPageForm
          mode="edit"
          entryId={id}
          slug={slug}
          clientId={client.id}
          month={month as MonthValue}
          monthLabel={monthMeta.label}
          defaultValues={defaultValues}
          entryDays={entryDays}
        />
      </main>
    </div>
  );
}
