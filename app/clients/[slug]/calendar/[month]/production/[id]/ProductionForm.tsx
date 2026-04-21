"use client";

import type { ReactElement, ReactNode } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, CheckCircle2, Link2, AlertCircle } from "lucide-react";
import {
  FaVideo, FaLayerGroup, FaImage, FaMobileScreen, FaClapperboard,
  FaBullhorn, FaThumbsUp, FaClipboardUser, FaBagShopping,
} from "react-icons/fa6";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/app/components/ui/sonner";
import { updateEntry, updateStatus } from "@/app/actions/entries";
import { sendTelegramNotification } from "@/app/actions/telegram";
import { ChannelIcon } from "@/app/components/ui/channel-icon";
import { MONTHS } from "@/lib/constants";
import type { EntryListItem } from "@/app/actions/entries";
import type { MonthValue } from "@/lib/constants";

// ─── Metadata ─────────────────────────────────────────────────────────────────

const MONTH_INDEX: Record<MonthValue, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const CONTENT_TYPE_META: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}> = {
  vid:      { icon: FaVideo,        label: "فيديو"   },
  carousel: { icon: FaLayerGroup,   label: "كاروسيل" },
  post:     { icon: FaImage,        label: "بوست"    },
  story:    { icon: FaMobileScreen, label: "ستوري"   },
  reel:     { icon: FaClapperboard, label: "ريل"     },
};

const STAGE_META: Record<string, {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = {
  awareness:  { label: "توعية",  icon: FaBullhorn      },
  engagement: { label: "تفاعل",  icon: FaThumbsUp      },
  leads:      { label: "عملاء",  icon: FaClipboardUser },
  conversion: { label: "تحويل",  icon: FaBagShopping   },
};

// ─── Layout primitives ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, multiline, isLink }: {
  label: string;
  value?: string | null;
  multiline?: boolean;
  isLink?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">{label}</p>
      {!value ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-amber-600 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs font-medium">لم يُحدَّد بعد — تواصل مع كاتب المحتوى</span>
        </div>
      ) : isLink || value.startsWith("http") ? (
        <a href={value} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline break-all">
          {value.length > 70 ? value.slice(0, 70) + "…" : value}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : multiline ? (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{value}</p>
      ) : (
        <p className="text-sm text-foreground">{value}</p>
      )}
    </div>
  );
}

