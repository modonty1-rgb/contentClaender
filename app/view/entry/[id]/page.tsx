import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getEntryById } from "@/app/actions/entries";
import { MONTHS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function ViewEntryPage({ params }: Props) {
  const { id } = await params;
  const entry = await getEntryById(id);
  if (!entry) notFound();

  const monthMeta = MONTHS.find((m) => m.value === entry.month);

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">JBR Content Calendar</p>
            <h1 className="text-base font-bold text-foreground leading-tight">
              {monthMeta?.label} — يوم {entry.day}
            </h1>
          </div>
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
            عرض فقط 👁
          </span>
        </div>
      </header>

      {/* Card */}
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
          {entry.typeOfContent && (
            <Chip label="النوع" value={entry.typeOfContent} color={typeColor(entry.typeOfContent)} />
          )}
          {entry.funnel.map((f) => (
            <Chip key={f} label="Funnel" value={f} color={funnelColor(f)} />
          ))}
          {entry.orgPaid && (
            <Chip label="نوعية النشر" value={entry.orgPaid} />
          )}
          <Chip label="حالة النشر" value={entry.publishing} color={publishingColor(entry.publishing)} />
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

        {/* Captions */}
        {entry.captionSA && (
          <Section title="Caption SA 🇸🇦">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.captionSA}</p>
          </Section>
        )}
        {entry.captionEG && (
          <Section title="Caption EG 🇪🇬">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.captionEG}</p>
          </Section>
        )}

        {/* Script */}
        {entry.script && (
          <Section title="Script / السكريبت">
            {entry.script.startsWith("http") ? (
              <LinkRow href={entry.script} label={entry.script} />
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.script}</p>
            )}
          </Section>
        )}

        {/* TOV */}
        {entry.tov && (
          <Section title="TOV — نبرة الصوت">
            <p className="text-sm text-foreground whitespace-pre-wrap">{entry.tov}</p>
          </Section>
        )}

        {/* Reference */}
        {entry.reference && (
          <Section title="Reference">
            <p className="text-sm text-foreground whitespace-pre-wrap">{entry.reference}</p>
          </Section>
        )}

        {/* Storyboard */}
        {entry.storyboard && (
          <Section title="Storyboard">
            {entry.storyboard.startsWith("http") ? (
              <LinkRow href={entry.storyboard} label={entry.storyboard} />
            ) : (
              <p className="text-sm text-foreground">{entry.storyboard}</p>
            )}
          </Section>
        )}

        {/* Material + Size */}
        {(entry.material || entry.size) && (
          <Section title="الإنتاج">
            <div className="space-y-1">
              {entry.material && <InfoRow label="Material" value={entry.material} />}
              {entry.size && <InfoRow label="المقاس" value={entry.size} />}
            </div>
          </Section>
        )}

        {/* Post / Video link */}
        {entry.postVidLinks && (
          <Section title="رابط المنشور / الفيديو">
            {entry.postVidLinks.startsWith("http") ? (
              <LinkRow href={entry.postVidLinks} label={entry.postVidLinks} />
            ) : (
              <p className="text-sm text-foreground">{entry.postVidLinks}</p>
            )}
          </Section>
        )}

        {/* Reel link */}
        {entry.reelLink && (
          <Section title="رابط الريل">
            {entry.reelLink.startsWith("http") ? (
              <LinkRow href={entry.reelLink} label={entry.reelLink} />
            ) : (
              <p className="text-sm text-foreground">{entry.reelLink}</p>
            )}
          </Section>
        )}

        {/* Content link */}
        {entry.contentLink && (
          <Section title="رابط المحتوى">
            {entry.contentLink.startsWith("http") ? (
              <LinkRow href={entry.contentLink} label={entry.contentLink} />
            ) : (
              <p className="text-sm text-foreground">{entry.contentLink}</p>
            )}
          </Section>
        )}

        {/* Publishing date/time */}
        {(entry.publishingDate || entry.publishingTime) && (
          <Section title="موعد النشر">
            <div className="space-y-1">
              {entry.publishingDate && (
                <InfoRow
                  label="التاريخ"
                  value={new Date(entry.publishingDate).toLocaleDateString("ar-SA", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                />
              )}
              {entry.publishingTime && <InfoRow label="الوقت" value={entry.publishingTime} />}
            </div>
          </Section>
        )}

        {/* Status fields */}
        {(entry.code || entry.readyToPublish || entry.reviewed) && (
          <Section title="الحالة">
            <div className="space-y-1">
              {entry.code && <InfoRow label="الكود" value={entry.code} />}
              {entry.readyToPublish && <InfoRow label="جاهز للنشر" value={entry.readyToPublish} />}
              {entry.reviewed && <InfoRow label="تمت المراجعة" value={entry.reviewed} />}
            </div>
          </Section>
        )}

        {/* Notes */}
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
      <span className="text-muted-foreground min-w-[100px] shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-primary underline break-all"
    >
      {label.length > 60 ? label.slice(0, 60) + "…" : label}
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function publishingColor(s: string) {
  if (s === "تم النشر")     return "bg-green-100 text-green-800 border-green-200";
  if (s === "مجدول")        return "bg-blue-100 text-blue-800 border-blue-200";
  if (s === "قيد المراجعة") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (s === "لم يتم النشر") return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-muted text-muted-foreground border-border";
}

function funnelColor(f: string) {
  if (f === "awareness")  return "bg-purple-100 text-purple-700 border-purple-200";
  if (f === "engagement") return "bg-orange-100 text-orange-700 border-orange-200";
  if (f === "leads")      return "bg-blue-100 text-blue-700 border-blue-200";
  if (f === "conversion") return "bg-green-100 text-green-700 border-green-200";
  return "bg-muted text-muted-foreground border-border";
}

function typeColor(t: string) {
  if (t === "vid")      return "bg-red-100 text-red-700 border-red-200";
  if (t === "carousel") return "bg-indigo-100 text-indigo-700 border-indigo-200";
  if (t === "post")     return "bg-gray-100 text-gray-700 border-gray-200";
  if (t === "story")    return "bg-pink-100 text-pink-700 border-pink-200";
  if (t === "reel")     return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-muted text-muted-foreground border-border";
}
