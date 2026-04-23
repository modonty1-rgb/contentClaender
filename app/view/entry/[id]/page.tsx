import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { getEntryById } from "@/app/actions/entries";
import { MONTHS, TYPE_LABELS, CUSTOMER_STAGE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function ViewEntryPage({ params }: Props) {
  const { id } = await params;
  const entry = await getEntryById(id);
  if (!entry) notFound();

  const monthMeta = MONTHS.find((m) => m.value === entry.month);

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors -mx-2 shrink-0"
          >
            <ArrowRight className="h-4 w-4" />
            الرئيسية
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-sm font-semibold text-foreground truncate min-w-0">
            {monthMeta?.label} — يوم {entry.day} — {entry.idea || "بدون فكرة"}
          </h1>
          <span className="mr-auto shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
            عرض فقط 👁
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4 space-y-4">

        {/* Title */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">الفكرة</p>
          <h2 className="text-lg font-bold text-foreground leading-snug">
            {entry.idea || <span className="text-muted-foreground italic font-normal">بدون فكرة</span>}
          </h2>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          {entry.contentType && (
            <Chip label="النوع" value={TYPE_LABELS[entry.contentType] ?? entry.contentType} color={typeColor(entry.contentType)} />
          )}
          {entry.customerStage.map((s) => (
            <Chip key={s} label="مرحلة العميل" value={CUSTOMER_STAGE_LABELS[s] ?? s} color="bg-violet-50 text-violet-700 border-violet-200" />
          ))}
          <Chip label="الحالة" value={entry.status} color={statusColor(entry.status)} />
        </div>

        {/* Channels */}
        {entry.channels.length > 0 && (
          <Section title="القنوات">
            <div className="flex flex-wrap gap-2">
              {entry.channels.map((ch) => (
                <span key={ch} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                  {ch}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* النص */}
        {entry.text && (
          <Section title="النص">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.text}</p>
          </Section>
        )}

        {/* الخطاف */}
        {entry.hook && (
          <Section title="الخطاف">
            <p className="text-sm text-foreground">{entry.hook}</p>
          </Section>
        )}

        {/* الدعوة */}
        {entry.cta && (
          <Section title="الدعوة">
            <p className="text-sm text-foreground">{entry.cta}</p>
          </Section>
        )}

        {/* السكريبت */}
        {entry.script && (
          <Section title="السكريبت">
            {entry.script.startsWith("http") ? (
              <LinkRow href={entry.script} label={entry.script} />
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.script}</p>
            )}
          </Section>
        )}

        {/* نبرة الصوت */}
        {entry.voiceTone && (
          <Section title="نبرة الصوت">
            <p className="text-sm text-foreground">{entry.voiceTone}</p>
          </Section>
        )}

        {/* الإلهام */}
        {entry.inspiration && (
          <Section title="الإلهام">
            <p className="text-sm text-foreground">{entry.inspiration}</p>
          </Section>
        )}

        {/* رابط الملف */}
        {entry.assetLink && (
          <Section title="رابط الملف الجاهز">
            <LinkRow href={entry.assetLink} label={entry.assetLink} />
          </Section>
        )}

        {/* موعد النشر */}
        {(entry.scheduledDate || entry.scheduledTime) && (
          <Section title="موعد النشر">
            <div className="space-y-1">
              {entry.scheduledDate && (
                <InfoRow label="التاريخ" value={new Date(entry.scheduledDate).toLocaleDateString("ar-SA", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })} />
              )}
              {entry.scheduledTime && <InfoRow label="الوقت" value={entry.scheduledTime} />}
            </div>
          </Section>
        )}

        {/* روابط النشر */}
        {entry.channelLinks && Object.keys(entry.channelLinks).length > 0 && (
          <Section title="روابط النشر">
            <div className="space-y-2">
              {Object.entries(entry.channelLinks).map(([ch, url]) => (
                <div key={ch} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">{ch}</span>
                  <LinkRow href={url} label={url} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ملحوظات */}
        {entry.notes && (
          <Section title="ملحوظات">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.notes}</p>
          </Section>
        )}

      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className={cn("rounded-full border px-3 py-1 text-xs font-medium", color ?? "bg-muted text-foreground border-border")}>
      <span className="text-muted-foreground">{label}: </span>
      {value}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground min-w-25 shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-primary underline break-all">
      {label.length > 60 ? label.slice(0, 60) + "…" : label}
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === "تم النشر")         return "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
  if (s === "جاهز للنشر")       return "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  if (s === "جاهز للمراجعة")    return "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  if (s === "قيد الإنتاج")      return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
  return "bg-muted text-muted-foreground border-border";
}

function typeColor(t: string) {
  if (t === "vid")      return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
  if (t === "carousel") return "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  if (t === "post")     return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
  if (t === "story")    return "bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800";
  if (t === "reel")     return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  return "bg-muted text-muted-foreground border-border";
}
