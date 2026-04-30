"use client";

import type { ReactElement, FormEvent } from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaVideo, FaLayerGroup, FaImage, FaMobileScreen, FaClapperboard,
  FaInstagram, FaTiktok, FaXTwitter, FaFacebook, FaYoutube, FaLinkedin, FaSnapchat,
  FaBullhorn, FaThumbsUp, FaClipboardUser, FaBagShopping, FaCheck, FaThreads, FaChevronDown,
} from "react-icons/fa6";
import { toast } from "@/app/components/ui/sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";
import { labelClass } from "@/app/components/AdminFormShared";
import {
  CUSTOMER_STAGE_OPTIONS, TYPE_OPTIONS,
  CHANNEL_OPTIONS, DAYS_IN_MONTH, MONTHS,
} from "@/lib/constants";
import { createEntry, updateEntry } from "@/app/actions/entries";
import { sendTelegramNotification } from "@/app/actions/telegram";
import type { MonthValue } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntryPageFormData = {
  month:         MonthValue;
  day:           number;
  idea:          string;
  customerStage: string[];
  contentType:   string;
  channels:      string[];
  text:          string;
  hook:          string;
  cta:           string;
  script:        string;
  voiceTone:     string;
  inspiration:   string;
  notes:         string;
};

export const EMPTY_FORM = (month: MonthValue, day = 1): EntryPageFormData => ({
  month, day, idea: "", customerStage: [], contentType: "",
  channels: [], text: "", hook: "", cta: "",
  script: "", voiceTone: "", inspiration: "", notes: "",
});

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

const CHANNEL_META: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  activeBg: string;
  activeIcon: string;
}> = {
  instagram: { icon: FaInstagram, label: "Instagram", activeBg: "bg-pink-500",    activeIcon: "text-white"        },
  tiktok:    { icon: FaTiktok,    label: "TikTok",    activeBg: "bg-neutral-900", activeIcon: "text-white"        },
  x:         { icon: FaXTwitter,  label: "X",         activeBg: "bg-neutral-900", activeIcon: "text-white"        },
  facebook:  { icon: FaFacebook,  label: "Facebook",  activeBg: "bg-blue-600",    activeIcon: "text-white"        },
  youtube:   { icon: FaYoutube,   label: "YouTube",   activeBg: "bg-red-600",     activeIcon: "text-white"        },
  linkedin:  { icon: FaLinkedin,  label: "LinkedIn",  activeBg: "bg-sky-700",     activeIcon: "text-white"        },
  snapchat:  { icon: FaSnapchat,  label: "Snapchat",  activeBg: "bg-yellow-400",  activeIcon: "text-neutral-900"  },
  threads:   { icon: FaThreads,   label: "Threads",   activeBg: "bg-neutral-900", activeIcon: "text-white"        },
};

// ─── Day calendar ─────────────────────────────────────────────────────────────

const WEEK_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

