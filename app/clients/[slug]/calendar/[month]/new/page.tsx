import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MONTHS } from "@/lib/constants";
import type { MonthValue } from "@/lib/constants";
import { getClientBySlug } from "@/app/actions/clients";
import { EntryPageForm } from "../EntryPageForm";
import type { EntryPageFormData } from "../EntryPageForm";

type Props = { params: Promise<{ slug: string; month: string }> };

export default async function NewEntryPage({ params }: Props) {
  const { slug, month } = await params;

  const [client, monthMeta] = await Promise.all([
    getClientBySlug(slug),
    Promise.resolve(MONTHS.find((m) => m.value === month)),
  ]);

  if (!client) notFound();
  if (!monthMeta) notFound();

  const defaultValues: EntryPageFormData = {
    day: 1, idea: "", funnel: [], typeOfContent: "", orgPaid: "organic",
    publishing: "لم يتم النشر", channels: [], captionSA: "", captionEG: "",
    script: "", tov: "", reference: "", postVidLinks: "", reelLink: "",
    publishingDate: "", publishingTime: "", code: "", notes: "",
    reviewed: "", readyToPublish: "", contentLink: "", storyboard: "",
    material: "", size: "",
  };

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Link
            href={`/clients/${slug}/calendar/${month}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors -mx-2"
          >
            <ArrowRight className="h-4 w-4" />
            {monthMeta.label}
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-sm font-semibold text-foreground">إضافة محتوى جديد</h1>
          <span className="mr-auto text-xs text-muted-foreground font-mono opacity-60">{client.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 pt-6">
        <EntryPageForm
          mode="create"
          slug={slug}
          clientId={client.id}
          month={month as MonthValue}
          monthLabel={monthMeta.label}
          defaultValues={defaultValues}
        />
      </main>
    </div>
  );
}