function dayDetail(day: number, month: MonthValue): string {
  const year = new Date().getFullYear();
  const date = new Date(year, MONTH_INDEX[month], day);
  const weekday = date.toLocaleDateString("ar-SA", { weekday: "long" });
  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? "";
  return `${weekday} ${day} ${monthLabel}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Props = {
  entry: EntryListItem;
  slug: string;
  month: MonthValue;
};

export function ProductionForm({ entry, slug, month }: Props): ReactElement {
  const router = useRouter();
  const [assetLink, setAssetLink] = useState(entry.assetLink ?? "");
  const [saving, startSave] = useTransition();

  const isFullyLocked = entry.status === "جاهز للنشر" || entry.status === "تم النشر";
  const isReview      = entry.status === "جاهز للمراجعة";
  const isDone        = isReview || isFullyLocked;
  const canSubmit     = assetLink.trim().length > 0;
  const typeMeta      = entry.contentType ? CONTENT_TYPE_META[entry.contentType] : null;
  const TypeIcon      = typeMeta?.icon;
  const stageItems    = entry.customerStage.map((s) => STAGE_META[s]).filter(Boolean);

  function handleMarkReady() {
    startSave(async () => {
      await updateEntry(entry.id, { assetLink: assetLink.trim() || null });
      const result = await updateStatus(entry.id, "جاهز للمراجعة");
      if (result.success) {
        toast.success("تم تحديث الحالة إلى جاهز للمراجعة");
        void sendTelegramNotification(
          `🎨 <b>جاهز للمراجعة</b>\n\n💡 <b>الفكرة:</b> ${entry.idea}\n📅 يوم ${entry.day}\n👤 العميل: ${slug}\n\nالكريتيف جاهز — يرجى المراجعة والموافقة.`
        );
        router.push(`/clients/${slug}/calendar/${month}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleApprove() {
    startSave(async () => {
      const result = await updateStatus(entry.id, "جاهز للنشر");
      if (result.success) {
        toast.success("تمت الموافقة — جاهز للنشر");
        void sendTelegramNotification(
          `✅ <b>جاهز للنشر</b>\n\n💡 <b>الفكرة:</b> ${entry.idea}\n📅 يوم ${entry.day}\n👤 العميل: ${slug}\n\nتمت الموافقة على الكريتيف — جاهز للميديا باير.`
        );
        router.push(`/clients/${slug}/calendar/${month}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleUpdateLink() {
    startSave(async () => {
      const result = await updateEntry(entry.id, { assetLink: assetLink.trim() || null });
      if (result.success) {
        toast.success("تم تحديث الرابط");
      } else {
        toast.error(result.error ?? "حدث خطأ");
      }
    });
  }

  return (
    <div className="space-y-5 pb-24">

      {/* Status banner */}
      {isDone && (
        <div className={cn(
          "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium",
          entry.status === "تم النشر"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-amber-200 bg-amber-50 text-amber-700",
        )}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          هذا المنشور في مرحلة: <span className="font-bold">{entry.status}</span>
        </div>
      )}

      {/* ── Info row ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">

        <div className="flex items-center gap-1.5 text-sm shrink-0">
          <span className="font-semibold text-foreground">{dayDetail(entry.day, month)}</span>
        </div>

        {typeMeta && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              {TypeIcon && <TypeIcon size={12} className="text-primary" />}
              <span className="text-sm font-semibold text-primary">{typeMeta.label}</span>
            </div>
          </>
        )}

        {entry.channels.length > 0 && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <div className="flex items-center gap-1.5">
              {entry.channels.map((ch) => <ChannelIcon key={ch} channel={ch} />)}
            </div>
          </>
        )}

        {stageItems.length > 0 && (
          <>
            <div className="w-px h-4 bg-border shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {stageItems.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1">
                    <Icon size={9} className="text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-foreground">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* ── الفكرة ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary/20 bg-primary/3 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/50 mb-1.5">الفكرة</p>
        <p className="text-base font-bold text-foreground leading-snug">{entry.idea}</p>
      </div>

      {/* ── المحتوى المكتوب ──────────────────────────────────────────── */}
      <Section title="المحتوى المكتوب">
        <Field label="النص" value={entry.text} multiline />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Field label="الخطاف Hook" value={entry.hook} />
          <Field label="الدعوة للتصرف CTA" value={entry.cta} />
        </div>
      </Section>

      {/* ── تفاصيل الإنتاج ───────────────────────────────────────────── */}
      <Section title="تفاصيل الإنتاج">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="نبرة الصوت Voice Tone" value={entry.voiceTone} />
          <Field label="الإلهام Reference" value={entry.inspiration} />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">السيناريو Script</p>
          {entry.script ? (
            <a href={entry.script} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline break-all">
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              {entry.script.length > 70 ? entry.script.slice(0, 70) + "…" : entry.script}
            </a>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-amber-600 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">لم يُحدَّد بعد — تواصل مع كاتب المحتوى</span>
            </div>
          )}
        </div>

        <Field label="ملحوظات للمصمم Notes" value={entry.notes} multiline />
      </Section>

      {/* ── Fixed footer ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-6 py-3 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <Input
              dir="ltr"
              value={assetLink}
              onChange={(e) => setAssetLink(e.target.value)}
              placeholder="https://drive.google.com/... رابط الكريتيف الجاهز"
              className="h-10 font-mono text-xs flex-1 min-w-0"
              disabled={isFullyLocked}
            />
            {assetLink.trim() && (
              <a href={assetLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          {isReview ? (
            <>
              <Button
                type="button"
                disabled={saving || !canSubmit}
                onClick={handleUpdateLink}
                variant="outline"
                className="shrink-0 h-10 font-semibold gap-2 px-5">
                <CheckCircle2 className="h-4 w-4" />
                {saving ? "جاري الحفظ..." : "تحديث الرابط"}
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={handleApprove}
                className="shrink-0 h-10 font-semibold gap-2 px-5 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="h-4 w-4" />
                {saving ? "جاري الحفظ..." : "منح الموافقة — جاهز للنشر"}
              </Button>
            </>
          ) : isFullyLocked ? (
            <Button type="button" disabled className="shrink-0 h-10 font-semibold gap-2 px-5 opacity-60">
              <CheckCircle2 className="h-4 w-4" />
              {entry.status}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={saving || !canSubmit}
              onClick={handleMarkReady}
              className="shrink-0 h-10 font-semibold gap-2 px-5">
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "جاري الحفظ..." : "جاهز للمراجعة"}
            </Button>
          )}
          <Button type="button" variant="outline" className="shrink-0 h-10"
            onClick={() => router.push(`/clients/${slug}/calendar/${month}`)}>
            رجوع
          </Button>
        </div>
      </div>

    </div>
  );
}
