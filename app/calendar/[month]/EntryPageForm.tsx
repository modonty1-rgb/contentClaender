"use client";

import type { ReactElement, FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/app/components/ui/sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/lib/utils";
import { labelClass } from "@/app/components/AdminFormShared";
import {
  FUNNEL_OPTIONS, TYPE_OPTIONS, ORG_PAID_OPTIONS,
  CHANNEL_OPTIONS, PUBLISHING_OPTIONS, DAYS_IN_MONTH,
} from "@/lib/constants";
import { createEntry, updateEntry } from "@/app/actions/entries";
import type { MonthValue } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntryPageFormData = {
  day: number;
  idea: string;
  funnel: string[];
  typeOfContent: string;
  orgPaid: string;
  publishing: string;
  channels: string[];
  captionSA: string;
  captionEG: string;
  script: string;
  tov: string;
  reference: string;
  postVidLinks: string;
  reelLink: string;
  publishingDate: string;
  publishingTime: string;
  code: string;
  notes: string;
  reviewed: string;
  readyToPublish: string;
  contentLink: string;
  storyboard: string;
  material: string;
  size: string;
};

export const EMPTY_FORM = (day = 1): EntryPageFormData => ({
  day,
  idea: "",
  funnel: [],
  typeOfContent: "",
  orgPaid: "organic",
  publishing: "لم يتم النشر",
  channels: [],
  captionSA: "",
  captionEG: "",
  script: "",
  tov: "",
  reference: "",
  postVidLinks: "",
  reelLink: "",
  publishingDate: "",
  publishingTime: "",
  code: "",
  notes: "",
  reviewed: "",
  readyToPublish: "",
  contentLink: "",
  storyboard: "",
  material: "",
  size: "",
});

// ─── Multi-select chips ───────────────────────────────────────────────────────

function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}): ReactElement {
  return (
    <div className="space-y-1.5">
      <Label className={labelClass}>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() =>
                onChange(active ? value.filter((v) => v !== opt) : [...value, opt])
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

type Props = {
  mode: "create" | "edit";
  entryId?: string;
  month: MonthValue;
  monthLabel: string;
  defaultValues: EntryPageFormData;
};

export function EntryPageForm({ mode, entryId, month, monthLabel, defaultValues }: Props): ReactElement {
  const router = useRouter();
  const [data, setData] = useState<EntryPageFormData>(defaultValues);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof EntryPageFormData>(key: K, val: EntryPageFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const days = Array.from({ length: DAYS_IN_MONTH[month] }, (_, i) => i + 1);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const commonFields = {
        day: data.day,
        idea: data.idea,
        funnel: data.funnel,
        typeOfContent: data.typeOfContent,
        orgPaid: data.orgPaid,
        publishing: data.publishing,
        channels: data.channels,
        captionSA: data.captionSA || null,
        captionEG: data.captionEG || null,
        script: data.script || null,
        tov: data.tov || null,
        reference: data.reference || null,
        postVidLinks: data.postVidLinks || null,
        publishingDate: data.publishingDate ? new Date(data.publishingDate) : null,
        reelLink: data.reelLink || null,
        publishingTime: data.publishingTime || null,
        code: data.code || null,
        notes: data.notes || null,
        reviewed: data.reviewed || null,
        readyToPublish: data.readyToPublish || null,
        contentLink: data.contentLink || null,
        storyboard: data.storyboard || null,
        material: data.material || null,
        size: data.size || null,
      };

      if (mode === "create") {
        const result = await createEntry({ month, ...commonFields });
        if (result.success) {
          toast.success("تم إضافة التاسك بنجاح");
          router.push(`/calendar/${month}`);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await updateEntry(entryId!, commonFields);
        if (result.success) {
          toast.success("تم حفظ التعديلات");
          router.push(`/calendar/${month}`);
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── 1. المعلومات الأساسية ───────────────────────────────────────────── */}
      <Section title="المعلومات الأساسية">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Day */}
          <div className="space-y-1.5">
            <Label className={labelClass}>اليوم</Label>
            <Select value={String(data.day)} onValueChange={(v) => set("day", Number(v))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {days.map((d) => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Type */}
          <div className="space-y-1.5">
            <Label className={labelClass}>نوع المحتوى</Label>
            <Select value={data.typeOfContent} onValueChange={(v) => set("typeOfContent", v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="اختر..." /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Org/Paid */}
          <div className="space-y-1.5">
            <Label className={labelClass}>عضوي / مدفوع</Label>
            <Select value={data.orgPaid} onValueChange={(v) => set("orgPaid", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORG_PAID_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Publishing */}
          <div className="space-y-1.5">
            <Label className={labelClass}>حالة النشر</Label>
            <Select value={data.publishing} onValueChange={(v) => set("publishing", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PUBLISHING_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChipSelect label="Funnel" options={FUNNEL_OPTIONS} value={data.funnel} onChange={(v) => set("funnel", v)} />
          <ChipSelect label="القنوات" options={CHANNEL_OPTIONS} value={data.channels} onChange={(v) => set("channels", v)} />
        </div>
      </Section>

      {/* ── 2. المحتوى ─────────────────────────────────────────────────────── */}
      <Section title="المحتوى">
        <div className="space-y-1.5">
          <Label className={labelClass}>الفكرة</Label>
          <Input
            value={data.idea}
            onChange={(e) => set("idea", e.target.value)}
            placeholder="فكرة المحتوى..."
            className="h-9"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={labelClass}>Caption SA 🇸🇦</Label>
            <Textarea
              value={data.captionSA}
              onChange={(e) => set("captionSA", e.target.value)}
              placeholder="الكابشن السعودي..."
              className="min-h-[120px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Caption EG 🇪🇬</Label>
            <Textarea
              value={data.captionEG}
              onChange={(e) => set("captionEG", e.target.value)}
              placeholder="الكابشن المصري..."
              className="min-h-[120px]"
            />
          </div>
        </div>
      </Section>

      {/* ── 3. الإنتاج ─────────────────────────────────────────────────────── */}
      <Section title="الإنتاج">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={labelClass}>Script / رابط السكريبت</Label>
            <Input
              value={data.script}
              onChange={(e) => set("script", e.target.value)}
              placeholder="https://docs.google.com/..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Storyboard</Label>
            <Input
              value={data.storyboard}
              onChange={(e) => set("storyboard", e.target.value)}
              placeholder="رابط الستوري بورد..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Material</Label>
            <Input
              value={data.material}
              onChange={(e) => set("material", e.target.value)}
              placeholder="الماتريال..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>المقاس</Label>
            <Input
              value={data.size}
              onChange={(e) => set("size", e.target.value)}
              placeholder="1080x1080..."
              className="h-9"
            />
          </div>
        </div>
      </Section>

      {/* ── 4. النشر ───────────────────────────────────────────────────────── */}
      <Section title="النشر">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={labelClass}>TOV — نبرة الصوت</Label>
            <Input
              value={data.tov}
              onChange={(e) => set("tov", e.target.value)}
              placeholder="نبرة الصوت..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Reference</Label>
            <Input
              value={data.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="المرجع..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>رابط التصميم / الفيديو</Label>
            <Input
              value={data.postVidLinks}
              onChange={(e) => set("postVidLinks", e.target.value)}
              placeholder="https://drive.google.com/..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>رابط الريل</Label>
            <Input
              value={data.reelLink}
              onChange={(e) => set("reelLink", e.target.value)}
              placeholder="https://..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>تاريخ النشر</Label>
            <Input
              type="date"
              value={data.publishingDate}
              onChange={(e) => set("publishingDate", e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>وقت النشر</Label>
            <Input
              type="time"
              value={data.publishingTime}
              onChange={(e) => set("publishingTime", e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </Section>

      {/* ── 5. معلومات إضافية ──────────────────────────────────────────────── */}
      <Section title="معلومات إضافية">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={labelClass}>الكود</Label>
            <Input
              value={data.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="JS001..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>رابط المحتوى</Label>
            <Input
              value={data.contentLink}
              onChange={(e) => set("contentLink", e.target.value)}
              placeholder="https://..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>هل المحتوى جاهز للنشر؟</Label>
            <Input
              value={data.readyToPublish}
              onChange={(e) => set("readyToPublish", e.target.value)}
              placeholder="جاهز / غير جاهز..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>هل تمت المراجعة؟</Label>
            <Input
              value={data.reviewed}
              onChange={(e) => set("reviewed", e.target.value)}
              placeholder="تمت المراجعة / لم تتم..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className={labelClass}>ملحوظات</Label>
            <Textarea
              value={data.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              className="min-h-[80px]"
            />
          </div>
        </div>
      </Section>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border flex items-center gap-3">
        <Button type="submit" disabled={saving} className="min-w-[140px] h-10 font-semibold">
          {saving ? "جاري الحفظ..." : mode === "create" ? "✚  إضافة التاسك" : "حفظ التعديلات"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() => router.push(`/calendar/${month}`)}
        >
          إلغاء
        </Button>
        {mode === "edit" && (
          <p className="text-xs text-muted-foreground mr-auto">التعديلات تُحفظ فوراً بعد الضغط</p>
        )}
      </div>
    </form>
  );
}