function DayCalendar({
  month, mode, value, entryDays, onChange,
}: {
  month: MonthValue;
  mode: "create" | "edit";
  value: number;
  entryDays?: number[];
  onChange: (d: number) => void;
}) {
  const today      = new Date();
  const year       = today.getFullYear();
  const monthIdx   = MONTH_INDEX[month];
  const todayDate  = today.getDate();
  const isCurrentMonth = mode === "create" && today.getMonth() === monthIdx;
  const firstDow   = new Date(year, monthIdx, 1).getDay();
  const totalDays  = DAYS_IN_MONTH[month];

  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-0.5">
      {/* Week headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_HEADERS.map((h) => (
          <div key={h} className="h-5 flex items-center justify-center">
            <span className="text-[9px] font-semibold tracking-wide uppercase text-muted-foreground/35">{h}</span>
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} className="h-7" />;

          const isPast     = isCurrentMonth && d < todayDate;
          const isToday    = isCurrentMonth && d === todayDate;
          const isSelected = value === d;
          const hasEntry   = entryDays?.includes(d) ?? false;

          if (isPast) {
            return (
              <div key={d} className={cn(
                "h-7 flex flex-col items-center justify-center rounded-md text-[11px] font-medium leading-none gap-px",
                hasEntry
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-red-400/10 text-red-400/60",
              )}>
                <span>{d}</span>
                {hasEntry && <FaCheck size={5} />}
              </div>
            );
          }

          return (
            <button key={d} type="button" onClick={() => onChange(d)}
              className={cn(
                "h-7 flex items-center justify-center rounded-md text-[11px] font-semibold transition-all leading-none",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isToday
                    ? "text-primary ring-1 ring-inset ring-primary/40 bg-primary/8 font-bold"
                    : "text-foreground/70 hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function Section({ title, badge, children, collapsible = false, defaultOpen = true }: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div
        role={collapsible ? "button" : undefined}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
        className={cn(
          "px-5 py-4 flex items-center gap-2 border-b border-border/60",
          collapsible && "cursor-pointer select-none hover:bg-muted/20 transition-colors",
        )}
      >
        <h3 className="text-sm font-bold text-foreground flex-1">{title}</h3>
        {badge}
        {collapsible && (
          <FaChevronDown size={10} className={cn("text-muted-foreground/40 transition-transform duration-200", open && "rotate-180")} />
        )}
      </div>
      {open && <div className="p-5 space-y-5">{children}</div>}
    </div>
  );
}

function SidebarCard({ title, detail, children }: {
  title?: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        {title && (
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">
            {title}
          </h3>
        )}
        {detail && (
          <p className={cn(
            "font-semibold text-foreground text-center leading-tight",
            title ? "text-sm mt-1" : "text-sm",
          )}>
            {detail}
          </p>
        )}
      </div>
      <div className="p-2.5 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function dayDetail(day: number, month: MonthValue): string {
  const year = new Date().getFullYear();
  const date = new Date(year, MONTH_INDEX[month], day);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? "";
  return `${weekday} · ${day} ${monthLabel}`;
}

// ─── Auto-resize textarea ─────────────────────────────────────────────────────

function AutoTextarea({ value, onChange, placeholder, className }: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <Textarea ref={ref} value={value} onChange={onChange} placeholder={placeholder}
      className={cn("resize-none overflow-hidden transition-[height]", className)} />
  );
}

// ─── Sidebar: Content type ────────────────────────────────────────────────────

function ContentTypeSidebar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const activeMeta = value ? CONTENT_TYPE_META[value] : null;
  const ActiveIcon = activeMeta?.icon;
  return (
    <SidebarCard title="نوع المحتوى">
      <div className="flex gap-1 p-1 bg-muted/60 rounded-xl">
        {TYPE_OPTIONS.map((opt) => {
          const meta = CONTENT_TYPE_META[opt];
          const Icon = meta.icon;
          const active = value === opt;
          return (
            <button key={opt} type="button" title={meta.label}
              onClick={() => onChange(active ? "" : opt)}
              className={cn(
                "flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground/40 hover:text-foreground hover:text-muted-foreground",
              )}
            >
              <Icon size={13} />
              <span className="text-[9px] font-medium leading-none">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </SidebarCard>
  );
}

// ─── Sidebar: Customer stage ──────────────────────────────────────────────────

function CustomerStageSidebar({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const activeLabels = value.map((v) => STAGE_META[v]?.label).filter(Boolean);
  return (
    <SidebarCard title="هدف الحملة">
      <div className="flex gap-1 p-1 bg-muted/60 rounded-xl">
        {CUSTOMER_STAGE_OPTIONS.map((opt) => {
          const meta = STAGE_META[opt];
          const Icon = meta.icon;
          const active = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              title={meta.label}
              onClick={() => onChange(active ? value.filter((v) => v !== opt) : [...value, opt])}
              className={cn(
                "flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all",
                active
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground/40 hover:text-foreground hover:text-muted-foreground",
              )}
            >
              <Icon size={12} />
              <span className="text-[9px] font-medium leading-none">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </SidebarCard>
  );
}

// ─── Sidebar: Channels ───────────────────────────────────────────────────────

function ChannelsSidebar({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <SidebarCard title="القنوات">
      <div className="flex flex-wrap gap-1">
        {CHANNEL_OPTIONS.map((ch) => {
          const meta = CHANNEL_META[ch];
          const Icon = meta?.icon;
          const active = value.includes(ch);
          return (
            <button key={ch} type="button" title={meta?.label ?? ch}
              onClick={() => onChange(active ? value.filter((v) => v !== ch) : [...value, ch])}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-lg transition-all",
                active
                  ? cn("shadow-sm", meta.activeBg, meta.activeIcon)
                  : "bg-muted/50 text-muted-foreground/40 hover:text-foreground hover:bg-muted",
              )}
            >
              {Icon && <Icon size={14} />}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-center text-[10px] text-primary font-semibold pt-0.5 leading-none">
          {value.length === 1 ? "قناة واحدة" : `${value.length} قنوات`}
        </p>
      )}
    </SidebarCard>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

type Props = {
  mode: "create" | "edit";
  entryId?: string;
  slug: string;
  clientId?: string;
  month: MonthValue;
  monthLabel: string;
  defaultValues: EntryPageFormData;
  entryDays?: number[];
};

export function EntryPageForm({ mode, entryId, slug, clientId, month, defaultValues, entryDays }: Props): ReactElement {
  const router = useRouter();
  const [data, setData] = useState<EntryPageFormData>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notifyTelegram, setNotifyTelegram] = useState(mode === "create");

  const set = <K extends keyof EntryPageFormData>(key: K, val: EntryPageFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const additionalHasData = !!(defaultValues.voiceTone || defaultValues.inspiration || defaultValues.script || defaultValues.notes);
  const [textTouched, setTextTouched] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!data.idea.trim()) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSaving(true);
    try {
      const fields = {
        day: data.day, idea: data.idea,
        customerStage: data.customerStage, contentType: data.contentType,
        channels: data.channels,
        text:        data.text        || null,
        hook:        data.hook        || null,
        cta:         data.cta         || null,
        script:      data.script      || null,
        voiceTone:   data.voiceTone   || null,
        inspiration: data.inspiration || null,
        notes:       data.notes       || null,
      };

      let saved = false;
      if (mode === "create") {
        const result = await createEntry({ month, clientId, ...fields });
        if (result.success) { saved = true; toast.success("تم إضافة المنشور بنجاح"); }
        else toast.error(result.error);
      } else {
        const monthChanged = data.month !== month;
        const result = await updateEntry(entryId!, monthChanged ? { ...fields, month: data.month } : fields);
        if (result.success) {
          saved = true;
          toast.success(monthChanged ? `تم نقل المنشور إلى ${MONTHS.find((m) => m.value === data.month)?.label}` : "تم حفظ التعديلات");
        } else toast.error(result.error);
      }

      if (saved) {
        if (notifyTelegram) {
          const monthLabel = MONTHS.find((m) => m.value === data.month)?.label ?? data.month;
          const typeLabel  = data.contentType ? CONTENT_TYPE_META[data.contentType]?.label : null;
          const stageLabels = data.customerStage.map((s) => STAGE_META[s]?.label).filter(Boolean).join("، ");
          const msg = [
            `${mode === "create" ? "📋 منشور جديد" : "✏️ تعديل منشور"}`,
            ``,
            `📅 <b>التاريخ:</b> يوم ${data.day} — ${monthLabel}`,
            `💡 <b>الفكرة:</b> ${data.idea}`,
            typeLabel  ? `🎬 <b>نوع المحتوى:</b> ${typeLabel}` : null,
            stageLabels ? `🎯 <b>هدف الحملة:</b> ${stageLabels}` : null,
            data.channels.length ? `📢 <b>القنوات:</b> ${data.channels.join("، ")}` : null,
            slug ? `\n👤 <b>العميل:</b> ${slug}` : null,
          ].filter(Boolean).join("\n");
          await sendTelegramNotification(msg);
        }
        router.push(`/clients/${slug}/calendar/${data.month}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>

      {/* ── 3-column layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-5 items-start">

        {/* RIGHT sidebar — اليوم (full column) */}
        <div className="lg:sticky lg:top-20 order-2 lg:order-1 space-y-4">
          <SidebarCard detail={dayDetail(data.day, data.month)}>
            {mode === "edit" && (
              <div className="px-1 pb-2">
                <select
                  value={data.month}
                  onChange={(e) => {
                    const newMonth = e.target.value as MonthValue;
                    const maxDay = DAYS_IN_MONTH[newMonth];
                    setData((prev) => ({ ...prev, month: newMonth, day: Math.min(prev.day, maxDay) }));
                  }}
                  className="w-full h-9 rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}
            <DayCalendar month={data.month} mode={mode} value={data.day} entryDays={data.month === month ? entryDays : []} onChange={(d) => set("day", d)} />
          </SidebarCard>
        </div>

        {/* CENTER — main content */}
        <div className="space-y-5 min-w-0 order-1 lg:order-2">

          <Section title="المحتوى">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Label className={labelClass}>الفكرة</Label>
                <span className="text-red-500 text-xs leading-none" title="مطلوب">*</span>
              </div>
              <Input value={data.idea} onChange={(e) => set("idea", e.target.value)}
                placeholder="ما هي فكرة المحتوى؟"
                className={cn("h-10 text-sm font-medium transition-all", data.idea ? "border-primary/30 bg-primary/3" : "")} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className={labelClass}>النص</Label>
                <span className={cn("text-[11px] tabular-nums transition-colors",
                  data.text.length > 800 ? "text-red-500 font-semibold" : data.text.length > 400 ? "text-amber-500" : "text-muted-foreground/40",
                )}>
                  {data.text.length} حرف
                </span>
              </div>
              <AutoTextarea value={data.text} onChange={(e) => { set("text", e.target.value); setTextTouched(true); }} placeholder="النص الكامل..." className="min-h-28" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className={labelClass}>الخطاف <span className="text-muted-foreground/50 font-normal">Hook</span></Label>
                {data.hook.length > 0 && (
                  <span className={cn("text-[11px] tabular-nums transition-colors",
                    data.hook.length > 200 ? "text-red-500 font-semibold" : data.hook.length > 100 ? "text-amber-500" : "text-muted-foreground/40",
                  )}>
                    {data.hook.length} حرف
                  </span>
                )}
              </div>
              <AutoTextarea value={data.hook} onChange={(e) => set("hook", e.target.value)} placeholder="الخطاف..." className="min-h-16" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className={labelClass}>الدعوة <span className="text-muted-foreground/50 font-normal">CTA</span></Label>
                {data.cta.length > 0 && (
                  <span className={cn("text-[11px] tabular-nums transition-colors",
                    data.cta.length > 150 ? "text-red-500 font-semibold" : data.cta.length > 80 ? "text-amber-500" : "text-muted-foreground/40",
                  )}>
                    {data.cta.length} حرف
                  </span>
                )}
              </div>
              <AutoTextarea value={data.cta} onChange={(e) => set("cta", e.target.value)} placeholder="الدعوة للتصرف..." className="min-h-16" />
            </div>
          </Section>

          <Section title="معلومات إضافية" collapsible defaultOpen={additionalHasData}
            badge={(() => {
              const filled = [data.voiceTone, data.inspiration, data.script, data.notes].filter(Boolean).length;
              return filled > 0
                ? <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">{filled}</span>
                : <span className="text-[10px] text-muted-foreground/40 font-normal">اختياري</span>;
            })()}>
            <div className="space-y-1.5">
              <Label className={labelClass}>نبرة الصوت</Label>
              <Input value={data.voiceTone} onChange={(e) => set("voiceTone", e.target.value)} placeholder="نبرة الصوت..." className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>الإلهام <span className="text-muted-foreground/50 font-normal">Reference</span></Label>
              <Input value={data.inspiration} onChange={(e) => set("inspiration", e.target.value)} placeholder="مرجع أو رابط إلهام..." className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>السيناريو</Label>
              <Input value={data.script} onChange={(e) => set("script", e.target.value)} placeholder="https://docs.google.com/..." className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>ملحوظات</Label>
              <AutoTextarea value={data.notes} onChange={(e) => set("notes", e.target.value)} placeholder="أي ملاحظات إضافية..." className="min-h-16" />
            </div>
          </Section>

        </div>

        {/* LEFT sidebar — نوع المحتوى ← هدف الحملة ← القنوات */}
        <div className="lg:sticky lg:top-20 order-3 space-y-4">
          <ContentTypeSidebar value={data.contentType} onChange={(v) => set("contentType", v)} />
          <CustomerStageSidebar value={data.customerStage} onChange={(v) => set("customerStage", v)} />
          <ChannelsSidebar value={data.channels} onChange={(v) => set("channels", v)} />
        </div>

      </div>

      {/* ── Action bar ─────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 mt-5 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border flex items-center gap-3">
        <Button type="submit" disabled={saving || !data.idea.trim()} className="min-w-35 h-10 font-semibold">
          {saving ? "جاري الحفظ..." : mode === "create" ? "✚  إضافة المنشور" : "حفظ التعديلات"}
        </Button>
        <Button type="button" variant="outline" className="h-10"
          onClick={() => router.push(`/clients/${slug}/calendar/${month}`)}>
          إلغاء
        </Button>
        {!data.idea.trim() && !saving && (
          <span className="text-xs text-muted-foreground/60 mr-auto">أضف الفكرة أولاً</span>
        )}
      </div>

      {/* ── Confirm dialog ─────────────────────────────────────────────── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "تأكيد إضافة المنشور" : "تأكيد حفظ التعديلات"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-1 text-sm">
              <p className="text-muted-foreground text-xs">يوم {data.day} — {MONTHS.find((m) => m.value === month)?.label}</p>
              <p className="font-semibold text-foreground leading-snug">{data.idea}</p>
            </div>

            {mode === "create" && (
              <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-border px-4 py-3 hover:bg-muted/30 transition-colors">
                <Checkbox
                  checked={notifyTelegram}
                  onCheckedChange={(v) => setNotifyTelegram(v === true)}
                />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">إرسال إشعار على Telegram</p>
                  <p className="text-xs text-muted-foreground">إخطار الفريق بهذا المنشور</p>
                </div>
              </label>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>إلغاء</Button>
            <Button onClick={handleConfirm} disabled={saving} className="font-semibold">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </form>
  );
}
