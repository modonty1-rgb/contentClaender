"use client";

import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/app/components/ui/sonner";
import { updateEntry, updateStatus } from "@/app/actions/entries";
import { sendTelegramNotification } from "@/app/actions/telegram";
import { CHANNELS } from "@/app/components/ui/channel-icon";
import { ChannelIcon } from "@/app/components/ui/channel-icon";
import { ORG_PAID_OPTIONS, CURRENCY_OPTIONS } from "@/lib/constants";
import type { EntryListItem } from "@/app/actions/entries";

// ─── Chip radio ───────────────────────────────────────────────────────────────

function ChipRadio({ options, value, onChange }: {
  options: readonly string[]; value: string; onChange: (v: string) => void;
}): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt} type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === opt
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/50",
          )}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">{title}</h3>
      {children}
    </div>
  );
}

function ReadField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground min-w-28 shrink-0 text-xs">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Props = { entry: EntryListItem; slug: string; month: string };

export function PublishForm({ entry, slug, month }: Props): ReactElement {
  const router = useRouter();

  const existingLinks = (entry.channelLinks as Record<string, string> | null) ?? {};

  const [orgPaid,      setOrgPaid]      = useState(entry.orgPaid      ?? "");
  const [budget,       setBudget]       = useState(entry.budget       != null ? String(entry.budget) : "");
  const [currency,     setCurrency]     = useState(entry.currency     ?? "SAR");
  const [adDuration,   setAdDuration]   = useState(entry.adDuration   != null ? String(entry.adDuration) : "");
  const [scheduledDate, setScheduledDate] = useState(
    entry.scheduledDate ? new Date(entry.scheduledDate).toISOString().split("T")[0] : "",
  );
  const [scheduledTime, setScheduledTime] = useState(entry.scheduledTime ?? "");
  const [links,        setLinks]        = useState<Record<string, string>>(existingLinks);
  const [saving, startSave] = useTransition();

  const isPublished = entry.status === "تم النشر";

  function buildPayload() {
    return {
      orgPaid:       orgPaid || null,
      budget:        budget ? Number(budget) : null,
      currency:      currency || null,
      adDuration:    adDuration ? Number(adDuration) : null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      scheduledTime: scheduledTime || null,
      channelLinks:  Object.keys(links).length > 0 ? links : null,
    };
  }

  function handleSave() {
    startSave(async () => {
      const result = await updateEntry(entry.id, buildPayload());
      if (result.success) {
        toast.success("تم الحفظ");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handlePublish() {
    startSave(async () => {
      await updateEntry(entry.id, buildPayload());
      const result = await updateStatus(entry.id, "تم النشر");
      if (result.success) {
        toast.success("تم النشر بنجاح");
        void sendTelegramNotification(
          `🚀 <b>تم النشر</b>\n\n💡 <b>الفكرة:</b> ${entry.idea}\n📅 يوم ${entry.day}\n👤 العميل: ${slug}\n\nتم نشر المحتوى بنجاح.`
        );
        router.push(`/clients/${slug}/calendar/${month}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-5">

      {/* Published banner */}
      {isPublished && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          تم النشر
          {entry.publishedAt && (
            <span className="font-normal text-green-600 mr-1">
              — {new Date(entry.publishedAt).toLocaleDateString("ar-SA", { day: "numeric", month: "long" })}
            </span>
          )}
        </div>
      )}

      {/* Entry summary */}
      <Section title="ملخص المنشور">
        <ReadField label="الفكرة"       value={entry.idea} />
        <ReadField label="نوع المحتوى"  value={entry.contentType} />
        <ReadField label="الحالة"        value={entry.status} />
        {entry.channels.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground min-w-28 shrink-0 text-xs">القنوات</span>
            <div className="flex items-center gap-1.5">
              {entry.channels.map((ch) => <ChannelIcon key={ch} channel={ch} />)}
            </div>
          </div>
        )}
        {entry.assetLink && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground min-w-28 shrink-0 text-xs">رابط الملف</span>
            <a href={entry.assetLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline break-all">
              {entry.assetLink.length > 50 ? entry.assetLink.slice(0, 50) + "…" : entry.assetLink}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        )}
      </Section>

      {/* Campaign settings */}
      <Section title="إعدادات الحملة">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">عضوي / مدفوع</Label>
          <ChipRadio options={ORG_PAID_OPTIONS} value={orgPaid} onChange={setOrgPaid} />
        </div>

        {orgPaid === "sponsored" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">المبلغ</Label>
              <Input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">العملة</Label>
              <ChipRadio options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">مدة الإعلان (أيام)</Label>
              <Input
                type="number"
                min="1"
                value={adDuration}
                onChange={(e) => setAdDuration(e.target.value)}
                placeholder="1"
                className="h-9"
              />
            </div>
          </div>
        )}
      </Section>

      {/* Schedule */}
      <Section title="موعد النشر">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">التاريخ</Label>
            <Input
              type="date"
              dir="ltr"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">الوقت</Label>
            <Input
              type="time"
              dir="ltr"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </Section>

      {/* Channel links */}
      {entry.channels.length > 0 && (
        <Section title="روابط النشر">
          <div className="space-y-3">
            {entry.channels.map((ch) => {
              const meta = CHANNELS[ch.toLowerCase()];
              const hasLink = Boolean(links[ch]?.trim());
              return (
                <div key={ch} className="flex items-center gap-3">
                  <ChannelIcon channel={ch} href={hasLink ? links[ch] : undefined} />
                  <Input
                    dir="ltr"
                    placeholder={`${meta?.label ?? ch} URL...`}
                    value={links[ch] ?? ""}
                    onChange={(e) => setLinks((prev) => ({ ...prev, [ch]: e.target.value }))}
                    className="h-8 text-xs flex-1 font-mono"
                  />
                  {hasLink && (
                    <a href={links[ch]} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Action bar */}
      <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border flex items-center gap-3">
        <Button
          type="button"
          disabled={saving || isPublished}
          onClick={handlePublish}
          className="min-w-[140px] h-10 font-semibold gap-2">
          <Send className="h-4 w-4" />
          {saving ? "جاري الحفظ..." : isPublished ? "تم النشر" : "نشر"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving || isPublished}
          onClick={handleSave}
          className="h-10">
          حفظ بدون نشر
        </Button>
        <Button type="button" variant="ghost" className="h-10"
          onClick={() => router.push(`/clients/${slug}/calendar/${month}`)}>
          رجوع
        </Button>
      </div>
    </div>
  );
}
